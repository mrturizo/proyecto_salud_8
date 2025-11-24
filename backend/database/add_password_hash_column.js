const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la BD:', DB_PATH);
  }
});

function columnExists(table, column) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${table})`, (err, rows) => {
      if (err) return reject(err);
      const exists = rows.some((r) => r.name === column);
      resolve(exists);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

(async () => {
  try {
    const exists = await columnExists('Usuarios', 'password_hash');
    if (!exists) {
      console.log('🛠️  Agregando columna password_hash a Usuarios...');
      await run('ALTER TABLE Usuarios ADD COLUMN password_hash TEXT');
      console.log('✅ Columna password_hash agregada');
    } else {
      console.log('ℹ️  La columna password_hash ya existe');
    }

    // Establecer hash para el fisioterapeuta demo
    const email = 'fisioterapeuta@salud.com';
    const hash = await bcrypt.hash('fisio123', 10);
    await run('UPDATE Usuarios SET password_hash = ? WHERE lower(email) = lower(?)', [hash, email]);
    console.log('✅ Password hash actualizado para', email);
  } catch (e) {
    console.error('❌ Error en migración:', e.message || e);
  } finally {
    db.close();
  }
})();


