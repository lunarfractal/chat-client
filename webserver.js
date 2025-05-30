const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer(async (req, res) => {
  const publicFolderPath = path.join(__dirname, 'static');

  if (req.url === '/' || req.url === '/index' || req.url === '/index.html') {
    serveStaticFile(res, path.join(publicFolderPath, 'index.html'));
  } else {
    const filePath = path.join(publicFolderPath, req.url);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error(err);
      } else {
        serveStaticFile(res, filePath);
      }
    });
  }
});

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error al leer el archivo local');
    } else {
      const contentType = getContentType(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ttf':
      return 'font/ttf';
    case '.otf':
      return 'font/otf';
    case '.eot':
      return 'application/vnd.ms-fontobject';
    default:
      return 'text/plain';
  }
}

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Servidor proxy escuchando en el puerto ${PORT}`);
});
