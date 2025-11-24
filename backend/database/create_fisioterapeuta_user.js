const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Usar la MISMA base de datos que el servidor: backend/database/salud_digital_aps.db
const DB_PATH = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite:', DB_PATH);
  }
});

async function ensureFisioterapeutaRole() {
  return new Promise((resolve, reject) => {
    db.get("SELECT rol_id FROM Roles WHERE nombre_rol = ?", ['Fisioterapeuta'], async (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row.rol_id);

      db.run("INSERT INTO Roles (nombre_rol) VALUES (?)", ['Fisioterapeuta'], function (insertErr) {
        if (insertErr) return reject(insertErr);
        console.log('✅ Rol "Fisioterapeuta" creado');
        db.get("SELECT rol_id FROM Roles WHERE nombre_rol = ?", ['Fisioterapeuta'], (e2, r2) => {
          if (e2) return reject(e2);
          resolve(r2.rol_id);
        });
      });
    });
  });
}

async function createFisioterapeutaUser() {
  const email = 'fisioterapeuta@salud.com';
  const passwordPlain = 'fisio123';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  try {
    // Asegurar rol
    const rolId = await ensureFisioterapeutaRole();
    console.log(`ℹ️  Rol Fisioterapeuta (ID: ${rolId}) listo`);

    const insertSql = `
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

    await new Promise((resolve, reject) => {
      db.run(
        insertSql,
        [
          'Fisioterapeuta Demo',
          email,
          '900000001',
          '3000000001',
          rolId,
          1,
          passwordHash,
        ],
        function (err) {
          if (err) return reject(err);
          if (this.changes > 0) {
            console.log('✅ Usuario Fisioterapeuta creado');
          } else {
            console.log('ℹ️  Usuario Fisioterapeuta ya existía (INSERT OR IGNORE)');
          }
          resolve();
        }
      );
    });

    // Confirmar usuario
    await new Promise((resolve, reject) => {
      db.get(
        'SELECT usuario_id, email, rol_id, activo FROM Usuarios WHERE email = ?',
        [email],
        (err, row) => {
          if (err) return reject(err);
          console.log('\n📋 Usuario listo:', row);
          console.log('\n🔑 Credenciales:');
          console.log('   Email:    fisioterapeuta@salud.com');
          console.log('   Password: fisio123');
          resolve();
        }
      );
    });
  } catch (error) {
    console.error('❌ Error creando usuario Fisioterapeuta:', error.message || error);
  } finally {
    db.close();
  }
}

createFisioterapeutaUser();


