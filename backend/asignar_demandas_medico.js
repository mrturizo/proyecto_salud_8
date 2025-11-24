// backend/asignar_demandas_medico.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
console.log('🔧 ASIGNANDO DEMANDAS AL MÉDICO');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Asignar todas las demandas al Dr. Carlos Mendoza (ID 5)
db.run(`
  UPDATE Demandas_Inducidas 
  SET profesional_asignado = 5, 
      fecha_asignacion = CURRENT_TIMESTAMP,
      estado = 'Asignada'
  WHERE profesional_asignado IS NULL
`, function(err) {
  if (err) {
    console.error('❌ Error asignando demandas:', err);
  } else {
    console.log(`✅ ${this.changes} demandas asignadas al Dr. Carlos Mendoza`);
  }

  // Verificar la asignación
  db.all(`
    SELECT 
      di.demanda_id, di.estado, di.descripcion, di.profesional_asignado,
      p.primer_nombre, p.primer_apellido, f.apellido_principal,
      u.nombre_completo as profesional_nombre
    FROM Demandas_Inducidas di
    LEFT JOIN Pacientes p ON di.paciente_id = p.paciente_id
    LEFT JOIN Familias f ON p.familia_id = f.familia_id
    LEFT JOIN Usuarios u ON di.profesional_asignado = u.usuario_id
    ORDER BY di.demanda_id
  `, (err, rows) => {
    if (err) {
      console.error('Error verificando asignación:', err);
    } else {
      console.log('\n📋 Demandas después de la asignación:');
      rows.forEach(demanda => {
        console.log(`   - ID ${demanda.demanda_id}: ${demanda.descripcion}`);
        console.log(`     Paciente: ${demanda.primer_nombre} ${demanda.primer_apellido} (${demanda.apellido_principal})`);
        console.log(`     Estado: ${demanda.estado}`);
        console.log(`     Profesional: ${demanda.profesional_nombre || 'Sin asignar'}`);
        console.log('');
      });
    }

    console.log('🎉 ASIGNACIÓN COMPLETADA');
    console.log('✅ Las demandas ahora aparecerán en la lista del Dr. Carlos Mendoza');
    
    db.close();
  });
});
