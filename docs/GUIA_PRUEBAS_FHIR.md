# Guía de Pruebas y Demostración FHIR

**Fecha:** 2025-01-XX  
**Objetivo:** Documentar las pruebas y demostraciones que validan la implementación completa de HL7 FHIR

---

## 📋 Resumen de Implementación

### ✅ Operaciones Implementadas

**Backend:**
- ✅ CREATE: `POST /api/fhir/patient`, `condition`, `medication`, `medication-request`
- ✅ READ: `GET /api/fhir/patient/:id`, `condition/:id`, `medication/:id`, `medication-request/:id`
- ✅ UPDATE: `PUT /api/fhir/patient/:id`, `condition/:id`, `medication/:id`, `medication-request/:id`
- ✅ DELETE: `DELETE /api/fhir/patient/:id`, `condition/:id`, `medication/:id`, `medication-request/:id`
- ✅ SEARCH: `GET /api/fhir/patient`, `condition`, `medication`, `medication-request` (con query params)
- ✅ METADATA: `GET /api/fhir/metadata`

**Frontend:**
- ✅ Servicio completo `fhirService.ts` con todas las operaciones
- ✅ Sincronización automática en formularios (Historia Clínica y Recetario)
- ✅ Mapeadores FHIR (`fhirMappers.ts`)

**Postman:**
- ✅ Colección completa con 20 requests
- ✅ Variables de entorno configuradas
- ✅ Tests automatizados

---

## 🧪 Pruebas con Postman

### Prerequisitos

1. **Servidor Backend corriendo:**
   ```powershell
   cd backend
   npm start
   ```
   El servidor debe estar en `http://localhost:3001`

2. **Servidor FHIR - OPCIONES:**

   **Opción A: Usar HAPI FHIR Público (Recomendado - No requiere Docker)**
   - URL: `https://hapi.fhir.org/baseR4`
   - Ventaja: No requiere instalación, siempre disponible
   - Desventaja: Datos compartidos con otros usuarios
   - **Configuración:** En Postman, usar variable `base_url = https://hapi.fhir.org/baseR4`

   **Opción B: HAPI FHIR Local con Docker (Opcional)**
   ```powershell
   cd sandbox/hapi-fhir
   docker compose up -d
   ```
   - Requiere Docker Desktop instalado
   - URL: `http://localhost:8080/hapi-fhir-jpaserver/fhir`
   - Ventaja: Datos privados, control total
   - **Nota:** Si Docker no está instalado, usar Opción A

   **Opción C: Solo Backend Gateway (Para pruebas de integración)**
   - Usar `{{api_base}}/fhir/*` en lugar de `{{base_url}}/*`
   - El backend actúa como gateway hacia el servidor FHIR
   - Requiere que `FHIR_BASE_URL` en `.env` apunte a un servidor FHIR

3. **Importar en Postman:**
   - Colección: `docs/postman/FHIR-Operaciones-Completas.postman_collection.json`
   - Entorno: `docs/postman/HAPI-FHIR-Test-Server.postman_environment.json`
   - **Configurar variables:**
     - `base_url`: `https://hapi.fhir.org/baseR4` (HAPI público) O `http://localhost:8080/hapi-fhir-jpaserver/fhir` (local)
     - `api_base`: `http://localhost:3001/api` (tu backend)

### Secuencia de Pruebas Recomendada

**IMPORTANTE:** Puedes usar el servidor HAPI FHIR público (`https://hapi.fhir.org/baseR4`) sin necesidad de Docker. Solo configura la variable `base_url` en Postman.

#### 1. Verificar CapabilityStatement
- **Request:** `01 - Get CapabilityStatement`
- **URL Opción 1 (Directo a HAPI):** `{{base_url}}/metadata` 
  - Usar `base_url = https://hapi.fhir.org/baseR4`
- **URL Opción 2 (A través del gateway):** `{{api_base}}/fhir/metadata`
  - Usar `api_base = http://localhost:3001/api`
- **Verificar:** Status 200, respuesta JSON con `resourceType: "CapabilityStatement"`

#### 2. Crear un Patient
- **Request:** `02 - Create Patient (POST)`
- **Verificar:** Status 201, ID guardado en variable `patient_id`
- **Nota:** El test automático guarda el ID

#### 3. Leer el Patient creado
- **Request:** `03 - Read Patient (GET)`
- **Verificar:** Status 200, datos coinciden con los enviados

#### 4. Actualizar el Patient
- **Request:** `04 - Update Patient (PUT)`
- **Modificar:** Agregar segundo teléfono o cambiar email
- **Verificar:** Status 200, `versionId` aumentó

#### 5. Buscar Patients
- **Request:** `05 - Search Patient by Family Name`
- **Request:** `06 - Search Patient by Gender`
- **Request:** `07 - Search Patient Combined`
- **Request:** `08 - Search Patient by Identifier`
- **Verificar:** Status 200, respuesta es Bundle con resultados

#### 6. Crear Condition (Diagnóstico)
- **Request:** `10 - Create Condition`
- **Verificar:** Status 201, ID guardado en `condition_id`

#### 7. Leer y Actualizar Condition
- **Request:** `11 - Read Condition`
- **Request:** `12 - Update Condition`
- **Verificar:** Operaciones exitosas

#### 8. Crear Medication y MedicationRequest
- **Request:** `15 - Create Medication`
- **Request:** `17 - Create MedicationRequest`
- **Verificar:** Status 201, IDs guardados

#### 9. Buscar MedicationRequests
- **Request:** `19 - Search MedicationRequests`
- **Verificar:** Bundle con resultados filtrados

#### 10. Eliminar Recursos (Opcional)
- **Request:** `09 - Delete Patient`
- **Request:** `14 - Delete Condition`
- **Request:** `20 - Delete MedicationRequest`
- **Verificar:** Status 200 o 204
- **Nota:** Después de eliminar, intentar leer debe dar 404

---

## 🖥️ Pruebas en la Aplicación Web

### Prueba 1: Sincronización Automática en Historia Clínica

**Pasos:**
1. Iniciar sesión como médico
2. Ir a "Consultas Asignadas"
3. Seleccionar un paciente
4. Completar formulario de Historia Clínica:
   - Motivo de consulta
   - Diagnóstico principal (usar autocompletado CIE10)
   - Diagnósticos relacionados (opcional)
5. Guardar

**Verificar:**
- Badge de estado FHIR muestra "Sincronizando" → "FHIR actualizado"
- En consola del navegador: no hay errores
- En servidor FHIR (si está corriendo): verificar que se creó:
  - 1 recurso `Patient`
  - N recursos `Condition` (uno por diagnóstico)

**Cómo verificar en HAPI FHIR:**
```
http://localhost:8080/
→ Buscar "Patient" por documento
→ Verificar que existe
→ Verificar Conditions asociados
```

### Prueba 2: Sincronización Automática en Recetario

**Pasos:**
1. Con el mismo paciente de la Prueba 1
2. Ir a pestaña "Receta"
3. Completar formulario:
   - Diagnóstico principal
   - Agregar medicamentos (usar autocompletado)
   - Especificar dosis y frecuencia
4. Guardar

**Verificar:**
- Badge de estado FHIR muestra "FHIR actualizado"
- En servidor FHIR: verificar que se creó:
  - 1 recurso `Patient` (actualizado si ya existía)
  - N recursos `Medication` (uno por medicamento único)
  - N recursos `MedicationRequest` (uno por medicamento en la receta)

### Prueba 3: Búsqueda de Pacientes desde FHIR (Futuro)

**Nota:** Esta funcionalidad requiere la vista de demostración que se puede implementar.

**Pasos:**
1. Ir a vista "FHIR Demo" (si está implementada)
2. Usar búsqueda por:
   - Nombre (family)
   - Documento (identifier)
   - Género
3. Ver resultados en tiempo real

**Verificar:**
- Resultados se muestran correctamente
- Datos coinciden con búsqueda
- Puede seleccionar y ver detalles

---

## 🔍 Verificación en Servidor FHIR

### Usando HAPI FHIR UI

**Opción A: HAPI FHIR Público (Sin Docker)**
1. **Acceder a la interfaz web:**
   ```
   https://hapi.fhir.org/
   ```
2. **Buscar recursos:**
   - Seleccionar tipo de recurso (Patient, Condition, etc.)
   - Usar filtros de búsqueda
   - Ver detalles de cada recurso
3. **Nota:** Los datos son compartidos con otros usuarios, usa IDs únicos

**Opción B: HAPI FHIR Local (Requiere Docker)**
1. **Acceder a la interfaz:**
   ```
   http://localhost:8080/
   ```
2. **Solo disponible si Docker está instalado y corriendo**

### Usando API Directa

**Ejemplo: Buscar todos los Patients (HAPI Público):**
```powershell
curl https://hapi.fhir.org/baseR4/Patient
```

**Ejemplo: Buscar Conditions de un Patient:**
```powershell
curl "https://hapi.fhir.org/baseR4/Condition?subject=Patient/12345678"
```

**Ejemplo: A través del Gateway (Backend):**
```powershell
curl http://localhost:3001/api/fhir/patient?family=García
```

---

## 📊 Checklist de Validación

### Funcionalidad Backend
- [ ] Todos los endpoints CREATE responden 201
- [ ] Todos los endpoints READ responden 200
- [ ] Todos los endpoints UPDATE responden 200
- [ ] Todos los endpoints DELETE responden 200/204
- [ ] Endpoints SEARCH retornan Bundle válido
- [ ] Endpoint METADATA retorna CapabilityStatement
- [ ] Manejo de errores (404, 400, 500) funciona correctamente

### Funcionalidad Frontend
- [ ] Sincronización automática funciona en Historia Clínica
- [ ] Sincronización automática funciona en Recetario
- [ ] Badges de estado muestran correctamente el estado
- [ ] Errores se manejan sin romper la UI
- [ ] Servicio `fhirService.ts` tiene todas las funciones exportadas

### Integración
- [ ] Datos locales se mapean correctamente a FHIR
- [ ] Códigos CIE10 se incluyen en Conditions
- [ ] Códigos INVIMA/ATC se incluyen en Medications
- [ ] Referencias entre recursos son correctas
- [ ] IDs se generan y sanitizan correctamente

### Postman
- [ ] Todas las requests funcionan
- [ ] Tests automatizados pasan
- [ ] Variables se guardan correctamente
- [ ] Documentación es clara

---

## 🎯 Escenarios de Demostración

### Escenario 1: Flujo Completo de Atención

**Objetivo:** Demostrar sincronización completa desde creación hasta receta.

1. **Crear Historia Clínica:**
   - Paciente: Juan Pérez, CC 12345678
   - Diagnóstico: I10 (Hipertensión)
   - Guardar → Verificar sincronización FHIR

2. **Crear Receta:**
   - Mismo paciente
   - Medicamento: Enalapril 20mg
   - Guardar → Verificar sincronización FHIR

3. **Verificar en HAPI FHIR:**
   - Patient existe con datos correctos
   - Condition existe con código I10
   - Medication existe con código INVIMA
   - MedicationRequest existe vinculado a Patient y Condition

### Escenario 2: Operaciones CRUD Manuales

**Objetivo:** Demostrar todas las operaciones usando Postman.

1. **CREATE:** Crear Patient, Condition, Medication, MedicationRequest
2. **READ:** Leer cada recurso creado
3. **UPDATE:** Modificar cada recurso
4. **SEARCH:** Buscar con diferentes parámetros
5. **DELETE:** Eliminar recursos (opcional)

### Escenario 3: Búsqueda y Filtrado

**Objetivo:** Demostrar capacidades de búsqueda.

1. Crear múltiples Patients con diferentes características
2. Buscar por:
   - Apellido
   - Género
   - Fecha de nacimiento
   - Identificador
3. Combinar múltiples filtros
4. Verificar resultados precisos

---

## 🐛 Solución de Problemas

### Error: "FHIR gateway error: 500"

**Causa:** Servidor FHIR no está corriendo o URL incorrecta.

**Solución:**
1. **Si usas HAPI FHIR público:** Verificar que `base_url = https://hapi.fhir.org/baseR4` en Postman
2. **Si usas HAPI FHIR local:** 
   - Verificar que Docker está corriendo: `docker compose ps` (en `sandbox/hapi-fhir`)
   - Si Docker no está instalado, usar HAPI público en su lugar
3. Verificar variable `FHIR_BASE_URL` en `.env` del backend
4. Verificar logs del servidor backend para más detalles

### Error: "Patient no encontrado" (404)

**Causa:** ID incorrecto o recurso no existe.

**Solución:**
1. Verificar que el Patient fue creado primero
2. Verificar que el ID es correcto
3. Usar SEARCH para encontrar el ID correcto

### Sincronización no funciona

**Causa:** Error en mapeo o servidor FHIR inaccesible.

**Solución:**
1. Revisar consola del navegador para errores
2. Verificar logs del servidor backend
3. Verificar que `fhirService.ts` está importado correctamente
4. Verificar que `buildPatientResource` retorna datos válidos

### Tests de Postman fallan

**Causa:** Variables de entorno no configuradas o servidor no responde.

**Solución:**
1. Verificar que el entorno está seleccionado en Postman
2. Verificar que `base_url` o `api_base` están configurados
3. Verificar que el servidor está corriendo
4. Ejecutar requests manualmente para ver errores específicos

---

## 📝 Notas Adicionales

### Variables de Entorno Importantes

```env
# Backend
FHIR_BASE_URL=http://localhost:8080/hapi-fhir-jpaserver/fhir
FHIR_USERNAME= (opcional)
FHIR_PASSWORD= (opcional)

# Frontend (hardcoded por ahora)
API_URL=http://localhost:3001/api
```

### URLs de Referencia

- **HAPI FHIR UI:** http://localhost:8080/
- **HAPI FHIR API:** http://localhost:8080/hapi-fhir-jpaserver/fhir
- **Backend API:** http://localhost:3001/api
- **HAPI FHIR Público:** https://hapi.fhir.org/baseR4

### Recursos Útiles

- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [HAPI FHIR Documentation](https://hapifhir.io/)
- [FHIR Validator](https://validator.fhir.org/)

---

## ✅ Conclusión

Con estas pruebas se valida que:

1. ✅ Todas las operaciones CRUD están implementadas
2. ✅ La sincronización automática funciona
3. ✅ Los datos se mapean correctamente a FHIR
4. ✅ La integración es robusta y maneja errores
5. ✅ La colección Postman es funcional y completa

**Estado:** Implementación completa y lista para demostración.

