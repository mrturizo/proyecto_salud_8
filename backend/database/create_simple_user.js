const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Crear usuario auxiliar simple
const createUser = `
  INSERT OR IGNORE INTO Usuarios (
    nombre_completo, 
    email, 
    numero_documento, 
    telefono,
    activo
  ) VALUES (?, ?, ?, ?, ?)
`;

db.run(createUser, [
  'María Auxiliar Enfermería',
  'auxiliar@salud.com',
  'aux123',
  '3001234567',
  1
], function(err) {
  if (err) {
    console.error('Error creando usuario:', err.message);
  } else if (this.changes > 0) {
    console.log('✅ Usuario auxiliar creado exitosamente');
  } else {
    console.log('ℹ️  Usuario auxiliar ya existe');
  }
  
  console.log('👤 Credenciales de prueba:');
  console.log('📧 Email: auxiliar@salud.com');
  console.log('🔑 Contraseña: aux123');
  
  db.close();
});
