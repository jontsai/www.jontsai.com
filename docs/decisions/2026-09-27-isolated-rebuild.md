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

## Original masthead and functional console (September 28)

Jonathan supplied desktop/mobile references: preserve the Courier wordmark,
128px square portrait, dim desktop “athan”, and compact “jontsai” below the
original 47em breakpoint. The centered italic verse returns above navigation.
Small screens scale the masthead rather than retaining the old fixed-width overflow.

The console's inherited Java-applet IP placeholder is not functional parity.
Replace it with an explicit, on-command HTTPS public-IP lookup using ipify's
IPv4/IPv6 endpoint (https://www.ipify.org/). No background lookup, cookies, or
referrer. Browser networking has timeout/cancellation and bounded text output;
CORS, HTTP and permission failures explain what happened without fabricating data.
A command registry owns aliases, help and execution. All 20 advertised names are
behavior-tested. The original full MIT license is retained offline, and copyright
uses the current year/contact. Geolocation remains explicitly permission-based.

The jonts.ai post already has its original dated permalink, recent-post entry,
archive and taxonomy links. Recommend a permanent About-page contextual link plus
an optional sidebar link so it remains discoverable after aging out of recent posts.
No editorial content or navigation placement was changed for that recommendation.

## Sidebar provider recovery (September 28)

User reported both embeds blank. A live browser reproduction found X's timeline
endpoint returning HTTP 429 and Clarity's one-shot global loader fragile across
widget switching. Replace the exclusive widget slot with independent lazy widgets,
shared status/retry/timeout handling, and provider-owned DOM isolated from React.

Twitter uses one shared script and explicit createTimeline (do-not-track enabled).
Clarity embeds its existing provider widget directly and handles only messages from
that exact iframe and trusted origin for ready/height/booking. Request a Call goes
to the provider's booking page rather than the obsolete parent modal loader. Keep
persistent direct links; do not introduce paid API services or bypass X rate limits.
Clarity rendering/reload is live-verified; X's 429 remains an external limitation.
