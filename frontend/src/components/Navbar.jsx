import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Barra de navegación superior, adaptada al rol del usuario.
 * Muestra solo los enlaces a los que el rol tiene acceso y permite cerrar sesión.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const r = user.role;
  const links = [
    { to: '/', label: 'Reportar', show: ['usuario_general', 'jefe_carrera', 'operaciones'].includes(r) },
    { to: '/mis-tickets', label: 'Mis reportes', show: ['usuario_general', 'jefe_carrera', 'operaciones'].includes(r) },
    { to: '/area', label: 'Panel de área', show: ['admin_area', 'operaciones'].includes(r) },
    { to: '/operaciones', label: 'Operaciones', show: r === 'operaciones' },
    { to: '/ejecutivo', label: 'Ejecutivo', show: ['rector', 'operaciones'].includes(r) },
    { to: '/foro', label: 'Foro', show: true },
  ].filter((l) => l.show);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <span className="brand">SIG-I</span>
      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.to === '/'}>
          {l.label}
        </NavLink>
      ))}
      <span className="spacer" />
      <span className="user">{user.name} · {user.role}</span>
      <button className="btn-logout" onClick={onLogout}>Salir</button>
    </nav>
  );
}
