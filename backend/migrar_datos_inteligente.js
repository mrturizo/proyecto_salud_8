// backend/migrar_datos_inteligente.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const bdOriginal = path.join(__dirname, 'salud_digital_aps.db');
const bdReparada = path.join(__dirname, 'database', 'salud_digital_aps.db');

console.log('🔄 MIGRACIÓN INTELIGENTE DE DATOS');
console.log('📊 BD Original:', bdOriginal);
console.log('📊 BD Reparada:', bdReparada);

const dbOriginal = new sqlite3.Database(bdOriginal);
const dbReparada = new sqlite3.Database(bdReparada);

// Función para obtener estructura de tabla
function obtenerEstructura(db, tabla) {
  return new Promise((resolve) => {
    db.all(`PRAGMA table_info(${tabla})`, (err, columns) => {
      if (err) {
        resolve([]);
      } else {
        resolve(columns);
      }
    });
  });
}

// Función para migrar datos con mapeo inteligente
async function migrarDatosInteligente() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 INICIANDO MIGRACIÓN INTELIGENTE');
  console.log('='.repeat(60));

  try {
    // 1. Migrar Usuarios
    console.log('\n🔄 1. MIGRANDO USUARIOS');
    const usuariosOriginal = await obtenerDatos(dbOriginal, 'SELECT * FROM Usuarios');
    const estructuraUsuarios = await obtenerEstructura(dbReparada, 'Usuarios');
    
    console.log(`   📊 Encontrados ${usuariosOriginal.length} usuarios`);
    
    for (const usuario of usuariosOriginal) {
      const insertSQL = `
        INSERT OR REPLACE INTO Usuarios (
          usuario_id, nombre_completo, email, numero_documento, 
          tipo_documento, rol_id, equipo_id, telefono, fecha_registro, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await ejecutarSQL(dbReparada, insertSQL, [
        usuario.usuario_id,
        usuario.nombre_completo,
        usuario.email || null,
        usuario.numero_documento || null,
        usuario.tipo_documento || null,
        usuario.rol_id,
        usuario.equipo_id || null,
        usuario.telefono || null,
        usuario.fecha_registro || null,
        usuario.activo !== undefined ? usuario.activo : 1
      ]);
    }
    console.log('   ✅ Usuarios migrados');

    // 2. Migrar Roles
    console.log('\n🔄 2. MIGRANDO ROLES');
    const rolesOriginal = await obtenerDatos(dbOriginal, 'SELECT * FROM Roles');
    console.log(`   📊 Encontrados ${rolesOriginal.length} roles`);
    
    for (const rol of rolesOriginal) {
      const insertSQL = `
        INSERT OR REPLACE INTO Roles (
          rol_id, nombre_rol, descripcion, fecha_creacion, activo
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      await ejecutarSQL(dbReparada, insertSQL, [
        rol.rol_id,
        rol.nombre_rol,
        rol.descripcion || null,
        rol.fecha_creacion || null,
        rol.activo !== undefined ? rol.activo : 1
      ]);
    }
    console.log('   ✅ Roles migrados');

    // 3. Migrar Familias
    console.log('\n🔄 3. MIGRANDO FAMILIAS');
    const familiasOriginal = await obtenerDatos(dbOriginal, 'SELECT * FROM Familias');
    console.log(`   📊 Encontradas ${familiasOriginal.length} familias`);
    
    for (const familia of familiasOriginal) {
      const insertSQL = `
        INSERT OR REPLACE INTO Familias (
          familia_id, apellido_principal, direccion, barrio_vereda, 
          municipio, telefono_contacto, creado_por_uid, fecha_creacion, activo,
          numero_ficha, zona, territorio, estrato, tipo_familia, 
          riesgo_familiar, fecha_caracterizacion, info_vivienda, 
          situaciones_proteccion, condiciones_salud_publica, practicas_cuidado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await ejecutarSQL(dbReparada, insertSQL, [
        familia.familia_id,
        familia.apellido_principal,
        familia.direccion || null,
        familia.barrio_vereda || null,
        familia.municipio || null,
        familia.telefono_contacto || null,
        familia.creado_por_uid,
        familia.fecha_creacion || null,
        familia.activo !== undefined ? familia.activo : 1,
        null, // numero_ficha
        null, // zona
        null, // territorio
        null, // estrato
        null, // tipo_familia
        null, // riesgo_familiar
        null, // fecha_caracterizacion
        null, // info_vivienda
        null, // situaciones_proteccion
        null, // condiciones_salud_publica
        null  // practicas_cuidado
      ]);
    }
    console.log('   ✅ Familias migradas');

    // 4. Migrar Pacientes
    console.log('\n🔄 4. MIGRANDO PACIENTES');
    const pacientesOriginal = await obtenerDatos(dbOriginal, 'SELECT * FROM Pacientes');
    console.log(`   📊 Encontrados ${pacientesOriginal.length} pacientes`);
    
    for (const paciente of pacientesOriginal) {
      const insertSQL = `
        INSERT OR REPLACE INTO Pacientes (
          paciente_id, numero_documento, tipo_documento, primer_nombre, 
          segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, 
          genero, telefono, email, familia_id, fecha_registro, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await ejecutarSQL(dbReparada, insertSQL, [
        paciente.paciente_id,
        paciente.numero_documento || null,
        paciente.tipo_documento || null,
        paciente.primer_nombre,
        paciente.segundo_nombre || null,
        paciente.primer_apellido,
        paciente.segundo_apellido || null,
        paciente.fecha_nacimiento || null,
        paciente.genero || null,
        paciente.telefono || null,
        paciente.email || null,
        paciente.familia_id,
        paciente.fecha_registro || null,
        paciente.activo !== undefined ? paciente.activo : 1
      ]);
    }
    console.log('   ✅ Pacientes migrados');

    // 5. Migrar Demandas Inducidas
    console.log('\n🔄 5. MIGRANDO DEMANDAS INDUCIDAS');
    const demandasOriginal = await obtenerDatos(dbOriginal, 'SELECT * FROM Demandas_Inducidas');
    console.log(`   📊 Encontradas ${demandasOriginal.length} demandas`);
    
    for (const demanda of demandasOriginal) {
      const insertSQL = `
        INSERT OR REPLACE INTO Demandas_Inducidas (
          demanda_id, plan_id, tipo_demanda, descripcion, prioridad, 
          fecha_creacion, fecha_limite, estado, paciente_id, 
          fecha_asignacion, fecha_completado, profesional_asignado, 
          observaciones, creado_por_uid, fecha_creacion_timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await ejecutarSQL(dbReparada, insertSQL, [
        demanda.demanda_id,
        demanda.plan_id || null,
        demanda.tipo_demanda || 'Consulta médica', // valor por defecto
        demanda.descripcion,
        demanda.prioridad || 'Media', // valor por defecto
        demanda.fecha_creacion || null,
        demanda.fecha_limite || null,
        demanda.estado || 'Pendiente', // valor por defecto
        demanda.paciente_id || null,
        null, // fecha_asignacion
        null, // fecha_completado
        null, // profesional_asignado
        null, // observaciones
        null, // creado_por_uid
        null  // fecha_creacion_timestamp
      ]);
    }
    console.log('   ✅ Demandas inducidas migradas');

    // Verificación final
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN FINAL');
    console.log('='.repeat(60));

    const tablas = ['Usuarios', 'Roles', 'Familias', 'Pacientes', 'Demandas_Inducidas'];
    
    for (const tabla of tablas) {
      const count = await contarRegistros(dbReparada, tabla);
      console.log(`   ✅ ${tabla}: ${count} registros`);
    }

    // Verificar familias con integrantes
    const familiasConIntegrantes = await obtenerDatos(dbReparada, `
      SELECT 
        f.familia_id, f.apellido_principal, f.municipio,
        COUNT(p.paciente_id) as integrantes_count
      FROM Familias f 
      LEFT JOIN Pacientes p ON f.familia_id = p.familia_id AND p.activo = 1
      GROUP BY f.familia_id, f.apellido_principal, f.municipio
      ORDER BY integrantes_count DESC
    `);

    console.log('\n👨‍👩‍👧‍👦 Familias migradas con integrantes:');
    familiasConIntegrantes.forEach(familia => {
      console.log(`   - ${familia.apellido_principal} (${familia.municipio}): ${familia.integrantes_count} integrantes`);
    });

    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('✅ Todos tus datos han sido migrados correctamente');
    console.log('✅ La estructura completa está disponible');
    console.log('✅ El servidor puede usar la BD con todos los datos');
    
    dbOriginal.close();
    dbReparada.close();

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    dbOriginal.close();
    dbReparada.close();
  }
}

// Funciones auxiliares
function obtenerDatos(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function ejecutarSQL(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function contarRegistros(db, tabla) {
  return new Promise((resolve) => {
    db.get(`SELECT COUNT(*) as count FROM ${tabla}`, (err, row) => {
      if (err) resolve(0);
      else resolve(row.count);
    });
  });
}

migrarDatosInteligente();
