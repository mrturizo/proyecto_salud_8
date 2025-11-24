const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🧪 Probando query simple para demandas asignadas');

// Query simplificado paso a paso
const query1 = `
  SELECT * FROM Demandas_Inducidas 
  WHERE asignado_a_uid = ? AND estado IN ('Pendiente', 'Asignada')
`;

db.all(query1, [5], (err, rows) => {
  if (err) {
    console.error('❌ Error en query 1:', err.message);
  } else {
    console.log(`✅ Query 1 exitoso: ${rows.length} demandas encontradas`);
    rows.forEach(row => {
      console.log(`   - Demanda ID: ${row.demanda_id}, Paciente: ${row.paciente_id}, Estado: ${row.estado}`);
    });
  }
  
  // Ahora probar con JOINs
  const query2 = `
    SELECT 
      di.demanda_id,
      di.paciente_id,
      di.estado,
      p.primer_nombre,
      p.primer_apellido,
      p.numero_documento
    FROM Demandas_Inducidas di
    JOIN Pacientes p ON di.paciente_id = p.paciente_id
    WHERE di.asignado_a_uid = ? AND di.estado IN ('Pendiente', 'Asignada')
  `;
  
  db.all(query2, [5], (err, rows) => {
    if (err) {
      console.error('❌ Error en query 2:', err.message);
    } else {
      console.log(`✅ Query 2 exitoso: ${rows.length} demandas encontradas`);
      rows.forEach(row => {
        console.log(`   - Demanda ID: ${row.demanda_id}, Paciente: ${row.primer_nombre} ${row.primer_apellido}`);
      });
    }
    
    db.close();
  });
});
