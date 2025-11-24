const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO ESTRUCTURA DE TABLA Demandas_Inducidas');

// Verificar estructura de la tabla
db.all("PRAGMA table_info(Demandas_Inducidas)", (err, columns) => {
  if (err) {
    console.error('Error obteniendo estructura:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 Columnas de la tabla Demandas_Inducidas:');
  columns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  // Verificar datos reales
  console.log('\n📋 Datos reales en Demandas_Inducidas:');
  db.all("SELECT * FROM Demandas_Inducidas WHERE demanda_id = 3", (err, rows) => {
    if (err) {
      console.error('Error obteniendo datos:', err);
    } else {
      rows.forEach(row => {
        console.log('   Demanda ID 3:');
        Object.keys(row).forEach(key => {
          console.log(`     ${key}: ${row[key]}`);
        });
      });
    }
    
    // Probar el query específico
    console.log('\n🧪 Probando el query del endpoint:');
    const query = `
      SELECT 
        di.*,
        p.primer_nombre,
        p.primer_apellido,
        p.numero_documento,
        f.apellido_principal,
        pcf.condicion_identificada
      FROM Demandas_Inducidas di
      JOIN Pacientes p ON di.paciente_id = p.paciente_id
      JOIN Familias f ON p.familia_id = f.familia_id
      LEFT JOIN Planes_Cuidado_Familiar pcf ON di.plan_id = pcf.plan_id
      WHERE di.asignado_a_uid = ? AND di.estado IN ('Pendiente', 'Asignada')
      ORDER BY di.fecha_demanda ASC
    `;
    
    db.all(query, [5], (err, result) => {
      if (err) {
        console.error('❌ Error en el query:', err.message);
      } else {
        console.log('✅ Query ejecutado correctamente');
        console.log(`📊 Resultados: ${result.length} filas`);
        result.forEach(row => {
          console.log(`   - Demanda ID: ${row.demanda_id}, Paciente: ${row.primer_nombre} ${row.primer_apellido}`);
        });
      }
      
      db.close();
    });
  });
});
