/**
 * Seed de datos base para desarrollo.
 *
 * Crea las áreas operativas y un usuario por cada rol para poder probar los
 * paneles. Es idempotente: si algo ya existe, no lo duplica.
 *
 * Uso:  npm run seed   (desde backend/)
 */
require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Area = require('../models/Area');
const { AREAS } = require('../config/incidentCatalog');
const { ROLES } = require('../config/roles');

const AREA_SEED = [
  { name: AREAS.TI, description: 'Tecnologías de la Información', color: '#2563eb' },
  { name: AREAS.MANTENIMIENTO, description: 'Mantenimiento e Infraestructura', color: '#d97706' },
  { name: AREAS.SEGURIDAD, description: 'Seguridad y Protección Civil', color: '#dc2626' },
];

// Contraseña común para todos los usuarios de prueba.
const DEMO_PASSWORD = 'password123';

const USER_SEED = [
  { name: 'Operaciones SIG-I', email: 'operaciones@alumnos.upa.edu.mx', role: ROLES.OPERACIONES },
  { name: 'Admin TI', email: 'ti@alumnos.upa.edu.mx', role: ROLES.ADMIN_AREA, area: AREAS.TI },
  { name: 'Admin Mantenimiento', email: 'mantenimiento@alumnos.upa.edu.mx', role: ROLES.ADMIN_AREA, area: AREAS.MANTENIMIENTO },
  { name: 'Admin Seguridad', email: 'seguridad@alumnos.upa.edu.mx', role: ROLES.ADMIN_AREA, area: AREAS.SEGURIDAD },
  { name: 'Rectoría', email: 'rector@alumnos.upa.edu.mx', role: ROLES.RECTOR },
  { name: 'Jefe de Carrera', email: 'jefe@alumnos.upa.edu.mx', role: ROLES.JEFE_CARRERA, program: 'Ingeniería en Sistemas' },
  { name: 'Usuario General', email: 'up230230@alumnos.upa.edu.mx', role: ROLES.USUARIO_GENERAL },
];

async function run() {
  await connectDB();

  // Áreas.
  for (const a of AREA_SEED) {
    await Area.updateOne({ name: a.name }, { $setOnInsert: a }, { upsert: true });
  }
  console.log(`✅ Áreas listas: ${AREA_SEED.map((a) => a.name).join(', ')}`);

  // Usuarios (uno por rol).
  for (const u of USER_SEED) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`  · ya existe: ${u.email} (${u.role})`);
      continue;
    }
    await User.create({ ...u, password: DEMO_PASSWORD, isVerified: true });
    console.log(`  + creado: ${u.email} (${u.role})`);
  }

  console.log(`\n🔑 Contraseña para todas las cuentas de prueba: ${DEMO_PASSWORD}`);
  console.log('   Ej. operaciones@alumnos.upa.edu.mx / password123\n');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
