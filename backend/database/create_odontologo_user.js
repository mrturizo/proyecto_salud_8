const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos:', DB_PATH);
  }
});

async function ensureRole() {
  return new Promise((resolve, reject) => {
    db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Odontólogo')", [], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row.rol_id);
      db.run("INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Odontólogo')", [], function(e){
        if (e) return reject(e);
        db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Odontólogo')", [], (e2, r2) => {
          if (e2) return reject(e2);
          resolve(r2?.rol_id || 0);
        });
      });
    });
  });
}

(async () => {
  try {
    const rolId = await ensureRole();
    const email = 'odontologo@salud.com';
    const doc = '900000004';
    const hash = await bcrypt.hash('odonto123', 10);

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO Usuarios (nombre_completo,email,numero_documento,telefono,rol_id,activo,password_hash)
         VALUES (?,?,?,?,?,1,?)`,
        ['Odontólogo Demo', email, doc, '3000000004', rolId, hash],
        function (err) { if (err) return reject(err); resolve(); }
      );
    });

    db.get('SELECT usuario_id,email,numero_documento,rol_id FROM Usuarios WHERE lower(email)=lower(?)', [email], (e, row) => {
      if (e) console.error(e);
      console.log('\n📋 Usuario listo:', row);
      console.log('\n🔑 Accesos:');
      console.log('  Email:', email);
      console.log('  Password (documento):', doc);
      console.log('  Password alterno:', 'odonto123');
      db.close();
    });
  } catch (err) {
    console.error('❌ Error creando odontólogo:', err.message || err);
    db.close();
  }
})();


