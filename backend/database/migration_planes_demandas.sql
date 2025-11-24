-- Migración para agregar tablas de Plan de Cuidado Familiar y Demandas Inducidas
-- Fecha: 2025-01-16
-- Descripción: Crear tablas para gestión de planes de cuidado y demandas inducidas

-- Crear tabla Planes_Cuidado_Familiar
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

-- Crear tabla Demandas_Inducidas
CREATE TABLE IF NOT EXISTS Demandas_Inducidas (
  demanda_id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
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

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_plan_paciente ON Planes_Cuidado_Familiar(paciente_id);
CREATE INDEX IF NOT EXISTS idx_plan_estado ON Planes_Cuidado_Familiar(estado);
CREATE INDEX IF NOT EXISTS idx_plan_creado_por ON Planes_Cuidado_Familiar(creado_por_uid);
CREATE INDEX IF NOT EXISTS idx_demanda_plan ON Demandas_Inducidas(plan_id);
CREATE INDEX IF NOT EXISTS idx_demanda_paciente ON Demandas_Inducidas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_demanda_estado ON Demandas_Inducidas(estado);
CREATE INDEX IF NOT EXISTS idx_demanda_profesional ON Demandas_Inducidas(profesional_asignado);

-- Insertar usuario de prueba para Auxiliar de Enfermería
INSERT OR IGNORE INTO Usuarios (
  nombre_completo, 
  email, 
  numero_documento, 
  telefono,
  rol_id, 
  equipo_id, 
  activo
) VALUES (
  'María Auxiliar Enfermería',
  'auxiliar@salud.com',
  'aux123',
  '3001234567',
  (SELECT rol_id FROM Roles WHERE nombre_rol = 'Auxiliar de enfermería'),
  (SELECT equipo_id FROM Equipos_Basicos LIMIT 1),
  1
);
