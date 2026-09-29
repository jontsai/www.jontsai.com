import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { getRoutes } from "../src/lib/content";
import { site } from "../src/config";
import { normalizeLegacyText } from "../src/lib/parity";

// Read-only GETs against the baseline. No browser scripts, analytics or mutations.
// Capture once; rerun with --refresh to compare against current production.
const cache = path.resolve("artifacts/baseline");
fs.mkdirSync(cache, { recursive: true });
const normalize = normalizeLegacyText;
const reports: Record<string, unknown>[] = [];
const routes = getRoutes();
for (let i = 0; i < routes.length; i += 3) {
  await Promise.all(
    routes.slice(i, i + 3).map(async (route) => {
      const filename = path.join(
        cache,
        encodeURIComponent(route.canonical) + ".html",
      );
      let baseline: string;
      let status = 200;
      try {
        if (fs.existsSync(filename) && !process.argv.includes("--refresh"))
          baseline = fs.readFileSync(filename, "utf8");
        else {
          const response = await fetch(site.url + route.canonical, {
            signal: AbortSignal.timeout(30000),
          });
          status = response.status;
          baseline = await response.text();
          if (response.ok) fs.writeFileSync(filename, baseline);
        }
        const old = load(baseline);
        const built = load(
          fs.readFileSync(
            path.join(
              "out",
              route.path === "/" ? "index.html" : `${route.path}.html`,
            ),
            "utf8",
          ),
        );
        const originalContent = old(".page > .content").first();
        const newContent = built("#main .prose").first();
        const selectors = ["p", "li", "h2", "h3", "h4", "pre"];
        const expectedBlocks = originalContent
          .find(selectors.join(","))
          .map((_, el) => normalize(old(el).text()))
          .get()
          .filter((s) => s.length > 10);
        const actualText = normalize(newContent.text());
        const missing =
          route.kind === "post" || route.kind === "content"
            ? expectedBlocks.filter((block) => !actualText.includes(block))
            : [];
        const oldIds = originalContent
          .find("[id]")
          .map((_, el) => old(el).attr("id")!)
          .get();
        const newIds = new Set(
          built("[id]")
            .map((_, el) => built(el).attr("id")!)
            .get(),
        );
        const missingAnchors =
          route.kind === "post" || route.kind === "content"
            ? oldIds.filter((id) => !newIds.has(id))
            : [];
        const oldPostLinks = originalContent
          .find("h1 > a")
          .map((_, el) => old(el).attr("href"))
          .get();
        const newPostLinks = built(".blog-entry > header h2 > a")
          .map((_, el) => built(el).attr("href"))
          .get();
        const paginationMatch =
          route.kind !== "blog" ||
          JSON.stringify(oldPostLinks) === JSON.stringify(newPostLinks);
        const titleMatch =
          normalize(old("title").text()) === normalize(built("title").text());
        reports.push({
          path: route.canonical,
          liveStatus: status,
          titleMatch,
          paginationMatch,
          expectedBlocks: expectedBlocks.length,
          missingBlocks: missing,
          missingAnchors,
          note:
            route.kind === "blog" && route.page! > 1
              ? "Page number added to title for unique SEO titles."
              : route.source === "tweets.html" &&
                  normalize(built("title").text()) ===
                    "Posts on X - Jonathan Tsai"
                ? "X terminology updated at owner request; legacy URL and post content preserved."
                : undefined,
        });
      } catch (error) {
        reports.push({ path: route.canonical, error: String(error) });
      }
    }),
  );
}
reports.sort((a, b) => String(a.path).localeCompare(String(b.path)));
fs.writeFileSync(
  "artifacts/live-comparison.json",
  JSON.stringify(
    {
      comparedAt: new Date().toISOString(),
      baseline: site.url,
      routes: reports,
    },
    null,
    2,
  ) + "\n",
);
const failed = reports.filter(
  (r) =>
    r.error ||
    r.liveStatus !== 200 ||
    r.paginationMatch === false ||
    (r.titleMatch === false && !r.note) ||
    (r.missingBlocks as string[])?.length ||
    (r.missingAnchors as string[])?.length,
);
console.log(
  `Compared ${reports.length} routes; ${failed.length} require review. Report: artifacts/live-comparison.json`,
);
for (const row of failed) console.log(JSON.stringify(row));
if (failed.length) process.exitCode = 1;
