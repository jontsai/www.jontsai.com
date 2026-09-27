import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import hljs from "highlight.js";
import { POSTS_PER_PAGE, site } from "../config";
import type { Article, PageContent, PageData, SiteRoute } from "./types";

const root = process.cwd();
// Kramdown-compatible heading IDs preserve existing deep links.
export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, "")
    .replace(/ /g, "-");
}
const markdown = new MarkdownIt({
  html: true,
  typographer: true,
  highlight(code, language) {
    return language && hljs.getLanguage(language)
      ? hljs.highlight(code, { language }).value
      : "";
  },
}).use(anchor, { slugify: headingId });

export function renderContent(
  source: string,
  data: Record<string, unknown> = {},
) {
  let text = source
    .replace(/{%\s*comment\s*%}[\s\S]*?{%\s*endcomment\s*%}/g, "")
    .replace(/{%\s*include JB\/setup\s*%}/g, "")
    .replace(
      /{%\s*include fragments\/likes\/books.html\s*%}/g,
      fs.readFileSync(path.join(root, "content/includes/books.html"), "utf8"),
    )
    .replace(
      /{%\s*include themes\/hacking-in-the-dark\/fragments\/widgets\/quora_button.html\s*%}/g,
      () =>
        `<p><a href="${markdown.utils.escapeHtml(String(data.quora_url || "https://www.quora.com"))}" rel="noopener noreferrer">View original question on Quora</a></p>`,
    )
    .replace(
      /{{\s*site.author.(\w+)\s*}}/g,
      (_, key: keyof typeof site.author) => site.author[key] || "",
    )
    .replace(/{{\s*BASE_PATH\s*}}/g, "")
    .replace(
      /{%\s*highlight\s+(\S+).*?%}([\s\S]*?){%\s*endhighlight\s*%}/g,
      "\n```$1\n$2\n```\n",
    )
    .replace(/{%\s*(?:raw|endraw)\s*%}/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/(<\/h[1-6]>)\n(?=\S)/g, "$1\n\n")
    .replace(/(?:src|href)="\/\//g, (match) => match.replace("//", "https://"));
  if (/{%|{{\s*(?:site\.|page\.|BASE_PATH)/.test(text))
    throw new Error("Unconverted Liquid markup in content");
  // Fix a malformed original profile link without changing article content.
  text = text.replace(
    "https://hackerone.comjontsai",
    "https://hackerone.com/jontsai",
  );
  return markdown
    .render(text)
    .replace(/(<(?:iframe|img)\b[^>]*\bsrc=["'])http:\/\//gi, "$1https://");
}
const values = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String)
    : value
      ? String(value).split(/\s+/)
      : [];
let cachedPosts: Article[] | undefined;
export function getPosts(): Article[] {
  if (cachedPosts) return cachedPosts;
  const dir = path.join(root, "content/posts");
  cachedPosts = fs
    .readdirSync(dir)
    .filter((f) => /\.md$/.test(f))
    .flatMap((file) => {
      const { data, content } = matter(
        fs.readFileSync(path.join(dir, file), "utf8"),
      );
      if (data.published === false) return [];
      const match = file.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/);
      if (!match) throw new Error(`Invalid dated post filename: ${file}`);
      const [, year, month, day, slug] = match;
      const url = data.permalink || `/${year}/${month}/${day}/${slug}`;
      const html = renderContent(content, data);
      return [
        {
          title: String(data.title),
          description:
            data.description ||
            html
              .replace(/<[^>]*>/g, "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 160),
          url,
          html,
          tagline: data.tagline || "",
          date: `${year}-${month}-${day}`,
          tags: values(data.tags),
          categories: values(data.categories || data.category),
          source: file,
          ...(data.wordpress_id
            ? {
                disqusIdentifier: `${data.wordpress_id} http://www.jontsai.com/?p=${data.wordpress_id}`,
              }
            : {}),
        },
      ];
    })
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.source.localeCompare(a.source),
    );
  return cachedPosts;
}
export function getPage(source: string): PageContent {
  const { data, content } = matter(
    fs.readFileSync(path.join(root, "content/pages", source), "utf8"),
  );
  // The homepage's recent-post list is now the shared PostList component.
  const body =
    source === "index.md"
      ? content.split("<h2>Recent Blog Posts</h2>")[0]
      : content;
  return {
    title: String(data.title),
    description: data.description || site.description,
    tagline: data.tagline || "",
    html: renderContent(body, data),
  };
}
export function getRoutes(): SiteRoute[] {
  const posts = getPosts();
  const routes: SiteRoute[] = [
    {
      path: "/",
      canonical: "/",
      title: "Home",
      kind: "home",
      source: "index.md",
    },
  ];
  for (const name of ["about", "code", "likes", "tweets"]) {
    const source = `${name}.${name === "tweets" ? "html" : "md"}`;
    routes.push({
      path: `/${name}`,
      canonical: `/${name}.html`,
      title: getPage(source).title,
      kind: "content",
      source,
    });
  }
  for (const kind of ["archive", "categories", "tags", "pages"] as const)
    routes.push({
      path: `/${kind}`,
      canonical: `/${kind}.html`,
      title: kind[0].toUpperCase() + kind.slice(1),
      kind,
    });
  for (let page = 1; page <= Math.ceil(posts.length / POSTS_PER_PAGE); page++) {
    const url = page === 1 ? "/blog" : `/blog/page${page}`;
    routes.push({
      path: url,
      canonical: url,
      title: page === 1 ? "Blog" : `Blog · Page ${page}`,
      kind: "blog",
      page,
    });
  }
  for (const post of posts)
    routes.push({
      path: post.url,
      canonical: post.url,
      title: post.title,
      kind: "post",
      postUrl: post.url,
    });
  return routes;
}
export function getPageData(routePath: string): PageData {
  const posts = getPosts();
  const route = getRoutes().find((r) => r.path === routePath);
  if (!route) throw new Error(`Unknown route ${routePath}`);
  const index = posts.findIndex((p) => p.url === route.postUrl);
  return {
    route,
    content: route.source ? getPage(route.source) : null,
    posts:
      route.kind === "blog"
        ? posts.slice(
            ((route.page || 1) - 1) * POSTS_PER_PAGE,
            (route.page || 1) * POSTS_PER_PAGE,
          )
        : route.kind === "home"
          ? posts.slice(0, 5).map((p) => ({ ...p, html: "" }))
          : route.kind === "post" || route.kind === "content"
            ? []
            : posts.map((p) => ({ ...p, html: "" })),
    post: index >= 0 ? posts[index] : null,
    previous: index >= 0 ? posts[index + 1] || null : null,
    next: index > 0 ? posts[index - 1] : null,
    totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
  };
}
