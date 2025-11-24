-- Script: Crear usuario auxiliar para pruebas
-- Ejecutado: $(fecha_actual)

INSERT OR IGNORE INTO Usuarios (
    nombre_completo, 
    email, 
    numero_documento, 
    rol_id, 
    equipo_id, 
    telefono,
    fecha_registro,
    activo
) 
SELECT 
    'Auxiliar de Enfermería Demo',
    'auxiliar@salud.com',
    '1000000999',
    rol_id,
    1,
    '3001234567',
    CURRENT_TIMESTAMP,
    1
FROM Roles 
WHERE nombre_rol = 'Auxiliar de enfermería';

-- Verificación
SELECT '✅ Usuario auxiliar creado: auxiliar@salud.com / 1000000999' as resultado;