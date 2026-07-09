/**
 * Módulo B — Reporte de incidencia.
 * Formulario: tipo (catálogo INC con color de orilla), título, ubicación y
 * descripción. La asignación de área/severidad la hace el backend según el tipo.
 * Incluye el botón de EMERGENCIA. Envío gestionado con Redux (slice `tickets`).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createTicket, createEmergency } from '../store/ticketsSlice';
import { INCIDENT_TYPES, accentFor } from '../config/incidentTypes';
import Navbar from '../components/Navbar';

// Id de cliente para evitar duplicados si se reenvía el formulario.
const newClientId = () =>
  (crypto.randomUUID && crypto.randomUUID()) || `c-${Date.now()}-${Math.random()}`;

export default function ReportIncident() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    incidentCode: 'INC-001',
    title: '',
    location: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await dispatch(createTicket({ ...form, clientSideId: newClientId() })).unwrap();
      navigate('/mis-tickets');
    } catch (err) {
      setError(err || 'No se pudo enviar el reporte.');
      setBusy(false);
    }
  };

  const emergency = async () => {
    const description = window.prompt('Describe brevemente la emergencia:');
    if (!description) return;
    const location = window.prompt('Ubicación (edificio / aula / zona):') || '';
    setBusy(true);
    try {
      await dispatch(createEmergency({ description, location })).unwrap();
      navigate('/mis-tickets');
    } catch (err) {
      setError(err || 'No se pudo enviar la emergencia.');
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <section className="page">
        <div className="page-head">
          <h1>Reportar incidencia</h1>
          <button
            className="btn-primary"
            style={{ background: '#dc2626' }}
            onClick={emergency}
            disabled={busy}
          >
            🚨 Emergencia
          </button>
        </div>

        <form className="card" onSubmit={submit} style={{ maxWidth: 620, marginTop: '1rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="incidentCode">Tipo de incidencia</label>
            <select
              id="incidentCode"
              name="incidentCode"
              value={form.incidentCode}
              onChange={onChange}
              style={{ borderLeft: `6px solid ${accentFor(form.incidentCode)}` }}
            >
              {Object.entries(INCIDENT_TYPES).map(([code, t]) => (
                <option key={code} value={code}>
                  {code} — {t.label} ({t.area})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="title">Título</label>
            <input id="title" name="title" value={form.title} onChange={onChange} required
              placeholder="Resumen corto del problema" />
          </div>

          <div className="field">
            <label htmlFor="location">Ubicación</label>
            <input id="location" name="location" value={form.location} onChange={onChange}
              placeholder="Edificio C, aula 204, baño planta baja…" />
          </div>

          <div className="field">
            <label htmlFor="description">Descripción</label>
            <textarea id="description" name="description" rows={4} value={form.description}
              onChange={onChange} required placeholder="Describe lo que ocurre con el mayor detalle posible." />
          </div>

          <button className="btn-primary" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </form>
      </section>
    </>
  );
}
