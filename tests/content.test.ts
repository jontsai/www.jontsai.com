import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { load } from "cheerio";
import { getPosts, getRoutes } from "../src/lib/content";
const fixture = "tests/fixtures/legacy";
const posts = getPosts();
const routes = getRoutes();
const read = (name: string) => fs.readFileSync(path.join("out", name), "utf8");
const exists = (url: string) => {
  const pathname = decodeURIComponent(
    new URL(url, "https://www.jontsai.com").pathname,
  );
  return [
    pathname,
    pathname + ".html",
    pathname.replace(/\/$/, "") + "/index.html",
  ].some(
    (file) =>
      fs.existsSync(path.join("out", file)) &&
      fs.statSync(path.join("out", file)).isFile(),
  );
};
test("every original published post is imported byte-for-byte and keeps its permalink", () => {
  const original = fs
    .readdirSync(`${fixture}/_posts`)
    .filter((f) => f.endsWith(".md"));
  // New posts are written here, not in the frozen fixture, so the site may
  // have more posts than the baseline but never fewer.
  assert.ok(posts.length >= original.length);
  for (const file of original) {
    const expected = fs.readFileSync(`${fixture}/_posts/${file}`, "utf8");
    assert.equal(fs.readFileSync(`content/posts/${file}`, "utf8"), expected);
    const p = posts.find((p) => p.source === file)!;
    assert.ok(p);
    assert.equal(p.title, matter(expected).data.title);
    assert.equal(
      p.url,
      "/" +
        file
          .replace(/^(\d{4})-(\d{2})-(\d{2})-/, "$1/$2/$3/")
          .replace(/\.md$/, ""),
    );
  }
});
test("all editorial routes, .html pages, slash variants, and category-prefixed aliases exist", () => {
  assert.equal(new Set(routes.map((r) => r.path)).size, routes.length);
  for (const route of routes) {
    assert.ok(exists(route.canonical), route.canonical);
    assert.ok(exists(route.path + (route.path === "/" ? "" : "/")), route.path);
  }
  for (const post of posts)
    for (const category of post.categories)
      assert.ok(exists(`/${category}${post.url}/`));
  for (const url of ["/index.html", "/blog/page1", "/blog/page1/", "/404.html"])
    assert.ok(exists(url), url);
});
test("HTML includes canonical metadata, resolved templates, and all internal navigation targets", () => {
  const missing = new Set<string>();
  for (const route of routes) {
    const html = read(route.path === "/" ? "index.html" : route.path + ".html");
    const $ = load(html);
    assert.equal(
      $("link[rel=canonical]").attr("href"),
      "https://www.jontsai.com" + route.canonical,
    );
    assert.ok($("meta[name=description]").attr("content"));
    assert.equal($("h1").length, 1, route.path);
    assert.equal($('script[src*="yui"],script[src*="jquery"]').length, 0);
    assert.doesNotMatch(
      $("#main").html() || "",
      /{%\s*(include|for|if)|{{\s*(site|page)\./,
    );
    $("#main a[href],header a[href],footer a[href]").each((_, el) => {
      const href = $(el).attr("href")!;
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (!exists(href)) missing.add(`${route.path}: ${href}`);
    });
  }
  assert.deepEqual([...missing], []);
});
test("taxonomy links retain original tag/category -ref anchors", () => {
  for (const type of ["tags", "categories"] as const) {
    const $ = load(read(`${type}.html`));
    const ids = new Set(
      $("[id]")
        .map((_, el) => $(el).attr("id"))
        .get(),
    );
    for (const value of new Set(posts.flatMap((p) => p[type])))
      assert.ok(ids.has(value + "-ref"), value);
  }
});
test("feeds, sitemap and verification paths survive without duplicate sitemap entries", () => {
  const $ = load(read("sitemap.xml"), { xmlMode: true });
  const urls = $("loc")
    .map((_, el) => $(el).text())
    .get();
  assert.equal(urls.length, routes.length);
  assert.equal(new Set(urls).size, urls.length);
  for (const post of posts)
    assert.ok(urls.includes("https://www.jontsai.com" + post.url));
  for (const file of ["rss.xml", "atom.xml", "feed/index.xml"]) {
    const feed = load(read(file), { xmlMode: true });
    assert.equal(feed("item,entry").length, posts.length);
  }
  for (const file of [
    "BingSiteAuth.xml",
    "google5b8c1af647be57ab.html",
    "pinterest-dbda3.html",
    "pinterest-ff883.html",
    ".well-known/keybase.txt",
  ])
    assert.equal(read(file), fs.readFileSync(path.join(fixture, file), "utf8"));
  assert.ok(fs.existsSync("out/.nojekyll"));
});

test("every URL in the original sitemap still has a static file", () => {
  const paths = JSON.parse(
    fs.readFileSync("tests/fixtures/legacy-sitemap-paths.json", "utf8"),
  ) as string[];
  assert.deepEqual(
    paths.filter((url) => !exists(url)),
    [],
  );
});

test("deployment mode controls domain binding and indexing on every editorial page", () => {
  const production = process.env.SITE_MODE === "production";
  if (production) assert.equal(read("CNAME").trim(), "www.jontsai.com");
  else
    assert.ok(
      !fs.existsSync("out/CNAME"),
      "Preview must not claim the live domain",
    );
  const robots = read("robots.txt");
  assert.equal(/^Disallow: \/$/m.test(robots), !production);
  assert.match(robots, /Sitemap: https:\/\/www\.jontsai\.com\/sitemap\.xml/);
  for (const route of routes) {
    const $ = load(
      read(route.path === "/" ? "index.html" : route.path + ".html"),
    );
    const directives = $("meta[name=robots]").attr("content") || "";
    assert.equal(directives.includes("noindex"), !production, route.canonical);
    assert.equal(directives.includes("nofollow"), !production, route.canonical);
  }
});
