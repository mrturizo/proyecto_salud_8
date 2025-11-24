const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

console.log('📋 Creando tabla HC_Psicologia...\n');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS HC_Psicologia (
  hc_psicologia_id INTEGER PRIMARY KEY AUTOINCREMENT,
  atencion_id INTEGER NOT NULL,
  fecha_atencion DATE NOT NULL,
  hora_consulta TIME,
  
  -- Motivo de consulta
  motivo_consulta TEXT,
  demanda_explicita TEXT,
  demanda_implicita TEXT,
  
  -- Historia del problema actual
  historia_problema_actual TEXT,
  inicio_sintomas TEXT,
  evolucion_sintomas TEXT,
  factores_precipitantes TEXT,
  factores_mantenedores TEXT,
  
  -- Antecedentes
  antecedentes_personales TEXT,
  antecedentes_familiares TEXT,
  antecedentes_psicologicos TEXT,
  antecedentes_psiquiatricos TEXT,
  
  -- Evaluación psicológica
  evaluacion_mental TEXT,
  estado_animo TEXT,
  estado_afectivo TEXT,
  pensamiento TEXT,
  percepcion TEXT,
  conciencia TEXT,
  orientacion TEXT,
  memoria TEXT,
  atencion TEXT,
  lenguaje TEXT,
  
  -- Funcionamiento
  funcionamiento_social TEXT,
  funcionamiento_laboral TEXT,
  funcionamiento_academico TEXT,
  relaciones_interpersonales TEXT,
  afrontamiento TEXT,
  
  -- Pruebas psicológicas
  pruebas_aplicadas JSON,
  resultados_pruebas TEXT,
  
  -- Diagnóstico
  diagnostico_psicologico TEXT,
  codigo_cie10 TEXT,
  diagnostico_psicologico_secundario TEXT,
  codigo_cie10_secundario TEXT,
  
  -- Plan de tratamiento
  plan_tratamiento TEXT,
  objetivos_tratamiento TEXT,
  intervenciones_planeadas TEXT,
  estrategias_terapeuticas TEXT,
  
  -- Observaciones
  observaciones_sesion TEXT,
  notas_clinicas TEXT,
  recomendaciones TEXT,
  
  -- Seguimiento
  proxima_cita DATE,
  frecuencia_recomendada TEXT,
  derivaciones TEXT,
  
  -- Estado
  estado VARCHAR(20) DEFAULT 'En proceso',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (atencion_id) REFERENCES Atenciones_Clinicas(atencion_id)
);
`;

db.run(createTableSQL, (err) => {
  if (err) {
    console.error('❌ Error creando tabla HC_Psicologia:', err.message);
    db.close();
    return;
  }
  
  console.log('✅ Tabla HC_Psicologia creada exitosamente');
  
  // Verificar estructura y crear índices
  db.all("PRAGMA table_info(HC_Psicologia)", (err, columns) => {
    if (err) {
      console.error('Error verificando estructura:', err.message);
      db.close();
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    console.log(`\n✅ Tabla creada con ${columns.length} columnas`);
    
    // Crear índices solo para columnas que existen
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_hc_psicologia_atencion ON HC_Psicologia(atencion_id)'
    ];
    
    if (columnNames.includes('estado')) {
      createIndexes.push('CREATE INDEX IF NOT EXISTS idx_hc_psicologia_estado ON HC_Psicologia(estado)');
    }
    
    let completed = 0;
    if (createIndexes.length === 0) {
      console.log('✅ No se requieren índices adicionales');
      db.close();
      return;
    }
    
    createIndexes.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ Error creando índice ${index + 1}:`, err.message);
        } else {
          completed++;
        }
        
        if (completed === createIndexes.length) {
          console.log('✅ Índices creados exitosamente');
          console.log('\n📋 Columnas principales:');
          console.log('   - hc_psicologia_id (PK)');
          console.log('   - atencion_id (FK)');
          console.log('   - motivo_consulta');
          console.log('   - evaluacion_mental');
          console.log('   - diagnostico_psicologico');
          console.log('   - plan_tratamiento');
          if (columnNames.includes('estado')) {
            console.log('   - estado');
          }
          db.close();
        }
      });
    });
  });
});

