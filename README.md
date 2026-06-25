# SIG-I — Sistema Integral de Gestión de Incidencias Universitarias

Plataforma web institucional para el reporte, seguimiento y resolución de incidencias operativas dentro de la universidad.

> Este repositorio fue reestructurado desde el prototipo *Brigada SOS* hacia la
> arquitectura de SIG-I. Actualmente contiene el **esqueleto** (estructura,
> modelos de datos, configuración y stubs por módulo); la lógica de cada módulo
> se implementa por fases.

## Stack

- **Backend:** Node.js + Express + MongoDB (Mongoose) + Socket.io + JWT
- **Frontend:** React 19 + Vite + React Router

## Estructura

```
sig-i/
├── backend/     API REST, modelos, RBAC, tiempo real  (ver ARCHITECTURE.md)
└── frontend/    SPA React con tema azul y enrutamiento por rol
```

Consulta **[ARCHITECTURE.md](ARCHITECTURE.md)** para el mapa completo de carpetas,
modelos y endpoints.

## Puesta en marcha

```bash
# Backend
cd backend
cp .env.example .env      # completar credenciales
npm install
npm run dev               # http://localhost:3000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Roles

`usuario_general` · `admin_area` · `operaciones` · `rector` · `jefe_carrera`
(definidos en [backend/config/roles.js](backend/config/roles.js)).

## ⚠️ Seguridad

El `backend/.env` contiene credenciales reales y **no debe subirse** (ya está en
`.gitignore`). Como fue commiteado en la versión inicial, **rota las credenciales
de MongoDB y el `JWT_SECRET`** antes de continuar.
