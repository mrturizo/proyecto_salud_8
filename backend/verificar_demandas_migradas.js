// backend/verificar_demandas_migradas.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
console.log('🔍 VERIFICANDO DEMANDAS MIGRADAS');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Verificar demandas y asignaciones
db.all(`
  SELECT 
    di.demanda_id, di.estado, di.descripcion, di.profesional_asignado,
    p.primer_nombre, p.primer_apellido, f.apellido_principal
  FROM Demandas_Inducidas di
  LEFT JOIN Pacientes p ON di.paciente_id = p.paciente_id
  LEFT JOIN Familias f ON p.familia_id = f.familia_id
  ORDER BY di.demanda_id
`, (err, rows) => {
  if (err) {
    console.error('Error consultando demandas:', err);
  } else {
    console.log('\n📋 Demandas inducidas en la BD:');
    if (rows.length > 0) {
      rows.forEach(demanda => {
        console.log(`   - ID ${demanda.demanda_id}: ${demanda.descripcion}`);
        console.log(`     Paciente: ${demanda.primer_nombre} ${demanda.primer_apellido} (${demanda.apellido_principal})`);
        console.log(`     Estado: ${demanda.estado}`);
        console.log(`     Profesional asignado: ${demanda.profesional_asignado || 'Sin asignar'}`);
        console.log('');
      });
    } else {
      console.log('   No hay demandas en la BD');
    }
  }

  // Verificar usuarios disponibles
  db.all("SELECT usuario_id, nombre_completo, email FROM Usuarios", (err, usuarios) => {
    if (err) {
      console.error('Error consultando usuarios:', err);
    } else {
      console.log('\n👥 Usuarios disponibles:');
      usuarios.forEach(user => {
        console.log(`   - ID ${user.usuario_id}: ${user.nombre_completo} (${user.email})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));
    
    db.close();
  });
});
