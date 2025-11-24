#!/usr/bin/env python3
"""
Script para predecir riesgo de stroke usando modelo preentrenado.
Recibe datos JSON por stdin y retorna predicción por stdout.
"""

import sys
import json
import pickle
import os
import numpy as np
from pathlib import Path

# Intentar importar joblib para mejor compatibilidad de modelos
try:
    import joblib
    USE_JOBLIB = True
except ImportError:
    USE_JOBLIB = False

# Ruta al modelo
MODEL_PATH = Path(__file__).parent / 'stroke_model.pkl'

def load_model():
    """Carga el modelo desde archivo .pkl"""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modelo no encontrado en {MODEL_PATH}")
    
    import warnings
    # Suprimir TODOS los warnings para evitar problemas de compatibilidad
    warnings.filterwarnings('ignore')
    
    # Intentar múltiples estrategias para cargar el modelo
    strategies = []
    
    # Estrategia 1: joblib (mejor compatibilidad entre versiones)
    if USE_JOBLIB:
        strategies.append(('joblib', lambda: joblib.load(MODEL_PATH)))
    
    # Estrategia 2: pickle estándar
    strategies.append(('pickle', lambda: pickle.load(open(MODEL_PATH, 'rb'))))
    
    # Estrategia 3: pickle con protocolo específico
    strategies.append(('pickle_protocol', lambda: pickle.load(open(MODEL_PATH, 'rb'), encoding='latin1')))
    
    # Intentar cada estrategia
    last_error = None
    for strategy_name, strategy_func in strategies:
        try:
            model = strategy_func()
            # Verificar que el modelo tiene los métodos necesarios
            if hasattr(model, 'predict') and hasattr(model, 'predict_proba'):
                # El modelo se cargó correctamente
                return model
            else:
                raise Exception(f"Modelo cargado con {strategy_name} pero no tiene métodos predict/predict_proba")
        except (ValueError, TypeError, AttributeError) as e:
            error_msg = str(e).lower()
            # Si es error de dtype incompatible, intentar la siguiente estrategia
            if 'incompatible dtype' in error_msg or 'missing_go_to_left' in error_msg:
                last_error = e
                continue  # Intentar siguiente estrategia
            else:
                last_error = e
                continue
        except Exception as e:
            last_error = e
            continue
    
    # Si todas las estrategias fallaron, intentar cargar forzando la compatibilidad
    # Esto puede funcionar si el modelo es funcional a pesar del warning
    try:
        import numpy as np
        # Cargar el pickle y reconstruir el modelo si es necesario
        with open(MODEL_PATH, 'rb') as f:
            # Intentar cargar ignorando completamente el error de dtype
            # A veces numpy puede manejar la conversión automáticamente
            try:
                model = pickle.load(f)
                # Verificar métodos
                if hasattr(model, 'predict') and hasattr(model, 'predict_proba'):
                    return model
            except (ValueError, TypeError) as dtype_error:
                # El error de dtype es crítico, pero intentemos una última cosa:
                # Cargar el pickle y modificar el árbol manualmente si es posible
                raise Exception(
                    f"No se pudo cargar el modelo debido a incompatibilidad de versiones. "
                    f"El modelo fue entrenado con scikit-learn 1.2.2, pero tienes {__import__('sklearn').__version__}. "
                    f"Error: incompatible dtype en el árbol de decisión. "
                    f"Soluciones: 1) Instalar scikit-learn 1.2.2, 2) Re-entrenar el modelo, "
                    f"3) Usar un entorno virtual con Python 3.10 y scikit-learn 1.2.2"
                )
    except Exception as e:
        sklearn_version = __import__('sklearn').__version__
        raise Exception(
            f"Error cargando modelo después de intentar todas las estrategias. "
            f"Modelo entrenado con scikit-learn 1.2.2, versión actual: {sklearn_version}. "
            f"Último error: {str(last_error)[:200]}"
        )

def predict_stroke(features):
    """
    Predice riesgo de stroke basado en features.
    
    Args:
        features: dict con las features requeridas
        
    Returns:
        dict con 'probability' (0-1) y 'risk_level' ('low'|'medium'|'high')
    """
    try:
        model = load_model()
        
        # Orden de features según el modelo
        feature_order = [
            'age',
            'hypertension',
            'heart_disease',
            'avg_glucose_level',
            'bmi',
            'gender_Male',
            'gender_Other',
            'ever_married_Yes',
            'work_type_Never_worked',
            'work_type_Private',
            'work_type_Self_employed',
            'work_type_children',
            'Residence_type_Urban',
            'smoking_status_formerly_smoked',
            'smoking_status_never_smoked',
            'smoking_status_smokes'
        ]
        
        # Construir array de features en el orden correcto
        feature_array = np.array([[features.get(f, 0) for f in feature_order]])
        
        # Predecir probabilidad
        probability = model.predict_proba(feature_array)[0][1]  # Probabilidad de clase 1 (stroke)
        
        # Determinar nivel de riesgo
        if probability < 0.3:
            risk_level = 'low'
        elif probability < 0.7:
            risk_level = 'medium'
        else:
            risk_level = 'high'
        
        return {
            'success': True,
            'probability': float(probability),
            'risk_level': risk_level,
            'prediction': int(model.predict(feature_array)[0])
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == '__main__':
    try:
        # Configurar encoding UTF-8 para stdout en Windows
        import sys
        import io
        if sys.platform == 'win32':
            # Forzar UTF-8 en Windows
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
        
        # IMPORTANTE: Redirigir stderr para que los warnings no contaminen stdout
        # Solo stdout debe contener JSON
        import warnings
        warnings.filterwarnings('ignore')  # Suprimir todos los warnings
        
        # Leer JSON de stdin
        stdin_data = sys.stdin.read()
        input_data = json.loads(stdin_data)
        
        # Realizar predicción
        result = predict_stroke(input_data)
        
        # Escribir SOLO JSON a stdout, nada más
        output = json.dumps(result, ensure_ascii=False)
        sys.stdout.write(output)
        sys.stdout.flush()
        
    except json.JSONDecodeError as e:
        error_result = {
            'success': False,
            'error': f'Error parseando JSON: {str(e)}'
        }
        output = json.dumps(error_result, ensure_ascii=False)
        sys.stdout.write(output)
        sys.stdout.flush()
        sys.exit(1)
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)  # Asegurar que el error sea string válido
        }
        output = json.dumps(error_result, ensure_ascii=False)
        sys.stdout.write(output)
        sys.stdout.flush()
        sys.exit(1)

