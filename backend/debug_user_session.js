const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 DEBUGGING SESIÓN DE USUARIO');

// Verificar todos los usuarios
console.log('\n📋 TODOS los usuarios:');
db.all("SELECT usuario_id, nombre_completo, email FROM Usuarios", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  usuarios.forEach(user => {
    console.log(`   - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}`);
  });
  
  // Verificar demandas por usuario
  console.log('\n📋 Demandas por usuario:');
  db.all("SELECT asignado_a_uid, COUNT(*) as count FROM Demandas_Inducidas GROUP BY asignado_a_uid", (err, demandas) => {
    if (err) {
      console.error('Error:', err);
    } else {
      demandas.forEach(d => {
        console.log(`   - Usuario ID ${d.asignado_a_uid}: ${d.count} demandas`);
      });
      
      // Verificar específicamente la demanda de Dr. Carlos Mendoza
      console.log('\n🔍 Verificando demanda de Dr. Carlos Mendoza (ID: 5):');
      db.all("SELECT * FROM Demandas_Inducidas WHERE asignado_a_uid = 5", (err, demandasCarlos) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log(`   Demandas encontradas: ${demandasCarlos.length}`);
          demandasCarlos.forEach(demanda => {
            console.log(`   - Demanda ID: ${demanda.demanda_id}, Paciente ID: ${demanda.paciente_id}, Estado: ${demanda.estado}`);
          });
        }
        db.close();
      });
    }
  });
});
