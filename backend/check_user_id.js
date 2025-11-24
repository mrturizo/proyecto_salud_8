const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO ID DE USUARIOS');

// Buscar Dr. Carlos Mendoza
db.get("SELECT usuario_id, nombre_completo, email FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, medico) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  if (medico) {
    console.log(`✅ Dr. Carlos Mendoza encontrado:`);
    console.log(`   - ID: ${medico.usuario_id}`);
    console.log(`   - Nombre: ${medico.nombre_completo}`);
    console.log(`   - Email: ${medico.email}`);
  } else {
    console.log('❌ Dr. Carlos Mendoza NO encontrado');
  }
  
  // Verificar todos los usuarios
  console.log('\n📋 TODOS los usuarios en la base de datos:');
  db.all("SELECT usuario_id, nombre_completo, email FROM Usuarios", (err, usuarios) => {
    if (err) {
      console.error('Error:', err);
    } else {
      usuarios.forEach(user => {
        console.log(`   - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}`);
      });
    }
    
    // Verificar demandas asignadas a cada ID
    console.log('\n📋 Demandas por usuario:');
    db.all("SELECT asignado_a_uid, COUNT(*) as count FROM Demandas_Inducidas GROUP BY asignado_a_uid", (err, demandas) => {
      if (err) {
        console.error('Error:', err);
      } else {
        demandas.forEach(d => {
          console.log(`   - Usuario ID ${d.asignado_a_uid}: ${d.count} demandas`);
        });
      }
      
      db.close();
    });
  });
});
