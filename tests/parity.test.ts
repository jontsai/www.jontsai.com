import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { load } from "cheerio";
import { normalizeLegacyText } from "../src/lib/parity";
import baseline from "./fixtures/live-content.json";

test("frozen live-site text, deep links, images and article links survive migration", () => {
  for (const page of baseline.pages) {
    const $ = load(fs.readFileSync("out" + page.path + ".html", "utf8"));
    const text = normalizeLegacyText($("#main .prose").first().text());
    for (const block of page.blocks)
      assert.ok(
        text.includes(normalizeLegacyText(block)),
        `${page.path}: missing text ${block.slice(0, 80)}`,
      );
    assert.equal(
      $("title").text(),
      page.path === "/tweets" ? "Posts on X - Jonathan Tsai" : page.title,
    );
    const ids = new Set(
      $("[id]")
        .map((_, el) => $(el).attr("id"))
        .get(),
    );
    for (const anchor of page.anchors)
      assert.ok(ids.has(anchor), `${page.path}#${anchor}`);
    const links = new Set(
      $("#main a[href]")
        .map((_, el) => $(el).attr("href")!)
        .get()
        .map(normalizeLegacyText),
    );
    for (const link of page.links)
      assert.ok(
        links.has(normalizeLegacyText(link)),
        `${page.path}: missing link ${link}`,
      );
    const imageUrl = (url: string) =>
      url.replace(/^http:/, "https:").replace(/^\/\//, "https://");
    const images = new Set(
      $("#main img[src]")
        .map((_, el) => imageUrl($(el).attr("src")!))
        .get(),
    );
    for (const image of page.images)
      assert.ok(
        images.has(imageUrl(image)),
        `${page.path}: missing image ${image}`,
      );
  }
});
