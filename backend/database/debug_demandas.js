const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Verificar todos los usuarios
console.log('\n👥 Todos los usuarios:');
db.all("SELECT usuario_id, nombre_completo, email FROM Usuarios", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  usuarios.forEach(user => {
    console.log(`  - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}`);
  });
  
  // Verificar todas las demandas inducidas
  console.log('\n📋 Todas las demandas inducidas:');
  db.all("SELECT * FROM Demandas_Inducidas", (err, demandas) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    demandas.forEach(demanda => {
      console.log(`  - ID: ${demanda.demanda_id}`);
      console.log(`    Paciente ID: ${demanda.paciente_id}`);
      console.log(`    Asignado a: ${demanda.asignado_a_uid}`);
      console.log(`    Estado: ${demanda.estado}`);
      console.log(`    Fecha: ${demanda.fecha_demanda}`);
      console.log('    ---');
    });
    
    // Verificar pacientes
    console.log('\n👤 Todos los pacientes:');
    db.all("SELECT paciente_id, primer_nombre, primer_apellido, numero_documento FROM Pacientes", (err, pacientes) => {
      if (err) {
        console.error('Error:', err);
        return;
      }
      
      pacientes.forEach(paciente => {
        console.log(`  - ID: ${paciente.paciente_id}, Nombre: ${paciente.primer_nombre} ${paciente.primer_apellido}, Doc: ${paciente.numero_documento}`);
      });
      
      db.close();
    });
  });
});
