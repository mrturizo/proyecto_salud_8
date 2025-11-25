# Configuración de URL del Backend

## 📋 Resumen

Este documento explica cómo configurar la URL del backend en el proyecto. **Por defecto, todo apunta a la URL de producción** (`https://salud-digital-backend.onrender.com`).

---

## 🔧 Configuración

### Frontend (`src/config/api.ts`)

**Por defecto**: `https://salud-digital-backend.onrender.com`

**Para desarrollo local**, crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend Scripts (`backend/config.js`)

**Por defecto**: `https://salud-digital-backend.onrender.com`

**Para desarrollo local**, crea un archivo `.env` en `backend/`:

```env
BACKEND_URL=http://localhost:3001
```

### Variables adicionales para STT/TTS

Backend (`backend/.env`):

```env
HF_API_TOKEN=tu_token_de_huggingface
HF_STT_MODEL=openai/whisper-large-v2
STT_DEFAULT_PROVIDER=huggingface   # huggingface | elevenlabs
```

Frontend (`.env.local`):

```env
VITE_DEFAULT_STT_PROVIDER=huggingface
VITE_ENABLE_TTS=true
```

Estas variables permiten alternar entre el modelo gratuito de Hugging Face (Whisper) y ElevenLabs. El selector también está disponible dentro de la aplicación.

---

## 📁 Archivos de Configuración

### Frontend: `src/config/api.ts`

```typescript
// URL de producción por defecto
const PRODUCTION_BACKEND_URL = 'https://salud-digital-backend.onrender.com';
const LOCAL_BACKEND_URL = 'http://localhost:3001';

// En producción, siempre usa la URL de producción
// En desarrollo, usa la variable de entorno o producción por defecto
```

### Backend: `backend/config.js`

```javascript
// URL de producción por defecto
const PRODUCTION_BACKEND_URL = 'https://salud-digital-backend.onrender.com';
const LOCAL_BACKEND_URL = 'http://localhost:3001';

// En producción, siempre usa la URL de producción
// En desarrollo, usa la variable de entorno o producción por defecto
```

---

## 🚀 Uso

### En el Frontend

Todos los servicios usan `API_BASE_URL` de `src/config/api.ts`:

```typescript
import { API_BASE_URL } from '../config/api';

// Ejemplo de uso
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

### En Scripts del Backend

Todos los scripts usan `API_BASE_URL` de `backend/config.js`:

```javascript
const { API_BASE_URL } = require('./config');

// Ejemplo de uso
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
```

---

## 📝 Archivos Actualizados

Los siguientes archivos ahora usan la configuración centralizada:

### Frontend
- ✅ `src/config/api.ts` - Configuración centralizada
- ✅ `src/services/authService.ts` - Usa `API_BASE_URL`
- ✅ `src/services/aiService.ts` - Usa `API_BASE_URL`
- ✅ `src/services/fhirService.ts` - Usa `API_BASE_URL`
- ✅ `src/services/terminologyService.ts` - Usa `API_BASE_URL`
- ✅ `src/App.tsx` - Usa `API_BASE_URL` para TTS y STT
- ✅ `src/components/STTButton.tsx` - Usa `API_BASE_URL`

### Backend Scripts
- ✅ `backend/config.js` - Configuración centralizada
- ✅ `backend/probar_login.js` - Usa `API_BASE_URL`
- ✅ `backend/verificar_endpoints_medicos.js` - Usa `API_BASE_URL`
- ✅ `backend/test_basic_endpoints.js` - Usa `API_BASE_URL`

---

## 🔒 Seguridad

- **En producción**, el código ignora cualquier variable de entorno que apunte a `localhost` por seguridad.
- **Por defecto**, todo apunta a la URL de producción.
- Solo se usa `localhost` si explícitamente se configura en un archivo `.env.local` (frontend) o `.env` (backend) y estás en desarrollo.

---

## 🧪 Verificación

### Frontend

Abre la consola del navegador y verifica:

```javascript
// Deberías ver:
🔧 Configuración API: {
  BACKEND_URL: "https://salud-digital-backend.onrender.com",
  API_BASE_URL: "https://salud-digital-backend.onrender.com/api",
  MODE: "production",
  PROD: true,
  ...
}
```

### Backend Scripts

Ejecuta cualquier script y verifica:

```bash
node backend/probar_login.js
# Deberías ver:
# 🔧 Configuración Backend: {
#   BACKEND_URL: "https://salud-digital-backend.onrender.com",
#   API_BASE_URL: "https://salud-digital-backend.onrender.com/api",
#   ...
# }
```

---

## 🛠️ Cambiar la URL

### Opción 1: Variable de Entorno (Recomendado)

**Frontend**: Crea `.env.local`:
```env
VITE_BACKEND_URL=https://tu-backend.com
```

**Backend**: Crea `backend/.env`:
```env
BACKEND_URL=https://tu-backend.com
```

### Opción 2: Editar Configuración Directamente

**Frontend**: Edita `src/config/api.ts`:
```typescript
const PRODUCTION_BACKEND_URL = 'https://tu-backend.com';
```

**Backend**: Edita `backend/config.js`:
```javascript
const PRODUCTION_BACKEND_URL = 'https://tu-backend.com';
```

---

## 📚 Documentación Relacionada

- [Rutas API Usuarios](./RUTAS_API_USUARIOS.md)
- [Configuración Vercel](./CONFIGURACION_VERCEL.md)

