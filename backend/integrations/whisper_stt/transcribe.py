#!/usr/bin/env python3
"""
Script para transcribir audio usando Whisper de OpenAI.
Uso: python transcribe.py <ruta_audio> [modelo] [idioma]
"""
import sys
import os
import json
import time
import signal

# Logs de progreso (van a stderr para no interferir con JSON en stdout)
def log_progress(message):
    print(f"[Whisper-Python] {message}", file=sys.stderr, flush=True)

# Variable global para manejar señales de terminación
terminate_requested = False

def signal_handler(signum, frame):
    """Maneja señales de terminación (SIGTERM, SIGINT)"""
    global terminate_requested
    terminate_requested = True
    log_progress(f"Señal de terminación recibida ({signum})")
    # Retornar error JSON y salir
    error = {'error': 'Proceso interrumpido por timeout o señal de terminación', 'success': False}
    print(json.dumps(error))
    sys.exit(1)

# Registrar manejadores de señales
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

try:
    import whisper
except ImportError as e:
    error = {'error': f'Whisper no está instalado: {str(e)}. Ejecuta: pip install openai-whisper', 'success': False}
    print(json.dumps(error), file=sys.stderr)
    sys.exit(1)

def transcribe_audio(audio_path, model_name='base', language='es'):
    """
    Transcribe un archivo de audio usando Whisper.
    
    Args:
        audio_path: Ruta al archivo de audio
        model_name: Modelo de Whisper a usar (tiny, base, small, medium, large)
        language: Código de idioma (es para español)
    
    Returns:
        str: Texto transcrito
    """
    global terminate_requested
    
    try:
        log_progress(f"Iniciando transcripción con modelo {model_name}, idioma {language}")
        
        # Verificar si se solicitó terminación antes de empezar
        if terminate_requested:
            raise InterruptedError("Proceso interrumpido antes de iniciar")
        
        # Cargar el modelo (se descarga automáticamente la primera vez)
        log_progress(f"Cargando modelo {model_name}...")
        start_load = time.time()
        model = whisper.load_model(model_name)
        
        # Verificar si se solicitó terminación durante la carga
        if terminate_requested:
            raise InterruptedError("Proceso interrumpido durante la carga del modelo")
        
        load_time = time.time() - start_load
        log_progress(f"Modelo cargado en {load_time:.2f} segundos")
        
        # Transcribir el audio
        log_progress(f"Transcribiendo audio: {audio_path}")
        start_transcribe = time.time()
        result = model.transcribe(audio_path, language=language, task='transcribe')
        
        # Verificar si se solicitó terminación durante la transcripción
        if terminate_requested:
            raise InterruptedError("Proceso interrumpido durante la transcripción")
        
        transcribe_time = time.time() - start_transcribe
        log_progress(f"Transcripción completada en {transcribe_time:.2f} segundos")
        
        # Retornar el texto transcrito
        text = result.get('text', '').strip()
        if not text:
            log_progress("Advertencia: El resultado está vacío")
        return text
    
    except KeyboardInterrupt:
        log_progress("Interrupción por teclado detectada")
        raise
    except InterruptedError:
        log_progress("Proceso interrumpido por señal de terminación")
        raise
    except Exception as e:
        log_progress(f"Error en transcribe_audio: {type(e).__name__}: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        if len(sys.argv) < 2:
            error = {'error': 'Uso: python transcribe.py <ruta_audio> [modelo] [idioma]', 'success': False}
            print(json.dumps(error))
            sys.exit(1)
        
        audio_path = sys.argv[1]
        model_name = sys.argv[2] if len(sys.argv) > 2 else 'base'
        language = sys.argv[3] if len(sys.argv) > 3 else 'es'
        
        log_progress(f"Parámetros: audio={audio_path}, modelo={model_name}, idioma={language}")
        
        # Verificar que el archivo existe
        if not os.path.exists(audio_path):
            error = {'error': f'Archivo no encontrado: {audio_path}', 'success': False}
            print(json.dumps(error))
            sys.exit(1)
        
        # Verificar tamaño del archivo
        file_size = os.path.getsize(audio_path)
        log_progress(f"Tamaño del archivo: {file_size} bytes")
        
        # Transcribir y mostrar resultado
        text = transcribe_audio(audio_path, model_name, language)
        result = {'text': text, 'success': True}
        print(json.dumps(result))
        log_progress("Proceso completado exitosamente")
        
    except KeyboardInterrupt:
        error = {'error': 'Proceso interrumpido por el usuario', 'success': False}
        print(json.dumps(error))
        sys.exit(1)
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        log_progress(f"Error fatal: {error_type}: {error_msg}")
        error = {'error': f'{error_type}: {error_msg}', 'success': False, 'type': error_type}
        print(json.dumps(error))
        sys.exit(1)

