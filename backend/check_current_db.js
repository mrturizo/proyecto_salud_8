const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
console.log('🔍 Verificando archivo:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n📋 Usuarios en el archivo que estamos modificando:');

db.all("SELECT * FROM Usuarios ORDER BY usuario_id", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`Total usuarios: ${usuarios.length}`);
  usuarios.forEach(user => {
    console.log(`   - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}`);
  });
  
  // Verificar demandas
  console.log('\n📋 Demandas en el archivo que estamos modificando:');
  db.all("SELECT * FROM Demandas_Inducidas", (err, demandas) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`Total demandas: ${demandas.length}`);
      demandas.forEach(demanda => {
        console.log(`   - ID: ${demanda.demanda_id}, Asignado a: ${demanda.asignado_a_uid}, Paciente: ${demanda.paciente_id}`);
      });
    }
    
    db.close();
  });
});
