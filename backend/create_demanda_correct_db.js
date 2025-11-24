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

console.log('\n🎯 CREANDO DEMANDA INDUCIDA EN LA BD CORRECTA');

async function createDemandaInducida() {
  try {
    // 1. Crear una familia para el paciente
    const insertFamilia = `
      INSERT INTO Familias (apellido_principal, direccion, barrio_vereda, municipio, telefono)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const familiaId = await new Promise((resolve, reject) => {
      db.run(insertFamilia, ['Martinez', 'Calle 20 # 10-30', 'Centro', 'Jamundí', '3008889999'], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    console.log(`✅ Familia Martinez creada (ID: ${familiaId})`);
    
    // 2. Crear paciente
    const insertPaciente = `
      INSERT INTO Pacientes (
        familia_id, tipo_documento, numero_documento, primer_nombre, 
        primer_apellido, segundo_apellido, fecha_nacimiento, genero, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const pacienteId = await new Promise((resolve, reject) => {
      db.run(insertPaciente, [
        familiaId, 'CC', '1122334455', 'María Elena', 'Martinez', 'López', '1978-08-15', 'F', 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    console.log(`✅ Paciente María Elena Martinez López creado (ID: ${pacienteId})`);
    
    // 3. Crear demanda inducida asignada a Dr. Carlos Mendoza (ID: 1)
    const insertDemanda = `
      INSERT INTO Demandas_Inducidas (
        numero_formulario,
        paciente_id,
        fecha_demanda,
        diligenciamiento,
        remision_a,
        estado,
        asignado_a_uid,
        solicitado_por_uid,
        seguimiento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const demandaId = await new Promise((resolve, reject) => {
      db.run(insertDemanda, [
        '29253',
        pacienteId,
        new Date().toISOString().split('T')[0],
        JSON.stringify(['Control prenatal', 'Salud mental', 'Enfermedades crónicas']),
        JSON.stringify(['Medicina general', 'Psicología', 'Nutrición']),
        'Asignada',
        1, // Asignado a Dr. Carlos Mendoza (ID: 1)
        1, // Solicitado por Dr. Carlos Mendoza
        JSON.stringify({
          verificado: true,
          fecha_seguimiento: new Date().toISOString().split('T')[0],
          observaciones: 'Consulta médica programada para María Elena Martinez - Seguimiento integral'
        })
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
