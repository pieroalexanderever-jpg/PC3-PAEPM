// Marca en amarillo las partes del texto que coinciden con la búsqueda.
// Ignora tildes y mayúsculas, igual que el backend.
const sinTildes = (texto) =>
  Array.from({ length: texto.length }, (_, i) => {
    const base = texto[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return base.length === 1 ? base : texto[i].toLowerCase();
  }).join("");

export function normalizarBusqueda(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export default function Resaltado({ texto, terminos }) {
  if (!terminos.length) return texto;

  const normal = sinTildes(texto);
  const marcado = new Array(texto.length).fill(false);

  for (const t of terminos) {
    let i = normal.indexOf(t);
    while (i !== -1) {
      for (let k = i; k < i + t.length; k++) marcado[k] = true;
      i = normal.indexOf(t, i + t.length);
    }
  }

  const partes = [];
  let inicio = 0;
  for (let i = 1; i <= texto.length; i++) {
    if (i === texto.length || marcado[i] !== marcado[inicio]) {
      const trozo = texto.slice(inicio, i);
      partes.push(marcado[inicio] ? <mark key={inicio}>{trozo}</mark> : trozo);
      inicio = i;
    }
  }
  return partes;
}
