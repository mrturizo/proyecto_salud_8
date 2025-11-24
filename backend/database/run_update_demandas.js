const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Leer el archivo de actualización
const updatePath = path.join(__dirname, 'update_demandas.sql');
const updateSQL = fs.readFileSync(updatePath, 'utf8');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Ejecutar la actualización
console.log('🔄 Actualizando tabla Demandas_Inducidas...');

// Dividir el SQL en statements individuales
const statements = updateSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

let completed = 0;
let errors = 0;

statements.forEach((statement, index) => {
  console.log(`Ejecutando statement ${index + 1}/${statements.length}...`);
  
  db.run(statement, (err) => {
    if (err) {
      console.error(`❌ Error en statement ${index + 1}:`, err.message);
      console.error('Statement:', statement);
      errors++;
    } else {
      console.log(`✅ Statement ${index + 1} ejecutado correctamente`);
    }
    
    completed++;
    
    if (completed === statements.length) {
      db.close((err) => {
        if (err) {
          console.error('Error cerrando base de datos:', err.message);
        } else {
          console.log('🔒 Base de datos cerrada');
        }
        
        if (errors === 0) {
          console.log('🎉 Actualización completada exitosamente');
          process.exit(0);
        } else {
          console.log(`⚠️  Actualización completada con ${errors} errores`);
          process.exit(1);
        }
      });
    }
  });
});
