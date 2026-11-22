import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// "Base de datos": un archivo JSON que se carga al iniciar el servidor
const productos = JSON.parse(
  await readFile(path.join(__dirname, "data", "productos.json"), "utf8")
);

// Quita tildes y pasa a minúsculas: "Teclado" y "téclado" coinciden
const normalizar = (texto = "") =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Guardamos una versión ya normalizada de cada producto para buscar rápido
const indice = productos.map((p) => ({
  producto: p,
  texto: normalizar(
    `${p.nombre} ${p.marca} ${p.categoria} ${p.descripcion}`
  ),
}));

// GET /api/health  ->  comprobar que el servidor responde
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hora: new Date().toISOString() });
});

// GET /api/categorias  ->  lista de categorías únicas
app.get("/api/categorias", (_req, res) => {
  const categorias = [...new Set(productos.map((p) => p.categoria))].sort();
  res.json(categorias);
});

// GET /api/productos?q=texto&categoria=Redes
// Todas las palabras de "q" deben aparecer en el producto.
app.get("/api/productos", (req, res) => {
  const terminos = normalizar(req.query.q).split(/\s+/).filter(Boolean);
  const categoria = normalizar(req.query.categoria);

  const resultados = indice
    .filter(({ producto, texto }) => {
      if (categoria && normalizar(producto.categoria) !== categoria) return false;
      return terminos.every((t) => texto.includes(t));
    })
    .map(({ producto }) => producto);

  res.json({ total: resultados.length, resultados });
});

// GET /api/productos/:id  ->  un producto
app.get("/api/productos/:id", (req, res) => {
  const producto = productos.find((p) => p.id === Number(req.params.id));
  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }
  res.json(producto);
});

// Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.listen(PORT, () => {
  console.log(`API lista en http://localhost:${PORT}/api/productos`);
});
