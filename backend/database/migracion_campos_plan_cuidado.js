// backend/database/migracion_campos_plan_cuidado.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('\n============================================================');
console.log('🔧 MIGRACIÓN: Campos Adicionales de Plan de Cuidado Familiar');
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
  console.log('\n📋 AGREGANDO CAMPOS A TABLA Planes_Cuidado_Familiar');
  const columnas = [
    { nombre: 'numero_ficha_relacionada', tipo: 'VARCHAR(100)' },
    { nombre: 'nombre_encuestado_principal', tipo: 'VARCHAR(200)' },
    { nombre: 'territorio', tipo: 'VARCHAR(150)' },
    { nombre: 'micro_territorio', tipo: 'VARCHAR(150)' },
    { nombre: 'direccion', tipo: 'VARCHAR(300)' },
    { nombre: 'telefono', tipo: 'VARCHAR(20)' },
    { nombre: 'profesional_entrega', tipo: 'VARCHAR(200)' },
    { nombre: 'ebs_numero', tipo: 'VARCHAR(50)' },
    { nombre: 'relaciones_salud_mental', tipo: 'TEXT' }
  ];

  for (const col of columnas) {
    const existe = await columnaExiste('Planes_Cuidado_Familiar', col.nombre);
    if (!existe) {
      await ejecutarSQL(
        `ALTER TABLE Planes_Cuidado_Familiar ADD COLUMN ${col.nombre} ${col.tipo}`,
        `Agregando columna ${col.nombre}`
      );
    } else {
      console.log(`   ✅ Columna ${col.nombre} ya existe`);
    }
  }

  console.log('\n✅ Migración completada exitosamente');
  db.close(() => console.log('✅ Conexión cerrada'));
}

runMigration().catch(err => {
  console.error('❌ Error durante la migración:', err);
  db.close(() => console.log('✅ Conexión cerrada con errores'));
});

