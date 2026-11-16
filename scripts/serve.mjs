// Minimal static server for site/, used by the Playwright checks (npm run serve to browse locally).
// Serves "dir/" as "dir/index.html" and unknown paths as 404.html, like GitHub Pages.
// SITE_DIR serves another folder instead, such as a local fixture build (scripts/fixture.mjs).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.SITE_DIR ? resolve(process.env.SITE_DIR) + sep : fileURLToPath(new URL('../site/', import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, { 'content-type': TYPES['.html'] }).end(await readFile(join(ROOT, '404.html')));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Serving ${ROOT} at http://127.0.0.1:${PORT}/`));
