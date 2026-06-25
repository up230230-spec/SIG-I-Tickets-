import { INCIDENT_TYPES, accentFor } from '../config/incidentTypes';

/**
 * Tarjeta de ticket. La línea de orilla (borde izquierdo) toma el color del
 * tipo de incidencia para identificarlo de un vistazo. El resto del diseño
 * usa la paleta azul del tema (styles/theme.css).
 */
export default function TicketCard({ ticket, onClick }) {
  const accent = accentFor(ticket.incidentCode);
  const typeLabel = INCIDENT_TYPES[ticket.incidentCode]?.label || ticket.incidentCode;

  return (
    <article
      className="ticket-card"
      style={{ '--accent': accent }}
      onClick={onClick}
    >
      <span className="meta" style={{ color: accent, fontWeight: 600 }}>
        {ticket.incidentCode} · {typeLabel}
      </span>
      <h3>{ticket.title}</h3>
      <p>{ticket.description}</p>
      <div className="meta">
        {ticket.area} · {ticket.severity} · {ticket.status}
      </div>
    </article>
  );
}
