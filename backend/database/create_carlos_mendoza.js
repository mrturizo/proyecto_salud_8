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

const createCarlosMendoza = async () => {
  const password = 'carlos123'; // Contraseña de prueba
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

    // Crear usuario Carlos Mendoza
    const insertUser = `
      INSERT OR IGNORE INTO Usuarios (
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
      'Carlos Mendoza',
      'medico1@saludigital.edu.co',
      'carlos123',
      '3005555555',
      rol_id_medico,
      1, // Activo
      passwordHash
    ], function(err) {
      if (err) {
        console.error('Error creando usuario Carlos Mendoza:', err.message);
      } else if (this.changes > 0) {
        console.log('✅ Usuario Carlos Mendoza creado exitosamente');
        console.log('\n👤 Credenciales de prueba:');
        console.log('📧 Email: medico1@saludigital.edu.co');
        console.log('🔑 Contraseña: carlos123');
        console.log('👨‍⚕️ Rol: Médico');
        console.log(`🆔 ID: ${this.lastID}`);
        createPatientForCarlos(this.lastID);
      } else {
        console.log('ℹ️  Usuario Carlos Mendoza ya existe');
        // Obtener el ID del usuario existente
        db.get("SELECT usuario_id FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, user) => {
          if (!err && user) {
            console.log(`🆔 ID: ${user.usuario_id}`);
            createPatientForCarlos(user.usuario_id);
          }
        });
      }
    });
  });
};

function createPatientForCarlos(medico_id) {
  // Crear una familia para el nuevo paciente
  const insertFamilia = `
    INSERT INTO Familias (
      apellido_principal, direccion, barrio_vereda, municipio, telefono
    ) VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(insertFamilia, [
    'Rodriguez',
    'Calle 15 # 8-45',
    'El Prado',
    'Jamundí',
    '3009876543'
  ], function(err) {
    if (err) {
      console.error('Error creando familia:', err.message);
      db.close();
      return;
    }
    
    const familia_id = this.lastID;
    console.log(`✅ Familia Rodriguez creada (ID: ${familia_id})`);
    
    // Crear paciente para Carlos Mendoza
    const insertPaciente = `
      INSERT INTO Pacientes (
        familia_id, tipo_documento, numero_documento, primer_nombre, 
        primer_apellido, segundo_apellido, fecha_nacimiento, genero, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertPaciente, [
      familia_id,
      'CC',
      '98765432',
      'Ana María',
      'Rodriguez',
      'García',
      '1985-03-20',
      'F',
      1
    ], function(err) {
      if (err) {
        console.error('Error creando paciente:', err.message);
        db.close();
        return;
      }
      
      const paciente_id = this.lastID;
      console.log(`✅ Paciente Ana María Rodriguez García creado (ID: ${paciente_id})`);
      
      // Crear demanda inducida asignada a Carlos Mendoza
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
        '29252', // Número del formulario
        paciente_id,
        new Date().toISOString().split('T')[0], // Fecha actual
        JSON.stringify(['Enfermedades crónicas', 'Salud mental', 'Nutrición adultos']), // Diligenciamiento
        JSON.stringify(['Medicina general', 'Psicología', 'Nutrición']), // Remisión a
        'Asignada',
        medico_id, // Asignado a Carlos Mendoza
        1, // Solicitado por auxiliar
        JSON.stringify({
          verificado: true,
          fecha_seguimiento: new Date().toISOString().split('T')[0],
          observaciones: 'Consulta médica programada para Ana María Rodriguez - Seguimiento de enfermedades crónicas'
        })
      ];
      
      db.run(insertDemanda, params, function(err) {
        if (err) {
          console.error('Error creando demanda inducida:', err.message);
        } else {
          console.log('✅ Demanda inducida creada exitosamente');
          console.log(`📋 ID de la demanda: ${this.lastID}`);
          console.log(`👤 Paciente: Ana María Rodriguez García (ID: ${paciente_id})`);
          console.log(`👨‍⚕️ Asignada a: Carlos Mendoza (ID: ${medico_id})`);
          console.log(`📅 Estado: Asignada`);
          console.log(`📧 Email médico: medico1@saludigital.edu.co`);
        }
        db.close();
      });
    });
  });
}

createCarlosMendoza().catch(err => {
  console.error('Error en createCarlosMendoza:', err);
  db.close();
});
