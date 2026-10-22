import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const port = Number(process.argv[3] || 4182);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (url.pathname === "/__e2e__/health") {
    response.end("ok");
    return;
  }
  try {
    let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep)) throw Error("Caminho inválido.");
    try {
      await stat(file);
    } catch {
      file = path.join(root, "docs/public", url.pathname);
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Não encontrado.");
  }
}).listen(port, "127.0.0.1");
