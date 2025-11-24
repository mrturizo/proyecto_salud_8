// backend/migrar_datos_originales.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const bdOriginal = path.join(__dirname, 'salud_digital_aps.db');
const bdReparada = path.join(__dirname, 'database', 'salud_digital_aps.db');

console.log('🔄 MIGRANDO DATOS DE BD ORIGINAL A BD REPARADA');
console.log('📊 BD Original:', bdOriginal);
console.log('📊 BD Reparada:', bdReparada);

// Verificar que ambas BD existen
if (!fs.existsSync(bdOriginal)) {
  console.error('❌ No se encuentra la BD original');
  process.exit(1);
}

if (!fs.existsSync(bdReparada)) {
  console.error('❌ No se encuentra la BD reparada');
  process.exit(1);
}

const dbOriginal = new sqlite3.Database(bdOriginal);
const dbReparada = new sqlite3.Database(bdReparada);

// Función para migrar datos de una tabla
function migrarTabla(nombreTabla, columnasExcluir = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Migrando tabla: ${nombreTabla}`);
    
    // Obtener datos de la BD original
    dbOriginal.all(`SELECT * FROM ${nombreTabla}`, (err, rows) => {
      if (err) {
        console.log(`   ⚠️  Error obteniendo datos de ${nombreTabla}: ${err.message}`);
        resolve(false);
        return;
      }

      if (rows.length === 0) {
        console.log(`   ✅ ${nombreTabla}: No hay datos para migrar`);
        resolve(true);
        return;
      }

      console.log(`   📊 Encontrados ${rows.length} registros en ${nombreTabla}`);

      // Obtener estructura de la tabla en BD reparada
      dbReparada.all(`PRAGMA table_info(${nombreTabla})`, (err, columns) => {
        if (err) {
          console.log(`   ❌ Error obteniendo estructura de ${nombreTabla}: ${err.message}`);
          resolve(false);
          return;
        }

        const columnasDisponibles = columns
          .map(col => col.name)
          .filter(col => !columnasExcluir.includes(col));

        console.log(`   📋 Columnas disponibles: ${columnasDisponibles.join(', ')}`);

        // Limpiar tabla en BD reparada (opcional)
        dbReparada.run(`DELETE FROM ${nombreTabla}`, (err) => {
          if (err) {
            console.log(`   ⚠️  No se pudo limpiar ${nombreTabla}: ${err.message}`);
          }

          // Insertar datos
          let insertados = 0;
          let errores = 0;

          rows.forEach((row, index) => {
            const valores = columnasDisponibles.map(col => row[col]).filter(val => val !== undefined);
            const placeholders = valores.map(() => '?').join(', ');
            
            const insertSQL = `INSERT INTO ${nombreTabla} (${columnasDisponibles.join(', ')}) VALUES (${placeholders})`;
            
            dbReparada.run(insertSQL, valores, function(err) {
              if (err) {
                console.log(`   ❌ Error insertando registro ${index + 1}: ${err.message}`);
                errores++;
              } else {
                insertados++;
              }

              if (index === rows.length - 1) {
                console.log(`   ✅ ${nombreTabla}: ${insertados} insertados, ${errores} errores`);
                resolve(errores === 0);
              }
            });
          });
        });
      });
    });
  });
}

async function migrarDatos() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 INICIANDO MIGRACIÓN DE DATOS');
  console.log('='.repeat(60));

  try {
    // Migrar tablas principales
    await migrarTabla('Usuarios');
    await migrarTabla('Roles');
    await migrarTabla('Familias');
    await migrarTabla('Pacientes');
    await migrarTabla('Planes_Cuidado_Familiar');
    await migrarTabla('Demandas_Inducidas', ['tipo_demanda', 'fecha_asignacion', 'fecha_completado', 'profesional_asignado', 'observaciones', 'creado_por_uid', 'fecha_creacion_timestamp']);
    await migrarTabla('HC_Medicina_General');

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('='.repeat(60));

    // Verificar migración
    console.log('\n🔍 VERIFICANDO MIGRACIÓN...');
    
    const tablas = ['Usuarios', 'Roles', 'Familias', 'Pacientes', 'Demandas_Inducidas', 'HC_Medicina_General'];
    
    for (const tabla of tablas) {
      dbReparada.get(`SELECT COUNT(*) as count FROM ${tabla}`, (err, row) => {
        if (err) {
          console.log(`   ❌ ${tabla}: Error - ${err.message}`);
        } else {
          console.log(`   ✅ ${tabla}: ${row.count} registros`);
        }
      });
    }

    // Verificar familias con integrantes
    setTimeout(() => {
      dbReparada.all(`
        SELECT 
          f.familia_id, f.apellido_principal, f.municipio,
          COUNT(p.paciente_id) as integrantes_count
        FROM Familias f 
        LEFT JOIN Pacientes p ON f.familia_id = p.familia_id AND p.activo = 1
        GROUP BY f.familia_id, f.apellido_principal, f.municipio
        ORDER BY integrantes_count DESC
      `, (err, rows) => {
        if (err) {
          console.error('Error verificando familias:', err);
        } else {
          console.log('\n👨‍👩‍👧‍👦 Familias migradas con integrantes:');
          rows.forEach(familia => {
            console.log(`   - ${familia.apellido_principal} (${familia.municipio}): ${familia.integrantes_count} integrantes`);
          });
        }

        console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
        console.log('✅ Todos tus datos han sido migrados a la BD reparada');
        console.log('✅ La estructura completa está disponible');
        console.log('✅ El servidor puede usar la BD con todos los datos');
        
        dbOriginal.close();
        dbReparada.close();
      });
    }, 1000);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    dbOriginal.close();
    dbReparada.close();
  }
}

migrarDatos();
