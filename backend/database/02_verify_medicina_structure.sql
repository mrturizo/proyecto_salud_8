-- Script: Verificar estructura de HC_Medicina_General
-- Estado: Columnas ya existen (no se requieren cambios)

SELECT 
    '✅ Estructura correcta - Columnas existentes:' as mensaje,
    name as columna,
    type as tipo
FROM pragma_table_info('HC_Medicina_General') 
WHERE name IN (
    'antecedentes_familiares', 
    'revision_por_sistemas', 
    'signos_vitales'
);