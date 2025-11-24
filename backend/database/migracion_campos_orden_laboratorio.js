// backend/database/migracion_campos_orden_laboratorio.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('\n============================================================');
console.log('🔧 MIGRACIÓN: Campos Adicionales de Orden de Laboratorio');
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
  console.log('\n📋 AGREGANDO CAMPOS A TABLA Ordenes_Laboratorio');
  
  // Agregar nuevos campos
  const columnas = [
    { nombre: 'servicio', tipo: 'VARCHAR(100)' },
    { nombre: 'numero_carnet', tipo: 'VARCHAR(50)' },
    { nombre: 'diagnostico_justificacion', tipo: 'TEXT' }
  ];

  for (const col of columnas) {
    const existe = await columnaExiste('Ordenes_Laboratorio', col.nombre);
    if (!existe) {
      await ejecutarSQL(
        `ALTER TABLE Ordenes_Laboratorio ADD COLUMN ${col.nombre} ${col.tipo}`,
        `Agregando columna ${col.nombre}`
      );
    } else {
      console.log(`   ✅ Columna ${col.nombre} ya existe`);
    }
  }

  // Verificar si existe examenes y si necesitamos renombrar indicaciones_clinicas
  const existeExamenes = await columnaExiste('Ordenes_Laboratorio', 'examenes');
  const existeIndicaciones = await columnaExiste('Ordenes_Laboratorio', 'indicaciones_clinicas');
  const existeExamenesSolicitados = await columnaExiste('Ordenes_Laboratorio', 'examenes_solicitados');

  if (existeIndicaciones && !existeExamenesSolicitados) {
    // Renombrar indicaciones_clinicas a examenes_solicitados
    // SQLite no soporta RENAME COLUMN directamente, necesitamos recrear la tabla
    console.log('\n📋 Renombrando indicaciones_clinicas a examenes_solicitados');
    console.log('   ⚠️  SQLite no soporta RENAME COLUMN, se mantendrá indicaciones_clinicas');
    console.log('   📝 Se usará indicaciones_clinicas como examenes_solicitados en el código');
  } else if (existeExamenesSolicitados) {
    console.log('   ✅ Columna examenes_solicitados ya existe');
  }

  // Si existe examenes (JSON), lo mantenemos para compatibilidad
  if (existeExamenes) {
    console.log('   ℹ️  Columna examenes (JSON) existe y se mantendrá para compatibilidad');
  }

  console.log('\n✅ Migración completada exitosamente');
  console.log('📝 Nota: indicaciones_clinicas se usará como examenes_solicitados en el código.');
  db.close(() => console.log('✅ Conexión cerrada'));
}

runMigration().catch(err => {
  console.error('❌ Error durante la migración:', err);
  db.close(() => console.log('✅ Conexión cerrada con errores'));
});

