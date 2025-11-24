# Integración de Inteligencia Artificial - Documentación

## Resumen

Se ha integrado un sistema de predicción de riesgo de stroke usando modelos de machine learning preentrenados de código abierto. La implementación permite analizar el riesgo de stroke basado en datos demográficos, signos vitales, antecedentes y parámetros clínicos del paciente.

## Arquitectura

```
Frontend (React)
    ↓
src/services/aiService.ts
    ↓
Backend API (/api/ai/predict/stroke)
    ↓
backend/services/aiService.js
    ↓
backend/services/dataMapper.js (mapeo de datos)
    ↓
backend/models/predict_stroke.py (script Python)
    ↓
Modelo ML (stroke_model.pkl)
```

## Componentes Implementados

### Backend

1. **`backend/services/aiService.js`**
   - Servicio principal de IA
   - Función `predictStrokeRisk()` para predecir riesgo de stroke
   - Generación de recomendaciones basadas en nivel de riesgo
   - Placeholders para futuras funciones (sugerencias de diagnóstico, resúmenes)

2. **`backend/services/dataMapper.js`**
   - Mapea datos de la app a features requeridas por el modelo
   - Valida y limpia datos numéricos
   - Maneja valores faltantes con defaults apropiados
   - Detecta hipertensión y enfermedad cardiaca desde texto libre

3. **`backend/models/predict_stroke.py`**
   - Script Python que carga y ejecuta el modelo `.pkl`
   - Recibe features por stdin (JSON)
   - Retorna predicción por stdout (JSON)

4. **Endpoints en `backend/server.js`**
   - `POST /api/ai/predict/stroke` - Predicción de riesgo de stroke
   - `GET /api/ai/suggest/diagnosis` - Sugerencias de diagnóstico (placeholder)
   - `POST /api/ai/generate/summary` - Resumen automático (placeholder)

### Frontend

1. **`src/services/aiService.ts`**
   - Cliente TypeScript para endpoints de IA
   - Funciones: `predictStrokeRisk()`, `suggestDiagnosis()`, `generateSummary()`

2. **`src/components/RiskBadge.tsx`**
   - Componente para mostrar badge de riesgo
   - Colores: verde (bajo), amarillo (moderado), rojo (alto)
   - Muestra probabilidad como porcentaje

3. **`src/components/AISuggestionsPanel.tsx`**
   - Panel que muestra recomendaciones basadas en predicción
   - Lista de recomendaciones personalizadas según nivel de riesgo

4. **Integración en `src/App.tsx` (ConsultaFormView)**
   - Botón "Analizar Riesgo" en sección de signos vitales
   - Muestra resultado con RiskBadge y AISuggestionsPanel
   - Estados para manejar carga y errores

## Mapeo de Datos

### Features Requeridas por el Modelo

El modelo de stroke requiere las siguientes features:

1. `age` (float) - Edad del paciente
2. `hypertension` (int: 0/1) - Hipertensión arterial
3. `heart_disease` (int: 0/1) - Enfermedad cardiaca
4. `avg_glucose_level` (float) - Nivel promedio de glucosa
5. `bmi` (float) - Índice de masa corporal
6. `gender_Male` (int: 0/1) - Género masculino
7. `gender_Other` (int: 0/1) - Otro género
8. `ever_married_Yes` (int: 0/1) - Alguna vez casado
9. `work_type_*` (int: 0/1) - Tipo de trabajo (4 variables)
10. `Residence_type_Urban` (int: 0/1) - Residencia urbana
11. `smoking_status_*` (int: 0/1) - Estado de tabaquismo (3 variables)

### Mapeo desde Datos de la App

- **Edad**: `patient.edad` o calculada desde `fecha_nacimiento`
- **Hipertensión**: Detectada desde `antecedentesPersonales.patologicos` o TA > 140/90
- **Enfermedad cardiaca**: Detectada desde antecedentes patológicos
- **Glucosa**: `glucometria` del formulario
- **IMC**: Calculado desde `peso` y `talla` o `imc` directo
- **Género**: `patient.genero` o `patient.sexo`
- **Estado civil**: `estadoCivil` del formulario
- **Tipo de trabajo**: `ocupacion` desde `Caracterizacion_Paciente` (obtenido automáticamente)
- **Tipo de residencia**: `territorio` desde `Familias.territorio` (obtenido automáticamente)
- **Estado de tabaquismo**: Detectado desde `antecedentesPersonales.toxicologicos` (texto libre)

## Instalación y Configuración

### Dependencias

1. **Backend** (`backend/package.json`):
   ```json
   "python-shell": "^5.0.0"
   ```

2. **Python** (requerido en el sistema):
   - Python 3.7+
   - scikit-learn
   - numpy
   - pickle (incluido en Python)

### Modelo Descargado

✅ **El modelo ya está descargado**: `stroke_model.pkl` (15.8 MB) en `backend/models/`

**Fuente original**: https://github.com/Monirules/Stroke-Predictor-app

### Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Python (si no están instaladas)
pip install scikit-learn numpy
```

## Uso

### Desde la Interfaz

1. Abrir Historia Clínica de un paciente
2. Completar al menos:
   - Edad del paciente (o fecha de nacimiento)
   - Signos vitales (opcional pero recomendado)
   - Antecedentes personales (opcional)
3. Hacer clic en "Analizar Riesgo" en la sección de Signos Vitales
4. Ver resultado:
   - Badge con nivel de riesgo y probabilidad
   - Panel con recomendaciones personalizadas

### Desde el Código

```typescript
import { predictStrokeRisk } from './services/aiService';

const patientData = {
  age: 65,
  gender: 'Masculino',
  tensionSistolica: 150,
  tensionDiastolica: 95,
  glucometria: 120,
  peso: 80,
  talla: 1.75,
  antecedentesPersonales: { patologicos: 'Hipertensión arterial' }
};

const result = await predictStrokeRisk(patientData);
if (result.success) {
  console.log('Riesgo:', result.risk_level);
  console.log('Probabilidad:', result.probability);
  console.log('Recomendaciones:', result.recommendations);
}
```

## Niveles de Riesgo

- **Bajo** (`low`): Probabilidad < 30%
- **Moderado** (`medium`): Probabilidad 30-70%
- **Alto** (`high`): Probabilidad > 70%

## Recomendaciones Generadas

Las recomendaciones se generan automáticamente según:
- Nivel de riesgo predicho
- Factores de riesgo detectados (hipertensión, glucosa elevada, IMC alto, etc.)
- Antecedentes cardiovasculares

## Estado Actual

✅ **Modelo descargado**: `stroke_model.pkl` (15.8 MB) en `backend/models/`
✅ **Mapeo mejorado**: Todas las variables se obtienen desde datos reales:
   - Territorio desde `Familias.territorio`
   - Ocupación desde `Caracterizacion_Paciente.ocupacion`
   - Tabaquismo detectado desde `antecedentesPersonales.toxicologicos`

## Próximos Pasos

1. **Probar predicción**: Usar la función desde la interfaz
2. **Validar mapeo**: Verificar que los datos se mapean correctamente en la consola
3. **Agregar más modelos**: Diabetes, heart disease, etc.
4. **Implementar NLP**: Para sugerencias de diagnóstico y resúmenes

## Troubleshooting

### Error: "Modelo no encontrado"
- Verificar que `stroke_model.pkl` existe en `backend/models/`
- Verificar permisos de lectura del archivo

### Error: "Python no encontrado"
- Instalar Python 3.7+
- Verificar que `python` o `python3` está en PATH
- Ajustar `pythonPath` en `aiService.js` si es necesario

### Error: "Faltan campos requeridos"
- Asegurar que al menos `age` está disponible
- Verificar que los datos del paciente se están pasando correctamente

### Predicciones incorrectas
- Verificar mapeo de datos en `dataMapper.js`
- Revisar logs del backend para ver features enviadas al modelo
- Validar que los valores numéricos están en rangos razonables

## Notas Técnicas

- El modelo se ejecuta en un proceso Python separado usando `python-shell`
- Los datos se validan y limpian antes de enviarse al modelo
- Valores faltantes se reemplazan con defaults razonables
- Las recomendaciones se generan dinámicamente basadas en el resultado

## Referencias

- Stroke Predictor App: https://github.com/Monirules/Stroke-Predictor-app
- MediAI Models: https://www.kaggle.com/models/sanjaykumar567/mediai-smart-disease-predictor

