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

  const logout = () => {
    localStorage.removeItem('sigi_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
