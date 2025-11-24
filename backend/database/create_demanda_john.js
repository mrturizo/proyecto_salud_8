const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Primero, obtener el ID de John Alex (médico)
db.get("SELECT usuario_id FROM Usuarios WHERE nombre_completo LIKE '%john%' OR nombre_completo LIKE '%alex%'", (err, medico) => {
  if (err) {
    console.error('Error obteniendo médico:', err.message);
    db.close();
    return;
  }
  
  if (!medico) {
    console.error('❌ No se encontró John Alex en la base de datos');
    db.close();
    return;
  }
  
  console.log(`✅ Médico encontrado: John Alex (ID: ${medico.usuario_id})`);
  
  // Obtener el primer paciente disponible
  db.get("SELECT paciente_id, primer_nombre, primer_apellido FROM Pacientes WHERE activo = 1 LIMIT 1", (err, paciente) => {
    if (err) {
      console.error('Error obteniendo paciente:', err.message);
      db.close();
      return;
    }
    
    if (!paciente) {
      console.error('❌ No hay pacientes en la base de datos');
      db.close();
      return;
    }
    
    console.log(`✅ Paciente encontrado: ${paciente.primer_nombre} ${paciente.primer_apellido} (ID: ${paciente.paciente_id})`);
    
    // Crear demanda inducida asignada a John Alex
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
      paciente.paciente_id,
      new Date().toISOString().split('T')[0], // Fecha actual
      JSON.stringify(['Control prenatal', 'Vacunación']), // Diligenciamiento
      JSON.stringify(['Medicina general', 'Nutrición']), // Remisión a
      'Asignada',
      medico.usuario_id, // Asignado a John Alex
      1, // Solicitado por (usuario auxiliar)
      JSON.stringify({
        verificado: true,
        fecha_seguimiento: new Date().toISOString().split('T')[0],
        observaciones: 'Demanda asignada para seguimiento médico'
      })
    ];
    
    db.run(insertDemanda, params, function(err) {
      if (err) {
        console.error('Error creando demanda inducida:', err.message);
      } else {
        console.log('✅ Demanda inducida creada exitosamente');
        console.log(`📋 ID de la demanda: ${this.lastID}`);
        console.log(`👨‍⚕️ Asignada a: John Alex (ID: ${medico.usuario_id})`);
        console.log(`👤 Para paciente: ${paciente.primer_nombre} ${paciente.primer_apellido}`);
        console.log(`📅 Estado: Asignada`);
      }
      db.close();
    });
  });
});
