const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO ESTRUCTURA DE TABLA Demandas_Inducidas');

// Verificar estructura de la tabla
db.all("PRAGMA table_info(Demandas_Inducidas)", (err, columns) => {
  if (err) {
    console.error('Error obteniendo estructura:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 Columnas de la tabla Demandas_Inducidas:');
  columns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  // Verificar datos de muestra
  console.log('\n📋 Datos de muestra:');
  db.all("SELECT * FROM Demandas_Inducidas LIMIT 1", (err, rows) => {
    if (err) {
      console.error('Error obteniendo datos:', err);
    } else if (rows.length > 0) {
      console.log('   Datos de la primera fila:');
      Object.keys(rows[0]).forEach(key => {
        console.log(`     ${key}: ${rows[0][key]}`);
      });
    } else {
      console.log('   No hay datos en la tabla');
    }
    
    db.close();
  });
});
