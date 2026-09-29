import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import { generateSitemap } from "@hacktoolkit/nextjs-htk/utils";
import { getPosts, getRoutes } from "../src/lib/content";
import { site } from "../src/config";
const out = path.resolve("out");
const routes = getRoutes();
const posts = getPosts();
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const write = (file: string, text: string) => {
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text);
};
// .html remains the canonical URL for original top-level pages. Extensionless
// posts also get directory aliases so /post and /post/ both resolve on Pages.
for (const route of routes.filter((r) => r.path !== "/")) {
  const generated = path.join(out, `${route.path}.html`);
  if (!fs.existsSync(generated))
    throw new Error(`Missing exported page ${route.path}`);
  write(`${route.path}/index.html`, fs.readFileSync(generated, "utf8"));
}
write("blog/page1.html", fs.readFileSync(path.join(out, "blog.html"), "utf8"));
write(
  "blog/page1/index.html",
  fs.readFileSync(path.join(out, "blog.html"), "utf8"),
);
// Older category-prefixed links still exist in original posts. Keep those as
// static aliases with canonical tags pointing to the current date-based URLs.
for (const post of posts)
  for (const category of post.categories) {
    const html = fs.readFileSync(path.join(out, `${post.url}.html`), "utf8");
    write(`${category}${post.url}.html`, html);
    write(`${category}${post.url}/index.html`, html);
  }
// Jekyll historically published dependency Markdown in addition to real site
// pages. Preserve those URLs, but exclude them from the new editorial sitemap.
const legacy = path.resolve("tests/fixtures/legacy");
const md = new MarkdownIt({ html: true });
function legacyMarkdown(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) legacyMarkdown(full);
    else if (/\.(?:md|markdown)$/.test(entry.name)) {
      const relative = path
        .relative(legacy, full)
        .replace(/\.(?:md|markdown)$/, "");
      const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>${xml(entry.name)}</title><main>${md.render(fs.readFileSync(full, "utf8"))}</main></html>`;
      write(`${relative}.html`, html);
      if (
        /^readme\.(md|markdown)$/i.test(entry.name) &&
        !fs.existsSync(path.join(out, path.dirname(relative), "index.html"))
      )
        write(`${path.dirname(relative)}/index.html`, html);
    }
  }
}
legacyMarkdown(path.join(legacy, "assets"));
for (const name of ["History.markdown", "README-JB.md"])
  write(
    name.replace(/\.(?:md|markdown)$/, ".html"),
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><main>${md.render(fs.readFileSync(path.join(legacy, name), "utf8"))}</main></html>`,
  );
const mostRecent = posts[0].date + "T00:00:00Z";
write(
  "sitemap.xml",
  generateSitemap({
    siteUrl: site.url,
    pages: [],
    additionalPages: routes.map((route) => ({
      path: route.canonical,
      lastmod:
        (posts.find((p) => p.url === route.postUrl)?.date || posts[0].date) +
        "T00:00:00Z",
      changefreq: route.kind === "post" ? "yearly" : "weekly",
      priority: route.path === "/" ? 1 : 0.8,
    })),
  }),
);
write(
  "sitemap.txt",
  routes.map((route) => site.url + route.canonical).join("\n") + "\n",
);
const preview = process.env.SITE_MODE !== "production";
write(
  "robots.txt",
  `User-agent: *\nDisallow: ${preview ? "/" : ""}\n\nSitemap: ${site.url}/sitemap.xml\nSitemap: ${site.url}/sitemap.txt\n`,
);
write(".nojekyll", "");
if (!preview) write("CNAME", "www.jontsai.com\n");
const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${site.name}</title><link>${site.url}</link><description>${xml(site.description)}</description><atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>${posts.map((post) => `<item><title>${xml(post.title)}</title><link>${site.url}${post.url}</link><guid isPermaLink="true">http://www.jontsai.com${post.url}</guid><pubDate>${new Date(post.date).toUTCString()}</pubDate><description>${xml(post.html)}</description></item>`).join("")}</channel></rss>`;
const atom = (legacyFeed = false) =>
  `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>${site.name}</title><link href="${site.url}"/><link href="${site.url}${legacyFeed ? "/feed/index.xml" : "/atom.xml"}" rel="self"/><id>http://www.${legacyFeed ? "jonathantsai" : "jontsai"}.com${legacyFeed ? "/" : ""}</id><updated>${mostRecent}</updated><author><name>${site.name}</name></author>${posts.map((post) => `<entry><title>${xml(post.title)}</title><link href="${site.url}${post.url}"/><id>http://www.${legacyFeed ? "jonathantsai" : "jontsai"}.com${post.url}</id><updated>${post.date}T00:00:00Z</updated><content type="html">${xml(post.html)}</content></entry>`).join("")}</feed>`;
write("rss.xml", rss);
write("atom.xml", atom());
write("feed/index.xml", atom(true));
console.log(
  `Exported ${routes.length} editorial routes, legacy aliases, assets, sitemap and feeds (${preview ? "preview/noindex" : "production"}).`,
);
