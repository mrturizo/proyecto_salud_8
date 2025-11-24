# Solución: Error al Guardar Historia Clínica - FHIR no Sincroniza

**Problema:** La sincronización FHIR se inicia pero no se completa, no aparece el badge "FHIR actualizado"

---

## 🔍 Diagnóstico

El backend está intentando conectarse a:
```
http://localhost:8080/hapi-fhir-jpaserver/fhir
```

Pero ese servidor **no está disponible** porque:
- Docker no está instalado o no está corriendo
- El servidor HAPI FHIR local no está iniciado

---

## ✅ Solución

### Paso 1: Actualizar Configuración del Backend

**Editar archivo:** `backend/.env`

**Cambiar esta línea:**
```env
FHIR_BASE_URL=http://localhost:8080/hapi-fhir-jpaserver/fhir
```

**Por esta:**
```env
FHIR_BASE_URL=https://hapi.fhir.org/baseR4
```

### Paso 2: Reiniciar el Backend

1. Ir a la terminal donde está corriendo el backend
2. Presionar `Ctrl+C` para detenerlo
3. Ejecutar:
   ```powershell
   cd backend
   npm start
   ```

### Paso 3: Verificar

1. Recargar la página de la app (F5)
2. Guardar una Historia Clínica
3. En la consola deberías ver:
   ```
   🔄 Iniciando sincronización FHIR...
   📤 Enviando Patient a FHIR...
   ✅ Patient sincronizado exitosamente
   📤 Enviando Conditions a FHIR...
   ✅ Sincronización FHIR completada exitosamente
   ```
4. El badge debería mostrar "FHIR actualizado" (verde)

---

## 🔍 Verificar que Funcionó

### En la Consola del Backend

Deberías ver mensajes como:
```
[FHIR Client] POST https://hapi.fhir.org/baseR4/Patient
[FHIR Client] POST Patient success
```

### En la Consola del Navegador

Deberías ver:
```
✅ Patient sincronizado exitosamente
✅ X Condition(s) sincronizado(s) exitosamente
✅ Sincronización FHIR completada exitosamente
📊 Estado FHIR actualizado: success
```

### En la Interfaz

- Badge verde "FHIR actualizado" aparece arriba a la derecha del formulario

---

## ⚠️ Si Aún No Funciona

### Verificar Error Específico

1. Abrir consola del navegador (F12 → Console)
2. Buscar mensajes en rojo que empiecen con "❌"
3. Copiar el mensaje de error completo

### Verificar Backend

1. Abrir consola del servidor backend
2. Buscar mensajes que empiecen con "❌ [FHIR]"
3. Verificar el mensaje de error

### Verificar Configuración

1. Verificar que el archivo `backend/.env` tiene:
   ```
   FHIR_BASE_URL=https://hapi.fhir.org/baseR4
   ```
2. Verificar que el backend se reinició después del cambio
3. Verificar que no hay errores de sintaxis en `.env`

---

## 📝 Nota

Si prefieres usar un servidor FHIR local en el futuro:
1. Instalar Docker Desktop
2. Ejecutar: `cd sandbox/hapi-fhir; docker compose up -d`
3. Cambiar `FHIR_BASE_URL` de vuelta a `http://localhost:8080/hapi-fhir-jpaserver/fhir`

Por ahora, usar HAPI público es la solución más rápida y no requiere Docker.

