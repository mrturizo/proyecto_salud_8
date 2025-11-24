const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

const createAuxiliarUser = async () => {
  const password = 'aux123'; // Contraseña de prueba
  const passwordHash = await bcrypt.hash(password, 10);

  // Verificar que existe el rol de Auxiliar de Enfermería
  db.get("SELECT rol_id FROM Roles WHERE nombre_rol = 'Auxiliar de Enfermería'", (err, row) => {
    if (err) {
      console.error('Error obteniendo rol:', err.message);
      db.close();
      return;
    }
    
    if (!row) {
      console.error('❌ Rol "Auxiliar de Enfermería" no encontrado');
      db.close();
      return;
    }

    const rol_id_auxiliar = row.rol_id;
    console.log(`✅ Rol encontrado: Auxiliar de Enfermería (ID: ${rol_id_auxiliar})`);

    // Crear usuario auxiliar
    const insertUser = `
      INSERT OR IGNORE INTO Usuarios (
        nombre_completo,
        email,
        numero_documento,
        telefono,
        rol_id,
        activo,
        password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertUser, [
      'María Auxiliar Enfermería',
      'auxiliar@salud.com',
      'aux123',
      '3001234567',
      rol_id_auxiliar,
      1, // Activo
      passwordHash
    ], function(err) {
      if (err) {
        console.error('Error creando usuario auxiliar:', err.message);
      } else if (this.changes > 0) {
        console.log('✅ Usuario auxiliar creado exitosamente');
        console.log('\n👤 Credenciales de prueba:');
        console.log('📧 Email: auxiliar@salud.com');
        console.log('🔑 Contraseña: aux123');
        console.log('👩‍⚕️ Rol: Auxiliar de Enfermería');
      } else {
        console.log('ℹ️  Usuario auxiliar ya existe');
        console.log('\n👤 Credenciales existentes:');
        console.log('📧 Email: auxiliar@salud.com');
        console.log('🔑 Contraseña: aux123');
        console.log('👩‍⚕️ Rol: Auxiliar de Enfermería');
      }
      db.close();
    });
  });
};

createAuxiliarUser().catch(err => {
  console.error('Error en createAuxiliarUser:', err);
  db.close();
});