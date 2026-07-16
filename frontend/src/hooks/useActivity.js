/**
 * Hook personalizado: obtiene la actividad del usuario autenticado.
 *
 * Encapsula la llamada a GET /dashboard/me junto con sus estados de carga y
 * error, y expone `reload()` para volver a pedirla. Es el ejemplo de "consumo
 * de API con manejo de estados de carga y error" a nivel de componente.
 *
 * @returns {{ data: object|null, loading: boolean, error: string|null, reload: () => void }}
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export default function useActivity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/me');
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
