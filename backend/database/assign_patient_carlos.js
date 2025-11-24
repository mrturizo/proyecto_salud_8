const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Buscar al doctor Carlos Mendoza
db.get("SELECT usuario_id, nombre_completo FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, medico) => {
  if (err) {
    console.error('Error obteniendo médico:', err.message);
    db.close();
    return;
  }
  
  if (!medico) {
    console.error('❌ No se encontró Carlos Mendoza con email medico1@saludigital.edu.co');
    db.close();
    return;
  }
  
  console.log(`✅ Médico encontrado: ${medico.nombre_completo} (ID: ${medico.usuario_id})`);
  
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
        medico.usuario_id, // Asignado a Carlos Mendoza
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
          console.log(`👨‍⚕️ Asignada a: ${medico.nombre_completo} (ID: ${medico.usuario_id})`);
          console.log(`📅 Estado: Asignada`);
          console.log(`📧 Email médico: medico1@saludigital.edu.co`);
        }
        db.close();
      });
    });
  });
});
