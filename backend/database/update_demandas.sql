-- Actualizar tabla Demandas_Inducidas para agregar columnas faltantes
ALTER TABLE Demandas_Inducidas ADD COLUMN paciente_id INTEGER;
ALTER TABLE Demandas_Inducidas ADD COLUMN fecha_asignacion DATE;
ALTER TABLE Demandas_Inducidas ADD COLUMN fecha_completado DATE;
ALTER TABLE Demandas_Inducidas ADD COLUMN profesional_asignado INTEGER;
ALTER TABLE Demandas_Inducidas ADD COLUMN observaciones TEXT;
ALTER TABLE Demandas_Inducidas ADD COLUMN creado_por_uid INTEGER;
ALTER TABLE Demandas_Inducidas ADD COLUMN fecha_creacion_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Agregar foreign keys
-- (SQLite no permite agregar foreign keys después de crear la tabla, pero las referencias funcionarán)

-- Crear índices faltantes
CREATE INDEX IF NOT EXISTS idx_demanda_paciente ON Demandas_Inducidas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_demanda_profesional ON Demandas_Inducidas(profesional_asignado);
