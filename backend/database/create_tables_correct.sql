-- Tabla Planes_Cuidado_Familiar según especificaciones del formato físico
CREATE TABLE IF NOT EXISTS Planes_Cuidado_Familiar (
  plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  familia_id INTEGER NOT NULL,
  paciente_principal_id INTEGER NOT NULL,
  fecha_entrega DATE NOT NULL,
  plan_asociado JSON, -- Array con los temas del "Plan familiar asociado"
  condicion_identificada TEXT, -- Campo "Condición/Situación Identificada"
  logro_salud TEXT, -- Campo "Logro en salud a establecerse"
  cuidados_salud TEXT, -- Campo "Cuidados de la salud"
  demandas_inducidas_desc TEXT, -- Campo "Demandas inducidas" del plan
  educacion_salud TEXT, -- Campo "Educación en salud"
  estado VARCHAR(20) DEFAULT 'Activo', -- 'Activo', 'Completado'
  creado_por_uid INTEGER NOT NULL,
  fecha_aceptacion DATE,
  fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (familia_id) REFERENCES Familias(familia_id),
  FOREIGN KEY (paciente_principal_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Tabla Demandas_Inducidas según especificaciones del formato físico
CREATE TABLE IF NOT EXISTS Demandas_Inducidas (
  demanda_id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero_formulario VARCHAR(100), -- El "Nº" del formulario físico
  paciente_id INTEGER NOT NULL,
  plan_id INTEGER, -- FK: Plan de cuidado que la origina (opcional)
  fecha_demanda DATE NOT NULL,
  diligenciamiento JSON, -- Almacena los checkboxes de "Funcionario que diligencia"
  remision_a JSON, -- Almacena los checkboxes de "Remisión a"
  estado VARCHAR(20) DEFAULT 'Pendiente', -- 'Pendiente', 'Asignada', 'Realizada', 'Cancelada'
  asignado_a_uid INTEGER, -- FK: Profesional al que se le asigna (si aplica)
  solicitado_por_uid INTEGER NOT NULL, -- FK: Usuario que solicita la demanda
  seguimiento JSON, -- Objeto con los datos de seguimiento
  fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (plan_id) REFERENCES Planes_Cuidado_Familiar(plan_id),
  FOREIGN KEY (asignado_a_uid) REFERENCES Usuarios(usuario_id),
  FOREIGN KEY (solicitado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Tabla Roles
CREATE TABLE IF NOT EXISTS Roles (
  rol_id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_rol VARCHAR(100) NOT NULL UNIQUE
);

-- Insertar roles básicos
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (1, 'Administrador');
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (2, 'Médico');
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (3, 'Auxiliar de Enfermería');
INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (4, 'Enfermero');

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_plan_familia ON Planes_Cuidado_Familiar(familia_id);
CREATE INDEX IF NOT EXISTS idx_plan_paciente_principal ON Planes_Cuidado_Familiar(paciente_principal_id);
CREATE INDEX IF NOT EXISTS idx_plan_estado ON Planes_Cuidado_Familiar(estado);
CREATE INDEX IF NOT EXISTS idx_demanda_paciente ON Demandas_Inducidas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_demanda_plan ON Demandas_Inducidas(plan_id);
CREATE INDEX IF NOT EXISTS idx_demanda_estado ON Demandas_Inducidas(estado);
CREATE INDEX IF NOT EXISTS idx_demanda_asignado ON Demandas_Inducidas(asignado_a_uid);
