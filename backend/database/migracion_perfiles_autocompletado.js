const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

// Crear tabla Perfiles_Autocompletado
const createTableSQL = `
CREATE TABLE IF NOT EXISTS Perfiles_Autocompletado (
  perfil_id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_perfil VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_perfil VARCHAR(50) DEFAULT 'HC_Medicina', -- 'HC_Medicina', 'HC_Psicologia', 'HC_Enfermeria', 'General'
  datos_perfil JSON NOT NULL, -- Objeto con todos los valores a autocompletar
  creado_por_uid INTEGER,
  activo BOOLEAN DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_perfiles_tipo ON Perfiles_Autocompletado(tipo_perfil);
CREATE INDEX IF NOT EXISTS idx_perfiles_activo ON Perfiles_Autocompletado(activo);
`;

db.exec(createTableSQL, (err) => {
  if (err) {
    console.error('❌ Error creando tabla Perfiles_Autocompletado:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Tabla Perfiles_Autocompletado creada exitosamente');
  
  // Insertar perfiles de ejemplo
  const perfilesEjemplo = [
    {
      nombre_perfil: 'Paciente Joven Normal',
      descripcion: 'Perfil para pacientes jóvenes sin condiciones especiales',
      tipo_perfil: 'HC_Medicina',
      datos_perfil: JSON.stringify({
        motivo_consulta: 'Control de salud',
        enfoque_diferencial: {
          ciclo_vida: 'Adolescente',
          genero: 'Sin enfoque especial',
          grupo_etnico: 'No aplica',
          orientacion_sexual: 'No aplica',
          discapacidad: false,
          victima_violencia: false,
          desplazamiento: false,
          reclusion: false,
          gestante_lactante: false,
          trabajador_salud: false
        },
        enfermedad_actual: 'Paciente asintomático, en control regular',
        antecedentes_familiares: 'No refiere antecedentes familiares relevantes',
        examen_fisico: 'Paciente en buen estado general. Signos vitales estables.',
        plan_manejo: 'Control periódico. Promoción y prevención en salud.'
      })
    },
    {
      nombre_perfil: 'Paciente Adulto Mayor Normal',
      descripcion: 'Perfil para pacientes adultos mayores sin condiciones especiales',
      tipo_perfil: 'HC_Medicina',
      datos_perfil: JSON.stringify({
        motivo_consulta: 'Control de salud',
        enfoque_diferencial: {
          ciclo_vida: 'Adulto Mayor',
          genero: 'Sin enfoque especial',
          grupo_etnico: 'No aplica',
          orientacion_sexual: 'No aplica',
          discapacidad: false,
          victima_violencia: false,
          desplazamiento: false,
          reclusion: false,
          gestante_lactante: false,
          trabajador_salud: false
        },
        enfermedad_actual: 'Paciente en seguimiento por edad, refiere buen estado general',
        antecedentes_familiares: 'Antecedentes familiares de hipertensión y diabetes',
        examen_fisico: 'Paciente en buen estado general. Signos vitales estables. Sin alteraciones evidentes.',
        plan_manejo: 'Control periódico. Promoción y prevención. Seguimiento de factores de riesgo cardiovascular.'
      })
    }
  ];
  
  const insertSQL = `
    INSERT OR IGNORE INTO Perfiles_Autocompletado 
    (nombre_perfil, descripcion, tipo_perfil, datos_perfil, activo) 
    VALUES (?, ?, ?, ?, 1)
  `;
  
  let insertados = 0;
  perfilesEjemplo.forEach((perfil) => {
    db.run(insertSQL, [
      perfil.nombre_perfil,
      perfil.descripcion,
      perfil.tipo_perfil,
      perfil.datos_perfil
    ], function(err) {
      if (err) {
        console.error(`❌ Error insertando perfil ${perfil.nombre_perfil}:`, err.message);
      } else {
        insertados++;
        if (insertados === perfilesEjemplo.length) {
          console.log(`✅ ${insertados} perfiles de ejemplo insertados`);
          db.close();
        }
      }
    });
  });
  
  // Si no hay perfiles para insertar, cerrar la BD
  if (perfilesEjemplo.length === 0) {
    db.close();
  }
});

console.log('📋 Ejecutando migración de Perfiles_Autocompletado...');

