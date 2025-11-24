const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

const createDrCarlos = async () => {
  // Crear hash de la contraseña correcta
  const password = '1000000001';
  const passwordHash = await bcrypt.hash(password, 10);

  // Verificar que existe el rol de Médico
  db.get("SELECT rol_id FROM Roles WHERE nombre_rol = 'Médico'", (err, row) => {
    if (err) {
      console.error('Error obteniendo rol:', err.message);
      db.close();
      return;
    }
    
    if (!row) {
      console.error('❌ Rol "Médico" no encontrado');
      db.close();
      return;
    }

    const rol_id_medico = row.rol_id;

    // Crear usuario Dr. Carlos Mendoza
    const insertUser = `
      INSERT INTO Usuarios (
        nombre_completo,
        email,
        numero_documento,
        telefono,
        rol_id,
        activo,
        password_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertUser, [
      'Dr. Carlos Mendoza',
      'medico1@saludigital.edu.co',
      '123456789',
      '3005555555',
      rol_id_medico,
      1, // Activo
      passwordHash
    ], function(err) {
      if (err) {
        console.error('Error creando Dr. Carlos Mendoza:', err.message);
      } else {
        const medico_id = this.lastID;
        console.log('✅ Dr. Carlos Mendoza creado exitosamente');
        console.log(`🆔 ID: ${medico_id}`);
        console.log('\n👤 Credenciales:');
        console.log('📧 Email: medico1@saludigital.edu.co');
        console.log('🔑 Contraseña: 1000000001');
        console.log('👨‍⚕️ Rol: Médico');
        
        // Crear familia y paciente para Carlos Mendoza
        createPatientForDrCarlos(medico_id);
      }
    });
  });
};

function createPatientForDrCarlos(medico_id) {
  // Crear una familia para el nuevo paciente
  const insertFamilia = `
    INSERT INTO Familias (
      apellido_principal, direccion, barrio_vereda, municipio, telefono
    ) VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(insertFamilia, [
    'Martinez',
    'Calle 20 # 10-30',
    'Centro',
    'Jamundí',
    '3008889999'
  ], function(err) {
    if (err) {
      console.error('Error creando familia:', err.message);
      db.close();
      return;
    }
    
    const familia_id = this.lastID;
    console.log(`✅ Familia Martinez creada (ID: ${familia_id})`);
    
    // Crear paciente para Dr. Carlos Mendoza
    const insertPaciente = `
      INSERT INTO Pacientes (
        familia_id, tipo_documento, numero_documento, primer_nombre, 
        primer_apellido, segundo_apellido, fecha_nacimiento, genero, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertPaciente, [
      familia_id,
      'CC',
      '1122334455',
      'María Elena',
      'Martinez',
      'López',
      '1978-08-15',
      'F',
      1
    ], function(err) {
      if (err) {
        console.error('Error creando paciente:', err.message);
        db.close();
        return;
      }
      
      const paciente_id = this.lastID;
      console.log(`✅ Paciente María Elena Martinez López creado (ID: ${paciente_id})`);
      
      // Crear demanda inducida asignada a Dr. Carlos Mendoza
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
      
      const params = [
        '29253', // Número del formulario
        paciente_id,
        new Date().toISOString().split('T')[0], // Fecha actual
        JSON.stringify(['Control prenatal', 'Salud mental', 'Enfermedades crónicas']), // Diligenciamiento
        JSON.stringify(['Medicina general', 'Psicología', 'Nutrición']), // Remisión a
        'Asignada',
        medico_id, // Asignado a Dr. Carlos Mendoza
        1, // Solicitado por auxiliar
        JSON.stringify({
          verificado: true,
          fecha_seguimiento: new Date().toISOString().split('T')[0],
          observaciones: 'Consulta médica programada para María Elena Martinez - Seguimiento integral'
        })
      ];
      
      db.run(insertDemanda, params, function(err) {
        if (err) {
          console.error('Error creando demanda inducida:', err.message);
        } else {
          console.log('✅ Demanda inducida creada exitosamente');
          console.log(`📋 ID de la demanda: ${this.lastID}`);
          console.log(`👤 Paciente: María Elena Martinez López (ID: ${paciente_id})`);
          console.log(`👨‍⚕️ Asignada a: Dr. Carlos Mendoza (ID: ${medico_id})`);
          console.log(`📅 Estado: Asignada`);
          
          console.log('\n🎯 ¡LISTO PARA PROBAR!');
          console.log('1. Inicia sesión con: medico1@saludigital.edu.co / 1000000001');
          console.log('2. Ve a "Consultas Médicas"');
          console.log('3. En "Demandas Inducidas" verás la demanda de María Elena Martinez');
        }
        db.close();
      });
    });
  });
}

createDrCarlos().catch(err => {
  console.error('Error en createDrCarlos:', err);
  db.close();
});
