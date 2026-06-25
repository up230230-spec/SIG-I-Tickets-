/**
 * Definición central de roles y permisos (RBAC) de SIG-I.
 *
 * Toda validación de permisos en el servidor debe apoyarse en este archivo
 * (ver middleware/rbac.js). Mantener una sola fuente de verdad evita
 * inconsistencias entre módulos.
 */

// Roles del sistema (usar estas constantes en todo el código, nunca strings sueltos).
const ROLES = {
  USUARIO_GENERAL: 'usuario_general', // Alumnos, docentes, personal administrativo
  ADMIN_AREA: 'admin_area',           // Gestiona tickets de su área asignada
  OPERACIONES: 'operaciones',         // Acceso total al sistema
  RECTOR: 'rector',                   // Dashboards ejecutivos (solo lectura)
  JEFE_CARRERA: 'jefe_carrera',       // Tickets de su programa académico
};

// Permisos atómicos del sistema.
const PERMISSIONS = {
  TICKET_CREATE: 'ticket:create',
  TICKET_READ_OWN: 'ticket:read_own',
  TICKET_READ_AREA: 'ticket:read_area',
  TICKET_READ_PROGRAM: 'ticket:read_program',
  TICKET_READ_ALL: 'ticket:read_all',
  TICKET_UPDATE_STATUS: 'ticket:update_status',
  TICKET_REASSIGN: 'ticket:reassign',
  TICKET_DELETE: 'ticket:delete',
  COMMENT_PUBLIC: 'comment:public',
  COMMENT_INTERNAL: 'comment:internal',
  DASHBOARD_GLOBAL: 'dashboard:global',
  DASHBOARD_EXEC: 'dashboard:executive',
  REPORT_EXPORT: 'report:export',
  USER_MANAGE_ROLES: 'user:manage_roles',
  FORUM_POST: 'forum:post',
  FORUM_MODERATE: 'forum:moderate',
  FORUM_OFFICIAL_REPLY: 'forum:official_reply',
};

// Matriz rol -> permisos.
const ROLE_PERMISSIONS = {
  [ROLES.USUARIO_GENERAL]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ_OWN,
    PERMISSIONS.COMMENT_PUBLIC,
    PERMISSIONS.FORUM_POST,
  ],
  [ROLES.ADMIN_AREA]: [
    PERMISSIONS.TICKET_READ_AREA,
    PERMISSIONS.TICKET_UPDATE_STATUS,
    PERMISSIONS.TICKET_REASSIGN,
    PERMISSIONS.COMMENT_PUBLIC,
    PERMISSIONS.COMMENT_INTERNAL,
    PERMISSIONS.FORUM_POST,
    PERMISSIONS.FORUM_OFFICIAL_REPLY,
  ],
  [ROLES.OPERACIONES]: [
    // Acceso total.
    ...Object.values(PERMISSIONS),
  ],
  [ROLES.RECTOR]: [
    PERMISSIONS.TICKET_READ_ALL,
    PERMISSIONS.DASHBOARD_EXEC,
    PERMISSIONS.REPORT_EXPORT,
  ],
  [ROLES.JEFE_CARRERA]: [
    PERMISSIONS.TICKET_CREATE,
    PERMISSIONS.TICKET_READ_PROGRAM,
    PERMISSIONS.COMMENT_PUBLIC,
    PERMISSIONS.FORUM_POST,
  ],
};

/** Devuelve true si el rol tiene el permiso indicado. */
const roleHasPermission = (role, permission) =>
  (ROLE_PERMISSIONS[role] || []).includes(permission);

module.exports = { ROLES, PERMISSIONS, ROLE_PERMISSIONS, roleHasPermission };
