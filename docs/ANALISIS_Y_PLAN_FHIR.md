# Análisis y Plan de Implementación HL7 FHIR

**Fecha:** 2025-01-XX  
**Estado:** Implementación Parcial - Requiere Completar Operaciones CRUD

---

## 📊 Análisis del Estado Actual

### ✅ Lo que YA está implementado

#### 1. **Infraestructura Base**
- ✅ Servidor FHIR (HAPI FHIR) configurado en Docker (`sandbox/hapi-fhir/`)
- ✅ Terminology Service (Ontoserver) configurado (`sandbox/terminology/`)
- ✅ Catálogos CIE10 y medicamentos cargados desde CSV
- ✅ Cliente FHIR backend (`backend/services/fhirClient.js`)
- ✅ Gateway FHIR REST (`backend/server.js` - endpoints `/api/fhir/*`)

#### 2. **Operaciones CREATE (POST)**
- ✅ `POST /api/fhir/patient` - Crear/actualizar Patient
- ✅ `POST /api/fhir/condition` - Crear Condition
- ✅ `POST /api/fhir/medication` - Crear Medication
- ✅ `POST /api/fhir/medication-request` - Crear MedicationRequest

#### 3. **Integración Frontend**
- ✅ Mapeadores FHIR (`src/utils/fhirMappers.ts`)
  - `buildPatientResource`
  - `buildConditionResources`
  - `buildMedicationResources`
  - `buildMedicationRequestResources`
- ✅ Servicio FHIR frontend (`src/services/fhirService.ts`)
- ✅ Sincronización automática desde formularios:
  - Historia Clínica → Patient + Condition
  - Recetario → Patient + Medication + MedicationRequest

#### 4. **Terminology Service**
- ✅ Búsqueda CIE10 (`GET /api/terminology/cie10`)
- ✅ Búsqueda medicamentos (`GET /api/terminology/medications`)
- ✅ Validación de códigos (`POST /api/terminology/validate`)

#### 5. **Documentación**
- ✅ Documento de interoperabilidad (`docs/INTEROPERABILIDAD_FHIR.md`)
- ✅ Colección Postman básica (`docs/tests/terminology_fhir.postman_collection.json`)

---

### ❌ Lo que FALTA implementar

#### 1. **Operaciones CRUD Completas**

**READ (GET):**
- ❌ `GET /api/fhir/patient/:id` - Leer Patient específico
- ❌ `GET /api/fhir/condition/:id` - Leer Condition específico
- ❌ `GET /api/fhir/medication/:id` - Leer Medication específico
- ❌ `GET /api/fhir/medication-request/:id` - Leer MedicationRequest específico

**UPDATE (PUT):**
- ❌ `PUT /api/fhir/patient/:id` - Actualizar Patient
- ❌ `PUT /api/fhir/condition/:id` - Actualizar Condition
- ❌ `PUT /api/fhir/medication/:id` - Actualizar Medication
- ❌ `PUT /api/fhir/medication-request/:id` - Actualizar MedicationRequest

**DELETE:**
- ❌ `DELETE /api/fhir/patient/:id` - Eliminar Patient
- ❌ `DELETE /api/fhir/condition/:id` - Eliminar Condition
- ❌ `DELETE /api/fhir/medication/:id` - Eliminar Medication
- ❌ `DELETE /api/fhir/medication-request/:id` - Eliminar MedicationRequest

**SEARCH (GET con query params):**
- ❌ `GET /api/fhir/patient?family=...&gender=...` - Buscar Patients
- ❌ `GET /api/fhir/condition?subject=Patient/...` - Buscar Conditions
- ❌ `GET /api/fhir/medication?code=...` - Buscar Medications
- ❌ `GET /api/fhir/medication-request?subject=Patient/...` - Buscar MedicationRequests

#### 2. **Operaciones FHIR Estándar**

**CapabilityStatement:**
- ❌ `GET /api/fhir/metadata` - Obtener CapabilityStatement del servidor

**Bundle Operations:**
- ❌ Operaciones de batch/transaction
- ❌ Exportar historias clínicas como Bundle

#### 3. **Recursos FHIR Adicionales**
- ❌ `Encounter` - Representar atenciones clínicas
- ❌ `Observation` - Signos vitales, resultados de laboratorio
- ❌ `Practitioner` - Profesionales de salud
- ❌ `Composition` - Historias clínicas estructuradas
- ❌ `Bundle` - Empaquetar múltiples recursos

#### 4. **Mejoras de Postman**
- ❌ Colección completa con todas las operaciones CRUD
- ❌ Variables de entorno para HAPI FHIR público
- ❌ Tests automatizados
- ❌ Ejemplos de todos los recursos

---

## 🎯 Plan de Implementación

### Fase 1: Completar Operaciones CRUD Básicas (Prioridad ALTA)

**Objetivo:** Implementar READ, UPDATE, DELETE y SEARCH para los recursos existentes.

#### 1.1 Extender `fhirClient.js`

Agregar funciones:
```javascript
// READ
async function readResource(resourceType, resourceId)
async function readPatient(patientId)
async function readCondition(conditionId)
async function readMedication(medicationId)
async function readMedicationRequest(medicationRequestId)

// UPDATE
async function updateResource(resourceType, resourceId, resource)
async function updatePatient(patientId, patientResource)
async function updateCondition(conditionId, conditionResource)
async function updateMedication(medicationId, medicationResource)
async function updateMedicationRequest(medicationRequestId, medicationRequestResource)

// DELETE
async function deleteResource(resourceType, resourceId)
async function deletePatient(patientId)
async function deleteCondition(conditionId)
async function deleteMedication(medicationId)
async function deleteMedicationRequest(medicationRequestId)

// SEARCH
async function searchResources(resourceType, queryParams)
async function searchPatients(queryParams)
async function searchConditions(queryParams)
async function searchMedications(queryParams)
async function searchMedicationRequests(queryParams)
```

#### 1.2 Agregar Endpoints en `server.js`

```javascript
// READ
app.get('/api/fhir/patient/:id', ...)
app.get('/api/fhir/condition/:id', ...)
app.get('/api/fhir/medication/:id', ...)
app.get('/api/fhir/medication-request/:id', ...)

// UPDATE
app.put('/api/fhir/patient/:id', ...)
app.put('/api/fhir/condition/:id', ...)
app.put('/api/fhir/medication/:id', ...)
app.put('/api/fhir/medication-request/:id', ...)

// DELETE
app.delete('/api/fhir/patient/:id', ...)
app.delete('/api/fhir/condition/:id', ...)
app.delete('/api/fhir/medication/:id', ...)
app.delete('/api/fhir/medication-request/:id', ...)

// SEARCH
app.get('/api/fhir/patient', ...) // con query params
app.get('/api/fhir/condition', ...)
app.get('/api/fhir/medication', ...)
app.get('/api/fhir/medication-request', ...)

// CapabilityStatement
app.get('/api/fhir/metadata', ...)
```

#### 1.3 Actualizar Frontend Service

Agregar métodos en `src/services/fhirService.ts`:
```typescript
// READ
export async function getPatient(id: string)
export async function getCondition(id: string)
export async function getMedication(id: string)
export async function getMedicationRequest(id: string)

// UPDATE
export async function updatePatient(id: string, resource: any)
export async function updateCondition(id: string, resource: any)
export async function updateMedication(id: string, resource: any)
export async function updateMedicationRequest(id: string, resource: any)

// DELETE
export async function deletePatient(id: string)
export async function deleteCondition(id: string)
export async function deleteMedication(id: string)
export async function deleteMedicationRequest(id: string)

// SEARCH
export async function searchPatients(params: Record<string, string>)
export async function searchConditions(params: Record<string, string>)
export async function searchMedications(params: Record<string, string>)
export async function searchMedicationRequests(params: Record<string, string>)
```

---

### Fase 2: Colección Postman Completa (Para Práctica 03)

**Objetivo:** Crear colección Postman que demuestre todas las operaciones CRUD según la guía práctica.

#### 2.1 Estructura de la Colección

```
FHIR - Operaciones Básicas
├── 01 - Get CapabilityStatement
├── 02 - Create Patient (POST)
├── 03 - Read Patient (GET)
├── 04 - Update Patient (PUT)
├── 05 - Search Patient by Family Name
├── 06 - Search Patient by Gender
├── 07 - Search Patient Combined
├── 08 - Search Patient by Identifier
├── 09 - Delete Patient (DELETE)
├── 10 - Create Condition
├── 11 - Read Condition
├── 12 - Update Condition
├── 13 - Search Conditions
├── 14 - Delete Condition
├── 15 - Create Medication
├── 16 - Create MedicationRequest
├── 17 - Search MedicationRequests
└── 18 - Create Observation (Opcional)
```

#### 2.2 Variables de Entorno

Crear `docs/postman/HAPI-FHIR-Test-Server.postman_environment.json`:
```json
{
  "name": "HAPI FHIR Test Server",
  "values": [
    {
      "key": "base_url",
      "value": "https://hapi.fhir.org/baseR4",
      "type": "default"
    },
    {
      "key": "local_base_url",
      "value": "http://localhost:8080/hapi-fhir-jpaserver/fhir",
      "type": "default"
    },
    {
      "key": "api_base",
      "value": "http://localhost:3001/api",
      "type": "default"
    },
    {
      "key": "patient_id",
      "value": "",
      "type": "default"
    },
    {
      "key": "condition_id",
      "value": "",
      "type": "default"
    },
    {
      "key": "practitioner_id",
      "value": "",
      "type": "default"
    }
  ]
}
```

#### 2.3 Tests Automatizados

Agregar tests en cada request:
- Verificar status code
- Guardar IDs en variables
- Validar estructura JSON
- Verificar campos requeridos

---

### Fase 3: Implementación Parcial en Subsistema (Para Demostración)

**Objetivo:** Implementar FHIR completamente en un subsistema pequeño para demostración.

#### 3.1 Subsistema Seleccionado: **Gestión de Pacientes**

**Justificación:**
- Es un módulo pequeño y bien definido
- Tiene flujos claros (crear, leer, actualizar, buscar)
- Es fundamental para otros módulos
- Permite demostrar todas las operaciones CRUD

#### 3.2 Implementación

**Backend:**
1. ✅ Ya existe `POST /api/fhir/patient` (CREATE)
2. ➕ Agregar `GET /api/fhir/patient/:id` (READ)
3. ➕ Agregar `PUT /api/fhir/patient/:id` (UPDATE)
4. ➕ Agregar `DELETE /api/fhir/patient/:id` (DELETE)
5. ➕ Agregar `GET /api/fhir/patient?family=...&identifier=...` (SEARCH)

**Frontend:**
1. Crear vista `PatientFHIRView` que permita:
   - Buscar pacientes por nombre, documento, etc.
   - Ver detalles de un paciente desde FHIR
   - Editar paciente y sincronizar con FHIR
   - Ver historial de versiones (si HAPI FHIR lo soporta)
   - Comparar datos locales vs FHIR

**Características de la Demo:**
- Búsqueda en tiempo real
- Sincronización bidireccional
- Indicadores de estado de sincronización
- Manejo de errores y conflictos
- Logs de operaciones FHIR

---

### Fase 4: Recursos FHIR Adicionales (Futuro)

#### 4.1 Encounter
- Mapear atenciones clínicas a `Encounter`
- Vincular con `Patient`, `Practitioner`, `Condition`

#### 4.2 Observation
- Signos vitales
- Resultados de laboratorio
- Escalas de evaluación

#### 4.3 Practitioner
- Profesionales de salud
- Roles y especialidades

#### 4.4 Composition
- Historias clínicas estructuradas
- Empaquetar múltiples recursos

---

## 📋 Checklist de Implementación

### Para Práctica 03 (Postman)

- [ ] Crear colección Postman completa con todas las operaciones
- [ ] Configurar variables de entorno (HAPI FHIR público y local)
- [ ] Probar todas las operaciones CRUD con HAPI FHIR público
- [ ] Documentar cada request con descripción y ejemplos
- [ ] Agregar tests automatizados
- [ ] Crear guía paso a paso para usar la colección

### Para Implementación Parcial (Subsistema)

- [ ] Implementar READ, UPDATE, DELETE, SEARCH en backend
- [ ] Actualizar `fhirClient.js` con nuevas funciones
- [ ] Agregar endpoints en `server.js`
- [ ] Actualizar `fhirService.ts` en frontend
- [ ] Crear vista `PatientFHIRView`
- [ ] Agregar indicadores de sincronización
- [ ] Probar flujo completo
- [ ] Documentar la implementación

### Para Plan Conceptual (Proyecto Total)

- [ ] Seleccionar aplicación SMART on FHIR de referencia
- [ ] Analizar arquitectura de la aplicación seleccionada
- [ ] Crear diagrama de arquitectura FHIR completa
- [ ] Definir recursos FHIR para cada módulo
- [ ] Planificar integración con Red Nacional de Datos
- [ ] Documentar estrategia de migración
- [ ] Crear roadmap de implementación por fases

---

## 🚀 Próximos Pasos Inmediatos

1. **Implementar operaciones CRUD faltantes** (Fase 1)
2. **Crear colección Postman completa** (Fase 2)
3. **Implementar subsistema de demostración** (Fase 3)
4. **Preparar documentación y guías** (Para entrega)

---

## 📚 Recursos de Referencia

- [HAPI FHIR Test Server](https://hapi.fhir.org/)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [SMART on FHIR Apps Directory](https://apps.smarthealthit.org/apps/featured)
- [FHIR Validator](https://validator.fhir.org/)

---

**Nota:** Este documento debe actualizarse conforme se avance en la implementación.

