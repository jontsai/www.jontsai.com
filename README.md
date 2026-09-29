# www.jontsai.com

Jonathan Tsai’s personal website, rebuilt with **Next.js**, **React**, TypeScript
and **[@hacktoolkit/nextjs-htk](https://github.com/hacktoolkit/nextjs-htk)**.
Statically exported for GitHub Pages; no application server is required.

This is a separate replacement repository. The existing
[jontsai.github.com](https://github.com/jontsai/jontsai.github.com) source and
[www.jontsai.com](https://www.jontsai.com) remain the unchanged migration baseline.

## Development

```sh
git clone --recurse-submodules https://github.com/jontsai/www.jontsai.com.git
cd www.jontsai.com
npm ci
npm run dev
```

Node.js 22+ is required; CI uses Node 24. Development listens on port 3147.
For production-like URL checks, use the **static preview**, not Next’s dev server:

```sh
npm run build
npm run preview
# http://127.0.0.1:3147
```

The static preview resolves `.html`, extensionless and directory-index aliases
like GitHub Pages. No SPA fallback hides broken URLs; unknown pages return 404.
`out/` is the deployable artifact. `public/` and `out/` are generated, not edited.

## Architecture

- `content/posts/`, `content/pages/`: editable original Markdown/HTML content.
- `src/config.ts`: shared identity, navigation, integrations and site settings.
- `src/lib/content.ts`: one loader/renderer and route manifest for the entire site.
- `src/components/`: shared shell, post lists, taxonomy, comments, keyboard tools,
  accessible dialogs and console. No copied page templates.
- `src/lib/console.ts`: independently testable legacy command interpreter.
- `scripts/prepare.ts`: copy compatibility assets from the pinned fixture.
- `scripts/export.ts`: URL aliases, feeds, robots and nextjs-htk sitemap generation.
- `tests/fixtures/legacy`: read-only Git submodule pinned to original source.
- `tests/fixtures/live-content.json`: independently captured live text, anchors,
  links and images, not generated from the new renderer.

nextjs-htk is installed from npm at a pinned release; its ThemeProvider/useTheme
and generateSitemap are used directly. The app does not copy those implementations.
Existing Liquid content is handled by a deliberately small, fail-closed adapter;
unrecognized templates stop the build rather than silently disappearing.

## URLs and SEO

Preserves all 41 original posts, original `.html` pages, nine blog pages, feeds,
category/tag `#name-ref` anchors, article heading IDs, site-verification files,
images and the original asset namespace. It also retains historical
category-prefixed article links and `/blog/page1` (fixing the old paginator).
All 559 paths recorded in the original sitemap resolve in the exported output.

The new sitemap contains the 59 editorial pages, not third-party dependency
manuals that Jekyll accidentally indexed. Canonicals, descriptions, Open Graph,
article structured data, RSS and Atom are generated from shared content metadata.
Article permalinks and existing feed item identifiers are stable.

## Verification and live comparisons

```sh
npm run build
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run compare:live -- --refresh
```

The comparison command performs read-only GETs against the original live site,
with three requests at a time. Reports and cached HTML go in ignored `artifacts/`.
Without `--refresh`, it reuses that cache. Run it at implementation milestones and
before cutover; it is intentionally not a recurring background job.

Tests check original post bytes and paths, all legacy sitemap paths, internal
navigation, semantic content, images/links, heading/taxonomy anchors, XML feeds,
verification-file identity, keyboard controls, safe text input, focus restoration,
console commands, mobile navigation, theme persistence and JavaScript-free content.
Intentional rendering differences are documented in [the parity report](docs/parity.md).

To deliberately replace the frozen live-content fixture: first run the live
comparison with `--refresh`, run `npx tsx scripts/capture-baseline.ts`, and review
the diff. Neither build nor CI updates or writes to the old repository.

## Preview and eventual GitHub Pages cutover

Builds **default to preview mode**: `noindex` metadata, robots disallowing crawling,
and no CNAME file. PR CI builds/tests/uploads a Pages artifact; it never deploys.
Do not point the real domain at this repository while evaluating the rebuild.

### Git workflow

- Open/update a PR: CI builds **both preview and production** exports, then runs
  TypeScript, URL/content/indexing checks and desktop/mobile browser tests against
  each artifact. CI never publishes the PR.
- Merge/push to `master`: the deployment workflow builds and tests the production
  artifact using the **same composite action** as PR verification. With deployment
  disabled, it only uploads the artifact. Once activated after cutover approval,
  successful `master` pushes deploy that exact tested artifact to GitHub Pages.
- Manual dry run: run **Deploy approved production site** on `master`, leaving
  `publish` unchecked. It builds/tests/uploads without publishing, even after
  automatic deployment is enabled.
- Manual release/retry: select `master`, check `publish`, and enter
  `www.jontsai.com`. The activation flag below is still required.

### One-time activation (only after explicit cutover approval)

1. Review and merge the migration PR; merging alone does **not** activate publishing.
2. Configure this repository's Pages source as **GitHub Actions** and assign the
   custom domain. Moving the domain off the original repository is a separate,
   intentional cutover; preserve its source for rollback. Root-relative URLs
   target the custom domain, not a `/www.jontsai.com/` project-site subpath.
3. Restrict the `github-pages` deployment environment to `master` and configure
   any desired required reviewers. Define repository Actions variable
   `PAGES_DEPLOY_ENABLED` as the exact string `true`.
4. Manually publish from `master` as above for the first release. Subsequent
   approved merges/pushes to `master` build, test and deploy automatically.
5. Verify the real domain, HTTP statuses, feeds, canonical URLs and HTTPS.
   Retain the original repository/source until the migration is accepted.

To pause future publishing, unset `PAGES_DEPLOY_ENABLED` or set it to `false`.
This does not stop a deployment already in progress or unpublish the current site.
After cutover, rollback uses a reviewed Git revert on `master`, which runs the same
build/test/deploy path; it never resets or rewrites the old baseline repository.

The workflow uses GitHub's job token/OIDC, not a personal deploy token. See
[GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

No Pages setting, DNS record, original source or live site is changed by this PR.
The deployment workflow is prepared but has not published a site.
