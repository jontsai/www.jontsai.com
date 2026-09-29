import fs from "node:fs";
import path from "node:path";
import { site } from "../src/config";
const fixture = path.resolve("tests/fixtures/legacy");
if (!fs.existsSync(path.join(fixture, "_config.yml")))
  throw new Error("Initialize the pinned fixture: git submodule update --init");
fs.mkdirSync("public", { recursive: true });
// Preserve the full legacy asset namespace without committing or loading a second
// copy of YUI into the new application. This fixture is read-only.
for (const name of ["assets", "img", ".well-known"])
  fs.cpSync(path.join(fixture, name), path.join("public", name), {
    recursive: true,
  });
for (const name of [
  "BingSiteAuth.xml",
  "google5b8c1af647be57ab.html",
  "pinterest-dbda3.html",
  "pinterest-ff883.html",
])
  fs.copyFileSync(path.join(fixture, name), path.join("public", name));
fs.mkdirSync("public/assets/css", { recursive: true });
fs.copyFileSync(
  "tests/fixtures/generated-assets/style.css",
  "public/assets/css/style.css",
);
fs.writeFileSync("public/.nojekyll", "");
// CNAME deliberately absent in the preview. Production cutover is a separate,
// explicitly approved operation, not a side effect of building this repository.
console.log(
  "Prepared legacy assets and verification files from the pinned baseline.",
);

fs.copyFileSync("content/assets/portrait.jpg", "public/img/portrait.jpg");
// The existing reviewed/public Olark bootstrap remains isolated from the app;
// load it only after a visitor explicitly opens live chat.
const olarkTemplate = fs.readFileSync(
  path.join(
    fixture,
    "_includes/themes/hacking-in-the-dark/fragments/js/olark.html",
  ),
  "utf8",
);
const olark = olarkTemplate.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
if (!olark) throw new Error("Missing baseline Olark loader");
fs.mkdirSync("public/integrations", { recursive: true });
fs.writeFileSync(
  "public/integrations/olark.js",
  olark.replace("{{ site.author.olark }}", site.integrations.olark),
);
