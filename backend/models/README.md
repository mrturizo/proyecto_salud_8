# Modelos de Machine Learning

Esta carpeta contiene los modelos de ML preentrenados para predicciones médicas.

## Modelos Disponibles

- `stroke_model.pkl` - Modelo para predicción de riesgo de stroke (ACV)

## Descarga de Modelos

### Stroke Model
El modelo debe descargarse desde:
- GitHub: https://github.com/Monirules/Stroke-Predictor-app
- Buscar el archivo `model_pickle.pkl` en el repositorio

### Instrucciones
1. Descargar `model_pickle.pkl` desde el repositorio
2. Renombrar a `stroke_model.pkl`
3. Colocar en esta carpeta `backend/models/`

## Estructura de Features Requeridas

### Stroke Model
El modelo requiere las siguientes features en este orden:
- age (float)
- hypertension (int: 0 o 1)
- heart_disease (int: 0 o 1)
- avg_glucose_level (float)
- bmi (float)
- gender_Male (int: 0 o 1)
- gender_Other (int: 0 o 1)
- ever_married_Yes (int: 0 o 1)
- work_type_Never_worked (int: 0 o 1)
- work_type_Private (int: 0 o 1)
- work_type_Self_employed (int: 0 o 1)
- work_type_children (int: 0 o 1)
- Residence_type_Urban (int: 0 o 1)
- smoking_status_formerly_smoked (int: 0 o 1)
- smoking_status_never_smoked (int: 0 o 1)
- smoking_status_smokes (int: 0 o 1)

