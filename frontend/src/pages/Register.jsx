/**
 * Módulo A — Registro con correo institucional (.edu.mx).
 * En desarrollo la cuenta queda verificada automáticamente e inicia sesión.
 */
import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth, homeRouteForRole } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeRouteForRole(user.role)} replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const res = await register(form);
      if (res.token) {
        // Auto-login (desarrollo): entrar directo.
        navigate(homeRouteForRole(res.user.role), { replace: true });
      } else {
        // Producción: requiere verificar correo.
        setInfo(res.message || 'Cuenta creada. Revisa tu correo para verificarla.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div>
        <div className="brand">
          <h1>SIG-I</h1>
          <p>Crea tu cuenta institucional</p>
        </div>
        <form className="form-card" onSubmit={onSubmit}>
          <h2 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Crear cuenta</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}

          <div className="field">
            <label htmlFor="name">Nombre completo</label>
            <input id="name" name="name" value={form.name} onChange={onChange} required />
          </div>

          <div className="field">
            <label htmlFor="email">Correo institucional (.edu.mx)</label>
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
            <label htmlFor="password">Contraseña (mínimo 6 caracteres)</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={6}
              value={form.password}
              onChange={onChange}
              required
            />
          </div>

          <button className="btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Creando…' : 'Crear cuenta'}
          </button>

          <div className="auth-links">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
