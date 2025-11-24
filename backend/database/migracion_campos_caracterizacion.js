const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Función para verificar si una columna existe
function columnaExiste(tabla, columna) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tabla})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const existe = rows.some(row => row.name === columna);
        resolve(existe);
      }
    });
  });
}

// Función para ejecutar SQL
function ejecutarSQL(sql, descripcion) {
  return new Promise((resolve, reject) => {
    db.run(sql, function(err) {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`   ⚠️  Columna ya existe: ${descripcion}`);
          resolve();
        } else {
          console.error(`   ❌ Error: ${descripcion}`, err.message);
          reject(err);
        }
      } else {
        console.log(`   ✅ ${descripcion}`);
        resolve();
      }
    });
  });
}

async function migrarCampos() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 MIGRACIÓN: Campos Adicionales de Caracterización');
  console.log('='.repeat(60));

  try {
    // 1. Agregar campos a tabla Familias
    console.log('\n📋 1. AGREGANDO CAMPOS A TABLA Familias');
    
    const camposFamilias = [
      { nombre: 'micro_territorio', tipo: 'VARCHAR(150)' },
      { nombre: 'numero_personas', tipo: 'INT' },
      { nombre: 'barrio', tipo: 'VARCHAR(150)' } // Separado de barrio_vereda si no existe
    ];

    for (const campo of camposFamilias) {
      const existe = await columnaExiste('Familias', campo.nombre);
      if (!existe) {
        await ejecutarSQL(
          `ALTER TABLE Familias ADD COLUMN ${campo.nombre} ${campo.tipo}`,
          `Agregando columna ${campo.nombre} a Familias`
        );
      } else {
        console.log(`   ✅ Columna ${campo.nombre} ya existe en Familias`);
      }
    }

    // 2. Agregar campos a tabla Caracterizacion_Paciente
    console.log('\n📋 2. AGREGANDO CAMPOS A TABLA Caracterizacion_Paciente');
    
    const camposPaciente = [
      { nombre: 'telefono_1', tipo: 'VARCHAR(20)' },
      { nombre: 'orientacion_sexual', tipo: 'VARCHAR(50)' },
      { nombre: 'comunidad_indigena', tipo: 'BOOLEAN' },
      { nombre: 'tiempo_cuidador', tipo: 'TEXT' } // JSON o texto para múltiples opciones
    ];

    for (const campo of camposPaciente) {
      const existe = await columnaExiste('Caracterizacion_Paciente', campo.nombre);
      if (!existe) {
        await ejecutarSQL(
          `ALTER TABLE Caracterizacion_Paciente ADD COLUMN ${campo.nombre} ${campo.tipo}`,
          `Agregando columna ${campo.nombre} a Caracterizacion_Paciente`
        );
      } else {
        console.log(`   ✅ Columna ${campo.nombre} ya existe en Caracterizacion_Paciente`);
      }
    }

    console.log('\n✅ Migración completada exitosamente');
    console.log('\n📝 Nota: Los campos JSON (info_vivienda, datos_pyp, datos_salud)');
    console.log('   se actualizarán automáticamente en el código sin necesidad de migración de BD.');
    
  } catch (error) {
    console.error('\n❌ Error en la migración:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error cerrando BD:', err.message);
      } else {
        console.log('\n✅ Conexión cerrada');
      }
    });
  }
}

// Ejecutar migración
migrarCampos();

