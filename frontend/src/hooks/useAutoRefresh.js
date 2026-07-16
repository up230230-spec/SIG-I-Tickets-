/**
 * Hook personalizado: ejecuta una función al montar y luego cada `intervalMs`.
 *
 * Centraliza el patrón de "refresco automático" (usado en el panel global). Usa
 * una ref para leer siempre la última versión del callback sin reiniciar el
 * temporizador, y limpia el intervalo al desmontar.
 *
 * @param {Function} callback  Acción a ejecutar (p. ej. recargar datos).
 * @param {number}   intervalMs Milisegundos entre ejecuciones (0 = sin repetir).
 */
import { useEffect, useRef } from 'react';

export default function useAutoRefresh(callback, intervalMs = 60000) {
  const savedCallback = useRef(callback);

  // Mantiene la ref apuntando al callback más reciente.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const run = () => savedCallback.current?.();
    run(); // ejecución inicial inmediata
    if (!intervalMs) return undefined;
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
