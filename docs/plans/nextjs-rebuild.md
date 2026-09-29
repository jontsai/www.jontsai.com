# URL-compatible static rebuild

## Goal and boundaries

Rebuild the public site with Next.js and nextjs-htk in this separate repository.
The original repository and production site are read-only regression baselines.
No DNS, old repository, production Pages settings, or live-site changes.

## Acceptance criteria

- Preserve all published posts, primary pages, date-based URLs, .html URLs,
  pagination, category/tag anchors, feeds, verification files and asset paths.
- Restore keyboard shortcuts and the console independently of YUI.
- Share route/content metadata across navigation, export, sitemap and tests.
- Preserve readable content without JavaScript; responsive, accessible controls.
- Compare the static output against pinned source and live HTML; document
  third-party services that cannot be verified or no longer exist.
- Produce a preview, screenshots, repeatable tests, CI artifact and review PR.

## Implementation

1. Pin original source as a read-only fixture; import editable Markdown content.
2. Centralize content loading, legacy rendering, route generation and metadata.
3. Build shared layouts, article/index/taxonomy views and interactive controls.
4. Export aliases/assets/feeds/sitemaps and add build-only GitHub Actions.
5. Run URL/content/browser parity checks against output and the live baseline.

## Verification

Type checking, content/URL tests, static HTTP and browser tests, mobile/desktop
screenshots, and explicit comparison reports. No automatic production deployment.
