# Arquitectura — SIG-I (esqueleto)

Mapa de la reestructuración. Estado actual: **backend completo** (Módulos A–E
implementados) y **frontend funcional** (páginas conectadas a la API). El
esqueleto original está descrito abajo; ya no quedan controllers en `501`.

## Backend (`/backend`)

```
backend/
├── server.js              Punto de entrada (Express + HTTP + Socket.io)
├── config/
│   ├── env.js             Carga/valida variables de entorno
│   ├── db.js              Conexión MongoDB
│   ├── roles.js           ROLES, PERMISSIONS y matriz RBAC (fuente de verdad)
│   └── incidentCatalog.js Catálogo INC-001… → área + severidad (asignación auto)
├── models/                Esquemas Mongoose (COMPLETOS)
│   ├── User.js            5 roles, bcrypt, verificación, reset password
│   ├── Ticket.js          Folio, estados, escalamiento, asignación, emergencia
│   ├── Comment.js         Público / interno + cambios de estado
│   ├── Area.js            Áreas operativas + admins + color
│   ├── ForumPost.js       Hilos del foro (anónimo, pin, cerrado)
│   ├── ForumReply.js      Respuestas (oficial / anónima)
│   └── AuditLog.js        Bitácora append-only (solo escritura, 2 años)
├── middleware/
│   ├── auth.js            protect (verifica JWT → req.user)
│   ├── rbac.js            requirePermission / requireRole
│   ├── audit.js           recordAudit() → AuditLog
│   └── errorHandler.js    notFound + errorHandler global
├── controllers/           IMPLEMENTADOS
│   ├── authController.js      Módulo A
│   ├── ticketController.js    Módulos B/C
│   ├── areaController.js       CRUD de áreas + catálogo INC
│   ├── dashboardController.js  Módulo D (global, heatmap, executive)
│   ├── reportController.js     Módulo D (export CSV/PDF)
│   └── forumController.js      Módulo E
├── routes/                Rutas por módulo + index (agregador → /api)
├── services/
│   ├── emailService.js        Verificación / reset (nodemailer)
│   ├── alertService.js        Alertas en tiempo real (Socket.io, críticos ≤10s)
│   ├── escalationService.js   Escalamiento 48h → severidad Alta
│   └── reportService.js       Export CSV / PDF (sin dependencias externas)
└── sockets/index.js       Gateway Socket.io (salas por área)
```

### Endpoints principales (`/api`)

| Método | Ruta | Módulo | Permiso |
|--------|------|--------|---------|
| POST | `/auth/register`, `/auth/login` | A | público |
| GET | `/auth/me` | A | autenticado |
| PATCH | `/auth/users/:id/role` | A | `user:manage_roles` |
| POST | `/tickets`, `/tickets/emergency` | B | `ticket:create` |
| GET | `/tickets`, `/tickets/:id` | B/C | autenticado (filtra por rol) |
| PATCH | `/tickets/:id/status` | C | `ticket:update_status` |
| PATCH | `/tickets/:id/reassign` | C | `ticket:reassign` |
| DELETE | `/tickets/:id` | D | `ticket:delete` |
| GET | `/dashboard/global`, `/heatmap` | D | `dashboard:global` |
| GET | `/dashboard/executive` | D | `dashboard:executive` |
| GET | `/dashboard/reports/tickets.{csv,pdf}` | D | `report:export` |
| GET/POST | `/forum`, `/forum/:id/replies` | E | `forum:post` |
| PATCH/DELETE | `/forum/:id/moderate`, `/forum/:id` | E | `forum:moderate` |

## Frontend (`/frontend/src`)

```
src/
├── App.jsx                Enrutamiento + ProtectedRoute por rol
├── api/
│   ├── client.js          Cliente HTTP (adjunta JWT)
│   └── socket.js          Cliente Socket.io (stub)
├── context/AuthContext.jsx  Sesión, rol, login/logout
├── routes/ProtectedRoute.jsx Protección por auth y rol
├── config/incidentTypes.js   Catálogo + color de orilla por tipo
├── styles/theme.css       Paleta AZUL institucional
├── components/TicketCard.jsx Tarjeta con LÍNEA DE ORILLA de color por tipo
└── pages/                 Stubs por módulo/rol
    ├── Login.jsx, Register.jsx
    ├── ReportIncident.jsx, MyTickets.jsx
    ├── AreaPanel.jsx, GlobalPanel.jsx
    ├── ExecutiveDashboard.jsx, Forum.jsx
```

### Diseño visual
- Paleta general **azul** (`styles/theme.css`).
- Cada tarjeta de ticket lleva una **línea de color en la orilla izquierda**
  según su tipo de incidencia (`config/incidentTypes.js`), para distinguirlos
  de un vistazo.

## Reglas de negocio clave (a implementar en los stubs)

1. **Asignación automática**: el código INC determina área y severidad.
2. **Alerta crítica ≤10s**: tickets críticos/emergencia → `alertService.broadcastCriticalAlert`.
3. **Flujo de estados**: `abierto → en_proceso → resuelto → cerrado`; cada cambio
   exige comentario. Excepción `resuelto → en_proceso` solo Operaciones.
4. **Escalamiento 48h**: sin actividad → severidad Alta (`escalationService`).
5. **Auditoría append-only**: acciones sensibles → `AuditLog`.
```
