const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO ESTRUCTURA DE TABLA Planes_Cuidado_Familiar');

// Verificar estructura de la tabla
db.all("PRAGMA table_info(Planes_Cuidado_Familiar)", (err, columns) => {
  if (err) {
    console.error('Error obteniendo estructura:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 Columnas de la tabla Planes_Cuidado_Familiar:');
  columns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  // Verificar si la tabla existe
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='Planes_Cuidado_Familiar'", (err, tables) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\n📋 Tabla existe:', tables.length > 0);
      if (tables.length === 0) {
        console.log('❌ La tabla Planes_Cuidado_Familiar NO existe');
      }
    }
    
    db.close();
  });
});
