# Instrucciones para Probar FHIR en la App

**Estado:** ✅ Backend corriendo y listo  
**Fecha:** 2025-01-XX

---

## ✅ Verificaciones Completadas

- ✅ **Backend corriendo** en puerto 3001
- ✅ **Terminología CIE10 funcionando** (probado con búsqueda "hiper")
- ✅ **Colección Postman lista** para importar
- ✅ **Variables de entorno configuradas** en Postman

---

## ⚠️ Configuración Importante

**El backend está intentando conectarse a HAPI FHIR local (puerto 8080) que no está disponible.**

### Opción 1: Usar HAPI FHIR Público (Recomendado - Sin Docker)

**Crear archivo:** `backend/.env`

```env
FHIR_BASE_URL=https://hapi.fhir.org/baseR4
```

**Luego reiniciar el backend:**
```powershell
# Detener el backend actual (Ctrl+C en la terminal donde corre)
# Luego iniciar de nuevo:
cd backend
npm start
```

### Opción 2: Continuar sin Configuración (Funciona pero con errores en metadata)

Si no configuras `.env`, la sincronización automática funcionará pero:
- El endpoint `/api/fhir/metadata` dará error (no crítico)
- Las operaciones CREATE/READ/UPDATE/DELETE funcionarán si configuras HAPI público en Postman

---

## 🧪 Pruebas que DEBES Hacer en la App

### Prueba 1: Historia Clínica con Sincronización FHIR

**Pasos:**
1. Abrir la app en el navegador: `http://localhost:3000` (o el puerto que uses)
2. Iniciar sesión como **médico**
3. Ir a **"Consultas Asignadas"** o el menú principal
4. Seleccionar un paciente
5. Completar Historia Clínica:
   - **Motivo de consulta:** "Control de hipertensión"
   - **Diagnóstico principal:** 
     - Escribir "I10" o "hiper" en el campo
     - Seleccionar del autocompletado: "I10 - Hipertensión esencial (primaria)"
   - **Diagnósticos relacionados:** (opcional) Agregar más si quieres
6. **Guardar**

**Qué Observar:**
- ✅ Debe aparecer un badge/indicador de estado FHIR
- ✅ El badge debe cambiar a "FHIR actualizado" (verde) o mostrar error
- ✅ Abrir consola del navegador (F12 → Console) y verificar:
  - No debe haber errores en rojo
  - Debe aparecer algún mensaje de sincronización

**Resultado Esperado:**
```
✅ Badge muestra: "FHIR actualizado" (verde)
✅ No hay errores en consola
✅ Datos guardados localmente
```

---

### Prueba 2: Recetario con Sincronización FHIR

**Pasos:**
1. Con el **mismo paciente** de la Prueba 1
2. Ir a la pestaña **"Receta"**
3. Completar receta:
   - **Diagnóstico principal:** Seleccionar uno
   - **Medicamentos:**
     - Escribir "ena" en el campo de medicamento
     - Seleccionar del autocompletado (ej: "Enalapril")
     - Especificar dosis: "1 tableta cada 12 horas"
     - Agregar más medicamentos si quieres
4. **Guardar**

**Qué Observar:**
- ✅ Badge de estado FHIR debe mostrar "FHIR actualizado"
- ✅ Verificar en consola que no hay errores
- ✅ La receta se guarda correctamente

**Resultado Esperado:**
```
✅ Badge muestra: "FHIR actualizado" (verde)
✅ Medicamentos guardados
✅ Sincronización exitosa
```

---

### Prueba 3: Verificar en HAPI FHIR Web (Opcional)

**Si quieres ver los recursos creados:**

1. Abrir: `https://hapi.fhir.org/`
2. Click en **"FHIR Tester UI"**
3. Buscar **"Patient"** por el documento del paciente
4. Verificar que existe con los datos correctos
5. Buscar **"Condition"** y ver los diagnósticos
6. Buscar **"MedicationRequest"** y ver las recetas

---

## 🔍 Qué Revisar si Hay Problemas

### Si el Badge Muestra "Error en FHIR"

**Revisar:**
1. **Consola del navegador (F12 → Console):**
   - Buscar mensajes de error en rojo
   - Copiar el mensaje de error completo

2. **Consola del servidor backend:**
   - Ver si hay errores relacionados con FHIR
   - Verificar que el backend está corriendo

3. **Configuración:**
   - Verificar que `FHIR_BASE_URL` está configurado en `.env`
   - O que el backend puede alcanzar el servidor FHIR

### Si el Autocompletado No Funciona

**CIE10:**
- Escribir al menos 2 caracteres
- Esperar un momento para que cargue
- Verificar que el backend está respondiendo en `/api/terminology/cie10`

**Medicamentos:**
- Escribir al menos 2 caracteres
- Verificar que el backend está respondiendo en `/api/terminology/medications`

---

## 📋 Checklist de Pruebas

### Funcionalidad Básica
- [ ] App carga correctamente
- [ ] Puedo iniciar sesión
- [ ] Puedo acceder a consultas/pacientes
- [ ] Puedo seleccionar un paciente

### Historia Clínica
- [ ] Formulario se muestra correctamente
- [ ] Autocompletado CIE10 funciona
- [ ] Puedo guardar Historia Clínica
- [ ] Badge FHIR aparece y muestra estado correcto
- [ ] No hay errores en consola

### Recetario
- [ ] Puedo acceder a pestaña Receta
- [ ] Autocompletado medicamentos funciona
- [ ] Puedo agregar medicamentos
- [ ] Puedo guardar receta
- [ ] Badge FHIR muestra estado correcto
- [ ] No hay errores en consola

---

## ✅ Estado Actual

**Backend:**
- ✅ Corriendo en puerto 3001
- ✅ Terminología funcionando
- ✅ Endpoints FHIR implementados
- ⚠️ Necesita configuración `.env` para usar HAPI público

**Frontend:**
- ✅ Servicio FHIR integrado
- ✅ Sincronización automática configurada
- ✅ Badges de estado implementados

**Listo para:**
- ✅ Probar sincronización en la app
- ✅ Verificar funcionamiento end-to-end

---

## 🚀 Siguiente Paso

**Ahora puedes probar en la app siguiendo las Pruebas 1 y 2.**

Si encuentras problemas, revisa la consola del navegador y del servidor para ver los errores específicos.

**¡Todo está listo para probar!**

