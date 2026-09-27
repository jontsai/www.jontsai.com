import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("out");
const port = Number(process.env.PORT || 3147);
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
};
http
  .createServer((req, res) => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(
        new URL(req.url || "/", "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    const target = path.resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const file = [
      target,
      target + ".html",
      path.join(target, "index.html"),
    ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    const selected = file || path.join(root, "404.html");
    res.writeHead(file ? 200 : 404, {
      "Content-Type":
        mime[path.extname(selected)] || "application/octet-stream",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-cache",
    });
    if (req.method === "HEAD") res.end();
    else fs.createReadStream(selected).pipe(res);
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Static preview at http://127.0.0.1:${port}`),
  );
