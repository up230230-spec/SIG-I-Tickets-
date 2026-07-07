import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * Contexto de autenticación: guarda el usuario/rol y el token.
 * STUB funcional básico: persiste el token y expone login/logout.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sigi_token');
    if (!token) return setLoading(false);
    api
      .get('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('sigi_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password }, { auth: false });
    localStorage.setItem('sigi_token', token);
    setUser(user);
    return user;
  };

  // Registro: en desarrollo el backend devuelve token+user (auto-login).
  const register = async (payload) => {
    const res = await api.post('/auth/register', payload, { auth: false });
    if (res.token) {
      localStorage.setItem('sigi_token', res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('sigi_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Ruta de inicio según el rol del usuario (para redirigir tras login). */
export const homeRouteForRole = (role) =>
  ({
    operaciones: '/operaciones',
    admin_area: '/area',
    rector: '/ejecutivo',
    jefe_carrera: '/mis-tickets',
    usuario_general: '/',
  }[role] || '/');
