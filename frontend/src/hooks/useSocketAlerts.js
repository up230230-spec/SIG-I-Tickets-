/**
 * Hook personalizado: escucha alertas críticas en tiempo real (Socket.io).
 *
 * Conecta al servidor de sockets, se suscribe opcionalmente a la sala de un
 * área y acumula las alertas `critical_alert` que llegan. Limpia el listener al
 * desmontar para no dejar suscripciones colgadas.
 *
 * @param {string} [area] Área a cuya sala suscribirse (opcional).
 * @returns {{ alerts: object[], latest: object|null, clear: () => void }}
 */
import { useEffect, useState, useCallback } from 'react';
import { connectSocket, subscribeArea } from '../api/socket';

export default function useSocketAlerts(area) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const socket = connectSocket();
    if (area) subscribeArea(area);

    const onAlert = (alert) => {
      // La más reciente al frente; conservamos las últimas 20.
      setAlerts((prev) => [{ ...alert, receivedAt: Date.now() }, ...prev].slice(0, 20));
    };

    socket.on('critical_alert', onAlert);
    return () => socket.off('critical_alert', onAlert);
  }, [area]);

  const clear = useCallback(() => setAlerts([]), []);

  return { alerts, latest: alerts[0] || null, clear };
}
