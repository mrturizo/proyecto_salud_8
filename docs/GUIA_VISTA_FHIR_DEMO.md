# Guía de Uso: Vista de Demostración FHIR

**Fecha:** 2025-01-XX  
**Objetivo:** Documentar el uso de la vista de demostración de interoperabilidad FHIR

---

## Acceso a la Vista

1. Iniciar sesión en la aplicación como **médico** o usuario con permisos
2. En el menú lateral, buscar la opción **"Interoperabilidad FHIR"** (icono de globo)
3. Click para acceder a la vista

---

## Funcionalidades

### Pestañas de Recursos

La vista tiene 5 pestañas para diferentes tipos de recursos FHIR:

1. **Patients** - Pacientes sincronizados
2. **Encounters** - Atenciones clínicas
3. **Conditions** - Diagnósticos
4. **Observations** - Signos vitales y exámenes
5. **Compositions** - Historias clínicas completas

### Búsqueda

Cada pestaña permite buscar recursos con diferentes criterios:

#### Patients
- **Apellido** (`family`) - Buscar por apellido del paciente
- **Documento** (`identifier`) - Buscar por número de documento
- **Género** (`gender`) - Buscar por género (male, female, other, unknown)

#### Encounters
- **ID Paciente** (`subject`) - Buscar atenciones de un paciente específico (formato: `Patient/{id}`)
- **Fecha** (`date`) - Buscar por fecha de atención
- **Estado** (`status`) - Buscar por estado (finished, in-progress, cancelled)

#### Conditions
- **ID Paciente** (`subject`) - Buscar diagnósticos de un paciente
- **Código CIE10** (`code`) - Buscar por código de diagnóstico

#### Observations
- **ID Paciente** (`subject`) - Buscar observaciones de un paciente
- **Código LOINC** (`code`) - Buscar por código LOINC del tipo de observación

#### Compositions
- **ID Paciente** (`subject`) - Buscar historias clínicas de un paciente

### Visualización de Resultados

- Los resultados se muestran en una lista con resumen de cada recurso
- Click en cualquier resultado para ver los detalles completos en JSON
- El panel de detalles muestra el recurso completo formateado

---

## Ejemplos de Uso

### Ejemplo 1: Buscar un Paciente

1. Seleccionar pestaña **Patients**
2. Seleccionar campo de búsqueda: **Documento**
3. Ingresar: `12345678` (o el documento del paciente)
4. Click en botón de búsqueda
5. Ver resultados y click para ver detalles

### Ejemplo 2: Ver Encounters de un Paciente

1. Primero buscar el Patient y obtener su ID (ej: `12345678`)
2. Seleccionar pestaña **Encounters**
3. Seleccionar campo: **ID Paciente**
4. Ingresar: `Patient/12345678`
5. Click en buscar
6. Ver todas las atenciones del paciente

### Ejemplo 3: Ver Historia Clínica Completa

1. Buscar Patient y obtener ID
2. Seleccionar pestaña **Compositions**
3. Buscar por ID del paciente
4. Ver Composition que agrupa:
   - Encounter (atención)
   - Conditions (diagnósticos)
   - Observations (signos vitales)

---

## Notas Importantes

### IDs de Recursos

- Los IDs en HAPI FHIR público son compartidos con otros usuarios
- Usar IDs únicos para evitar conflictos
- El sistema sanitiza automáticamente los IDs de documentos

### Servidor FHIR

- Por defecto usa HAPI FHIR público: `https://hapi.fhir.org/baseR4`
- No requiere credenciales
- Datos pueden ser eliminados periódicamente (no es para producción)

### Errores Comunes

- **"No se encontraron resultados"**: Verificar que el recurso existe y el criterio de búsqueda es correcto
- **"Error de conexión"**: Verificar que el servidor FHIR esté accesible
- **"404 Not Found"**: El recurso no existe con ese ID

---

## Integración con Sincronización Automática

Los recursos mostrados en esta vista son los mismos que se sincronizan automáticamente cuando:

1. Se guarda una Historia Clínica → Se crean Patient, Encounter, Conditions, Observations, Composition
2. Se guarda una Receta → Se crean Patient, Medications, MedicationRequests

Por lo tanto, esta vista permite verificar que la sincronización automática funcionó correctamente.

---

## Casos de Uso para Demostración

### Caso 1: Verificar Sincronización Completa

1. Crear una historia clínica completa con signos vitales
2. Ir a vista FHIR Demo
3. Buscar el paciente por documento
4. Verificar que existen:
   - Patient
   - Encounter
   - Conditions (diagnósticos)
   - Observations (signos vitales)
   - Composition (historia completa)

### Caso 2: Explorar Recursos Relacionados

1. Buscar un Patient
2. Obtener su ID
3. Buscar Encounters de ese paciente
4. Buscar Conditions de ese paciente
5. Ver cómo están relacionados mediante referencias

### Caso 3: Validar Códigos CIE10

1. Buscar Conditions
2. Verificar que tienen códigos CIE10 en el campo `code.coding`
3. Validar que los códigos coinciden con los usados en la aplicación

---

## Limitaciones

- La búsqueda es básica (no soporta operadores avanzados)
- No permite crear/editar recursos directamente desde la vista (solo lectura)
- Los datos en HAPI público son compartidos y temporales

---

## Próximas Mejoras (Opcional)

- Agregar filtros avanzados
- Permitir crear recursos manualmente
- Exportar recursos a JSON/XML
- Visualización gráfica de relaciones entre recursos


