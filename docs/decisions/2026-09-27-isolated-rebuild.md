# Isolated migration and frozen baseline

## Context

The original Jekyll site must stay online and its source must stay unchanged while
its replacement is implemented and compared. Existing URLs and interactions are
part of the acceptance criteria, not opportunities for a content rewrite.

## Options

1. Replace the original repository in place: simplest cutover, loses an isolated baseline.
2. Copy the entire original codebase: unnecessary duplicate application/vendor code.
3. Separate repository with editable content and a pinned, read-only source fixture.

## Decision

Use option 3. `tests/fixtures/legacy` pins `jontsai/jontsai.github.com` at
`65325915`; content is imported byte-for-byte into `content/`. The fixture supplies
legacy assets and independent regression evidence, never the new app runtime.
New React code has no YUI or jQuery dependency. nextjs-htk supplies the shared theme
provider and sitemap generator. One route manifest drives export and validation.

## Consequences

- Source/live baseline cannot be accidentally deployed by the new build.
- Old asset and dependency-document URLs are preserved in the output, but omitted
  from the editorial sitemap. They are not loaded by the application.
- Builds default to noindex previews with no CNAME. Production requires explicit
  cutover approval, Pages configuration and a manually dispatched workflow.
- Frozen public content/anchor/link/image fixtures permit offline regression tests.
  Read-only live comparisons can be rerun separately without silently updating them.

## Visual refinement: terminal identity

Jonathan rejected the first preview's editorial styling as too different from his
original personal site. The requested direction is distinctly his: white on black,
shades of orange and green, and the feeling of a terminal application in a browser.

Keeping the editorial design with different colors would not recover that identity.
Reproducing the old YUI-era layout literally would retain its responsive limitations.
Instead, retain the original monospaced nameplate, square portrait, command tagline,
and orange/green hierarchy in shared, responsive React components. Use a terminal
path title strip for every page and expose the functional keyboard/console controls
near the top. Keep semantic navigation, native dialogs, focus management, readable
contrast, theme preference, and static no-JavaScript content.

The homepage heading returns to “Home.” Editorial content, routes, metadata and
third-party integrations are unchanged. Desktop/mobile and light/dark screenshots
were inspected; existing browser and baseline comparisons verify behavior and content.
The original site remains the read-only reference, with all changes confined to PR #1.

## Git-driven deployment readiness (September 28)

Jonathan requested deployment through the Git workflow while the old site stays
untouched. The initial manual-only workflow tested the preview, then rebuilt an
untested production artifact. A shared composite action now builds and verifies a
selected mode; PR CI exercises both preview and production, including domain and
indexing assertions. Deployment uses the same action and publishes its tested
production artifact without rebuilding after verification.

After explicit cutover approval, the repository variable `PAGES_DEPLOY_ENABLED`
activates publishing on `master` pushes. Before activation, merges only build and
upload artifacts. Manual dry runs remain available; manual publishing requires
both the activation flag and domain confirmation. Pages/OIDC write permissions
belong only to the deployment job. No Pages settings or domain bindings are changed
by this implementation. The one-time activation and rollback steps are in README.
