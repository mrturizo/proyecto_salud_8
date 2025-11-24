const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Primero, buscar al Carlos Mendoza original (el que tiene la contraseña 1000000001)
db.get("SELECT usuario_id, nombre_completo, email FROM Usuarios WHERE email = 'medico1@saludigital.edu.co' AND password_hash IS NOT NULL", (err, medicoOriginal) => {
  if (err) {
    console.error('Error buscando médico original:', err.message);
    db.close();
    return;
  }
  
  if (!medicoOriginal) {
    console.error('❌ No se encontró Carlos Mendoza original');
    db.close();
    return;
  }
  
  console.log(`✅ Carlos Mendoza original encontrado: ${medicoOriginal.nombre_completo} (ID: ${medicoOriginal.usuario_id})`);
  
  // Eliminar el Carlos Mendoza duplicado que creé (ID: 4)
  db.run("DELETE FROM Usuarios WHERE usuario_id = 4 AND email = 'medico1@saludigital.edu.co'", function(err) {
    if (err) {
      console.error('Error eliminando duplicado:', err.message);
    } else {
      console.log(`✅ Usuario duplicado eliminado (filas afectadas: ${this.changes})`);
    }
    
    // Actualizar la demanda inducida para asignarla al Carlos Mendoza original
    db.run("UPDATE Demandas_Inducidas SET asignado_a_uid = ? WHERE demanda_id = 2", [medicoOriginal.usuario_id], function(err) {
      if (err) {
        console.error('Error actualizando demanda:', err.message);
      } else {
        console.log(`✅ Demanda inducida actualizada para Carlos Mendoza original (ID: ${medicoOriginal.usuario_id})`);
        console.log('\n📋 Resumen:');
        console.log(`👨‍⚕️ Médico: ${medicoOriginal.nombre_completo}`);
        console.log(`📧 Email: ${medicoOriginal.email}`);
        console.log(`🔑 Contraseña: 1000000001`);
        console.log(`🆔 ID: ${medicoOriginal.usuario_id}`);
        console.log(`👤 Paciente asignado: Ana María Rodriguez García`);
        console.log(`📋 Demanda inducida ID: 2`);
      }
      db.close();
    });
  });
});
