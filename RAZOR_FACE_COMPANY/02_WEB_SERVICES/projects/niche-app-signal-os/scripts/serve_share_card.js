const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8787);

const contentTypes = {
  ".png": "image/png",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const requestedPath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const relativePath = requestedPath || latestShareCardPath() || "output/share-cards";
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found");
    return;
  }

  res.writeHead(200, {
    "content-type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`share-card server listening on ${port}`);
});

function latestShareCardPath() {
  const dir = path.join(root, "output", "share-cards");
  if (!fs.existsSync(dir)) return "";
  const pngs = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".png"))
    .map((name) => {
      const fullPath = path.join(dir, name);
      return { name, mtimeMs: fs.statSync(fullPath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return pngs[0] ? path.join("output", "share-cards", pngs[0].name) : "";
}
