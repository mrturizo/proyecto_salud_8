const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICACIÓN FINAL - Dr. Carlos Mendoza');

// 1. Verificar que Dr. Carlos Mendoza existe
db.get("SELECT usuario_id, nombre_completo, email, rol_id FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, medico) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  if (!medico) {
    console.error('❌ Dr. Carlos Mendoza NO existe en la base de datos');
    db.close();
    return;
  }
  
  console.log(`✅ Dr. Carlos Mendoza encontrado:`);
  console.log(`   - ID: ${medico.usuario_id}`);
  console.log(`   - Nombre: ${medico.nombre_completo}`);
  console.log(`   - Email: ${medico.email}`);
  console.log(`   - Rol ID: ${medico.rol_id}`);
  
  // 2. Verificar demandas asignadas a este médico
  db.all("SELECT * FROM Demandas_Inducidas WHERE asignado_a_uid = ?", [medico.usuario_id], (err, demandas) => {
    if (err) {
      console.error('Error obteniendo demandas:', err);
      db.close();
      return;
    }
    
    console.log(`\n📋 Demandas asignadas a Dr. Carlos Mendoza (ID: ${medico.usuario_id}):`);
    if (demandas.length === 0) {
      console.log('   ❌ NO HAY DEMANDAS ASIGNADAS');
    } else {
      demandas.forEach(demanda => {
        console.log(`   - ID: ${demanda.demanda_id}, Paciente: ${demanda.paciente_id}, Estado: ${demanda.estado}`);
      });
    }
    
    // 3. Verificar TODAS las demandas
    console.log('\n📋 TODAS las demandas en la base de datos:');
    db.all("SELECT * FROM Demandas_Inducidas", (err, todasDemandas) => {
      if (err) {
        console.error('Error:', err);
        db.close();
        return;
      }
      
      todasDemandas.forEach(demanda => {
        console.log(`   - ID: ${demanda.demanda_id}, Asignado a: ${demanda.asignado_a_uid}, Paciente: ${demanda.paciente_id}, Estado: ${demanda.estado}`);
      });
      
      // 4. Verificar pacientes
      console.log('\n👤 TODOS los pacientes:');
      db.all("SELECT paciente_id, primer_nombre, primer_apellido, numero_documento FROM Pacientes", (err, pacientes) => {
        if (err) {
          console.error('Error:', err);
          db.close();
          return;
        }
        
        pacientes.forEach(paciente => {
          console.log(`   - ID: ${paciente.paciente_id}, Nombre: ${paciente.primer_nombre} ${paciente.primer_apellido}, Doc: ${paciente.numero_documento}`);
        });
        
        db.close();
      });
    });
  });
});
