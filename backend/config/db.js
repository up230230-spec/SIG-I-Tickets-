const mongoose = require('mongoose');

/**
 * Conexión a MongoDB (Atlas o local).
 * La URI se toma de la variable de entorno MONGO_URI.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error de conexión a DB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
