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

const createJohnAlex = async () => {
  const password = 'john123'; // Contraseña de prueba
  const passwordHash = await bcrypt.hash(password, 10);

  // Verificar que existe el rol de Médico
  db.get("SELECT rol_id FROM Roles WHERE nombre_rol = 'Médico'", (err, row) => {
    if (err) {
      console.error('Error obteniendo rol:', err.message);
      db.close();
      return;
    }
    
    if (!row) {
      console.error('❌ Rol "Médico" no encontrado');
      db.close();
      return;
    }

    const rol_id_medico = row.rol_id;
    console.log(`✅ Rol encontrado: Médico (ID: ${rol_id_medico})`);

    // Crear usuario John Alex
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
      'John Alex',
      'john@salud.com',
      'john123',
      '3009876543',
      rol_id_medico,
      1, // Activo
      passwordHash
    ], function(err) {
      if (err) {
        console.error('Error creando usuario John Alex:', err.message);
      } else if (this.changes > 0) {
        console.log('✅ Usuario John Alex creado exitosamente');
        console.log('\n👤 Credenciales de prueba:');
        console.log('📧 Email: john@salud.com');
        console.log('🔑 Contraseña: john123');
        console.log('👨‍⚕️ Rol: Médico');
        console.log(`🆔 ID: ${this.lastID}`);
      } else {
        console.log('ℹ️  Usuario John Alex ya existe');
        // Obtener el ID del usuario existente
        db.get("SELECT usuario_id FROM Usuarios WHERE email = 'john@salud.com'", (err, user) => {
          if (!err && user) {
            console.log(`🆔 ID: ${user.usuario_id}`);
          }
        });
      }
      db.close();
    });
  });
};

createJohnAlex().catch(err => {
  console.error('Error en createJohnAlex:', err);
  db.close();
});
