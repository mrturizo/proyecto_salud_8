-- Crear tabla Planes_Cuidado_Familiar si no existe
CREATE TABLE IF NOT EXISTS Planes_Cuidado_Familiar (
  plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  fecha_creacion DATE NOT NULL,
  fecha_revision DATE,
  tipo_plan VARCHAR(100), -- Prevención, Promoción, Protección, Recuperación
  estado VARCHAR(50) DEFAULT 'Activo', -- Activo, Completado, Suspendido, Cancelado
  diagnostico_principal TEXT,
  objetivos_cuidado TEXT,
  intervenciones JSON, -- Array de intervenciones planificadas
  recursos_requeridos JSON, -- Recursos humanos, materiales, etc.
  indicadores_evaluacion JSON, -- Métricas para evaluar el plan
  observaciones TEXT,
  creado_por_uid INTEGER NOT NULL,
  responsable_seguimiento INTEGER,
  fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id),
  FOREIGN KEY (responsable_seguimiento) REFERENCES Usuarios(usuario_id)
);

-- Crear tabla Demandas_Inducidas si no existe
CREATE TABLE IF NOT EXISTS Demandas_Inducidas (
  demanda_id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER,
  paciente_id INTEGER NOT NULL,
  tipo_demanda VARCHAR(100), -- Consulta médica, Terapia, Laboratorio, etc.
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(50) DEFAULT 'Media', -- Alta, Media, Baja
  estado VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, Asignada, En Proceso, Completada, Cancelada
  fecha_creacion DATE NOT NULL,
  fecha_asignacion DATE,
  fecha_completado DATE,
  profesional_asignado INTEGER,
  observaciones TEXT,
  creado_por_uid INTEGER NOT NULL,
  fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES Planes_Cuidado_Familiar(plan_id),
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (profesional_asignado) REFERENCES Usuarios(usuario_id),
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Crear tabla Roles si no existe
CREATE TABLE IF NOT EXISTS Roles (
  rol_id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_rol VARCHAR(100) NOT NULL UNIQUE
);

-- Insertar roles básicos
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (1, 'Administrador');
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (2, 'Médico');
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (3, 'Auxiliar de Enfermería');
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (4, 'Enfermero');

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_plan_paciente ON Planes_Cuidado_Familiar(paciente_id);
CREATE INDEX IF NOT EXISTS idx_plan_estado ON Planes_Cuidado_Familiar(estado);
CREATE INDEX IF NOT EXISTS idx_demanda_paciente ON Demandas_Inducidas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_demanda_estado ON Demandas_Inducidas(estado);
CREATE INDEX IF NOT EXISTS idx_demanda_profesional ON Demandas_Inducidas(profesional_asignado);
