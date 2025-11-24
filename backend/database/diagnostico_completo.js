// backend/database/diagnostico_completo.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('🔍 DIAGNÓSTICO COMPLETO DE LA BASE DE DATOS');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Función para verificar tabla
function verificarTabla(nombreTabla) {
  return new Promise((resolve) => {
    db.all(`PRAGMA table_info(${nombreTabla})`, (err, columns) => {
      if (err) {
        console.log(`❌ Tabla ${nombreTabla}: NO EXISTE`);
        resolve({ existe: false, columnas: [] });
      } else {
        console.log(`✅ Tabla ${nombreTabla}: EXISTE (${columns.length} columnas)`);
        columns.forEach(col => {
          console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });
        resolve({ existe: true, columnas: columns });
      }
    });
  });
}

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

async function diagnosticoCompleto() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO TABLAS PRINCIPALES');
  console.log('='.repeat(60));

  // Verificar tablas principales
  const tablas = [
    'Usuarios', 'Roles', 'Familias', 'Pacientes', 
    'Caracterizacion_Paciente', 'Planes_Cuidado_Familiar', 
    'Demandas_Inducidas', 'HC_Medicina_General'
  ];

  const resultados = {};
  
  for (const tabla of tablas) {
    console.log(`\n📋 Verificando tabla: ${tabla}`);
    resultados[tabla] = await verificarTabla(tabla);
    if (resultados[tabla].existe) {
      await contarRegistros(tabla);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO ESTRUCTURA ESPECÍFICA DE Demandas_Inducidas');
  console.log('='.repeat(60));

  if (resultados.Demandas_Inducidas.existe) {
    const columnasEsperadas = [
      'demanda_id', 'paciente_id', 'plan_id', 'tipo_demanda', 'descripcion',
      'prioridad', 'estado', 'fecha_creacion', 'fecha_asignacion', 
      'fecha_completado', 'profesional_asignado', 'observaciones',
      'creado_por_uid', 'fecha_creacion_timestamp'
    ];

    console.log('\n🔍 Columnas esperadas vs existentes:');
    columnasEsperadas.forEach(col => {
      const existe = resultados.Demandas_Inducidas.columnas.some(c => c.name === col);
      console.log(`   ${existe ? '✅' : '❌'} ${col}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO ESTRUCTURA ESPECÍFICA DE Familias');
  console.log('='.repeat(60));

  if (resultados.Familias.existe) {
    const columnasCaracterizacion = [
      'numero_ficha', 'zona', 'territorio', 'estrato', 'tipo_familia',
      'riesgo_familiar', 'fecha_caracterizacion', 'info_vivienda',
      'situaciones_proteccion', 'condiciones_salud_publica', 'practicas_cuidado'
    ];

    console.log('\n🔍 Columnas de caracterización en Familias:');
    columnasCaracterizacion.forEach(col => {
      const existe = resultados.Familias.columnas.some(c => c.name === col);
      console.log(`   ${existe ? '✅' : '❌'} ${col}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO USUARIOS Y ROLES');
  console.log('='.repeat(60));

  // Verificar usuarios
  db.all("SELECT u.*, r.nombre_rol FROM Usuarios u LEFT JOIN Roles r ON u.rol_id = r.rol_id", (err, usuarios) => {
    if (err) {
      console.error('Error obteniendo usuarios:', err);
    } else {
      console.log(`\n👥 Usuarios en el sistema (${usuarios.length}):`);
      usuarios.forEach(user => {
        console.log(`   - ${user.nombre_completo} (${user.email}) - Rol: ${user.nombre_rol || 'Sin rol'}`);
      });
    }

    // Verificar roles
    db.all("SELECT * FROM Roles", (err, roles) => {
      if (err) {
        console.error('Error obteniendo roles:', err);
      } else {
        console.log(`\n🎭 Roles en el sistema (${roles.length}):`);
        roles.forEach(role => {
          console.log(`   - ${role.rol_id}: ${role.nombre_rol}`);
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ DIAGNÓSTICO COMPLETADO');
      console.log('='.repeat(60));
      
      db.close();
    });
  });
}

diagnosticoCompleto().catch(console.error);
