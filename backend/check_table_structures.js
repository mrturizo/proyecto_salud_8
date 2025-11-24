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

console.log('\n🔍 VERIFICANDO ESTRUCTURAS DE TABLAS');

// Verificar estructura de Familias
db.all("PRAGMA table_info(Familias)", (err, columns) => {
  if (err) {
    console.error('Error con Familias:', err);
  } else {
    console.log('\n📋 Columnas de tabla Familias:');
    columns.forEach(col => {
      console.log(`   - ${col.name}: ${col.type}`);
    });
  }
  
  // Verificar estructura de Pacientes
  db.all("PRAGMA table_info(Pacientes)", (err, columns) => {
    if (err) {
      console.error('Error con Pacientes:', err);
    } else {
      console.log('\n📋 Columnas de tabla Pacientes:');
      columns.forEach(col => {
        console.log(`   - ${col.name}: ${col.type}`);
      });
    }
    
    // Verificar estructura de Demandas_Inducidas
    db.all("PRAGMA table_info(Demandas_Inducidas)", (err, columns) => {
      if (err) {
        console.error('Error con Demandas_Inducidas:', err);
        console.log('❌ La tabla Demandas_Inducidas no existe');
      } else {
        console.log('\n📋 Columnas de tabla Demandas_Inducidas:');
        columns.forEach(col => {
          console.log(`   - ${col.name}: ${col.type}`);
        });
      }
      
      db.close();
    });
  });
});
