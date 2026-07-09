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

**Requisito previo:** [Node.js](https://nodejs.org) (versión LTS). Verifica con `node --version`.

> El proyecto son **dos servidores** que corren a la vez: el backend (API) y el
> frontend (web). Usa **dos terminales**, una para cada uno.

### 1️⃣ Backend (API) — primera vez

```powershell
cd backend
npm install                 # instala dependencias
copy .env.example .env      # crea tu archivo de entorno (en Mac/Linux: cp)
# edita backend/.env y pon un MONGO_URI y JWT_SECRET válidos
npm run seed                # crea áreas + usuarios de prueba (idempotente)
npm run dev                 # arranca la API en http://localhost:3000
```

### 2️⃣ Frontend (web) — primera vez, en OTRA terminal

```powershell
cd frontend
npm install                 # instala dependencias
npm run dev                 # arranca la web en http://localhost:5173
```

Abre **http://localhost:5173** en el navegador.

### Día a día

Ya hecho el setup inicial, solo hacen falta **dos comandos** (uno por terminal):

| Terminal | Carpeta | Comando |
|----------|---------|---------|
| 1 — Backend | `backend/` | `npm run dev` |
| 2 — Frontend | `frontend/` | `npm run dev` |

### Cuentas de prueba (tras `npm run seed`)

Contraseña para todas: **`password123`**

| Rol | Correo |
|-----|--------|
| Operaciones | `operaciones@alumnos.upa.edu.mx` |
| Admin de área (TI) | `ti@alumnos.upa.edu.mx` |
| Rector | `rector@alumnos.upa.edu.mx` |
| Usuario general | `up******@alumnos.upa.edu.mx` |

O regístrate con tu propio correo institucional `up######@alumnos.upa.edu.mx`.

### Notas para el equipo

- **`backend/.env` no está en el repo** (contiene credenciales). Cada quien debe
  crearlo desde `.env.example` con una cadena de MongoDB válida.
- `npm run seed` **solo se corre una vez por base de datos**; es idempotente (no duplica).
- Si al arrancar el backend aparece **`querySrv ECONNREFUSED`**, tu red bloquea la
  consulta DNS `SRV`: usa la cadena en formato `mongodb://host1,host2,host3/...`
  (hosts directos) en vez de `mongodb+srv://`.

## Roles

`usuario_general` · `admin_area` · `operaciones` · `rector` · `jefe_carrera`
(definidos en [backend/config/roles.js](backend/config/roles.js)).

##  Seguridad

El `backend/.env` contiene credenciales reales y **no debe subirse** (ya está en
`.gitignore`). Como fue commiteado en la versión inicial, **rota las credenciales
de MongoDB y el `JWT_SECRET`** antes de continuar.
