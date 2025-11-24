const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Primero, verificar qué médico tenemos
db.get("SELECT usuario_id, nombre_completo, rol_id FROM Usuarios WHERE rol_id = 2", (err, medico) => {
  if (err) {
    console.error('Error obteniendo médico:', err.message);
    db.close();
    return;
  }
  
  if (!medico) {
    console.error('❌ No se encontró ningún médico en la base de datos');
    db.close();
    return;
  }
  
  console.log(`✅ Médico encontrado: ${medico.nombre_completo} (ID: ${medico.usuario_id})`);
  
  // Verificar si ya existe una familia para John Alex
  db.get("SELECT familia_id FROM Familias WHERE apellido_principal = 'Alex'", (err, familia) => {
    if (err) {
      console.error('Error verificando familia:', err.message);
      db.close();
      return;
    }
    
    let familia_id;
    
    if (!familia) {
      // Crear familia Alex
      const insertFamilia = `
        INSERT INTO Familias (
          apellido_principal, direccion, barrio_vereda, municipio, telefono
        ) VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(insertFamilia, [
        'Alex',
        'Calle 10 # 5-20',
        'Centro',
        'Jamundí',
        '3001234567'
      ], function(err) {
        if (err) {
          console.error('Error creando familia:', err.message);
          db.close();
          return;
        }
        
        familia_id = this.lastID;
        console.log(`✅ Familia Alex creada (ID: ${familia_id})`);
        createJohnAlexPatient(familia_id, medico.usuario_id);
      });
    } else {
      familia_id = familia.familia_id;
      console.log(`✅ Familia Alex encontrada (ID: ${familia_id})`);
      createJohnAlexPatient(familia_id, medico.usuario_id);
    }
  });
});

function createJohnAlexPatient(familia_id, medico_id) {
  // Verificar si John Alex ya existe como paciente
  db.get("SELECT paciente_id FROM Pacientes WHERE primer_nombre = 'John' AND primer_apellido = 'Alex'", (err, paciente) => {
    if (err) {
      console.error('Error verificando paciente:', err.message);
      db.close();
      return;
    }
    
    let paciente_id;
    
    if (!paciente) {
      // Crear paciente John Alex
      const insertPaciente = `
        INSERT INTO Pacientes (
          familia_id, tipo_documento, numero_documento, primer_nombre, 
          primer_apellido, fecha_nacimiento, genero, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(insertPaciente, [
        familia_id,
        'CC',
        '12345678',
        'John',
        'Alex',
        '1990-05-15',
        'M',
        1
      ], function(err) {
        if (err) {
          console.error('Error creando paciente:', err.message);
          db.close();
          return;
        }
        
        paciente_id = this.lastID;
        console.log(`✅ Paciente John Alex creado (ID: ${paciente_id})`);
        createDemandaInducida(paciente_id, medico_id);
      });
    } else {
      paciente_id = paciente.paciente_id;
      console.log(`✅ Paciente John Alex encontrado (ID: ${paciente_id})`);
      createDemandaInducida(paciente_id, medico_id);
    }
  });
}

function createDemandaInducida(paciente_id, medico_id) {
  // Crear demanda inducida asignada al médico
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
    '29251', // Número del formulario
    paciente_id,
    new Date().toISOString().split('T')[0], // Fecha actual
    JSON.stringify(['Control prenatal', 'Vacunación', 'Salud mental']), // Diligenciamiento
    JSON.stringify(['Medicina general', 'Psicología']), // Remisión a
    'Asignada',
    medico_id, // Asignado al médico existente
    1, // Solicitado por auxiliar
    JSON.stringify({
      verificado: true,
      fecha_seguimiento: new Date().toISOString().split('T')[0],
      observaciones: 'Consulta médica programada para John Alex'
    })
  ];
  
  db.run(insertDemanda, params, function(err) {
    if (err) {
      console.error('Error creando demanda inducida:', err.message);
    } else {
      console.log('✅ Demanda inducida creada exitosamente');
      console.log(`📋 ID de la demanda: ${this.lastID}`);
      console.log(`👤 Paciente: John Alex (ID: ${paciente_id})`);
      console.log(`👨‍⚕️ Asignada al médico (ID: ${medico_id})`);
      console.log(`📅 Estado: Asignada`);
    }
    db.close();
  });
}
