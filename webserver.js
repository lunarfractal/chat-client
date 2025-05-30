const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

const publicFolderPath = path.join(__dirname, 'static');

app.use(express.static(publicFolderPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicFolderPath, 'index.html'));
});

app.get(['/index', '/index.html'], (req, res) => {
  res.sendFile(path.join(publicFolderPath, 'index.html'));
});

app.get('*', (req, res) => {
  res.status(404).send('Archivo no encontrado');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

