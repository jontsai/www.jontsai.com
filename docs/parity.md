# Migration parity

## Preserved and restored

- 41 original Markdown posts and page source content retained without rewrites.
- Home/About/Blog/Code/Likes, pages directory, year archive, category/tag indexes,
  tweets, article navigation, date metadata and the original post taglines.
- `.html` top-level URLs, extensionless dated post URLs and slash/index aliases.
- Nine full-content blog pages, five posts per page, with a correct first-page link.
- Original heading anchors, case-sensitive tag/category anchors and legacy links.
- RSS, Atom, `/feed/index.xml`, both sitemaps, verification documents, favicon,
  Keybase proof, portrait, all legacy asset paths and published dependency docs.
- `G H`, `G A`, `G B`, `G C`, `G L`, `?`, backtick/tilde, `T`, Escape.
- All 20 web-console commands, including aliases, history/repeat, time/UTC,
  browser/referrer, public-IP lookup, CORS-aware fetch and permission-based geolocation.
  Command registration drives help and aliases; every command is behavior-tested.
  The full original MIT license works offline.
- Share links, donation link, social profiles, tweet content and video embeds.
- nextjs-htk-backed light/dark theme, accessible dialogs, focus restoration,
  keyboard-safe typing, touch-accessible controls and JavaScript-free reading.

## Third-party boundaries

- Disqus uses HTTPS and the original HTTP page URL identity to avoid creating
  new threads. Loading is explicit; account availability and historical thread
  association must be confirmed against the provider before cutover.
- `T` opens contact choices; **Open live chat** loads the original isolated Olark
  bootstrap. Email and the original contact URL remain available if the account
  or remote service does not work. Provider availability is not a local test pass.
- Twitter timeline/tweets and Clarity widgets load on request with ordinary links
  as fallbacks. Local tests do not claim the remote provider works.
- The old Java-applet IP lookup is replaced. The `ip`
  command now explicitly requests a public IPv4/IPv6 address from ipify over HTTPS,
  only when run. No lookup on page load; credentials and referrer are omitted.
  Live browser lookup verified; provider/network failure gives an actionable error.
- Google+ and legacy Flattr widgets are not recreated. Existing sharing/donation
  actions are available through ordinary links, without pretending those old
  provider APIs still work. Analytics are not activated on the preview; the old
  Universal Analytics/Heap snippets remain preserved only in the baseline.

## Intentional differences

- Responsive terminal-inspired design retains the original white-on-black,
  orange/green palette and monospaced identity. The homepage heading is “Home”;
  its SEO title remains “Home - Jonathan Tsai”. The original Courier masthead has
  a 128px portrait, dim “athan” on desktop, shortened “jontsai” below 47em, and
  the centered italic verse; narrow screens scale it without horizontal clipping.
- Blog pages 2–9 have unique page-number titles instead of nine identical titles.
- The broken HackerOne profile link has its missing slash restored.
- Kramdown and markdown-it disagree on literal pipe separators and one malformed
  emphasis marker. Semantic comparison normalizes only those documented cases
  and smart punctuation; source Markdown is still byte-identical.
- Old inline-HTML heading/list boundaries now parse as intended, restoring a link
  that a naive Markdown migration would otherwise leave as literal Markdown.
- HTTP embedded image/video resources use HTTPS to avoid mixed-content blocking.
- Preview is noindex with no CNAME; the production build restores indexability.
- Legacy dependency docs stay reachable but are excluded from the editorial
  sitemap and marked noindex. Old executable assets are not loaded by the new UI.

## Evidence

`npm test` validates source and frozen independent live fixtures without network
access. `npm run compare:live -- --refresh` produces a timestamped 59-route live
comparison report. Playwright exercises desktop/mobile interactions against the
actual static export. Screenshots and comparison reports are build artifacts,
not assertions that untested external providers or a production deployment work.
