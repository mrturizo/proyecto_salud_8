const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Actualizar la demanda 2 para asignarla a John Alex (ID: 2) que sí existe
db.run("UPDATE Demandas_Inducidas SET asignado_a_uid = 2 WHERE demanda_id = 2", function(err) {
  if (err) {
    console.error('Error actualizando demanda:', err.message);
  } else {
    console.log(`✅ Demanda 2 actualizada para John Alex (ID: 2)`);
    console.log(`📋 Filas afectadas: ${this.changes}`);
  }
  
  // Verificar el resultado
  db.all("SELECT * FROM Demandas_Inducidas", (err, demandas) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\n📋 Demandas actualizadas:');
      demandas.forEach(demanda => {
        console.log(`  - ID: ${demanda.demanda_id}, Paciente: ${demanda.paciente_id}, Asignado a: ${demanda.asignado_a_uid}, Estado: ${demanda.estado}`);
      });
    }
    db.close();
  });
});
