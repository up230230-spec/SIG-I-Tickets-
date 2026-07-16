# Flujo de la aplicación — SIG-I

Recorrido funcional del sistema: cómo entra el usuario, cómo se mueve entre
secciones y **qué ocurre al pulsar cada botón**. La navegación se resuelve con
`react-router-dom` y el estado con **Redux Toolkit** (slices `auth`, `tickets`,
`forum`, `dashboard`).

---

## 1. Mapa general de rutas

```mermaid
flowchart TD
    subgraph Públicas
        L["/login — Login"]
        R["/register — Register"]
    end
    subgraph Protegidas["Protegidas (requieren sesión + rol)"]
        H["/ — Reportar incidencia"]
        MT["/mis-tickets — Mis reportes"]
        AR["/area — Panel de área / Todos los tickets"]
        OP["/operaciones — Panel global"]
        EJ["/ejecutivo — Dashboard ejecutivo"]
        FO["/foro — Foro institucional"]
    end

    L -->|login OK| Redirige{{homeRouteForRole}}
    R -->|registro OK dev| Redirige
    L <-->|enlaces| R

    Redirige -->|usuario_general| H
    Redirige -->|jefe_carrera| MT
    Redirige -->|admin_area| AR
    Redirige -->|operaciones| OP
    Redirige -->|rector| EJ
```

`ProtectedRoute` vigila cada ruta protegida:
- **Sin sesión** → redirige a `/login`.
- **Con sesión pero rol no autorizado** → redirige a `/`.

---

## 2. Autenticación (Módulo A)

```mermaid
flowchart TD
    A[Login: correo + contraseña] -->|clic 'Entrar'| B["dispatch(login)"]
    B -->|POST /api/auth/login| C{¿Credenciales OK?}
    C -->|No| D[Alerta de error en el formulario]
    C -->|Sí| E[Guarda JWT en localStorage<br/>store.auth.user = user]
    E --> F["navigate(homeRouteForRole(role))"]

    G[Register: nombre, correo .edu.mx, contraseña] -->|clic 'Crear cuenta'| H["dispatch(register)"]
    H -->|POST /api/auth/register| I{¿Modo?}
    I -->|desarrollo: devuelve token| E
    I -->|producción: verificar correo| J[Mensaje: revisa tu correo]
```

- Al cargar la app, `AuthProvider` despacha `loadMe()` → `GET /api/auth/me` para
  restaurar la sesión si hay token guardado.
- **Botón "Salir"** (Navbar) → `dispatch(logout())` borra el token y navega a `/login`.

---

## 3. Barra de navegación (enlaces según rol)

El `Navbar` muestra **solo** las secciones permitidas para el rol:

| Enlace | Ruta | Roles que lo ven |
|--------|------|------------------|
| Reportar | `/` | usuario_general, jefe_carrera, operaciones |
| Mis reportes | `/mis-tickets` | usuario_general, jefe_carrera, operaciones |
| Panel de área / **Tickets** | `/area` | admin_area, operaciones |
| Operaciones | `/operaciones` | operaciones |
| Ejecutivo | `/ejecutivo` | rector, operaciones |
| Foro | `/foro` | todos |
| Salir | — | todos (cierra sesión) |

---

## 4. Reportar incidencia (Módulo B) — ruta `/`

```mermaid
flowchart TD
    subgraph Formulario normal
        A[Elige tipo INC, título, ubicación, descripción] -->|clic 'Enviar reporte'| B["dispatch(createTicket)"]
        B -->|POST /api/tickets| C[Backend asigna área + severidad<br/>según el código INC]
        C --> D["navigate('/mis-tickets')"]
    end

    subgraph Botón de emergencia
        E[clic '🚨 Emergencia'] --> F[prompt: descripción + ubicación]
        F -->|POST /api/tickets/emergency| G[Ticket crítico + alerta Socket.io]
        G --> D
    end
```

- El **color de la orilla** del selector cambia según el tipo de incidencia elegido.
- Tras enviar, el usuario aterriza en **Mis reportes** para ver su ticket recién creado.

---

## 5. Mis reportes (Módulo B) — ruta `/mis-tickets`

```mermaid
flowchart TD
    A[Entra a la sección] -->|"dispatch(fetchTickets({mine:1}))"| B[GET /api/tickets?mine=1]
    B --> C[Muestra SOLO los tickets propios como tarjetas]
    C -->|clic en una tarjeta| D["dispatch(fetchTicket(id))"]
    D -->|GET /api/tickets/:id| E[Abre panel de detalle:<br/>estado, descripción, comentarios]
    E -->|escribe comentario + 'Enviar'| F["dispatch(addComment)"]
    F -->|POST /api/tickets/:id/comments| G[Comentario añadido al hilo]
    E -->|clic 'Cerrar'| H["dispatch(clearDetail)"]
```

> `?mine=1` fuerza que **cualquier** rol vea aquí únicamente lo que él reportó.

---

## 6. Panel de área / Todos los tickets (Módulo C) — ruta `/area`

```mermaid
flowchart TD
    A[Entra a la sección] --> B{¿Rol?}
    B -->|operaciones| C["Título 'Todos los tickets'<br/>+ filtro por Área"]
    B -->|admin_area| D["Título 'Panel de mi área'<br/>solo su área (forzado por backend)"]
    C --> E["dispatch(fetchTickets(filtros))"]
    D --> E
    E -->|GET /api/tickets?status=&severity=&area=| F[Tabla de tickets con color por tipo]

    F -->|clic '→ siguiente estado'| G[prompt: comentario obligatorio]
    G -->|"dispatch(updateStatus)"| H[PATCH /api/tickets/:id/status]

    F -->|clic 'Reasignar'| I[prompt: ID destino + motivo]
    I -->|"dispatch(reassignTicket)"| J[PATCH /api/tickets/:id/reassign]

    H --> K[Recarga la lista]
    J --> K
```

- Flujo de estados unidireccional: **abierto → en_proceso → resuelto → cerrado**
  (cada cambio exige comentario). Solo Operaciones puede regresar de resuelto a en_proceso.

---

## 7. Panel global (Módulo D) — ruta `/operaciones`

```mermaid
flowchart TD
    A[Entra a la sección] -->|"dispatch(fetchGlobal) + fetchHeatmap"| B[GET /api/dashboard/global<br/>GET /api/dashboard/heatmap]
    B --> C[Tarjetas KPI + mapa de calor por área + últimos reportes]
    C -.->|cada 60s| B

    C -->|clic 'Exportar CSV'| D[GET /dashboard/reports/tickets.csv<br/>con JWT → descarga blob]
    C -->|clic 'Exportar PDF'| E[GET /dashboard/reports/tickets.pdf<br/>con JWT → descarga blob]
```

- Refresco automático cada **60 segundos**.
- Los reportes se descargan con `fetch` autenticado (adjunta el JWT) y se fuerza
  la descarga del archivo generado por el backend.

---

## 8. Dashboard ejecutivo (Módulo D) — ruta `/ejecutivo`

```mermaid
flowchart TD
    A[Entra a la sección] -->|"dispatch(fetchExecutive)"| B[GET /api/dashboard/executive]
    B --> C[KPIs: cumplimiento de SLA, tiempo medio de<br/>resolución, backlog, volumen por área/severidad]
```

Solo lectura (rol Rector / Operaciones). El color del % de SLA cambia:
verde ≥90 %, naranja ≥70 %, rojo por debajo.

---

## 9. Foro institucional (Módulo E) — ruta `/foro`

```mermaid
flowchart TD
    A[Entra a la sección] -->|"dispatch(fetchPosts(categoria))"| B[GET /api/forum]
    B --> C[Lista de hilos por categoría]

    C -->|'Publicar' nuevo hilo| D["dispatch(createPost)"]
    D -->|POST /api/forum| B

    C -->|clic en un hilo| E["dispatch(fetchPost(id))"]
    E -->|GET /api/forum/:id| F[Detalle del hilo + respuestas]

    F -->|'Responder'| G["dispatch(addReply)"]
    G -->|POST /api/forum/:id/replies| F

    F -->|solo Operaciones: Fijar/Cerrar| H["dispatch(moderatePost)"]
    F -->|solo Operaciones: Eliminar| I["dispatch(deletePost)"]
    H -->|PATCH /api/forum/:id/moderate| B
    I -->|DELETE /api/forum/:id| B
```

- **Publicación anónima**: el autor real se oculta a todos salvo a Operaciones.
- **Respuesta oficial** (etiqueta verde): solo admin de área / Operaciones.

---

## 10. Ciclo completo (resumen)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as React + Redux
    participant API as Express API
    participant DB as MongoDB

    U->>UI: Inicia sesión
    UI->>API: POST /auth/login
    API->>DB: Verifica credenciales
    DB-->>API: usuario
    API-->>UI: JWT + user
    UI-->>U: Redirige al panel según rol

    U->>UI: Reporta incidencia
    UI->>API: POST /tickets (con JWT)
    API->>DB: Crea ticket (área/severidad automáticas)
    API-->>UI: ticket creado
    Note over API: Si es crítico → alerta Socket.io en tiempo real
    UI-->>U: Ve el ticket en 'Mis reportes'

    U->>UI: (Admin) cambia estado
    UI->>API: PATCH /tickets/:id/status
    API->>DB: Actualiza + registra en AuditLog
    API-->>UI: ticket actualizado
```

---

### Notas clave del flujo
- **Todo** pasa por el cliente API central ([frontend/src/api/client.js](frontend/src/api/client.js)),
  que adjunta el JWT automáticamente.
- Cada acción de UI despacha un **thunk de Redux**; el estado resultante actualiza
  la vista sin recargar la página.
- El backend **siempre** re-verifica permisos por rol (un admin de TI nunca verá
  tickets de otra área, aunque manipule la petición).
