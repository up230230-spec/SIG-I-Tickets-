# Guía de estilos — SIG-I

Sistema de diseño del **Sistema Integral de Gestión de Incidencias (SIG-I)**.
Documenta los tokens visuales, la tipografía, los componentes y los mockups de
cada pantalla. La fuente de verdad de los tokens es
[frontend/src/styles/theme.css](frontend/src/styles/theme.css); esta guía los
explica y los organiza. Los mockups visuales interactivos están en
[flujo-presentacion.html](flujo-presentacion.html) y en el artefacto de mockups.

---

## 1. Principios de diseño

1. **Claridad institucional** — paleta azul sobria (UPA), jerarquía tipográfica clara.
2. **Identificación por color** — cada tipo de incidencia y cada severidad tiene un color; la información crítica salta a la vista.
3. **Consistencia** — todos los componentes derivan de las mismas variables CSS (`--blue-*`, `--radius`, `--shadow`).
4. **Responsivo primero** — grillas que colapsan a una columna y tablas con scroll horizontal en móvil.

---

## 2. Paleta de color (tokens)

### Azules institucionales

| Token | Hex | Uso |
|-------|-----|-----|
| `--blue-900` | `#0a2540` | Títulos, navbar, fondos oscuros |
| `--blue-800` | `#103a66` | Subtítulos, texto de acento |
| `--blue-700` | `#1e4f8a` | Hover de botones primarios |
| `--blue-600` | `#2563eb` | **Color primario** (botones, enlaces) |
| `--blue-500` | `#3b82f6` | Borde de foco |
| `--blue-400` | `#60a5fa` | Acentos suaves |
| `--blue-100` | `#dbeafe` | Fondos de badge, halo de foco |
| `--blue-50`  | `#eff6ff` | Fondos sutiles, filas hover |

### Neutros

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#f4f7fb` | Fondo de la aplicación |
| `--surface` | `#ffffff` | Tarjetas, formularios, tablas |
| `--text` | `#0f172a` | Texto principal |
| `--text-muted` | `#64748b` | Texto secundario / meta |
| `--border` | `#e2e8f0` | Bordes y separadores |

### Semánticos (severidad y estado)

| Estado | Fondo | Texto | Token de clase |
|--------|-------|-------|----------------|
| Crítica | `#fee2e2` | `#b91c1c` | `.badge.sev-critica` |
| Alta | `#ffedd5` | `#c2410c` | `.badge.sev-alta` |
| Media | `#dbeafe` | `#103a66` | `.badge.sev-media` |
| Oficial (foro) | `#dcfce7` | `#15803d` | `.badge.official` |
| Error | `#fef2f2` | `#b91c1c` | `.alert-error` |
| Éxito | `#f0fdf4` | `#15803d` | `.alert-success` |

> Además, cada **tipo de incidencia** define un color de acento propio para la
> orilla izquierda de su tarjeta (ver
> [frontend/src/config/incidentTypes.js](frontend/src/config/incidentTypes.js)).

---

## 3. Tipografía

- **Familia:** stack del sistema (`system-ui`, Segoe UI, Roboto, Helvetica…) — rápida y nativa en cada SO.
- **Escala:**
  - `h1` de página: ~1.8–2 rem, color `--blue-900`.
  - `h2` de sección: ~1.3 rem, color `--blue-900`.
  - Cuerpo: 0.95 rem.
  - Meta / secundario: 0.85 rem, color `--text-muted`.
  - Valor de KPI (`.stat-card .value`): 2 rem, peso 700.

---

## 4. Tokens de forma

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius` | `12px` | Bordes de tarjetas, formularios, tablas |
| `--shadow` | `0 2px 10px rgba(16,58,102,0.08)` | Elevación de superficies |
| Radio de botón | `8px` | Botones e inputs |
| Radio de badge | `999px` | Pastillas / etiquetas |

---

## 5. Componentes

| Componente | Clase | Descripción |
|------------|-------|-------------|
| Botón primario | `.btn-primary` | Acción principal (azul, texto blanco). |
| Botón fantasma | `.btn-ghost` | Acción secundaria (borde, fondo transparente). |
| Tarjeta | `.card` | Superficie base con sombra y radio. |
| Tarjeta KPI | `.stat-card` | Valor grande + etiqueta centrada. |
| Tarjeta de ticket | `.ticket-card` | Con **línea de orilla** de color por tipo (`--accent`). |
| Badge | `.badge` (+ `.sev-*`, `.official`) | Pastilla de estado/severidad. |
| Alerta | `.alert` (+ `.alert-error`/`.alert-success`) | Mensajes de feedback. |
| Campo de formulario | `.field` | Label + input con estado de foco azul. |
| Tabla | `.table` dentro de `.table-wrap` | Tabla con scroll horizontal en móvil. |
| Grilla | `.grid.cols-{2,3,4}` | Colapsa a 1 columna < 800px. |
| Barra de calor | `.heat-row` / `.heat-track` / `.heat-fill` | Mapa de calor por área. |
| Navbar | `.navbar` | Barra superior adaptada al rol. |

---

## 6. Responsividad (breakpoints)

- **≤ 800px:** las grillas `.cols-2/3/4` pasan a una sola columna.
- **≤ 600px:** se reduce el padding de página, se oculta el nombre de usuario en la navbar, se encoge la tipografía de KPIs y el mapa de calor.
- Las tablas siempre viven dentro de `.table-wrap` (scroll horizontal) para no desbordar en móvil.

---

## 7. Iconografía

Se usan emojis semánticos para señales rápidas, sin dependencias externas:
🚨 emergencia · 🎫 ticket · 💬 foro · 📌 hilo fijado · 🔒 hilo cerrado.

---

## 8. Mockups por pantalla

Los mockups completos, navegables, están en el **artefacto HTML de mockups** y en
[flujo-presentacion.html](flujo-presentacion.html). Resumen de cada pantalla:

| Pantalla | Ruta | Descripción del layout |
|----------|------|------------------------|
| **Login** | `/login` | Pantalla centrada con degradado azul, tarjeta de formulario (correo + contraseña) y enlace a registro. |
| **Registro** | `/register` | Igual que login, con nombre + correo `.edu.mx` + contraseña. |
| **Reportar incidencia** | `/` | Formulario con selector de tipo (orilla de color dinámica), título, ubicación, descripción y botón de emergencia 🚨. |
| **Mis reportes** | `/mis-tickets` | Grilla de `TicketCard` + panel de detalle con seguimiento de comentarios. |
| **Panel de área / Tickets** | `/area` | Toolbar de filtros + tabla de tickets con acciones de estado y reasignación. |
| **Panel global** | `/operaciones` | 4 KPIs + mapa de calor por área + tabla de últimos reportes + exportar CSV/PDF. |
| **Dashboard ejecutivo** | `/ejecutivo` | KPIs de SLA (color por umbral), tiempo medio de resolución, backlog y volumen. |
| **Foro** | `/foro` | Lista de hilos por categoría + detalle con respuestas (oficiales/anónimas). |
| **Mi actividad** | `/mi-actividad` | Dashboard personal: KPIs (reportes, comentarios, foro), gestión (si aplica), desglose por estado, línea de tiempo y hilos del foro. |

---

## 9. Justificación del estado global (Redux + Context)

- **Redux Toolkit** centraliza el estado que comparten varias pantallas y que se
  sincroniza con la API: `auth`, `tickets`, `forum`, `dashboard`. Se eligió por
  su previsibilidad (thunks async con estados `pending/fulfilled/rejected`) y por
  las DevTools.
- **Context API** (`AuthContext`) se conserva como una **capa fina** sobre el
  slice `auth`: expone `useAuth()` / `homeRouteForRole()` a los componentes sin
  acoplarlos a la forma del store, lo que facilitó migrar de Context puro a
  Redux sin reescribir las páginas.
- El **estado local de UI** (texto de un comentario, campo de filtro) vive con
  `useState` en cada componente; no todo pertenece al store global.
