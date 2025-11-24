// backend/verificar_bd_original.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('🔍 VERIFICANDO BASE DE DATOS ORIGINAL');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos original');
});

// Función para contar registros
function contarRegistros(nombreTabla) {
  return new Promise((resolve) => {
    db.get(`SELECT COUNT(*) as count FROM ${nombreTabla}`, (err, row) => {
      if (err) {
        console.log(`   📊 Registros en ${nombreTabla}: ERROR - ${err.message}`);
        resolve(0);
      } else {
        console.log(`   📊 Registros en ${nombreTabla}: ${row.count}`);
        resolve(row.count);
      }
    });
  });
}

async function verificarBDOriginal() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO DATOS EN BD ORIGINAL');
  console.log('='.repeat(60));

  const tablas = [
    'Usuarios', 'Roles', 'Familias', 'Pacientes', 
    'Planes_Cuidado_Familiar', 'Demandas_Inducidas', 'HC_Medicina_General'
  ];

  for (const tabla of tablas) {
    console.log(`\n📋 Verificando tabla: ${tabla}`);
    await contarRegistros(tabla);
  }

  // Verificar datos específicos de familias con integrantes
  console.log('\n🔍 VERIFICANDO FAMILIAS CON INTEGRANTES');
  db.all(`
    SELECT 
      f.familia_id, f.apellido_principal, f.municipio,
      COUNT(p.paciente_id) as integrantes_count
    FROM Familias f 
    LEFT JOIN Pacientes p ON f.familia_id = p.familia_id AND p.activo = 1
    GROUP BY f.familia_id, f.apellido_principal, f.municipio
    ORDER BY integrantes_count DESC
  `, (err, rows) => {
    if (err) {
      console.error('Error consultando familias:', err);
    } else {
      console.log('\n👨‍👩‍👧‍👦 Familias con conteo de integrantes:');
      rows.forEach(familia => {
        console.log(`   - ${familia.apellido_principal} (${familia.municipio}): ${familia.integrantes_count} integrantes`);
      });
    }

    // Verificar demandas inducidas
    console.log('\n🔍 VERIFICANDO DEMANDAS INDUCIDAS');
    db.all(`
      SELECT 
        di.demanda_id, di.tipo_demanda, di.descripcion, di.estado,
        p.primer_nombre, p.primer_apellido, f.apellido_principal
      FROM Demandas_Inducidas di
      LEFT JOIN Pacientes p ON di.paciente_id = p.paciente_id
      LEFT JOIN Familias f ON p.familia_id = f.familia_id
      ORDER BY di.demanda_id
    `, (err, rows) => {
      if (err) {
        console.error('Error consultando demandas:', err);
      } else {
        console.log('\n📋 Demandas inducidas:');
        if (rows.length > 0) {
          rows.forEach(demanda => {
            console.log(`   - ID ${demanda.demanda_id}: ${demanda.tipo_demanda} - ${demanda.descripcion} (${demanda.primer_nombre} ${demanda.primer_apellido} - ${demanda.apellido_principal})`);
          });
        } else {
          console.log('   No hay demandas inducidas registradas');
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ VERIFICACIÓN COMPLETADA');
      console.log('='.repeat(60));
      
      db.close();
    });
  });
}

verificarBDOriginal().catch(console.error);
