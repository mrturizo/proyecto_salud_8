const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🎯 PROBANDO QUERY FINAL');

const query = `
  SELECT 
    di.demanda_id,
    di.paciente_id,
    di.diligenciamiento,
    di.remision_a,
    di.estado,
    di.asignado_a_uid,
    di.solicitado_por_uid,
    di.seguimiento,
    p.primer_nombre,
    p.primer_apellido,
    p.numero_documento,
    f.apellido_principal
  FROM Demandas_Inducidas di
  JOIN Pacientes p ON di.paciente_id = p.paciente_id
  JOIN Familias f ON p.familia_id = f.familia_id
  WHERE di.asignado_a_uid = ? AND di.estado IN ('Pendiente', 'Asignada')
`;

// Probar con ID 5 (Dr. Carlos Mendoza)
db.all(query, [5], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
  } else {
    console.log(`✅ Query exitoso para ID 5: ${rows.length} demandas`);
    rows.forEach(row => {
      console.log(`   - Demanda ID: ${row.demanda_id}, Paciente: ${row.primer_nombre} ${row.primer_apellido}, Estado: ${row.estado}`);
    });
  }
  
  // Probar con ID 1 también
  db.all(query, [1], (err, rows) => {
    if (err) {
      console.error('❌ Error con ID 1:', err.message);
    } else {
      console.log(`✅ Query exitoso para ID 1: ${rows.length} demandas`);
      rows.forEach(row => {
        console.log(`   - Demanda ID: ${row.demanda_id}, Paciente: ${row.primer_nombre} ${row.primer_apellido}, Estado: ${row.estado}`);
      });
    }
    
    db.close();
  });
});
