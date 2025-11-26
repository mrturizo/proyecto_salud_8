# Configuración de Base de Datos Persistente en Render

## Problema Actual

En Render, el servidor está usando `/tmp/salud_digital_aps.db` que es un directorio temporal. Esto significa que:
- ✅ Los datos se guardan correctamente durante la sesión
- ❌ Los datos se pierden en cada nuevo despliegue (cada commit)
- ❌ No hay persistencia entre reinicios

## Soluciones

### Opción 1: Usar Variable de Entorno DB_PATH (Recomendado)

1. En Render Dashboard, ve a tu servicio
2. Ve a "Environment" (Variables de entorno)
3. Agrega una nueva variable:
   - **Key:** `DB_PATH`
   - **Value:** `/opt/render/persistent/salud_digital_aps.db`

4. El código ahora detectará esta variable y usará esa ruta persistente

**Nota:** Esta ruta puede requerir permisos especiales. Si no funciona, prueba con:
- `/opt/render/project/src/backend/database/salud_digital_aps.db` (dentro del proyecto)

### Opción 2: Usar PostgreSQL (Mejor para Producción)

Render ofrece PostgreSQL como servicio gestionado:

1. Crea un nuevo servicio PostgreSQL en Render
2. Obtén la connection string
3. Modifica `backend/server.js` para usar PostgreSQL en lugar de SQLite
4. Los datos estarán completamente persistentes

### Opción 3: Volumen Persistente (Solo planes de pago)

Si tienes un plan de pago en Render, puedes montar un volumen persistente.

## Verificación

Después de configurar `DB_PATH`, verifica en los logs de Render que aparezca:
```
✅ Usando base de datos persistente: /opt/render/persistent/salud_digital_aps.db
```

En lugar de:
```
⚠️  Usando base de datos temporal en /tmp
```

## Script de Asignación de Familias

El script `backend/database/assign_familia_to_patients.js` ahora usa la misma lógica que el servidor, por lo que funcionará con la configuración de `DB_PATH`.

Para ejecutarlo localmente:
```bash
cd backend
node database/assign_familia_to_patients.js
```

Para ejecutarlo en Render (si tienes acceso SSH):
```bash
# Desde el directorio del proyecto en Render
cd backend
DB_PATH=/opt/render/persistent/salud_digital_aps.db node database/assign_familia_to_patients.js
```

