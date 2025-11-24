# Documentación de Rutas API - Usuarios y Autenticación

## 📋 Base URL

**Producción**: `https://salud-digital-backend.onrender.com/api`  
**Desarrollo Local**: `http://localhost:3001/api`

---

## 🔐 Autenticación

### POST `/api/auth/login`
Autentica un usuario en el sistema.

**Request Body:**
```json
{
  "email": "medico1@saludigital.edu.co",
  "password": "1000000001"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Dr. Carlos Mendoza",
    "email": "medico1@saludigital.edu.co",
    "role": "Médico",
    "roleId": 1,
    "team": null,
    "document": "1000000001"
  }
}
```

**Response Error (401):**
```json
{
  "error": "Email o contraseña incorrectos"
}
```

---

## 👥 Usuarios

### GET `/api/usuarios`
Obtiene información sobre usuarios (ruta informativa).

**Response:**
```json
{
  "message": "Use /api/usuarios/rol/:rol para obtener usuarios por rol"
}
```

### GET `/api/usuarios/rol/:rol`
Obtiene usuarios por rol.

**Parámetros:**
- `rol` (path): Nombre del rol (ej: "Médico", "Psicólogo", "Enfermero Jefe")

**Response Success (200):**
```json
[
  {
    "usuario_id": 1,
    "nombre_completo": "Dr. Carlos Mendoza",
    "email": "medico1@saludigital.edu.co",
    "numero_documento": "1000000001",
    "rol_id": 1,
    "nombre_rol": "Médico"
  }
]
```

### GET `/api/usuarios/:id/hc-completadas`
Obtiene las historias clínicas completadas por un usuario (médico).

**Parámetros:**
- `id` (path): ID del usuario
- `desde` (query, opcional): Fecha desde (formato: YYYY-MM-DD)
- `hasta` (query, opcional): Fecha hasta (formato: YYYY-MM-DD)

**Response Success (200):**
```json
[
  {
    "atencion_id": 1,
    "paciente_id": 1,
    "usuario_id": 1,
    "fecha_atencion": "2025-11-14",
    "motivo_consulta": "Dolor de cabeza",
    "diagnostico_principal": "Cefalea tensional",
    "paciente_nombre": "Juan Pérez",
    "paciente_documento": "1234567890"
  }
]
```

### GET `/api/usuarios/:id/hc-psicologia-completadas`
Obtiene las historias clínicas de psicología completadas por un usuario (psicólogo).

**Parámetros:**
- `id` (path): ID del usuario
- `desde` (query, opcional): Fecha desde (formato: YYYY-MM-DD)
- `hasta` (query, opcional): Fecha hasta (formato: YYYY-MM-DD)

**Response Success (200):**
```json
[
  {
    "atencion_id": 1,
    "paciente_id": 1,
    "usuario_id": 2,
    "fecha_atencion": "2025-11-14",
    "motivo_consulta": "Ansiedad",
    "paciente_nombre": "Juan Pérez",
    "paciente_documento": "1234567890"
  }
]
```

### GET `/api/usuarios/:id/bitacora`
Obtiene la bitácora mensual de un usuario.

**Parámetros:**
- `id` (path): ID del usuario
- `mes` (query, opcional): Mes (1-12). Si no se especifica, usa el mes actual.
- `ano` (query, opcional): Año (ej: 2025). Si no se especifica, usa el año actual.

**Response Success (200):**
```json
{
  "mes": 11,
  "ano": 2025,
  "total_atenciones": 25,
  "total_hc_medicina": 15,
  "total_hc_psicologia": 10,
  "dias_trabajados": 20,
  "promedio_diario": 1.25,
  "detalle_diario": [
    {
      "fecha": "2025-11-01",
      "atenciones": 2,
      "hc_medicina": 1,
      "hc_psicologia": 1
    }
  ]
}
```

### GET `/api/usuarios/:id/demandas-asignadas`
Obtiene las demandas asignadas a un usuario.

**Parámetros:**
- `id` (path): ID del usuario

**Response Success (200):**
```json
[
  {
    "demanda_id": 1,
    "paciente_id": 1,
    "usuario_asignado_id": 1,
    "tipo_demanda": "Consulta médica",
    "prioridad": "Alta",
    "estado": "Pendiente",
    "fecha_creacion": "2025-11-14",
    "paciente_nombre": "Juan Pérez"
  }
]
```

### GET `/api/usuarios/:id/resumen-actividad`
Obtiene un resumen de actividad de un usuario.

**Parámetros:**
- `id` (path): ID del usuario

**Response Success (200):**
```json
{
  "usuario_id": 1,
  "nombre": "Dr. Carlos Mendoza",
  "total_atenciones": 150,
  "total_hc_medicina": 100,
  "total_hc_psicologia": 50,
  "total_recetas": 80,
  "total_ordenes_laboratorio": 60,
  "mes_actual": {
    "atenciones": 25,
    "recetas": 15,
    "ordenes": 10
  }
}
```

---

## 🔍 Debug y Utilidades

### GET `/api/debug/users`
Obtiene información de debug sobre usuarios (solo desarrollo).

**Response Success (200):**
```json
{
  "total_usuarios": 10,
  "usuarios_por_rol": {
    "Médico": 3,
    "Psicólogo": 2,
    "Enfermero Jefe": 1
  },
  "usuarios": [
    {
      "usuario_id": 1,
      "nombre_completo": "Dr. Carlos Mendoza",
      "email": "medico1@saludigital.edu.co",
      "rol": "Médico"
    }
  ]
}
```

---

## 📝 Notas

1. **Autenticación**: Todas las rutas (excepto `/api/auth/login`) requieren autenticación. El token debe enviarse en el header `Authorization: Bearer <token>` (si se implementa en el futuro).

2. **Roles disponibles**:
   - Médico
   - Psicólogo
   - Fisioterapeuta
   - Nutricionista
   - Fonoaudiólogo
   - Odontólogo
   - Enfermero Jefe
   - Auxiliar de Enfermería
   - Administrativo

3. **Formato de fechas**: Todas las fechas se manejan en formato ISO 8601 (YYYY-MM-DD).

4. **Códigos de estado HTTP**:
   - `200`: Success
   - `400`: Bad Request (datos inválidos)
   - `401`: Unauthorized (credenciales inválidas)
   - `404`: Not Found (recurso no encontrado)
   - `500`: Internal Server Error (error del servidor)

---

## 🔗 Rutas Relacionadas

### Familias
- `GET /api/familias` - Listar familias
- `GET /api/familias/:id` - Obtener familia por ID
- `GET /api/familias/:id/pacientes` - Obtener pacientes de una familia
- `GET /api/familias/:id/caracterizacion` - Obtener caracterización de una familia

### Pacientes
- `GET /api/pacientes/buscar?q=termino` - Buscar pacientes
- `GET /api/pacientes/:id` - Obtener paciente por ID
- `GET /api/pacientes/:id/recetas` - Obtener recetas de un paciente
- `GET /api/pacientes/:id/ordenes-laboratorio` - Obtener órdenes de laboratorio de un paciente

### Historia Clínica
- `POST /api/hc/medicina` - Crear historia clínica de medicina
- `GET /api/hc/medicina/:atencion_id` - Obtener historia clínica de medicina
- `PUT /api/hc/medicina/:atencion_id` - Actualizar historia clínica de medicina
- `POST /api/hc/psicologia` - Crear historia clínica de psicología
- `GET /api/hc/psicologia/:atencion_id` - Obtener historia clínica de psicología
- `PUT /api/hc/psicologia/:atencion_id` - Actualizar historia clínica de psicología

---

## 🛠️ Configuración

Para cambiar la URL del backend, edita el archivo de configuración:

**Frontend**: `src/config/api.ts`  
**Backend (scripts)**: `backend/config.js`

O usa variables de entorno:
- Frontend: `VITE_BACKEND_URL`
- Backend: `BACKEND_URL`

