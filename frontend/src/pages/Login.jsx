/**
 * Módulo A — Inicio de sesión.
 * Autentica con correo institucional + contraseña y redirige según el rol.
 */
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth, homeRouteForRole } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Si ya hay sesión, no mostrar el login.
  if (user) return <Navigate to={homeRouteForRole(user.role)} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      navigate(homeRouteForRole(u.role), { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div>
        <div className="brand">
          <h1>SIG-I</h1>
          <p>Sistema Integral de Gestión de Incidencias</p>
        </div>
        <form className="form-card" onSubmit={onSubmit}>
          <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Iniciar sesión</h2>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="email">Correo institucional</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="up230230@alumnos.upa.edu.mx"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>

          <button className="btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="auth-links">
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
