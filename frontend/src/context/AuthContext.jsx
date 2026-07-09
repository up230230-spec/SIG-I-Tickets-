/**
 * Autenticación respaldada por Redux.
 *
 * El estado de sesión vive ahora en el slice `auth` del store. Este módulo
 * conserva la API previa (`AuthProvider`, `useAuth`, `homeRouteForRole`) como
 * una capa fina sobre Redux para no tocar las páginas que ya la consumían.
 */
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadMe, login as loginThunk, register as registerThunk, logout as logoutAction } from '../store/authSlice';

// Dispara la carga del usuario actual (token → /auth/me) al montar la app.
export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(loadMe()); }, [dispatch]);
  return children;
}

// Hook con la misma forma que antes: { user, loading, login, register, logout }.
export function useAuth() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);

  return {
    user,
    loading,
    login: (email, password) => dispatch(loginThunk({ email, password })).unwrap(),
    register: (payload) => dispatch(registerThunk(payload)).unwrap(),
    logout: () => dispatch(logoutAction()),
  };
}

/** Ruta de inicio según el rol del usuario (para redirigir tras login). */
export const homeRouteForRole = (role) =>
  ({
    operaciones: '/operaciones',
    admin_area: '/area',
    rector: '/ejecutivo',
    jefe_carrera: '/mis-tickets',
    usuario_general: '/',
  }[role] || '/');
