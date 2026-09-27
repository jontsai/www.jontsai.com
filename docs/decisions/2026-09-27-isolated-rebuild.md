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
