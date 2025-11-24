const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos correcta');
});

console.log('\n🔍 VERIFICANDO ESTRUCTURA DE Planes_Cuidado_Familiar');

db.all("PRAGMA table_info(Planes_Cuidado_Familiar)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    console.log('❌ La tabla Planes_Cuidado_Familiar no existe');
  } else {
    console.log('\n📋 Columnas de tabla Planes_Cuidado_Familiar:');
    columns.forEach(col => {
      console.log(`   - ${col.name}: ${col.type}`);
    });
  }
  
  db.close();
});
