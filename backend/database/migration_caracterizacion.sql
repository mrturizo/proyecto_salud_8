-- Migración para agregar campos de caracterización a la tabla Familias
-- Fecha: 2025-01-16
-- Descripción: Agregar campos híbridos (columnas directas + JSON) para caracterización familiar

-- Agregar columnas directas para búsquedas y filtros
ALTER TABLE Familias ADD COLUMN numero_ficha VARCHAR(100);
ALTER TABLE Familias ADD COLUMN zona VARCHAR(50);
ALTER TABLE Familias ADD COLUMN territorio VARCHAR(150);
ALTER TABLE Familias ADD COLUMN estrato INT;
ALTER TABLE Familias ADD COLUMN tipo_familia VARCHAR(100);
ALTER TABLE Familias ADD COLUMN riesgo_familiar VARCHAR(100);
ALTER TABLE Familias ADD COLUMN fecha_caracterizacion DATE;

-- Agregar campos JSON para datos complejos
ALTER TABLE Familias ADD COLUMN info_vivienda JSON;
ALTER TABLE Familias ADD COLUMN situaciones_proteccion JSON;
ALTER TABLE Familias ADD COLUMN condiciones_salud_publica JSON;
ALTER TABLE Familias ADD COLUMN practicas_cuidado JSON;

-- Crear tabla para caracterización individual de pacientes
CREATE TABLE Caracterizacion_Paciente (
  caracterizacion_paciente_id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente_id INTEGER NOT NULL,
  fecha_caracterizacion DATE,
  rol_familiar VARCHAR(50), -- Jefe, Cónyuge, Hijo, Hermano, Padre, Otro
  ocupacion VARCHAR(150),
  nivel_educativo VARCHAR(100),
  grupo_poblacional VARCHAR(100), -- NNA, Gestante, Adulto Mayor
  regimen_afiliacion VARCHAR(100), -- Subsidiado, Contributivo, Especial, Excepción, No afiliado, EAPB
  pertenencia_etnica VARCHAR(100), -- Indígena, Rom, Raizal, Palenquero, Negro Afro, Otro, Ninguna
  discapacidad JSON, -- Array de tipos de discapacidad
  victima_violencia BOOLEAN,
  datos_pyp JSON, -- Datos de Prevención y Promoción (vacunación, lactancia, etc.)
  datos_salud JSON, -- Medidas antropométricas, diagnósticos, enfermedades, etc.
  creado_por_uid INTEGER,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);

-- Crear índices para mejorar rendimiento (después de crear las columnas y tabla)
CREATE INDEX IF NOT EXISTS idx_caracterizacion_paciente_id ON Caracterizacion_Paciente(paciente_id);
CREATE INDEX IF NOT EXISTS idx_caracterizacion_fecha ON Caracterizacion_Paciente(fecha_caracterizacion);
CREATE INDEX IF NOT EXISTS idx_familias_zona ON Familias(zona);
CREATE INDEX IF NOT EXISTS idx_familias_territorio ON Familias(territorio);
CREATE INDEX IF NOT EXISTS idx_familias_tipo_familia ON Familias(tipo_familia);
CREATE INDEX IF NOT EXISTS idx_familias_riesgo ON Familias(riesgo_familiar);
