const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Verificar tablas existentes
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n📋 Tablas existentes:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  // Verificar estructura de Demandas_Inducidas
  db.all("PRAGMA table_info(Demandas_Inducidas)", (err, columns) => {
    if (err) {
      console.log('\n❌ Tabla Demandas_Inducidas no existe');
    } else {
      console.log('\n🏗️ Estructura de Demandas_Inducidas:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
    }
    
    db.close();
  });
});
