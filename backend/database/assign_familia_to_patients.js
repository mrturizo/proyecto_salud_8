const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Determinar la ruta de la base de datos usando la misma lógica que server.js
// El script debe ejecutarse desde el directorio backend donde están las dependencias
const sourceDbPath = path.join(__dirname, 'salud_digital_aps.db'); // backend/database/salud_digital_aps.db
const tmpDbPath = '/tmp/salud_digital_aps.db';
const persistentDbPath = process.env.DB_PATH || path.join(process.env.HOME || '/opt/render', 'persistent', 'salud_digital_aps.db');

let dbPath = null;

// Prioridad 1: DB_PATH (persistente en Render)
if (process.env.DB_PATH && fs.existsSync(persistentDbPath)) {
  dbPath = persistentDbPath;
  console.log('✅ Usando base de datos persistente:', dbPath);
}
// Prioridad 2: /tmp (temporal en Render)
else if (fs.existsSync(tmpDbPath)) {
  dbPath = tmpDbPath;
  console.log('⚠️  Usando base de datos temporal en /tmp:', dbPath);
}
// Prioridad 3: Fuente en database/
else if (fs.existsSync(sourceDbPath)) {
  dbPath = sourceDbPath;
  console.log('✅ Usando base de datos fuente:', dbPath);
}
// Prioridad 4: Buscar en directorio padre (backend/)
else {
  const backendDbPath = path.join(path.dirname(__dirname), 'salud_digital_aps.db');
  if (fs.existsSync(backendDbPath)) {
    dbPath = backendDbPath;
    console.log('✅ Usando base de datos en backend:', dbPath);
  } else {
    // Por defecto, usar el directorio database
    dbPath = sourceDbPath;
    console.log('⚠️  Usando ruta por defecto (puede no existir):', dbPath);
  }
}

console.log('📊 Asignando familias a pacientes sin familia...');
console.log(`📁 Base de datos: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Función para crear una familia por defecto para un paciente
function crearFamiliaParaPaciente(paciente, callback) {
  const apellidoPrincipal = paciente.primer_apellido || 'Sin apellido';
  const nombreCompleto = `${paciente.primer_nombre || ''} ${paciente.primer_apellido || ''}`.trim();
  
  // Crear familia con datos básicos del paciente
  const insertFamilia = `
    INSERT INTO Familias (
      apellido_principal,
      direccion,
      municipio,
      creado_por_uid,
      fecha_creacion
    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  
  const direccion = paciente.direccion || 'Dirección no especificada';
  const municipio = paciente.municipio || 'Municipio no especificado';
  const creadoPor = paciente.usuario_id || 1; // Usar usuario_id del paciente o 1 por defecto
  
  db.run(insertFamilia, [apellidoPrincipal, direccion, municipio, creadoPor], function(err) {
    if (err) {
      console.error(`❌ Error creando familia para paciente ${paciente.paciente_id}:`, err.message);
      return callback(err, null);
    }
    
    const familiaId = this.lastID;
    console.log(`✅ Familia creada: ID ${familiaId} - Apellido: ${apellidoPrincipal}`);
    callback(null, familiaId);
  });
}

// Función principal
function asignarFamilias() {
  return new Promise((resolve, reject) => {
    // 1. Encontrar todos los pacientes sin familia_id
    const queryPacientes = `
      SELECT 
        paciente_id,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        numero_documento,
        tipo_documento
      FROM Pacientes
      WHERE familia_id IS NULL
      ORDER BY paciente_id
    `;
    
    db.all(queryPacientes, [], (err, pacientes) => {
      if (err) {
        console.error('❌ Error consultando pacientes:', err.message);
        return reject(err);
      }
      
      if (pacientes.length === 0) {
        console.log('✅ No hay pacientes sin familia asignada.');
        db.close();
        return resolve();
      }
      
      console.log(`\n📋 Encontrados ${pacientes.length} pacientes sin familia asignada.\n`);
      
      let procesados = 0;
      let errores = 0;
      
      // Procesar cada paciente
      pacientes.forEach((paciente, index) => {
        crearFamiliaParaPaciente(paciente, (err, familiaId) => {
          if (err) {
            errores++;
            procesados++;
            if (procesados === pacientes.length) {
              console.log(`\n📊 Resumen: ${procesados - errores} pacientes actualizados, ${errores} errores`);
              db.close();
              if (errores === pacientes.length) {
                reject(new Error('Todos los pacientes fallaron al asignar familia'));
              } else {
                resolve();
              }
            }
            return;
          }
          
          // Asignar la familia al paciente
          const updatePaciente = `
            UPDATE Pacientes
            SET familia_id = ?
            WHERE paciente_id = ?
          `;
          
          db.run(updatePaciente, [familiaId, paciente.paciente_id], function(updateErr) {
            procesados++;
            
            if (updateErr) {
              console.error(`❌ Error actualizando paciente ${paciente.paciente_id}:`, updateErr.message);
              errores++;
            } else {
              const nombreCompleto = `${paciente.primer_nombre || ''} ${paciente.primer_apellido || ''}`.trim() || `ID ${paciente.paciente_id}`;
              console.log(`✅ Paciente actualizado: ${nombreCompleto} (ID: ${paciente.paciente_id}) → Familia ID: ${familiaId}`);
            }
            
            // Verificar si terminamos
            if (procesados === pacientes.length) {
              console.log(`\n📊 Resumen:`);
              console.log(`   ✅ Pacientes actualizados: ${procesados - errores}`);
              console.log(`   ❌ Errores: ${errores}`);
              console.log(`\n✅ Proceso completado.`);
              db.close();
              resolve();
            }
          });
        });
      });
    });
  });
}

// Ejecutar el script
asignarFamilias()
  .then(() => {
    console.log('\n🎉 Script ejecutado exitosamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error ejecutando script:', err.message);
    process.exit(1);
  });

