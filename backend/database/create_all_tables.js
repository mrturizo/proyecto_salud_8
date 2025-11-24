const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Script completo para crear todas las tablas
const createTablesSQL = `
-- Tabla Usuarios
CREATE TABLE IF NOT EXISTS Usuarios (
  usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  numero_documento VARCHAR(50) UNIQUE,
  telefono VARCHAR(20),
  rol_id INTEGER,
  activo BOOLEAN DEFAULT 1,
  password_hash VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES Roles(rol_id)
);

-- Tabla Familias
CREATE TABLE IF NOT EXISTS Familias (
  familia_id INTEGER PRIMARY KEY AUTOINCREMENT,
  apellido_principal VARCHAR(100) NOT NULL,
  direccion TEXT,
  barrio_vereda VARCHAR(150),
  municipio VARCHAR(100),
  telefono VARCHAR(20),
  numero_ficha VARCHAR(100),
  zona VARCHAR(50),
  territorio VARCHAR(150),
  estrato INTEGER,
  tipo_familia VARCHAR(100),
  riesgo_familiar VARCHAR(100),
  fecha_caracterizacion DATE,
  info_vivienda JSON,
  situaciones_proteccion JSON,
  condiciones_salud_publica JSON,
  practicas_cuidado JSON,
  creado_por_uid INTEGER,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Tabla Pacientes
CREATE TABLE IF NOT EXISTS Pacientes (
  paciente_id INTEGER PRIMARY KEY AUTOINCREMENT,
  familia_id INTEGER NOT NULL,
  tipo_documento VARCHAR(10),
  numero_documento VARCHAR(50),
  primer_nombre VARCHAR(100),
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100),
  segundo_apellido VARCHAR(100),
  fecha_nacimiento DATE,
  genero VARCHAR(10),
  activo BOOLEAN DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (familia_id) REFERENCES Familias(familia_id)
);

-- Tabla Caracterizacion_Paciente
CREATE TABLE IF NOT EXISTS Caracterizacion_Paciente (
  caracterizacion_paciente_id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  fecha_caracterizacion DATE,
  rol_familiar VARCHAR(50),
  ocupacion VARCHAR(150),
  nivel_educativo VARCHAR(100),
  grupo_poblacional VARCHAR(100),
  regimen_afiliacion VARCHAR(100),
  pertenencia_etnica VARCHAR(100),
  discapacidad JSON,
  victima_violencia BOOLEAN,
  datos_pyp JSON,
  datos_salud JSON,
  creado_por_uid INTEGER,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Tabla Planes_Cuidado_Familiar
CREATE TABLE IF NOT EXISTS Planes_Cuidado_Familiar (
  plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  familia_id INTEGER NOT NULL,
  paciente_principal_id INTEGER NOT NULL,
  fecha_entrega DATE NOT NULL,
  plan_asociado JSON,
  condicion_identificada TEXT,
  logro_salud TEXT,
  cuidados_salud TEXT,
  demandas_inducidas_desc TEXT,
  educacion_salud TEXT,
  estado VARCHAR(20) DEFAULT 'Activo',
  creado_por_uid INTEGER NOT NULL,
  fecha_aceptacion DATE,
  fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (familia_id) REFERENCES Familias(familia_id),
  FOREIGN KEY (paciente_principal_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Tabla Demandas_Inducidas
CREATE TABLE IF NOT EXISTS Demandas_Inducidas (
  demanda_id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_formulario VARCHAR(100),
  paciente_id INTEGER NOT NULL,
  plan_id INTEGER,
  fecha_demanda DATE NOT NULL,
  diligenciamiento JSON,
  remision_a JSON,
  estado VARCHAR(20) DEFAULT 'Pendiente',
  asignado_a_uid INTEGER,
  solicitado_por_uid INTEGER NOT NULL,
  seguimiento JSON,
  fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (plan_id) REFERENCES Planes_Cuidado_Familiar(plan_id),
  FOREIGN KEY (asignado_a_uid) REFERENCES Usuarios(usuario_id),
  FOREIGN KEY (solicitado_por_uid) REFERENCES Usuarios(usuario_id)
);
`;

// Ejecutar creación de tablas
db.exec(createTablesSQL, (err) => {
  if (err) {
    console.error('Error creando tablas:', err.message);
  } else {
    console.log('✅ Todas las tablas creadas exitosamente');
  }
  
  // Verificar tablas creadas
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error verificando tablas:', err.message);
    } else {
      console.log('\n📋 Tablas disponibles:');
      tables.forEach(table => {
        console.log(`  - ${table.name}`);
      });
    }
    db.close();
  });
});
