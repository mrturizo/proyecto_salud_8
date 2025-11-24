# Implementación de Roles: Psicólogo y Enfermero Jefe
## + Expansión de Funcionalidades: Base de Datos, Perfiles y STT

## Resumen del Sprint

Este documento detalla la implementación completa de los roles **Psicólogo** y **Enfermero Jefe** en el sistema de Salud Digital APS, así como la expansión de funcionalidades clave: **completar bases de datos de formularios**, **sistema de perfiles de autocompletado** y **expansión de Speech-to-Text (STT)**. Se incluyen todas las funcionalidades, endpoints, vistas y componentes creados o modificados.

---

## 📋 Tabla de Contenidos

1. [Rol: Psicólogo](#rol-psicólogo)
2. [Rol: Enfermero Jefe](#rol-enfermero-jefe)
3. [Completar Bases de Datos de Formularios](#completar-bases-de-datos-de-formularios)
4. [Sistema de Perfiles de Autocompletado](#sistema-de-perfiles-de-autocompletado)
5. [Expansión de Speech-to-Text (STT)](#expansión-de-speech-to-text-stt)
6. [Cambios en Base de Datos](#cambios-en-base-de-datos)
7. [Endpoints Backend](#endpoints-backend)
8. [Servicios Frontend](#servicios-frontend)
9. [Componentes y Vistas](#componentes-y-vistas)
10. [Credenciales de Prueba](#credenciales-de-prueba)

---

## 🧠 Rol: Psicólogo

### Credenciales de Acceso
- **Email**: `psicologo@salud.com`
- **Contraseña**: `psic123`
- **Rol ID**: 22

### Funcionalidades Implementadas

#### 1. **Dashboard de Psicología**
- **Ruta**: `dashboard-psicologia`
- **Vista**: `DashboardPsicologiaView`
- **Funcionalidad**: Muestra estadísticas epidemiológicas y de salud mental:
  - Total de consultas
  - Consultas completadas
  - Consultas pendientes
  - Pacientes atendidos (únicos)

#### 2. **Historia Clínica Psicológica**
- **Ruta**: Accesible desde "Consultas Asignadas" → Seleccionar paciente
- **Vista**: `HCPsicologiaView`
- **Campos del formulario**:
  - Motivo de Consulta (requerido)
  - Análisis Funcional
  - Antecedentes Psicológicos
  - Evaluación Mental
  - Diagnóstico (DSM-5)
  - Plan Terapéutico
  - Técnicas Aplicadas
  - Próxima Sesión

#### 3. **Consultas Asignadas**
- **Ruta**: `consultas-asignadas`
- **Vista**: `ConsultasAsignadasView` (adaptada para psicólogo)
- **Funcionalidad específica para psicólogo**:
  - Muestra "BD Pacientes Asignados" ordenados por estado y fecha
  - Filtra pacientes desde demandas inducidas asignadas al psicólogo
  - Al hacer clic en un paciente, abre la HC Psicológica
  - Muestra información de familia y estado de demanda

#### 4. **Consultas Realizadas**
- **Ruta**: `consultas-realizadas`
- **Vista**: `ConsultasRealizadasView` (adaptada para psicólogo)
- **Funcionalidad específica para psicólogo**:
  - Muestra solo "HC Psicológicas por mí - Completadas"
  - Filtra por fechas (desde/hasta)
  - Muestra diagnóstico DSM-5 en lugar de CIE-10
  - Permite ver y editar HC completadas

#### 5. **Educación en Salud**
- **Ruta**: `educacion-salud`
- **Vista**: `EducacionSaludView`
- **Funcionalidad**: Gestión de actividades de educación en salud:
  - BD con temas, horarios, territorio, personas
  - Búsqueda y filtrado por territorio
  - Vista de actividades programadas (estructura base lista para futura implementación completa)

#### 6. **Menú de Navegación**
- **Secciones principales**:
  - Crear Familia
  - Consultas Asignadas
  - Consultas Realizadas
  - Educación en Salud
  - Bitácora
- **Secciones del sidebar**:
  - BD Pacientes
  - Dashboard
  - Configuración
  - Ayuda

---

## 🩺 Rol: Enfermero Jefe

### Credenciales de Acceso
- **Email**: `enfermerojefe@salud.com`
- **Contraseña**: `11223344`
- **Rol ID**: 23

### Funcionalidades Implementadas

#### 1. **Dashboard de Enfermería**
- **Ruta**: `dashboard-enfermeria`
- **Vista**: `DashboardEnfermeriaView`
- **Funcionalidad**: Muestra información epidemiológica de enfermería:
  - Total Familias
  - Familias Caracterizadas
  - Planes Activos
  - Consultas Pendientes
  - Pacientes Asignados

#### 2. **Ver y Editar Caracterizaciones**
- **Ruta**: `caracterizaciones`
- **Vista**: `CaracterizacionesView` (mejorada)
- **Funcionalidad**:
  - Lista todas las familias con estado de caracterización
  - Permite buscar por apellido o dirección
  - Filtra por estado (Todas / Con caracterización / Sin caracterización)
  - Al hacer clic en una familia:
    - Si tiene caracterización: Ver/Editar
    - Si no tiene: Crear nueva caracterización
  - Indica posibilidad de crear plan de cuidado desde caracterización

#### 3. **Planes de Cuidado Familiar**
- **Ruta**: `planes-cuidado`
- **Vista**: `PlanesCuidadoListView` (compartida con Auxiliar)
- **Funcionalidad**:
  - Tabs: "Pacientes con PCF" y "Pacientes sin PCF"
  - Búsqueda y filtrado
  - Ver y editar planes existentes
  - Agregar PCF para pacientes sin plan

#### 4. **Consultas / Asignaciones**
- **Ruta**: `consultas-asignadas`
- **Vista**: `ConsultasAsignadasView` (compartida)
- **Funcionalidad**:
  - Muestra "BD Pacientes Asignados" ordenados por estado/fecha
  - Filtra desde demandas inducidas asignadas
  - Permite acceder a información detallada del paciente

#### 5. **Educación en Salud**
- **Ruta**: `educacion-salud`
- **Vista**: `EducacionSaludView` (compartida con Psicólogo)
- **Funcionalidad**: Misma que para Psicólogo

#### 6. **Menú de Navegación**
- **Secciones principales**:
  - Crear Familia
  - Ver y Editar Caracterizaciones
  - BD Pacientes
  - Planes de Cuidado Familiar
  - Consultas / Asignaciones
  - Educación en Salud
  - Bitácora
- **Secciones del sidebar**:
  - BD Pacientes
  - Dashboard
  - Configuración
  - Ayuda

---

## 📋 Completar Bases de Datos de Formularios

### Resumen

Se completaron los formularios físicos del sistema para que todos los campos estén disponibles en la base de datos y el frontend. Se implementaron migraciones para agregar campos faltantes y se actualizaron los endpoints y vistas correspondientes.

### 1. Recetario Médico (Nº 0048)

#### Campos Agregados a `Recetas_Medicas`

**Nuevos campos en la tabla**:
- `codigo_diagnostico_principal` (VARCHAR(20))
- `codigo_diagnostico_rel1` (VARCHAR(20))
- `codigo_diagnostico_rel2` (VARCHAR(20))
- `recomendaciones` (TEXT)

**Estructura expandida de `medicamentos` (JSON)**:
```json
{
  "nombre": "string",
  "concentracion": "string",
  "forma_farmaceutica": "string",
  "via_administracion": "string",
  "dosis_frecuencia_duracion": "string",
  "cantidad_numerica": "number",
  "cantidad_letras": "string",
  "entregado": "boolean"
}
```

**Migración**: `backend/database/migracion_campos_receta_medica.js`

#### Frontend - RecetaFormView

**Campos agregados**:
- Código Diagnóstico Principal
- Código Diagnóstico Relacionado 1
- Código Diagnóstico Relacionado 2
- Recomendaciones
- Campos expandidos en medicamentos:
  - Concentración
  - Forma Farmacéutica (dropdown)
  - Vía de Administración (dropdown)
  - Dosis, Frecuencia y Duración
  - Cantidad (numérica y letras)
  - Entregado (checkbox)

**Ubicación**: `src/App.tsx` - `RecetaFormView` (línea ~2286)

### 2. Solicitud de Laboratorio (Nº 0057)

#### Campos Agregados a `Ordenes_Laboratorio`

**Nuevos campos en la tabla**:
- `servicio` (VARCHAR(100))
- `numero_carnet` (VARCHAR(50))
- `diagnostico_justificacion` (TEXT)

**Nota**: El campo `indicaciones_clinicas` se usa para almacenar `examenes_solicitados` (texto libre).

**Migración**: `backend/database/migracion_campos_orden_laboratorio.js`

#### Frontend - ExamenesFormView

**Campos agregados**:
- Servicio (radio buttons: Ambulatorio / Hospitalario)
- N° Carnet
- Diagnóstico (textarea)
- EXÁMENES SOLICITADOS (textarea grande)

**Ubicación**: `src/App.tsx` - `ExamenesFormView` (línea ~3083)

### 3. Historia Clínica Consulta Ambulatoria

#### Campos Agregados a `HC_Medicina_General`

**Campos previamente agregados** (documentados para referencia):
- `hora_consulta` (TIME)
- `enfoque_diferencial` (JSON)
- Signos vitales expandidos:
  - `tension_arterial_sistolica`, `tension_arterial_diastolica`
  - `frecuencia_cardiaca`, `frecuencia_respiratoria`
  - `saturacion_oxigeno`, `temperatura`
- Medidas antropométricas:
  - `peso`, `talla`, `imc`
  - `perimetro_cefalico`, `perimetro_toracico`, `perimetro_abdominal`
  - `perimetro_braquial`, `perimetro_pantorrilla`
- Otros parámetros:
  - `glucometria`, `glasgow`
- Campos de texto:
  - `conducta_seguir`, `evolucion`, `analisis`
- `fecha_hora_egreso` (TIMESTAMP)

**Migración**: `backend/database/migracion_campos_hc_medicina.js`

### 4. Tabla Pacientes

#### Campos Agregados

- `estado_civil` (VARCHAR(50))

**Migración**: `backend/database/migracion_campos_hc_medicina.js`

---

## 🎯 Sistema de Perfiles de Autocompletado

### Resumen

Sistema completo para crear, gestionar y aplicar perfiles de autocompletado que permiten llenar rápidamente formularios con datos predefinidos. Los perfiles pueden ser públicos (disponibles para todos) o privados (creados por el usuario).

### Tabla: `Perfiles_Autocompletado`

**Estructura**:
```sql
CREATE TABLE IF NOT EXISTS Perfiles_Autocompletado (
  perfil_id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_perfil VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_perfil VARCHAR(50) DEFAULT 'HC_Medicina',
  -- Tipos: 'HC_Medicina', 'HC_Psicologia', 'HC_Enfermeria', 'General'
  datos_perfil JSON NOT NULL,
  creado_por_uid INTEGER, -- NULL = público, valor = privado del usuario
  activo BOOLEAN DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
);
```

**Índices**:
- `idx_perfiles_tipo` en `tipo_perfil`
- `idx_perfiles_activo` en `activo`

**Migración**: `backend/database/migracion_perfiles_autocompletado.js`

### Perfiles Predeterminados

Se crearon 5 perfiles públicos iniciales:

1. **Paciente Joven Normal**
   - Tipo: HC_Medicina
   - Descripción: Pacientes jóvenes sin condiciones especiales

2. **Paciente Adulto Mayor Normal**
   - Tipo: HC_Medicina
   - Descripción: Pacientes adultos mayores sin condiciones especiales

3. **Paciente con Hipertensión**
   - Tipo: HC_Medicina
   - Descripción: Pacientes con diagnóstico de hipertensión arterial

4. **Paciente con Diabetes Tipo 2**
   - Tipo: HC_Medicina
   - Descripción: Pacientes con diabetes tipo 2

5. **Paciente Pediátrico**
   - Tipo: HC_Medicina
   - Descripción: Perfil para pacientes pediátricos

**Script**: `backend/database/agregar_perfiles_predeterminados.js`

### Endpoints Backend

#### 1. **GET /api/perfiles-autocompletado**
Obtener perfiles filtrados por tipo y usuario.

**Query Parameters**:
- `tipo_perfil` (opcional): Filtra por tipo de perfil
- `usuario_id` (opcional): Incluye perfiles privados del usuario

**Lógica**:
- Siempre muestra perfiles públicos (`creado_por_uid IS NULL`)
- Si se proporciona `usuario_id`, también muestra perfiles privados del usuario
- Ordena: públicos primero, luego privados, luego por nombre

**Response**:
```json
[
  {
    "perfil_id": 1,
    "nombre_perfil": "Paciente Joven Normal",
    "descripcion": "...",
    "tipo_perfil": "HC_Medicina",
    "datos_perfil": {...},
    "creado_por_uid": null,
    "activo": 1,
    "fecha_creacion": "...",
    "fecha_actualizacion": "..."
  }
]
```

#### 2. **GET /api/perfiles-autocompletado/:id**
Obtener un perfil específico por ID.

#### 3. **POST /api/perfiles-autocompletado**
Crear nuevo perfil (público o privado).

**Request Body**:
```json
{
  "nombre_perfil": "Mi Perfil Personalizado",
  "descripcion": "Perfil para pacientes con condición X",
  "tipo_perfil": "HC_Medicina",
  "datos_perfil": {
    "motivo_consulta": "...",
    "enfermedad_actual": "...",
    ...
  },
  "creado_por_uid": 22  // null para público, número para privado
}
```

#### 4. **PUT /api/perfiles-autocompletado/:id**
Actualizar perfil existente.

#### 5. **DELETE /api/perfiles-autocompletado/:id**
Desactivar perfil (soft delete: `activo = 0`).

### Servicios Frontend

**AuthService - Métodos agregados**:

```typescript
// Obtener perfiles
static async getPerfiles(tipoPerfil?: string, usuarioId?: number): Promise<PerfilAutocompletado[]>

// Obtener perfil por ID
static async getPerfil(perfilId: number): Promise<PerfilAutocompletado>

// Crear perfil
static async crearPerfil(data: CrearPerfilPayload): Promise<PerfilAutocompletado>

// Actualizar perfil
static async actualizarPerfil(perfilId: number, data: ActualizarPerfilPayload): Promise<PerfilAutocompletado>

// Eliminar perfil (desactivar)
static async eliminarPerfil(perfilId: number): Promise<void>
```

**Ubicación**: `src/services/authService.ts` (líneas ~629-720)

### Tipos TypeScript

**Archivo**: `src/types/perfiles.ts`

```typescript
export interface PerfilAutocompletado {
  perfil_id: number;
  nombre_perfil: string;
  descripcion?: string;
  tipo_perfil: string;
  datos_perfil: DatosPerfilHC;
  creado_por_uid?: number | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface DatosPerfilHC {
  motivo_consulta?: string;
  enfermedad_actual?: string;
  antecedentes_familiares?: string;
  examen_fisico?: string;
  conducta_seguir?: string;
  evolucion?: string;
  analisis?: string;
  plan_manejo?: string;
  enfoque_diferencial?: any;
  // ... más campos según el tipo de perfil
}
```

### Integración en Frontend

#### ConsultaFormView (HC Medicina)

**Funcionalidad agregada**:
- Dropdown para seleccionar perfil
- Botón "Aplicar Perfil" que llena automáticamente los campos
- Botón "Guardar como Perfil" que abre modal para crear perfil personalizado
- Modal con campos: nombre del perfil, descripción

**Ubicación**: `src/App.tsx` - `ConsultaFormView` (línea ~2286)

**Flujo de uso**:
1. Usuario selecciona un perfil del dropdown
2. Click en "Aplicar Perfil" → Se llenan los campos del formulario
3. Usuario puede modificar los valores antes de guardar
4. Usuario puede crear su propio perfil desde el formulario actual

---

## 🎤 Expansión de Speech-to-Text (STT)

### Resumen

Se implementó un sistema completo de Speech-to-Text (STT) que permite a los usuarios llenar campos de texto mediante dictado de voz. El sistema utiliza la API de ElevenLabs para transcribir audio a texto.

### Componente: STTButton

**Ubicación**: `src/components/STTButton.tsx`

**Props**:
```typescript
interface STTButtonProps {
  onTranscription: (text: string) => void;  // Callback con el texto transcrito
  disabled?: boolean;
  className?: string;
}
```

**Funcionalidad**:
- Solicita permisos de micrófono al usuario
- Graba audio en formato WebM o MP4
- Envía audio al backend para transcripción
- Muestra estados visuales: grabando, procesando, listo
- Maneja errores y permisos denegados

**Estados visuales**:
- **Listo**: Botón azul con icono de micrófono y texto "Voz"
- **Grabando**: Botón rojo con icono de micrófono apagado y texto "Detener"
- **Procesando**: Botón deshabilitado con spinner y texto "Procesando..."

### Endpoint Backend: POST /api/stt

**Ubicación**: `backend/server.js` (línea ~2368)

**Funcionalidad**:
- Recibe archivo de audio (multipart/form-data)
- Valida API key de ElevenLabs (`ELEVENLABS_API_KEY`)
- Envía audio a ElevenLabs API con:
  - Modelo: `scribe_v1`
  - Idioma: `es` (español)
- Limpia archivos temporales
- Retorna texto transcrito

**Request**:
```
POST /api/stt
Content-Type: multipart/form-data
Body: { audio: File }
```

**Response**:
```json
{
  "text": "Texto transcrito del audio..."
}
```

**Configuración requerida**:
- Variable de entorno: `ELEVENLABS_API_KEY` en `backend/.env`

### Integración en Formularios

El componente `STTButton` se integró en los siguientes formularios:

#### 1. Historia Clínica (ConsultaFormView)
**Campos con STT**:
- Motivo de Consulta
- Enfermedad Actual
- Antecedentes Familiares
- Examen Físico
- Conducta a Seguir
- Evolución
- Análisis
- Plan de Manejo

#### 2. Recetario Médico (RecetaFormView)
**Campos con STT**:
- Indicaciones
- Recomendaciones
- Dosis, Frecuencia y Duración (en medicamentos)

#### 3. Solicitud de Laboratorio (ExamenesFormView)
**Campos con STT**:
- Diagnóstico
- Exámenes Solicitados

**Ubicación**: `src/App.tsx` - Integrado en múltiples vistas

### Flujo de Uso

1. Usuario hace click en el botón "Voz" junto a un campo de texto
2. Navegador solicita permiso de micrófono (primera vez)
3. Botón cambia a estado "Grabando" (rojo)
4. Usuario habla
5. Usuario hace click en "Detener"
6. Botón cambia a "Procesando..." (con spinner)
7. Audio se envía al backend → ElevenLabs → Transcripción
8. Texto transcrito se inserta automáticamente en el campo
9. Botón vuelve a estado "Listo"

### Manejo de Errores

- **Permiso denegado**: Muestra alerta al usuario
- **Error de API**: Muestra mensaje de error específico
- **Audio vacío**: No inserta texto si la transcripción está vacía
- **Error de red**: Maneja errores de conexión

### Configuración

**Requisitos**:
1. API Key de ElevenLabs configurada en `backend/.env`:
   ```
   ELEVENLABS_API_KEY=tu_api_key_aqui
   ```
2. Permisos de micrófono en el navegador
3. HTTPS recomendado para producción (requisito de navegadores modernos para MediaRecorder)

**Nota**: El sistema funciona sin API key configurada, pero mostrará un error al intentar transcribir.

---

## 💾 Cambios en Base de Datos

### Tabla: `HC_Psicologia`
Nueva tabla creada para almacenar historias clínicas psicológicas.

**Estructura**:
```sql
CREATE TABLE IF NOT EXISTS HC_Psicologia (
  hc_psicologia_id INTEGER PRIMARY KEY AUTOINCREMENT,
  atencion_id INTEGER NOT NULL,
  fecha_atencion DATE NOT NULL,
  hora_consulta TIME,
  motivo_consulta TEXT,
  analisis_funcional TEXT,
  antecedentes_psicologicos TEXT,
  evaluacion_mental TEXT,
  diagnosticos_dsm5 TEXT,
  plan_terapeutico TEXT,
  tecnicas_aplicadas TEXT,
  proxima_sesion DATE,
  -- Índices
  FOREIGN KEY (atencion_id) REFERENCES Atenciones_Clinicas(atencion_id)
);
```

**Nota**: La tabla existía previamente con una estructura ligeramente diferente (9 columnas). Se mantuvo la estructura existente para compatibilidad.

### Tabla: `Roles`
- Se agregó el rol "Psicólogo" (ID: 22)
- Se agregó el rol "Enfermero Jefe" (ID: 23)

### Tabla: `Usuarios`
- Usuario de prueba para Psicólogo creado
- Usuario de prueba para Enfermero Jefe creado

---

## 🔌 Endpoints Backend

### Endpoints de Speech-to-Text (STT)

#### POST /api/stt
Transcribir audio a texto usando ElevenLabs API.

**Request**:
- Content-Type: `multipart/form-data`
- Body: `{ audio: File }`

**Response**:
```json
{
  "text": "Texto transcrito del audio..."
}
```

**Configuración**:
- Requiere `ELEVENLABS_API_KEY` en `backend/.env`
- Modelo: `scribe_v1`
- Idioma: `es` (español)

**Ubicación**: `backend/server.js` (línea ~2368)

### Endpoints de Perfiles de Autocompletado

#### 1. GET /api/perfiles-autocompletado
Obtener perfiles filtrados.

**Query Parameters**:
- `tipo_perfil` (opcional): Filtra por tipo ('HC_Medicina', 'HC_Psicologia', etc.)
- `usuario_id` (opcional): Incluye perfiles privados del usuario

**Response**: Array de perfiles

#### 2. GET /api/perfiles-autocompletado/:id
Obtener perfil específico por ID.

#### 3. POST /api/perfiles-autocompletado
Crear nuevo perfil.

**Request Body**:
```json
{
  "nombre_perfil": "string",
  "descripcion": "string",
  "tipo_perfil": "HC_Medicina",
  "datos_perfil": {...},
  "creado_por_uid": null  // null = público, número = privado
}
```

#### 4. PUT /api/perfiles-autocompletado/:id
Actualizar perfil existente.

#### 5. DELETE /api/perfiles-autocompletado/:id
Desactivar perfil (soft delete).

**Ubicación**: `backend/server.js` (líneas ~2412-2678)

### Endpoints de HC_Psicologia

#### 1. **POST /api/hc/psicologia**
Crear nueva atención y historia clínica psicológica.

**Request Body**:
```json
{
  "paciente_id": 1,
  "usuario_id": 22,
  "fecha_atencion": "2024-01-15",
  "motivo_consulta": "Ansiedad generalizada",
  "analisis_funcional": "...",
  "antecedentes_psicologicos": "...",
  "evaluacion_mental": "...",
  "diagnosticos_dsm5": "F41.1 - Trastorno de ansiedad generalizada",
  "plan_terapeutico": "...",
  "tecnicas_aplicadas": "...",
  "proxima_sesion": "2024-01-22"
}
```

**Response**:
```json
{
  "success": true,
  "atencion_id": 123,
  "message": "Historia clínica psicológica creada exitosamente"
}
```

#### 2. **GET /api/hc/psicologia/:atencion_id**
Obtener historia clínica psicológica por ID de atención.

**Response**:
```json
{
  "atencion_id": 123,
  "motivo_consulta": "...",
  "analisis_funcional": "...",
  "antecedentes_psicologicos": "...",
  "evaluacion_mental": "...",
  "diagnosticos_dsm5": "...",
  "plan_terapeutico": "...",
  "tecnicas_aplicadas": "...",
  "proxima_sesion": "2024-01-22"
}
```

#### 3. **GET /api/pacientes/:id/hc-psicologia**
Obtener todas las historias clínicas psicológicas de un paciente.

**Response**: Array de objetos con información de atención y HC psicológica.

#### 4. **GET /api/usuarios/:id/hc-psicologia-completadas**
Obtener historias clínicas psicológicas completadas por un psicólogo específico.

**Response**: Array de objetos con información de paciente, familia y HC.

#### 5. **PUT /api/hc/psicologia/:atencion_id**
Actualizar historia clínica psicológica existente.

**Request Body**: Mismo formato que POST, todos los campos son opcionales excepto los que se quieren actualizar.

**Response**:
```json
{
  "success": true,
  "message": "Historia clínica psicológica actualizada exitosamente"
}
```

---

## 🔧 Servicios Frontend

### AuthService - Métodos Agregados

#### HC_Psicologia

```typescript
// Crear nueva HC psicológica
static async crearHCPsicologia(data: any)

// Obtener HC psicológica por atención
static async getHCPsicologia(atencionId: number)

// Actualizar HC psicológica
static async updateHCPsicologia(atencionId: number, data: any)

// Obtener HC psicológicas de un paciente
static async getHCPsicologiaPaciente(pacienteId: number)

// Obtener HC psicológicas completadas por psicólogo
static async getHCPsicologiaCompletadas(usuarioId: number)
```

**Ubicación**: `src/services/authService.ts`

---

## 🎨 Componentes y Vistas

### Vistas Nuevas

#### 1. **DashboardPsicologiaView**
- **Ubicación**: `src/App.tsx` (línea ~7346)
- **Props**: `{ deviceType }`
- **Funcionalidad**: Dashboard con estadísticas de psicología

#### 2. **DashboardEnfermeriaView**
- **Ubicación**: `src/App.tsx` (línea ~7232)
- **Props**: `{ deviceType }`
- **Funcionalidad**: Dashboard con estadísticas de enfermería

#### 3. **HCPsicologiaView**
- **Ubicación**: `src/App.tsx` (línea ~7523)
- **Props**: `{ atencion?, paciente, onSave, onCancel }`
- **Funcionalidad**: Formulario completo de historia clínica psicológica

#### 4. **EducacionSaludView**
- **Ubicación**: `src/App.tsx` (línea ~7391)
- **Props**: `{ deviceType }`
- **Funcionalidad**: Gestión de actividades de educación en salud (estructura base)

### Vistas Modificadas

#### 1. **ConsultasAsignadasView**
- **Cambios**:
  - Detección de rol (psicólogo vs otros)
  - Para psicólogo: muestra "BD Pacientes Asignados" ordenados por estado/fecha
  - Integración con `HCPsicologiaView` para psicólogo
  - Integración con `HistoriaClinicaView` para otros roles

#### 2. **ConsultasRealizadasView**
- **Cambios**:
  - Detección de rol (psicólogo vs otros)
  - Para psicólogo: muestra solo HC psicológicas completadas
  - Muestra diagnóstico DSM-5 para psicólogo (vs CIE-10 para otros)
  - Integración con `HCPsicologiaView` para psicólogo

#### 3. **CaracterizacionesView**
- **Cambios**:
  - Mejorada para Enfermero Jefe
  - Indica posibilidad de crear plan de cuidado desde caracterización
  - Mejor feedback visual sobre estado de caracterización

#### 4. **PlanesCuidadoListView**
- **Cambios**:
  - Compatible con Enfermero Jefe
  - Permite ver y editar planes
  - Tabs separados para pacientes con/sin PCF

---

## 🔄 Configuración de Roles

### USER_ROLES - Actualizado

#### Psicólogo
```typescript
psicologo: {
  name: "Psicólogo",
  icon: Brain,
  color: "emerald",
  mainSections: [
    { key: "crear-familia", label: "Crear Familia", icon: Users },
    { key: "consultas-asignadas", label: "Consultas Asignadas", icon: Calendar },
    { key: "consultas-realizadas", label: "Consultas Realizadas", icon: CheckCircle },
    { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
    { key: "bitacora", label: "Bitácora", icon: Activity }
  ],
  sidebarSections: [
    { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
    { key: "dashboard-psicologia", label: "Dashboard", icon: BarChart3 },
    { key: "configuracion", label: "Configuración", icon: Settings },
    { key: "ayuda", label: "Ayuda", icon: HelpCircle }
  ]
}
```

#### Enfermero Jefe
```typescript
enfermero_jefe: {
  name: "Enfermero Jefe",
  icon: Shield,
  color: "emerald",
  mainSections: [
    { key: "crear-familia", label: "Crear Familia", icon: Users },
    { key: "caracterizaciones", label: "Ver y Editar Caracterizaciones", icon: FileText },
    { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
    { key: "planes-cuidado", label: "Planes de Cuidado Familiar", icon: Activity },
    { key: "consultas-asignadas", label: "Consultas / Asignaciones", icon: Calendar },
    { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
    { key: "bitacora", label: "Bitácora", icon: Activity }
  ],
  sidebarSections: [
    { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
    { key: "dashboard-enfermeria", label: "Dashboard", icon: BarChart3 },
    { key: "configuracion", label: "Configuración", icon: Settings },
    { key: "ayuda", label: "Ayuda", icon: HelpCircle }
  ]
}
```

### renderPage - Casos Agregados

```typescript
case "dashboard-psicologia":
  return <DashboardPsicologiaView deviceType={deviceType} />;

case "dashboard-enfermeria":
  return <DashboardEnfermeriaView deviceType={deviceType} />;

case "educacion-salud":
  return <EducacionSaludView deviceType={deviceType} />;
```

---

## 📁 Archivos Creados/Modificados

### Archivos Nuevos

1. **backend/check_psicologo_users.js**
   - Script para verificar/crear usuario de psicólogo

2. **backend/check_enfermero_jefe_users.js**
   - Script para verificar/crear usuario de Enfermero Jefe

3. **backend/database/create_hc_psicologia.js**
   - Script para crear tabla HC_Psicologia (si no existe)

### Archivos Modificados

1. **backend/server.js**
   - Agregados endpoints de HC_Psicologia (5 endpoints) - Líneas ~771-1002
   - Endpoint POST /api/stt para Speech-to-Text - Línea ~2368
   - Agregados endpoints de Perfiles de Autocompletado (5 endpoints) - Líneas ~2412-2678
   - Actualizados endpoints de Recetas_Medicas para nuevos campos - Líneas ~1400-1600
   - Actualizados endpoints de Ordenes_Laboratorio para nuevos campos - Líneas ~1700-1900

2. **src/services/authService.ts**
   - Agregados métodos para HC_Psicologia (5 métodos) - Líneas ~587-627
   - Agregados métodos para Perfiles de Autocompletado (5 métodos) - Líneas ~629-720
   - Método consultarADRES actualizado para manejar 503 (API no configurada) - Líneas ~680-720

3. **src/App.tsx**
   - Agregadas vistas: DashboardPsicologiaView, DashboardEnfermeriaView, HCPsicologiaView, EducacionSaludView
   - Modificadas vistas: ConsultasAsignadasView, ConsultasRealizadasView, CaracterizacionesView
   - Integración de STTButton en múltiples formularios (ConsultaFormView, RecetaFormView, ExamenesFormView)
   - Sistema de perfiles de autocompletado en ConsultaFormView:
     - Dropdown de perfiles
     - Botón "Aplicar Perfil"
     - Modal "Guardar como Perfil"
   - Campos expandidos en RecetaFormView y ExamenesFormView
   - Actualizado USER_ROLES para ambos roles
   - Agregados casos en renderPage

---

## 🔑 Credenciales de Prueba

### Psicólogo
```
Email: psicologo@salud.com
Contraseña: psic123
Rol: Psicólogo
```

### Enfermero Jefe
```
Email: enfermerojefe@salud.com
Contraseña: 11223344
Rol: Enfermero Jefe
```

---

## 🚀 Flujos de Usuario Implementados

### Flujo Psicólogo

1. **Login** → **Dashboard** (estadísticas)
2. **Consultas Asignadas** → Ver pacientes asignados → Seleccionar paciente → **HC Psicológica**
3. **Consultas Realizadas** → Ver HC completadas → Seleccionar HC → Ver/Editar
4. **Educación en Salud** → Ver actividades programadas
5. **BD Pacientes** → Buscar pacientes
6. **Bitácora** → Ver registro de actividades

### Flujo Enfermero Jefe

1. **Login** → **Dashboard** (estadísticas epidemiológicas)
2. **Ver y Editar Caracterizaciones** → Seleccionar familia → Ver/Editar/Crear caracterización
3. **Planes de Cuidado Familiar** → Ver planes → Editar o crear nuevo
4. **Consultas / Asignaciones** → Ver pacientes asignados → Acceder a información
5. **BD Pacientes** → Buscar pacientes
6. **Educación en Salud** → Ver actividades
7. **Bitácora** → Ver registro de actividades

---

## 📝 Notas Técnicas

### Detección de Rol en Vistas

Las vistas `ConsultasAsignadasView` y `ConsultasRealizadasView` detectan el rol del usuario para mostrar contenido específico:

```typescript
const { user } = useAuth();
const isPsicologo = user?.role === 'psicologo';
```

### Integración con Atenciones_Clinicas

Las HC psicológicas se crean asociadas a una atención clínica:
- Tipo de atención: `'Consulta Psicológica'`
- Estado inicial: `'En proceso'`
- Se puede completar usando el endpoint `/api/atenciones/:id/completar`

### Ordenamiento de Pacientes Asignados

Para psicólogo y enfermero jefe, los pacientes asignados se ordenan por:
1. Estado (Pendiente/Asignada primero)
2. Fecha de demanda (más reciente primero)

---

## ✅ Checklist de Implementación

### Psicólogo
- [x] Usuario creado
- [x] Tabla HC_Psicologia verificada/creada
- [x] Endpoints backend implementados
- [x] Métodos en AuthService agregados
- [x] Dashboard de Psicología creado
- [x] Vista de HC Psicológica creada
- [x] Consultas Asignadas adaptada
- [x] Consultas Realizadas adaptada
- [x] Educación en Salud implementada
- [x] Configuración de menú actualizada
- [x] Casos en renderPage agregados

### Enfermero Jefe
- [x] Usuario creado
- [x] Dashboard de Enfermería creado
- [x] Vista de Caracterizaciones mejorada
- [x] Planes de Cuidado compatible
- [x] Consultas Asignadas compatible
- [x] Educación en Salud disponible
- [x] Configuración de menú actualizada
- [x] Casos en renderPage agregados

### Completar Bases de Datos
- [x] Migración Recetas_Medicas (campos diagnósticos y recomendaciones)
- [x] Migración Ordenes_Laboratorio (servicio, carnet, diagnóstico)
- [x] Estructura JSON de medicamentos expandida
- [x] Frontend RecetaFormView actualizado
- [x] Frontend ExamenesFormView actualizado
- [x] Endpoints backend actualizados para nuevos campos

### Perfiles de Autocompletado
- [x] Tabla Perfiles_Autocompletado creada
- [x] 5 perfiles predeterminados insertados
- [x] 5 endpoints backend implementados (CRUD completo)
- [x] Métodos en AuthService agregados
- [x] Tipos TypeScript creados
- [x] Integración en ConsultaFormView (dropdown, aplicar, guardar)
- [x] Sistema público/privado funcionando

### Speech-to-Text (STT)
- [x] Componente STTButton creado
- [x] Endpoint POST /api/stt implementado
- [x] Integración en ConsultaFormView (8 campos)
- [x] Integración en RecetaFormView (3 campos)
- [x] Integración en ExamenesFormView (2 campos)
- [x] Manejo de errores y permisos
- [x] Estados visuales (listo, grabando, procesando)
- [x] Documentación de configuración (ELEVENLABS_API_KEY)

---

## 📊 Resumen de Migraciones de Base de Datos

### Scripts de Migración Ejecutados

1. **migracion_campos_receta_medica.js**
   - **Tabla**: `Recetas_Medicas`
   - **Campos agregados**:
     - `codigo_diagnostico_principal` (VARCHAR(20))
     - `codigo_diagnostico_rel1` (VARCHAR(20))
     - `codigo_diagnostico_rel2` (VARCHAR(20))
     - `recomendaciones` (TEXT)

2. **migracion_campos_orden_laboratorio.js**
   - **Tabla**: `Ordenes_Laboratorio`
   - **Campos agregados**:
     - `servicio` (VARCHAR(100))
     - `numero_carnet` (VARCHAR(50))
     - `diagnostico_justificacion` (TEXT)

3. **migracion_perfiles_autocompletado.js**
   - **Tabla nueva**: `Perfiles_Autocompletado`
   - **Perfiles iniciales insertados**: 2 (Paciente Joven Normal, Paciente Adulto Mayor Normal)

4. **agregar_perfiles_predeterminados.js**
   - **Perfiles adicionales insertados**: 3
     - Paciente con Hipertensión
     - Paciente con Diabetes Tipo 2
     - Paciente Pediátrico

5. **create_hc_psicologia.js**
   - **Tabla nueva**: `HC_Psicologia` (si no existe)

6. **migracion_campos_hc_medicina.js** (previamente ejecutada)
   - **Tabla**: `HC_Medicina_General`
   - **Campos agregados**: 20+ campos (signos vitales, antropometría, etc.)
   - **Tabla**: `Pacientes`
   - **Campo agregado**: `estado_civil`

### Notas sobre Migraciones

- ✅ Todas las migraciones son **idempotentes**: verifican si las columnas/tablas existen antes de crearlas
- ✅ Se mantiene **compatibilidad** con datos existentes
- ✅ Las migraciones pueden ejecutarse múltiples veces sin errores
- ✅ Estructuras JSON expandidas sin necesidad de migración de BD (manejadas en código)

---

## 🎯 Resumen Ejecutivo de Funcionalidades

### Formularios Completados ✅

| Formulario | Campos Agregados | Estado |
|------------|------------------|--------|
| Recetario Médico (Nº 0048) | 4 campos + estructura JSON expandida | ✅ Completo |
| Solicitud de Laboratorio (Nº 0057) | 3 campos | ✅ Completo |
| Historia Clínica Consulta Ambulatoria | 20+ campos (previamente) | ✅ Completo |

### Perfiles de Autocompletado ✅

- **Tabla creada**: `Perfiles_Autocompletado`
- **Perfiles predeterminados**: 5 (públicos)
- **Funcionalidad**: CRUD completo, sistema público/privado
- **Integración**: ConsultaFormView (HC Medicina)
- **Total endpoints**: 5 (GET, GET/:id, POST, PUT, DELETE)

### Speech-to-Text (STT) ✅

- **Componente**: `STTButton` (reutilizable)
- **API**: ElevenLabs (scribe_v1, español)
- **Campos integrados**: 13 campos en 3 formularios
- **Estados visuales**: Listo, Grabando, Procesando
- **Configuración**: `ELEVENLABS_API_KEY` en backend/.env

### Roles Implementados ✅

- **Psicólogo**: Dashboard, HC Psicológica, Consultas adaptadas, Educación en Salud
- **Enfermero Jefe**: Dashboard, Caracterizaciones, Planes de Cuidado, Consultas

---

## 🔮 Próximos Pasos Sugeridos

1. **Educación en Salud**: Implementar backend completo para actividades de educación en salud
2. **HC_Psicologia**: Expandir campos si se requiere más detalle según necesidades clínicas
3. **Bitácora**: Implementar funcionalidad completa de bitácora mensual
4. **Reportes**: Agregar reportes específicos para cada rol
5. **Notificaciones**: Sistema de notificaciones para asignaciones y seguimientos
6. **STT**: Expandir a más campos y formularios según necesidad
7. **Perfiles**: Crear perfiles específicos para HC_Psicologia y otros tipos de formularios
8. **ADRES**: Implementar integración completa cuando se obtengan credenciales oficiales

---

## 📞 Soporte

Para cualquier duda o problema con la implementación, revisar:
- Logs del backend en consola
- Logs del frontend en DevTools
- Estructura de base de datos con scripts de verificación
- Endpoints usando herramientas como Postman o curl
- Variables de entorno requeridas:
  - `ELEVENLABS_API_KEY` (para STT)
  - `APITUDE_API_KEY` (opcional, para ADRES)

---

**Fecha de Documentación**: Diciembre 2024
**Versión**: 1.0
**Estado**: ✅ Implementación Completa

**Cambios Documentados**:
- ✅ Roles: Psicólogo y Enfermero Jefe
- ✅ Completar Bases de Datos de Formularios
- ✅ Sistema de Perfiles de Autocompletado
- ✅ Expansión de Speech-to-Text (STT)

