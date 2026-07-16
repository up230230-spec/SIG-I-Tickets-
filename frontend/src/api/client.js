/**
 * Cliente HTTP central de SIG-I — basado en Axios.
 *
 * Una sola instancia de Axios con interceptores centraliza:
 *   1. La base URL de la API.
 *   2. La inyección automática del JWT (salvo peticiones públicas con auth:false).
 *   3. El manejo uniforme de errores (se normalizan a un Error con `.message`).
 *   4. El cierre de sesión automático ante un 401 (token inválido/expirado).
 *
 * La interfaz pública (`api.get/post/patch/delete`) se mantiene idéntica a la
 * versión anterior basada en fetch, de modo que los slices de Redux no cambian.
 */
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : `http://${window.location.hostname}:3000/api`);

const TOKEN_KEY = 'sigi_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);

// Instancia única reutilizada en toda la app.
const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptor de petición: adjunta el JWT salvo que se pida auth:false. ---
http.interceptors.request.use((config) => {
  if (config.skipAuth !== true) {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Interceptor de respuesta: devuelve `data` y normaliza los errores. ---
http.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      (status ? `Error ${status}` : 'No se pudo conectar con el servidor.');

    // Sesión inválida o expirada: limpiamos el token para forzar el re-login.
    if (status === 401 && error.config?.skipAuth !== true) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(new Error(message));
  }
);

// Traduce las opciones heredadas ({ auth:false }) a la config de Axios.
const withOpts = (opts = {}) => {
  const { auth, ...rest } = opts;
  return { ...rest, skipAuth: auth === false };
};

export const api = {
  get: (p, opts) => http.get(p, withOpts(opts)),
  post: (p, body, opts) => http.post(p, body, withOpts(opts)),
  patch: (p, body, opts) => http.patch(p, body, withOpts(opts)),
  delete: (p, opts) => http.delete(p, withOpts(opts)),

  // Descarga autenticada de un blob (reportes CSV/PDF). Devuelve el Blob listo.
  download: (p) => http.get(p, { responseType: 'blob' }),

  BASE_URL,
  http, // instancia cruda por si se requiere una configuración puntual
};
