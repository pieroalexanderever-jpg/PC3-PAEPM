import { useEffect, useMemo, useState } from "react";
import useDebounce from "./hooks/useDebounce.js";
import Resaltado, { normalizarBusqueda } from "./components/Resaltado.jsx";

// En desarrollo, Vite reenvía /api al backend (ver vite.config.js).
// Para producción puedes definir VITE_API_URL en un archivo .env
const API = import.meta.env.VITE_API_URL ?? "/api";

const formatoSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export default function App() {
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [datos, setDatos] = useState({ total: 0, resultados: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Esperamos 250 ms después de la última tecla antes de consultar la API
  const consulta = useDebounce(texto, 250);
  const terminos = useMemo(() => normalizarBusqueda(consulta), [consulta]);

  // Categorías (una sola vez)
  useEffect(() => {
    fetch(`${API}/categorias`)
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  // Búsqueda: se repite cuando cambia el texto (ya con debounce) o la categoría
  useEffect(() => {
    const controlador = new AbortController();
    const params = new URLSearchParams();
    if (consulta.trim()) params.set("q", consulta.trim());
    if (categoria) params.set("categoria", categoria);

    setCargando(true);
    setError(null);

    fetch(`${API}/productos?${params}`, { signal: controlador.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
        return r.json();
      })
      .then((json) => {
        setDatos(json);
        setCargando(false);
      })
      .catch((e) => {
        if (e.name === "AbortError") return; // petición cancelada por una más nueva
        setError("No se pudo conectar con la API. ¿Está corriendo el backend en el puerto 3001?");
        setCargando(false);
      });

    // Si el usuario sigue escribiendo, cancelamos la petición anterior
    return () => controlador.abort();
  }, [consulta, categoria]);

  const mensajeEstado = cargando
    ? "Buscando…"
    : error
    ? ""
    : consulta.trim()
    ? `${datos.total} ${datos.total === 1 ? "resultado" : "resultados"} para «${consulta.trim()}»`
    : `${datos.total} productos en el catálogo`;

  return (
    <div className="pagina">
      <header className="cabecera">
        <h1>Catálogo de tecnología</h1>
        <label className="buscador">
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Busca un producto, marca o categoría: switch cisco, ram 16…"
            autoFocus
            autoComplete="off"
          />
        </label>

        <div className="filtros" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={categoria === "" ? "chip activo" : "chip"}
            aria-pressed={categoria === ""}
            onClick={() => setCategoria("")}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              className={categoria === c ? "chip activo" : "chip"}
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      <main>
        <p className="estado" role="status" aria-live="polite">
          {mensajeEstado}
        </p>

        {error && <p className="error">{error}</p>}

        {!error && !cargando && datos.total === 0 && (
          <p className="vacio">
            Ningún producto coincide con «{consulta.trim()}». Prueba con menos palabras o quita el
            filtro de categoría.
          </p>
        )}

        <ul className={cargando ? "lista cargando" : "lista"}>
          {datos.resultados.map((p) => (
            <li key={p.id} className="fila">
              <div className="fila-principal">
                <h2>
                  <Resaltado texto={p.nombre} terminos={terminos} />
                </h2>
                <p className="meta">
                  <Resaltado texto={p.marca} terminos={terminos} /> ·{" "}
                  <Resaltado texto={p.categoria} terminos={terminos} />
                </p>
                <p className="descripcion">
                  <Resaltado texto={p.descripcion} terminos={terminos} />
                </p>
              </div>
              <div className="fila-precio">
                <strong>{formatoSoles.format(p.precio)}</strong>
                <span className={p.stock <= 5 ? "stock bajo" : "stock"}>
                  {p.stock <= 5 ? `Quedan ${p.stock}` : `${p.stock} disponibles`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
