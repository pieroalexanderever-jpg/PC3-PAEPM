import { useEffect, useState } from "react";

// Devuelve el valor recién después de que el usuario deja de escribir `retraso` ms.
// Así no se hace una petición por cada tecla.
export default function useDebounce(valor, retraso = 250) {
  const [valorRetrasado, setValorRetrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setValorRetrasado(valor), retraso);
    return () => clearTimeout(id);
  }, [valor, retraso]);

  return valorRetrasado;
}
