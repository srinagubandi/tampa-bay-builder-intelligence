const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const root = path.join(__dirname, 'public');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, 'index.html')) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    const target = !statErr && stat.isFile() ? filePath : path.join(root, 'index.html');
    fs.readFile(target, (readErr, content) => {
      if (readErr) {
        res.writeHead(500).end('Server error');
        return;
      }
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
      res.end(content);
    });
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Builder dashboard listening on port ${port}`);
});
