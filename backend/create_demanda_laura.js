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

console.log('\n🎯 CREANDO PLAN Y DEMANDA PARA LAURA ROMERO');

async function createPlanAndDemanda() {
  try {
    // Usar Laura Romero (ID: 2)
    const pacienteId = 2;
    
    // 1. Crear un plan de cuidado familiar para Laura Romero
    const insertPlan = `
      INSERT INTO Planes_Cuidado_Familiar (
        paciente_id, diagnostico_principal, objetivos_cuidado, 
        intervenciones_planeadas, fecha_creacion, fecha_revision, 
        creado_por_uid, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const planId = await new Promise((resolve, reject) => {
      db.run(insertPlan, [
        pacienteId, // paciente_id
        'Control de salud general y seguimiento preventivo', // diagnostico_principal
        'Mantener estado de salud óptimo, prevenir enfermedades y mejorar calidad de vida', // objetivos_cuidado
        'Consultas médicas regulares, exámenes de laboratorio, educación en salud preventiva, seguimiento nutricional', // intervenciones_planeadas
        new Date().toISOString(), // fecha_creacion
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // fecha_revision (30 días)
        1, // creado_por_uid (Dr. Carlos Mendoza)
        'Activo' // estado
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    console.log(`✅ Plan de cuidado familiar creado para Laura Romero (ID: ${planId})`);
    
    // 2. Crear demanda inducida
    const insertDemanda = `
      INSERT INTO Demandas_Inducidas (
        plan_id, tipo_demanda, descripcion, prioridad, fecha_creacion, 
        fecha_limite, estado, paciente_id, fecha_asignacion, creado_por_uid, 
        fecha_creacion_timestamp, profesional_asignado, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const demandaId = await new Promise((resolve, reject) => {
      db.run(insertDemanda, [
        planId, // plan_id
        'Consulta', // tipo_demanda
        'Consulta médica de control para Laura Romero - Evaluación general de salud y seguimiento preventivo', // descripcion
        'Media', // prioridad
        new Date().toISOString(), // fecha_creacion
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // fecha_limite (14 días)
        'Asignada', // estado
        pacienteId, // paciente_id
        new Date().toISOString().split('T')[0], // fecha_asignacion
        1, // creado_por_uid (Dr. Carlos Mendoza)
        new Date().toISOString(), // fecha_creacion_timestamp
        1, // profesional_asignado (Dr. Carlos Mendoza)
        'Demanda inducida para control médico de Laura Romero - incluye evaluación general, exámenes de rutina y educación en salud preventiva'
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    console.log('✅ Demanda inducida creada exitosamente');
    console.log(`📋 ID de la demanda: ${demandaId}`);
    console.log(`👤 Paciente: Laura Romero (ID: ${pacienteId})`);
    console.log(`👨‍⚕️ Asignada a: Dr. Carlos Mendoza (ID: 1)`);
    console.log(`📅 Estado: Asignada`);
    console.log(`📋 Plan asociado: ${planId}`);
    
    // Verificar que se creó correctamente
    console.log('\n🔍 Verificando demanda creada:');
    db.get("SELECT * FROM Demandas_Inducidas WHERE demanda_id = ?", [demandaId], (err, demanda) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('✅ Demanda verificada:');
        console.log(`   - ID: ${demanda.demanda_id}`);
        console.log(`   - Paciente: ${demanda.paciente_id}`);
        console.log(`   - Asignado a: ${demanda.profesional_asignado}`);
        console.log(`   - Estado: ${demanda.estado}`);
        console.log(`   - Descripción: ${demanda.descripcion}`);
      }
      
      console.log('\n🎯 ¡LISTO PARA PROBAR!');
      console.log('1. Reinicia el backend');
      console.log('2. Inicia sesión con: medico1@saludigital.edu.co / 1000000001');
      console.log('3. Ve a "Consultas Asignadas" → "Demandas Inducidas"');
      console.log('4. Deberías ver la demanda de Laura Romero');
      
      db.close();
    });
    
  } catch (error) {
    console.error('Error creando plan y demanda:', error);
    db.close();
  }
}

createPlanAndDemanda();
