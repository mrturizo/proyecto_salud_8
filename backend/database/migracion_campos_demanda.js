// backend/database/migracion_campos_demanda.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('\n============================================================');
console.log('🔧 MIGRACIÓN: Campos Adicionales de Demanda Inducida');
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
  console.log('\n📋 AGREGANDO CAMPOS A TABLA Demandas_Inducidas');
  const columnas = [
    { nombre: 'edad', tipo: 'INTEGER' },
    { nombre: 'sexo', tipo: 'VARCHAR(20)' },
    { nombre: 'eps', tipo: 'VARCHAR(200)' },
    { nombre: 'regimen', tipo: 'VARCHAR(100)' },
    { nombre: 'ips_atencion', tipo: 'VARCHAR(200)' },
    { nombre: 'ebs_numero', tipo: 'VARCHAR(50)' },
    { nombre: 'educacion_salud', tipo: 'TEXT' },
    { nombre: 'intervencion_efectiva', tipo: 'TEXT' }
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
  console.log('📝 Nota: El campo seguimiento ya existe como JSON y se expandirá en el frontend.');
  db.close(() => console.log('✅ Conexión cerrada'));
}

runMigration().catch(err => {
  console.error('❌ Error durante la migración:', err);
  db.close(() => console.log('✅ Conexión cerrada con errores'));
});

