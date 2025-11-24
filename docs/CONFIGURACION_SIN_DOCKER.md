# Configuración FHIR Sin Docker

**Problema:** Docker no está instalado o no está disponible  
**Solución:** Usar HAPI FHIR público (no requiere instalación)

---

## ✅ Solución: Usar HAPI FHIR Público

### Ventajas
- ✅ No requiere Docker
- ✅ No requiere instalación
- ✅ Siempre disponible
- ✅ Perfecto para pruebas y demostraciones

### Desventajas
- ⚠️ Datos compartidos con otros usuarios (usar IDs únicos)
- ⚠️ No es para producción

---

## 📋 Configuración Paso a Paso

### 1. Configurar Variables en Postman

1. Abrir Postman
2. Importar entorno: `docs/postman/HAPI-FHIR-Test-Server.postman_environment.json`
3. Editar el entorno y configurar:
   - `base_url` = `https://hapi.fhir.org/baseR4`
   - `api_base` = `http://localhost:3001/api`
4. Guardar

### 2. Configurar Backend (Opcional)

Si quieres que el backend también use HAPI público:

**Archivo:** `backend/.env` (o crear si no existe)

```env
FHIR_BASE_URL=https://hapi.fhir.org/baseR4
```

**Nota:** Si no tienes `.env`, el backend usará el valor por defecto `http://localhost:8080/hapi-fhir-jpaserver/fhir`. Para usar HAPI público, crea el archivo `.env` con la variable arriba.

### 3. Iniciar Backend

```powershell
cd backend
npm start
```

Verificar que está corriendo en `http://localhost:3001`

### 4. Probar con Postman

1. Importar colección: `docs/postman/FHIR-Operaciones-Completas.postman_collection.json`
2. Seleccionar entorno: "HAPI FHIR Test Server"
3. Ejecutar requests:
   - `01 - Get CapabilityStatement` → Debe funcionar con HAPI público
   - `02 - Create Patient` → Creará un Patient en HAPI público
   - Continuar con el resto de requests

---

## 🧪 Pruebas Recomendadas

### Prueba 1: CapabilityStatement
- **Request:** `01 - Get CapabilityStatement`
- **URL:** `{{base_url}}/metadata`
- **Resultado esperado:** Status 200, JSON con información del servidor

### Prueba 2: Crear Patient
- **Request:** `02 - Create Patient (POST)`
- **Modificar:** Usar un documento único (ej: `CC12345678` + timestamp)
- **Resultado esperado:** Status 201, ID guardado automáticamente

### Prueba 3: Leer Patient
- **Request:** `03 - Read Patient (GET)`
- **Resultado esperado:** Status 200, datos del Patient creado

---

## 🔍 Verificar Recursos en HAPI FHIR Web

1. Abrir navegador: `https://hapi.fhir.org/`
2. Click en "FHIR Tester UI"
3. Seleccionar recurso (ej: Patient)
4. Buscar por ID o usar filtros
5. Ver detalles del recurso

---

## ⚠️ Notas Importantes

### IDs Únicos
Como los datos son compartidos, usa IDs únicos:
- Documentos: `CC12345678` + timestamp
- Nombres: Agregar sufijo único

### Datos Temporales
Los datos en HAPI público pueden ser eliminados periódicamente. No usar para datos permanentes.

### Alternativa: Solo Gateway Backend
Si solo quieres probar el gateway del backend (sin servidor FHIR externo):
- Usar `{{api_base}}/fhir/*` en Postman
- El backend intentará conectarse al servidor FHIR configurado
- Si `FHIR_BASE_URL` no está configurado, fallará

---

## 🎯 Resumen

**Para Práctica 03 (Sin Docker):**
1. ✅ Usar HAPI FHIR público: `https://hapi.fhir.org/baseR4`
2. ✅ Configurar `base_url` en Postman
3. ✅ Ejecutar colección completa
4. ✅ Verificar recursos en `https://hapi.fhir.org/`

**Todo funciona sin necesidad de Docker.**

