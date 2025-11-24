const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
const migrationPath = path.join(__dirname, 'create_tables_correct.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

fs.readFile(migrationPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error leyendo archivo de migración:', err.message);
    return;
  }

  const statements = data.split(';').filter(s => s.trim() !== '');

  db.serialize(() => {
    let errors = 0;
    statements.forEach((statement, index) => {
      const stmtNumber = index + 1;
      console.log(`Ejecutando statement ${stmtNumber}/${statements.length}...`);
      db.run(statement, (err) => {
        if (err) {
          console.error(`❌ Error en statement ${stmtNumber}:`, err.message);
          console.error('Statement:', statement);
          errors++;
        } else {
          console.log(`✅ Statement ${stmtNumber} ejecutado correctamente`);
        }
      });
    });

    db.close((err) => {
      if (err) {
        console.error('Error cerrando la base de datos:', err.message);
      } else {
        console.log('🔒 Base de datos cerrada');
        if (errors === 0) {
          console.log('🎉 Tablas creadas exitosamente');
        } else {
          console.log(`⚠️  Migración completada con ${errors} errores`);
        }
      }
    });
  });
});
