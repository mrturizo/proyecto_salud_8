// backend/database/migracion_campos_demanda_completa.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('\n============================================================');
console.log('🔧 MIGRACIÓN: Campos Adicionales Completos de Demanda Inducida');
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
  console.log('\n📋 AGREGANDO CAMPOS ADICIONALES A TABLA Demandas_Inducidas');
  const columnas = [
    { nombre: 'tipo_identificacion', tipo: 'VARCHAR(20)' },
    { nombre: 'numero_identificacion', tipo: 'VARCHAR(50)' },
    { nombre: 'telefono', tipo: 'VARCHAR(20)' },
    { nombre: 'direccion', tipo: 'VARCHAR(300)' },
    { nombre: 'nombres_completos', tipo: 'VARCHAR(300)' },
    { nombre: 'intervencion_efectiva_si', tipo: 'BOOLEAN' },
    { nombre: 'seguimiento_verificado', tipo: 'BOOLEAN' },
    { nombre: 'seguimiento_medio', tipo: 'VARCHAR(100)' }
  ];

  for (const col of columnas) {
    const existe = await columnaExiste('Demandas_Inducidas', col.nombre);
    if (!existe) {
      await ejecutarSQL(
        `ALTER TABLE Demandas_Inducidas ADD COLUMN ${col.nombre} ${col.tipo}`,
        `Agregando columna ${col.nombre}`
      );
    } else {
      console.log(`   ✅ Columna ${col.nombre} ya existe`);
    }
  }

  console.log('\n✅ Migración completada exitosamente');
  console.log('📝 Nota: Los campos seguimiento_fecha y seguimiento_observaciones se guardan en el campo JSON seguimiento.');
  db.close(() => console.log('✅ Conexión cerrada'));
}

runMigration().catch(err => {
  console.error('❌ Error durante la migración:', err);
  db.close(() => console.log('✅ Conexión cerrada con errores'));
});

