import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { getRoutes } from "../src/lib/content";
// Explicit snapshot command: never runs as part of build or CI. Inspect diffs
// before accepting a changed baseline. The source repo is never written to.
const pages = getRoutes()
  .filter((r) => ["post", "content"].includes(r.kind))
  .map((route) => {
    const $ = load(
      fs.readFileSync(
        path.join(
          "artifacts/baseline",
          encodeURIComponent(route.canonical) + ".html",
        ),
        "utf8",
      ),
    );
    const content = $(".page > .content").first();
    return {
      path: route.path,
      canonical: route.canonical,
      title: $("title").text(),
      blocks: content
        .find("p,li,h2,h3,h4,pre")
        .map((_, el) => $(el).text())
        .get()
        .filter((text) => text.trim().length > 10),
      anchors: content
        .find("[id]")
        .map((_, el) => $(el).attr("id")!)
        .get(),
      links: content
        .find("a[href]")
        .map((_, el) => $(el).attr("href")!)
        .get(),
      images: content
        .find("img[src]")
        .map((_, el) => $(el).attr("src")!)
        .get(),
    };
  });
fs.writeFileSync(
  "tests/fixtures/live-content.json",
  JSON.stringify(
    {
      source: "https://www.jontsai.com",
      sourceCommit: "65325915",
      captured: "2026-09-27",
      pages,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Captured ${pages.length} public article/page content fixtures.`);
