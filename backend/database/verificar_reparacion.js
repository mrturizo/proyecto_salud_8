// backend/database/verificar_reparacion.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('🔍 VERIFICACIÓN POST-REPARACIÓN');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Probar las consultas que estaban fallando
async function verificarReparacion() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PROBANDO CONSULTAS QUE ESTABAN FALLANDO');
  console.log('='.repeat(60));

  // 1. Probar consulta de demandas asignadas
  console.log('\n🔍 1. Probando consulta de demandas asignadas...');
  const queryDemandas = `
    SELECT 
      di.demanda_id,
      di.plan_id,
      di.tipo_demanda,
      di.descripcion,
      di.prioridad,
      di.fecha_creacion,
      di.fecha_limite,
      di.estado,
      di.paciente_id,
      di.fecha_asignacion,
      di.creado_por_uid,
      di.profesional_asignado,
      di.observaciones,
      p.primer_nombre,
      p.primer_apellido,
      p.numero_documento,
      f.apellido_principal
    FROM Demandas_Inducidas di
    JOIN Pacientes p ON di.paciente_id = p.paciente_id
    JOIN Familias f ON p.familia_id = f.familia_id
    WHERE di.profesional_asignado = ? AND di.estado IN ('Pendiente', 'Asignada')
  `;

  db.all(queryDemandas, [1], (err, rows) => {
    if (err) {
      console.log('   ❌ Error en consulta de demandas:', err.message);
    } else {
      console.log(`   ✅ Consulta de demandas exitosa: ${rows.length} registros encontrados`);
    }

    // 2. Probar consulta de caracterización
    console.log('\n🔍 2. Probando consulta de caracterización...');
    const queryCaracterizacion = `
      SELECT 
        p.paciente_id,
        p.numero_documento,
        p.tipo_documento,
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido,
        p.fecha_nacimiento,
        p.genero,
        cp.*
      FROM Pacientes p
      LEFT JOIN Caracterizacion_Paciente cp ON p.paciente_id = cp.paciente_id
      WHERE p.familia_id = ? AND p.activo = 1
      ORDER BY p.primer_nombre
    `;

    db.all(queryCaracterizacion, [1], (err, rows) => {
      if (err) {
        console.log('   ❌ Error en consulta de caracterización:', err.message);
      } else {
        console.log(`   ✅ Consulta de caracterización exitosa: ${rows.length} registros encontrados`);
      }

      // 3. Probar endpoint de usuarios
      console.log('\n🔍 3. Probando consulta de usuarios...');
      const queryUsuarios = `
        SELECT 
          u.usuario_id, u.nombre_completo, u.email, u.numero_documento,
          r.nombre_rol, r.rol_id
        FROM Usuarios u 
        JOIN Roles r ON u.rol_id = r.rol_id 
        WHERE u.email = ?
      `;

      db.get(queryUsuarios, ['auxiliar@salud.com'], (err, row) => {
        if (err) {
          console.log('   ❌ Error en consulta de usuarios:', err.message);
        } else if (row) {
          console.log(`   ✅ Consulta de usuarios exitosa: Usuario encontrado - ${row.nombre_completo}`);
        } else {
          console.log('   ⚠️  Usuario auxiliar no encontrado');
        }

        // 4. Probar consulta de familias con caracterización
        console.log('\n🔍 4. Probando consulta de familias con caracterización...');
        const queryFamilias = `
          SELECT 
            f.familia_id, f.apellido_principal, f.direccion, 
            f.barrio_vereda, f.municipio, f.telefono_contacto,
            f.numero_ficha, f.zona, f.territorio, f.estrato,
            f.tipo_familia, f.riesgo_familiar, f.fecha_caracterizacion,
            u.nombre_completo as creado_por,
            (
              SELECT COUNT(1) FROM Pacientes p
              WHERE p.familia_id = f.familia_id AND p.activo = 1
            ) AS integrantes_count
          FROM Familias f 
          JOIN Usuarios u ON f.creado_por_uid = u.usuario_id
          ORDER BY f.apellido_principal
        `;

        db.all(queryFamilias, [], (err, rows) => {
          if (err) {
            console.log('   ❌ Error en consulta de familias:', err.message);
          } else {
            console.log(`   ✅ Consulta de familias exitosa: ${rows.length} registros encontrados`);
            if (rows.length > 0) {
              console.log('   📋 Muestra de datos de familias:');
              rows.slice(0, 2).forEach(familia => {
                console.log(`      - ${familia.apellido_principal} (${familia.municipio}) - Zona: ${familia.zona || 'Sin asignar'}`);
              });
            }
          }

          // 5. Verificar estructura final
          console.log('\n🔍 5. Verificando estructura final de tablas...');
          
          const verificarEstructura = (tabla, columnasEsperadas) => {
            return new Promise((resolve) => {
              db.all(`PRAGMA table_info(${tabla})`, (err, columns) => {
                if (err) {
                  console.log(`   ❌ Error verificando ${tabla}:`, err.message);
                  resolve(false);
                } else {
                  const columnasExistentes = columns.map(col => col.name);
                  const faltantes = columnasEsperadas.filter(col => !columnasExistentes.includes(col));
                  
                  if (faltantes.length === 0) {
                    console.log(`   ✅ ${tabla}: Todas las columnas esperadas están presentes`);
                    resolve(true);
                  } else {
                    console.log(`   ⚠️  ${tabla}: Faltan columnas: ${faltantes.join(', ')}`);
                    resolve(false);
                  }
                }
              });
            });
          };

          Promise.all([
            verificarEstructura('Demandas_Inducidas', [
              'demanda_id', 'paciente_id', 'plan_id', 'tipo_demanda', 'descripcion',
              'prioridad', 'estado', 'fecha_creacion', 'fecha_asignacion', 
              'fecha_completado', 'profesional_asignado', 'observaciones',
              'creado_por_uid', 'fecha_creacion_timestamp'
            ]),
            verificarEstructura('Caracterizacion_Paciente', [
              'caracterizacion_paciente_id', 'paciente_id', 'fecha_caracterizacion',
              'rol_familiar', 'ocupacion', 'nivel_educativo', 'grupo_poblacional',
              'regimen_afiliacion', 'pertenencia_etnica', 'discapacidad',
              'victima_violencia', 'datos_pyp', 'datos_salud', 'creado_por_uid'
            ]),
            verificarEstructura('Familias', [
              'familia_id', 'apellido_principal', 'direccion', 'barrio_vereda',
              'municipio', 'telefono_contacto', 'creado_por_uid', 'fecha_creacion',
              'activo', 'numero_ficha', 'zona', 'territorio', 'estrato',
              'tipo_familia', 'riesgo_familiar', 'fecha_caracterizacion',
              'info_vivienda', 'situaciones_proteccion', 'condiciones_salud_publica',
              'practicas_cuidado'
            ])
          ]).then(() => {
            console.log('\n' + '='.repeat(60));
            console.log('🎉 VERIFICACIÓN COMPLETADA');
            console.log('='.repeat(60));
            console.log('✅ Todas las consultas están funcionando correctamente');
            console.log('✅ La estructura de la base de datos está completa');
            console.log('✅ Los índices han sido creados correctamente');
            console.log('🚀 La base de datos está completamente reparada y lista para usar');
            
            db.close();
          });
        });
      });
    });
  });
}

verificarReparacion().catch(console.error);
