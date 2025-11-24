const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos correcta');
});

console.log('\n🎯 CREANDO DEMANDA INDUCIDA CON ESTRUCTURA CORRECTA');

async function createDemandaInducida() {
  try {
    // 1. Crear una familia para el paciente
    const insertFamilia = `
      INSERT INTO Familias (apellido_principal, direccion, barrio_vereda, municipio, telefono_contacto, creado_por_uid, fecha_creacion, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const familiaId = await new Promise((resolve, reject) => {
      db.run(insertFamilia, [
        'Martinez', 
        'Calle 20 # 10-30', 
        'Centro', 
        'Jamundí', 
        '3008889999',
        1, // Creado por Dr. Carlos Mendoza
        new Date().toISOString(),
        1 // Activo
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    console.log(`✅ Familia Martinez creada (ID: ${familiaId})`);
    
    // 2. Crear paciente
    const insertPaciente = `
      INSERT INTO Pacientes (
        familia_id, tipo_documento, numero_documento, primer_nombre, 
        primer_apellido, segundo_apellido, fecha_nacimiento, genero, fecha_registro, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const pacienteId = await new Promise((resolve, reject) => {
      db.run(insertPaciente, [
        familiaId, 'CC', '1122334455', 'María Elena', 'Martinez', 'López', '1978-08-15', 'F', new Date().toISOString(), 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    console.log(`✅ Paciente María Elena Martinez López creado (ID: ${pacienteId})`);
    
    // 3. Crear demanda inducida con la estructura correcta
    const insertDemanda = `
      INSERT INTO Demandas_Inducidas (
        plan_id, tipo_demanda, descripcion, prioridad, fecha_creacion, 
        fecha_limite, estado, paciente_id, fecha_asignacion, creado_por_uid, 
        fecha_creacion_timestamp, profesional_asignado, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const demandaId = await new Promise((resolve, reject) => {
      db.run(insertDemanda, [
        null, // plan_id
        'Consulta', // tipo_demanda
        'Consulta médica integral para María Elena Martinez López - Control prenatal, salud mental y enfermedades crónicas', // descripcion
        'Alta', // prioridad
        new Date().toISOString(), // fecha_creacion
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // fecha_limite (7 días)
        'Asignada', // estado
        pacienteId, // paciente_id
        new Date().toISOString().split('T')[0], // fecha_asignacion
        1, // creado_por_uid (Dr. Carlos Mendoza)
        new Date().toISOString(), // fecha_creacion_timestamp
        1, // profesional_asignado (Dr. Carlos Mendoza)
        'Demanda inducida para seguimiento integral de salud - incluye control prenatal, evaluación de salud mental y manejo de enfermedades crónicas'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    console.log('✅ Demanda inducida creada exitosamente');
    console.log(`📋 ID de la demanda: ${demandaId}`);
    console.log(`👤 Paciente: María Elena Martinez López (ID: ${pacienteId})`);
    console.log(`👨‍⚕️ Asignada a: Dr. Carlos Mendoza (ID: 1)`);
    console.log(`📅 Estado: Asignada`);
    
    console.log('\n🎯 ¡LISTO PARA PROBAR!');
    console.log('1. Reinicia el backend');
    console.log('2. Inicia sesión con: medico1@saludigital.edu.co / 1000000001');
    console.log('3. Ve a "Consultas Asignadas" → "Demandas Inducidas"');
    console.log('4. Deberías ver la demanda de María Elena Martinez López');
    
  } catch (error) {
    console.error('Error creando demanda inducida:', error);
  } finally {
    db.close();
  }
}

createDemandaInducida();
