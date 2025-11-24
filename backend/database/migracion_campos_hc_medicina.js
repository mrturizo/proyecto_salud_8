// backend/database/migracion_campos_hc_medicina.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('\n============================================================');
console.log('🔧 MIGRACIÓN: Campos Adicionales de HC Consulta Ambulatoria');
console.log('============================================================');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos SQLite:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

function ejecutarSQL(sql, descripcion) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`   ❌ Error ${descripcion}: ${err.message}`);
        reject(err);
      } else {
        console.log(`   ✅ ${descripcion}`);
        resolve(true);
      }
    });
  });
}

async function columnaExiste(tabla, columna) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tabla})`, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const existe = rows.some(row => row.name === columna);
      resolve(existe);
    });
  });
}

async function runMigration() {
  console.log('\n📋 1. AGREGANDO estado_civil A TABLA Pacientes');
  const existeEstadoCivil = await columnaExiste('Pacientes', 'estado_civil');
  if (!existeEstadoCivil) {
    await ejecutarSQL(
      `ALTER TABLE Pacientes ADD COLUMN estado_civil VARCHAR(50)`,
      'Agregando columna estado_civil a Pacientes'
    );
  } else {
    console.log('   ✅ Columna estado_civil ya existe en Pacientes');
  }

  console.log('\n📋 2. AGREGANDO CAMPOS A TABLA HC_Medicina_General');
  const columnas = [
    // Hora de consulta
    { nombre: 'hora_consulta', tipo: 'TIME' },
    // Enfoque diferencial
    { nombre: 'enfoque_diferencial', tipo: 'JSON' },
    // Signos vitales expandidos
    { nombre: 'tension_arterial_sistolica', tipo: 'INTEGER' },
    { nombre: 'tension_arterial_diastolica', tipo: 'INTEGER' },
    { nombre: 'frecuencia_cardiaca', tipo: 'INTEGER' },
    { nombre: 'frecuencia_respiratoria', tipo: 'INTEGER' },
    { nombre: 'saturacion_oxigeno', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'temperatura', tipo: 'DECIMAL(4, 1)' },
    // Medidas antropométricas
    { nombre: 'peso', tipo: 'DECIMAL(6, 2)' },
    { nombre: 'talla', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'imc', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'perimetro_cefalico', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'perimetro_toracico', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'perimetro_abdominal', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'perimetro_braquial', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'perimetro_pantorrilla', tipo: 'DECIMAL(5, 2)' },
    // Otros parámetros
    { nombre: 'glucometria', tipo: 'DECIMAL(5, 2)' },
    { nombre: 'glasgow', tipo: 'VARCHAR(10)' },
    // Campos de texto adicionales
    { nombre: 'conducta_seguir', tipo: 'TEXT' },
    { nombre: 'evolucion', tipo: 'TEXT' },
    { nombre: 'analisis', tipo: 'TEXT' },
    // Egreso
    { nombre: 'fecha_hora_egreso', tipo: 'TIMESTAMP' }
  ];

  for (const col of columnas) {
    const existe = await columnaExiste('HC_Medicina_General', col.nombre);
    if (!existe) {
      await ejecutarSQL(
        `ALTER TABLE HC_Medicina_General ADD COLUMN ${col.nombre} ${col.tipo}`,
        `Agregando columna ${col.nombre}`
      );
    } else {
      console.log(`   ✅ Columna ${col.nombre} ya existe`);
    }
  }

  console.log('\n📋 3. VERIFICANDO antecedentes_personales');
  // Verificar si antecedentes_personales es TEXT y necesita migración
  db.all(`PRAGMA table_info(HC_Medicina_General)`, [], async (err, rows) => {
    if (err) {
      console.error('   ❌ Error verificando tipo de antecedentes_personales:', err);
      return;
    }
    
    const colAntecedentes = rows.find(row => row.name === 'antecedentes_personales');
    if (colAntecedentes) {
      console.log(`   ℹ️  antecedentes_personales existe como: ${colAntecedentes.type}`);
      console.log('   📝 Nota: Se mantendrá como está y se manejará como JSON en el código');
    } else {
      console.log('   ⚠️  antecedentes_personales no existe en la tabla');
    }
  });

  console.log('\n✅ Migración completada exitosamente');
  console.log('📝 Nota: Los campos JSON (enfoque_diferencial, antecedentes_personales estructurados) se manejarán en el código.');
  db.close(() => console.log('✅ Conexión cerrada'));
}

runMigration().catch(err => {
  console.error('❌ Error durante la migración:', err);
  db.close(() => console.log('✅ Conexión cerrada con errores'));
});

