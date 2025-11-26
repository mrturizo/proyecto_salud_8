# Interoperabilidad HL7 FHIR – Resolución 1888 de 2025

**Fecha de elaboración:** 9 de noviembre de 2025  
**Responsable:** Equipo APS Digital  
**Alcance del sprint:** Iteración 1 – análisis normativo, arquitectura objetivo y sandbox inicial.

---

## 1. Matriz de cumplimiento normativo iniciativa HL7 FHIR

| Categoría | Referencia (Res. 1888/2025) | Requisito normativo | Estado actual plataforma | Brecha y acciones requeridas |
|-----------|-----------------------------|---------------------|---------------------------|------------------------------|
| Identificación de usuarios y autenticación | Art. 11, 12 | Autenticación federada con mecanismos reconocidos por MinSalud/MINTIC (OAuth2/OIDC, firma digital) | Autenticación interna con contraseñas simples en SQLite | Migrar a Identity Provider compatible (Keycloak/IDaaS), implementar OAuth2/OIDC, cifrado de contraseñas y MFA según perfil clínico |
| Seguridad y protección de datos | Art. 14, 16 | Cifrado en tránsito (TLS 1.2+), cifrado en reposo, gestión de consentimientos, auditorías | TLS disponible solo en despliegues manuales, BD sin cifrado | Forzar HTTPS, habilitar HSTS, migrar BD a motor con cifrado/column-level encryption, diseñar módulo de consentimientos y auditoría |
| Interoperabilidad técnica | Art. 18, 19 | Uso obligatorio de HL7 FHIR R4, perfiles colombianos y terminologías oficiales | API REST propietaria, sin recursos FHIR estandarizados | Implementar gateway/servidor FHIR, mapear datos a recursos R4, validar contra perfiles nacionales |
| Interoperabilidad semántica | Art. 20 | Diagnósticos en CIE10, procedimientos CUPS, medicamentos con códigos INVIMA/ATC, EPS/IPS registradas | Catálogos parciales (CIE10, medicamentos sin codificación estandar) | Integrar Terminology Service oficial, sincronizar catálogos y normalizar persistencia |
| Gestión documental | Art. 22 | Intercambio de historias clínicas en FHIR (`Composition`, `Bundle`) con metadatos mínimos (autor, fecha, paciente) | Documentos almacenados como JSON propietarios | Modelar historias como `Composition`, empaquetar en `Bundle`, exponer/ingresar vía API FHIR |
| Eventos clínicos | Art. 23 | Registro de atenciones en `Encounter`, resultados diagnósticos en `Observation`, recetas en `MedicationRequest` | Atenciones/recetas en tablas propias sin mapeo FHIR | Diseñar mapeo a recursos FHIR y actualizar flujos backend/frontend |
| Auditoría y trazabilidad | Art. 24 | Registro de acceso/modificación, eventos de interoperabilidad (`AuditEvent`) | Logs en consola sin correlación | Implementar `AuditEvent`, almacenar logs firmados con retención mínima de 5 años |
| Consentimiento informado | Art. 25 | Gestión de consentimientos para intercambio de datos (`Consent`) | No existe gestión formal | Crear módulo digital de consentimientos y reflejar en recurso `Consent` |
| Conectividad con Red Nacional de Datos en Salud | Art. 26 | Integración con repositorios y pasarelas oficiales, cumplimiento de políticas de seguridad | No existe conexión con servicios externos | Diseñar gateway que consuma APIs oficiales, validar certificaciones y sandbox ministerial |
| Gobierno de datos | Art. 30 | Comité de interoperabilidad, políticas de calidad y ciclo de vida de datos | Políticas informales, sin comité formal | Constituir comité, documentar políticas y plan de continuidad operativa |

> **Nota:** Se tomó como referencia el borrador oficial de la Resolución 1888 de 2025 (MinSalud) y los lineamientos HL7 FHIR Colombia publicados en septiembre 2025. Los artículos exactos pueden variar en la versión final; registrar fecha y fuente de consulta.

---

## 2. Arquitectura objetivo HL7 FHIR (visión macro)

### 2.1 Diagrama lógico de componentes

```mermaid
flowchart LR
    subgraph Frontend APS
        UI[Aplicación React APS]
    end

    subgraph Backend APS
        API[API Express/Node]
        FHIRGW[Gateway FHIR REST]
        Auth[Servicio de Identidad (Keycloak/OIDC)]
        Audit[Auditoría & Consentimientos]
        Terminology[Terminology Service]
    end

    subgraph Infraestructura
        DB[(BD Operacional\nPostgreSQL cifrado)]
        FHIRServer[(Servidor FHIR\nHAPI/Firely)]
        Cache[(Redis/Cache terminologías)]
        Log[SIEM / Logs firmados]
    end

    subgraph Ecosistema Externo
        RIPS[Red Nacional de Datos en Salud]
        ADRES[ADRES / BDUA]
        INVIMA[Catálogos INVIMA/CUM]
        EPS[IPS/EPS externas]
    end

    UI --> API
    API --> DB
    API --> FHIRGW
    API --> Terminology
    FHIRGW --> FHIRServer
    FHIRServer --> RIPS
    FHIRServer --> EPS
    Terminology --> INVIMA
    Terminology --> RIPS
    Auth --> API
    Auth --> UI
    Audit --> API
    Audit --> Log
    FHIRGW --> Audit
    API --> ADRES
```

### 2.2 Descripción de capas

- **Frontend APS (React):** formularios clínicos, dashboards y módulos de interoperabilidad. Consumirá API REST y endpoints FHIR mediante gateway.
- **Backend APS (Node/Express):** orquesta flujos de negocio, mantiene compatibilidad con módulos existentes y delega intercambio FHIR al gateway.
- **Gateway FHIR:** módulo especializado que convierte peticiones internas a recursos HL7 FHIR R4, valida contra los perfiles colombianos y maneja autenticación con la Red Nacional de Datos.
- **Servidor FHIR (HAPI/Firely):** repositorio clínico, expone recursos `Patient`, `Encounter`, `Condition`, `Medication`, `Observation`, `Composition`, `Consent`, `AuditEvent`, entre otros.
- **Terminology Service:** resuelve códigos CIE10, CUPS, ATC, INVIMA, asegurando integridad semántica.
- **Identidad y acceso (Keycloak/OIDC):** gestiona usuarios, roles clínicos, MFA y tokens firmados exigidos por la resolución.
- **Auditoría y consentimientos:** centraliza eventos `AuditEvent`, administrando `Consent` y políticas de retención. Integra con un SIEM externo.
- **Infraestructura:** base de datos operacional cifrada (PostgreSQL/MySQL), cache para catálogos, repositorio de logs inmutables. Contenedores Docker y orquestación (Kubernetes / Azure AKS / AWS EKS).
- **Conectividad externa:** integración con ADRES/BDUA para datos demográficos, Red Nacional para intercambio clínico, catálogos INVIMA y sistemas de EPS/IPS.

### 2.3 Seguridad y cumplimiento

- Comunicación cifrada (TLS 1.2+) entre todos los componentes, certificados emitidos por entidad certificadora reconocida.
- Tokens JWT firmados, scopes por recurso FHIR, y autorización basada en roles (RBAC) y atributos (ABAC).
- Módulo de consentimientos digital que emite recursos `Consent` y aplica políticas en gateway para controlar acceso.
- Auditoría (`AuditEvent`) para operaciones CRUD de recursos FHIR y eventos administrativos.
- Plan de continuidad: respaldos cifrados, replicación de base de datos, procedimientos de recuperación.

### 2.4 Roadmap técnico (high-level)

1. **Fase 0:** Refactor autenticación y cifrado de datos críticos, migrar a BD segura.
2. **Fase 1:** Implementar gateway FHIR y Terminology Service, exponer recursos `Patient`, `Condition`, `Medication`.
3. **Fase 2:** Mapear historias clínicas (`Encounter`, `Composition`, `Observation`, `MedicationRequest`).
4. **Fase 3:** Integrar consentimientos electrónicos y auditoría avanzada.
5. **Fase 4:** Certificación y homologación con Red Nacional y pruebas de interoperabilidad.

---

## 3. Sandbox HL7 FHIR – Guía de despliegue rápido

### 3.1 Entorno local con Docker Compose

- **Ubicación:** `sandbox/hapi-fhir/docker-compose.yml`
- Utiliza imagen oficial `hapiproject/hapi:v6.10.0`
- Volúmenes:
  - `./data` → Persistencia de base de datos HAPI
  - `./logs` → Registros del servidor
- Healthcheck: consulta `CapabilityStatement` para validar estado.

**Comandos básicos (PowerShell):**

```powershell
cd C:\Users\U\Documents\GitHub\Proyecto_salud\sandbox\hapi-fhir
docker compose up -d           # iniciar
docker compose ps              # verificar contenedores
curl http://localhost:8080/hapi-fhir-jpaserver/fhir/metadata
docker compose down            # detener
docker compose down -v         # detener y eliminar datos
```

### 3.2 Recursos de ejemplo disponibles

| Recurso | Archivo | Descripción |
|---------|---------|-------------|
| Patient | `examples/patient-example.json` | Paciente colombiano con NI |
| Condition | `examples/condition-example.json` | Diagnóstico CIE10 I10 (Hipertensión) |
| Medication | `examples/medication-example.json` | Medicamento Enalapril con códigos INVIMA/ATC |

**Carga mediante cURL:**

```powershell
curl -X POST -H "Content-Type: application/fhir+json" `
  -d @examples/patient-example.json `
  http://localhost:8080/hapi-fhir-jpaserver/fhir/Patient
```

Repetir para Condition y Medication cambiando el recurso objetivo.

### 3.3 Uso desde UI

- Acceder a `http://localhost:8080/` → “FHIR Tester UI”
- Seleccionar recurso (ej. `Patient`) y cargar JSON desde el apartado “POST a resource”.
- Validar respuesta HTTP 201/200 y revisar pestaña “History”.

### 3.4 Próximos pasos técnicos sobre el sandbox

1. Configurar autenticación básica o reverse proxy con OAuth2 para el entorno de QA.
2. Integrar Terminology Service (ej. Ontoserver) para validación de códigos.
3. Automatizar carga de recursos base (plantillas) mediante scripts PowerShell o npm.

---

## 4. Terminology Service implementado

### 4.1 Despliegue y operación
- **Repositorio:** `sandbox/terminology/docker-compose.yml`
- **Imagen:** `ontoserver/ontoserver:ctsa-6.6.1`
- **Puertos:** `8180` (expuestos)
- **Volúmenes:** `./data`, `./config`, `./logs`
- **Guía rápida:** `sandbox/terminology/README.md`

```powershell
cd C:\Users\U\Documents\GitHub\Proyecto_salud\sandbox\terminology
docker compose up -d
curl http://localhost:8180/fhir/metadata
```

### 4.2 Scripts ETL
- **Ruta:** `scripts/etl/`
- **Script principal:** `node scripts/etl/loadTerminology.js --baseUrl=http://localhost:8180/fhir`
- **Catálogos oficiales:**
  - `backend/terminology-data/cie10_colombia.csv` → exportar desde el Ministerio de Salud / DANE (CIE-10) en formato CSV (`Código`, `Descripción`).
  - `backend/terminology-data/cum_medicamentos.csv` → descargar desde datos abiertos INVIMA: <https://www.datos.gov.co/d/i7cb-raxc> (opción “Download” → CSV).
- **Archivos demo:** `cie10_subset.csv`, `meds_subset.csv` (solo para pruebas si no se dispone de los oficiales).
- El script publica:
  - Catálogo oficial: `CodeSystem/cie10-colombia-oficial`, `ValueSet/vs-cie10-colombia-oficial`
  - Catálogo oficial CUM: `CodeSystem/invima-colombia-oficial`, `ValueSet/vs-medicamentos-invima-oficial`
  - Si faltan los oficiales, se generan los recursos con sufijo `demo`.

### 4.3 Endpoints backend
- `GET /api/terminology/cie10?query=` → búsqueda CIE10 (debounce en frontend)
- `GET /api/terminology/medications?query=` → búsqueda medicamentos (INVIMA/ATC)
- `POST /api/terminology/validate` → validación por `valueSet` (soporta `type=cie10|medication`)
- Cache in-memory (`SimpleCache`) con TTL 5 minutos

### 4.4 Integración frontend
- Componente reutilizable `TerminologyAutocomplete`
- Formularios actualizados:
  - `ConsultaFormView`: diagnóstico principal + relacionados con autopilado CIE10
  - `RecetaFormView`: códigos CIE10 y buscador de medicamentos con INVIMA/ATC
- Servicio dedicado `src/services/terminologyService.ts`

---

## 5. Gateway FHIR y sincronización

### 5.1 Cliente backend
- Archivo: `backend/services/fhirClient.js`
- Funciones completas CRUD para todos los recursos:
  - Patient: `upsertPatient`, `readPatient`, `updatePatient`, `deletePatient`, `searchPatients`
  - Condition: `createCondition`, `readCondition`, `updateCondition`, `deleteCondition`, `searchConditions`
  - Medication: `createMedication`, `readMedication`, `updateMedication`, `deleteMedication`, `searchMedications`
  - MedicationRequest: `createMedicationRequest`, `readMedicationRequest`, `updateMedicationRequest`, `deleteMedicationRequest`, `searchMedicationRequests`
  - Encounter: `createEncounter`, `readEncounter`, `updateEncounter`, `deleteEncounter`, `searchEncounters`
  - Observation: `createObservation`, `readObservation`, `updateObservation`, `deleteObservation`, `searchObservations`
  - Composition: `createComposition`, `readComposition`, `updateComposition`, `deleteComposition`, `searchCompositions`
- Autenticación: Basic Auth opcional (`FHIR_USERNAME` + `FHIR_PASSWORD`)
- Retry logic: Reintentos automáticos con backoff exponencial para errores de red
- Manejo de errores mejorado: Mensajes descriptivos y logging detallado

### 5.2 Endpoints gateway
- **Patient:** `POST /api/fhir/patient`, `GET /api/fhir/patient/:id`, `PUT /api/fhir/patient/:id`, `DELETE /api/fhir/patient/:id`, `GET /api/fhir/patient` (search)
- **Condition:** `POST /api/fhir/condition`, `GET /api/fhir/condition/:id`, `PUT /api/fhir/condition/:id`, `DELETE /api/fhir/condition/:id`, `GET /api/fhir/condition` (search)
- **Medication:** `POST /api/fhir/medication`, `GET /api/fhir/medication/:id`, `PUT /api/fhir/medication/:id`, `DELETE /api/fhir/medication/:id`, `GET /api/fhir/medication` (search)
- **MedicationRequest:** `POST /api/fhir/medication-request`, `GET /api/fhir/medication-request/:id`, `PUT /api/fhir/medication-request/:id`, `DELETE /api/fhir/medication-request/:id`, `GET /api/fhir/medication-request` (search)
- **Encounter:** `POST /api/fhir/encounter`, `GET /api/fhir/encounter/:id`, `PUT /api/fhir/encounter/:id`, `DELETE /api/fhir/encounter/:id`, `GET /api/fhir/encounter` (search)
- **Observation:** `POST /api/fhir/observation`, `GET /api/fhir/observation/:id`, `PUT /api/fhir/observation/:id`, `DELETE /api/fhir/observation/:id`, `GET /api/fhir/observation` (search)
- **Composition:** `POST /api/fhir/composition`, `GET /api/fhir/composition/:id`, `PUT /api/fhir/composition/:id`, `DELETE /api/fhir/composition/:id`, `GET /api/fhir/composition` (search)
- **Metadata:** `GET /api/fhir/metadata`

### 5.3 Utilidades frontend
- Servicio: `src/services/fhirService.ts` - Todas las operaciones CRUD exportadas
- Mapeadores: `src/utils/fhirMappers.ts`
  - `buildPatientResource` - Convierte datos de paciente a recurso FHIR Patient
  - `buildConditionResources` - Convierte diagnósticos CIE10 a recursos Condition
  - `buildMedicationResources` - Convierte medicamentos a recursos Medication
  - `buildMedicationRequestResources` - Convierte recetas a recursos MedicationRequest
  - `buildEncounterResource` - Convierte atenciones clínicas a recurso Encounter
  - `buildObservationResources` - Convierte signos vitales a recursos Observation
  - `buildCompositionResource` - Agrupa historia clínica completa en Composition

---

## 6. Sincronización en la aplicación

### 6.1 Historia Clínica (ConsultaFormView)
- Tras guardar, sincroniza automáticamente:
  1. **Patient** - Upsert con datos del paciente
  2. **Encounter** - Representa la atención clínica
  3. **Conditions** - Diagnóstico principal + relacionados (con códigos CIE10)
  4. **Observations** - Signos vitales y medidas antropométricas:
     - Tensión arterial (sistólica y diastólica)
     - Frecuencia cardíaca y respiratoria
     - Saturación de oxígeno
     - Temperatura
     - Peso, talla, IMC
     - Glucometría
     - Escala de Glasgow
  5. **Composition** - Agrupa toda la historia clínica en un documento estructurado
- Estado de sincronización visible con `ResponsiveBadge` (`Sincronizando`, `FHIR actualizado`, `Error en FHIR`)
- Manejo de errores: Si falla algún recurso, se registra el error pero no interrumpe el flujo

### 6.2 Recetario (RecetaFormView)
- Tras guardar:
  - Upsert `Patient`
  - Creación de `Medication` (uno por código INVIMA)
  - Creación de `MedicationRequest` con `reasonCode` asociado a diagnósticos
- UI con badges de estado (idéntico a Historia Clínica)
- Campos enriquecidos: muestra códigos INVIMA y ATC junto a cada medicamento

### 6.3 Vista de Demostración FHIR (FHIRDemoView)
- Vista dedicada para demostrar interoperabilidad
- Accesible desde menú lateral: "Interoperabilidad FHIR"
- Funcionalidades:
  - Búsqueda de recursos por diferentes criterios
  - Visualización de resultados en lista
  - Ver detalles completos de recursos en JSON
  - Soporte para todos los recursos: Patient, Encounter, Condition, Observation, Composition

---

## 7. Pruebas y evidencias

- **Postman collection:** `docs/tests/terminology_fhir.postman_collection.json`
  - Variables: `{{api_base}}` por defecto `http://localhost:3001/api`
  - Incluye consultas de terminología y operaciones FHIR (Patient, Condition, MedicationRequest)
- **Scripts ETL:** generan recursos demo para validar autocompletado
- **Flujos manuales recomendados:**
  1. Ejecutar Ontoserver y HAPI FHIR (`docker compose up`)
  2. Cargar terminologías (`node scripts/etl/loadTerminology.js`)
  3. Probar autocompletado en la app (diagnóstico y medicamentos)
  4. Guardar historia clínica y receta → verificar badges y recursos en HAPI FHIR (`http://localhost:8080/`)

---

## 8. Variables de entorno clave

| Variable | Ubicación | Descripción |
|----------|-----------|-------------|
| `TERMINOLOGY_BASE_URL` | Backend | URL Ontoserver (por defecto `http://localhost:8180/fhir`) |
| `CIE10_VALUESET_URL` | Backend | ValueSet CIE10 (demo) |
| `MEDS_VALUESET_URL` | Backend | ValueSet medicamentos (demo) |
| `TERMINOLOGY_PAGE_SIZE` | Backend | Límite de resultados (default 20) |
| `FHIR_BASE_URL` | Backend | URL HAPI FHIR (por defecto `https://hapi.fhir.org/baseR4` - servidor público) |
| `FHIR_USERNAME`, `FHIR_PASSWORD` | Backend | Credenciales Basic Auth (opcional, no requerido para HAPI público) |

**Nota importante:** El sistema está configurado para usar HAPI FHIR público por defecto (`https://hapi.fhir.org/baseR4`), que es gratuito y no requiere credenciales. Ideal para estudiantes y demostraciones.

---

## 9. Gestión de throttling del servidor FHIR público

- El gateway usa el servidor compartido `https://hapi.fhir.org/baseR4`, el cual limita la tasa de peticiones. Cuando ocurre un `429 Too Many Requests`, el backend reintenta automáticamente con backoff exponencial y jitter configurable mediante:
  - `FHIR_MAX_RETRIES`
  - `FHIR_BACKOFF_BASE_MS`
  - `FHIR_BACKOFF_MAX_MS`
  - `FHIR_BACKOFF_JITTER_MS`
- En frontend se agregó `src/config/fhirThrottle.ts` para controlar el tamaño de lote y la espera entre peticiones de Observations. Variables disponibles:
  - `VITE_FHIR_MAX_RETRIES`
  - `VITE_FHIR_BASE_DELAY_MS`
  - `VITE_FHIR_OBSERVATION_BATCH_SIZE`
  - `VITE_FHIR_OBSERVATION_BATCH_DELAY_MS`
- Las Observations se envían por lotes pequeños, se espera entre lotes y se registran los recursos que no pudieron sincronizarse. La UI muestra un aviso cuando ocurre alguna advertencia.
- Recomendación: para producción se debe desplegar un servidor HAPI dedicado (sandbox Docker/Render) para eliminar los límites del servicio público.

## 10. Próximos pasos inmediatos

1. Validar esta matriz con el equipo legal y funcional para precisar artículos, numerales y priorización.
2. Definir responsables y fechas para cada brecha identificada.
3. Elaborar repositorio de evidencias (actas, capturas, diagramas) para auditorías futuras.

