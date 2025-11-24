# Configuración de Vercel para Frontend

## Problema: Frontend llamando a localhost en producción

Si el frontend desplegado en Vercel está intentando conectarse a `localhost:3001` en lugar de `https://salud-digital-backend.onrender.com`, sigue estos pasos:

## Solución

### 1. Verificar el código

El archivo `src/config/api.ts` ahora tiene la lógica correcta:
- En **producción** (Vercel), siempre usa `https://salud-digital-backend.onrender.com`
- En **desarrollo local**, usa `http://localhost:3001`

### 2. Verificar variables de entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com
2. Abre la configuración del proyecto
3. Ve a **Settings** → **Environment Variables**
4. **IMPORTANTE**: Verifica si hay una variable `VITE_BACKEND_URL` configurada con `http://localhost:3001`
   - Si existe, **BÓRRALA** o cámbiala a `https://salud-digital-backend.onrender.com`
   - Si no existe, **NO la crees** (el código ya tiene el valor por defecto correcto)

### 3. Hacer commit y push del código actualizado

```bash
git add src/config/api.ts
git add src/services/*.ts
git add src/App.tsx
git add src/components/STTButton.tsx
git commit -m "fix: Configurar URL del backend para producción"
git push
```

### 4. Forzar nuevo build en Vercel

1. En Vercel, ve a **Deployments**
2. Encuentra el último deployment
3. Haz clic en los **3 puntos** (⋯) → **Redeploy**
4. Selecciona **Use existing Build Cache** (opcional, puedes desmarcarlo para forzar un build limpio)

### 5. Verificar el deployment

Después del deployment:
1. Abre la consola del navegador en tu aplicación desplegada
2. Deberías ver un log: `🔧 Configuración API:` con:
   - `BACKEND_URL: "https://salud-digital-backend.onrender.com"`
   - `API_BASE_URL: "https://salud-digital-backend.onrender.com/api"`
   - `MODE: "production"`
   - `PROD: true`

### 6. Si aún no funciona

Si después de estos pasos todavía intenta conectarse a localhost:

1. **Limpiar caché de Vercel**:
   - Ve a **Settings** → **Build & Development Settings**
   - En **Build Command**, verifica que sea: `npm run build`
   - Guarda los cambios

2. **Verificar que no hay archivos .env en el repositorio**:
   ```bash
   # Verificar que .env no esté en el repositorio
   git ls-files | grep .env
   ```
   Si aparece algún archivo `.env`, elimínalo del repositorio (pero mantenlo en `.gitignore`)

3. **Forzar build sin caché**:
   - En Vercel, crea un nuevo deployment
   - En las opciones avanzadas, desmarca **Use existing Build Cache**

## Configuración recomendada en Vercel

### Variables de entorno (opcional)

Si quieres configurar explícitamente la URL del backend en Vercel:

1. Ve a **Settings** → **Environment Variables**
2. Agrega:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `https://salud-digital-backend.onrender.com`
   - **Environment**: Production, Preview, Development (todas)
3. Guarda y haz un nuevo deployment

**Nota**: No es necesario configurar esta variable si no quieres, ya que el código tiene el valor por defecto correcto.

## Verificación final

Después de desplegar, abre la consola del navegador y verifica:

```javascript
// Deberías ver esto en la consola:
🔧 Configuración API: {
  BACKEND_URL: "https://salud-digital-backend.onrender.com",
  API_BASE_URL: "https://salud-digital-backend.onrender.com/api",
  MODE: "production",
  PROD: true,
  DEV: false,
  VITE_BACKEND_URL: "(no configurado)" // o la URL si está configurada
}
```

Si ves `localhost:3001` en algún lugar, el build no se actualizó correctamente o hay una variable de entorno mal configurada.

