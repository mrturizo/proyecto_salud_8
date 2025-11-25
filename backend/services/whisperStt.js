const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base';
const PYTHON_CMD = process.env.PYTHON_CMD || 'python3';
const WHISPER_TIMEOUT = 120000; // 2 minutos (más agresivo para evitar cuelgues)

/**
 * Ejecuta un proceso con spawn y timeout, matando el proceso si excede el tiempo
 * @param {string} command - Comando a ejecutar
 * @param {string[]} args - Argumentos del comando
 * @param {number} timeoutMs - Timeout en milisegundos
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function spawnWithTimeout(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let timeoutId = null;
    let processKilled = false;

    console.log(`[Whisper] Ejecutando: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    // Capturar stdout en tiempo real
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Capturar stderr en tiempo real y mostrar logs de progreso
    childProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      stderr += dataStr;
      
      // Mostrar logs de progreso en tiempo real
      const lines = dataStr.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.includes('[Whisper-Python]')) {
          console.log(line.trim());
        }
      });
    });

    // Manejar finalización del proceso
    childProcess.on('close', (code, signal) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (processKilled) {
        reject(new Error(`Whisper: Proceso terminado por timeout después de ${timeoutMs / 1000} segundos`));
      } else if (code !== 0) {
        const error = new Error(`Whisper: Proceso terminó con código ${code}${signal ? ` (señal: ${signal})` : ''}`);
        error.code = code;
        error.signal = signal;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    // Manejar errores de spawn
    childProcess.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (error.code === 'ENOENT') {
        reject(new Error(`Whisper: ${command} no encontrado. Verifica que Python esté instalado y en el PATH.`));
      } else {
        reject(new Error(`Whisper: Error ejecutando proceso: ${error.message}`));
      }
    });

    // Implementar timeout
    timeoutId = setTimeout(() => {
      if (!childProcess.killed) {
        processKilled = true;
        console.error(`[Whisper] Timeout: Matando proceso después de ${timeoutMs / 1000} segundos`);
        
        // Intentar matar el proceso y sus hijos
        try {
          childProcess.kill('SIGTERM');
          
          // Si después de 5 segundos no se ha cerrado, forzar kill
          setTimeout(() => {
            if (!childProcess.killed) {
              console.error(`[Whisper] Forzando terminación del proceso`);
              childProcess.kill('SIGKILL');
            }
          }, 5000);
        } catch (killError) {
          console.error(`[Whisper] Error matando proceso:`, killError.message);
        }
      }
    }, timeoutMs);
  });
}

/**
 * Verifica que Python esté disponible
 * @returns {Promise<boolean>}
 */
async function verifyPython() {
  return new Promise((resolve) => {
    const checkProcess = spawn(PYTHON_CMD, ['--version'], {
      stdio: 'ignore',
      shell: false
    });

    checkProcess.on('close', (code) => {
      resolve(code === 0);
    });

    checkProcess.on('error', () => {
      resolve(false);
    });

    // Timeout de 5 segundos para la verificación
    setTimeout(() => {
      if (!checkProcess.killed) {
        checkProcess.kill();
        resolve(false);
      }
    }, 5000);
  });
}

/**
 * Transcribe audio usando Whisper local
 * @param {Buffer} audioBuffer - Buffer del audio
 * @param {string} contentType - Tipo MIME del audio (ej: 'audio/webm')
 * @param {string} filename - Nombre del archivo original
 * @returns {Promise<string>} Texto transcrito
 */
async function transcribeWithWhisper({ audioBuffer, contentType, filename }) {
  const scriptPath = path.join(__dirname, '../integrations/whisper_stt/transcribe.py');
  const tempDir = path.join(__dirname, '../../temp');
  const tempFilePath = path.join(tempDir, `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.webm`);

  // Crear directorio temporal si no existe
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Verificar que Python esté disponible
    console.log(`[Whisper] Verificando Python...`);
    const pythonAvailable = await verifyPython();
    if (!pythonAvailable) {
      throw new Error(`Python no está disponible. Verifica que ${PYTHON_CMD} esté instalado y en el PATH.`);
    }
    console.log(`[Whisper] Python verificado: ${PYTHON_CMD}`);

    // Guardar el buffer de audio en un archivo temporal
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log(`[Whisper] Archivo temporal creado: ${tempFilePath}`);

    let audioFile = tempFilePath;
    let needsCleanup = false;

    // Ejecutar script de Whisper usando spawn con timeout
    console.log(`[Whisper] Modelo: ${WHISPER_MODEL}, Idioma: es, Timeout: ${WHISPER_TIMEOUT / 1000} segundos`);
    const startTime = Date.now();

    let stdout = '';
    let stderr = '';
    
    try {
      const result = await spawnWithTimeout(
        PYTHON_CMD,
        [scriptPath, audioFile, WHISPER_MODEL, 'es'],
        WHISPER_TIMEOUT
      );
      stdout = result.stdout || '';
      stderr = result.stderr || '';
    } catch (spawnError) {
      // Capturar stdout y stderr del error
      stdout = spawnError.stdout || '';
      stderr = spawnError.stderr || '';
      
      // Si hay stdout con JSON, intentar parsearlo primero
      if (stdout && stdout.trim()) {
        try {
          const errorResult = JSON.parse(stdout.trim());
          if (errorResult.error) {
            throw new Error(`Whisper error: ${errorResult.error}`);
          }
        } catch (parseError) {
          // Si no es JSON válido, continuar con el manejo normal
        }
      }
      
      // Re-lanzar el error para que se maneje en el catch principal
      throw spawnError;
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Whisper] Proceso completado en ${elapsedTime} segundos`);

    // Procesar stderr (warnings importantes, los logs de progreso ya se mostraron en tiempo real)
    if (stderr && stderr.trim()) {
      const stderrLines = stderr.trim().split('\n');
      const warnings = stderrLines.filter(line => 
        !line.includes('[Whisper-Python]') &&
        !line.includes('torch') && 
        !line.includes('UserWarning') &&
        !line.includes('FutureWarning') &&
        line.trim()
      );
      
      // Mostrar warnings importantes
      if (warnings.length > 0) {
        console.warn(`[Whisper] Warnings:`, warnings.join('; '));
      }
    }

    // Parsear resultado JSON de stdout
    if (!stdout || !stdout.trim()) {
      throw new Error('Whisper no retornó ningún resultado. Verifica los logs de Python.');
    }

    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch (parseError) {
      console.error(`[Whisper] Error parseando JSON:`, stdout.substring(0, 200));
      throw new Error(`Whisper: Error parseando respuesta. Output: ${stdout.substring(0, 200)}`);
    }
    
    if (result.error) {
      throw new Error(`Whisper error: ${result.error}`);
    }

    if (!result.success) {
      throw new Error(`Whisper: Proceso falló. ${result.error || 'Sin detalles'}`);
    }

    if (!result.text) {
      throw new Error('Whisper: No se obtuvo texto transcrito (resultado vacío)');
    }

    console.log(`[Whisper] Transcripción exitosa: ${result.text.substring(0, 50)}...`);
    return result.text;

  } catch (error) {
    console.error(`[Whisper] Error capturado:`, error.message);
    if (error.stack) {
      console.error(`[Whisper] Stack:`, error.stack.substring(0, 500));
    }
    
    // Capturar stderr si está disponible
    const stderr = error.stderr || '';
    if (stderr) {
      console.error(`[Whisper] stderr:`, stderr.substring(0, 500));
    }
    
    // Si es timeout
    if (error.message.includes('timeout') || error.message.includes('Timeout') || error.signal === 'SIGTERM' || error.signal === 'SIGKILL') {
      throw new Error(`Whisper: Timeout después de ${WHISPER_TIMEOUT / 1000} segundos. El proceso fue terminado para evitar cuelgues. Intenta nuevamente o usa un modelo más pequeño.`);
    }
    
    // Si Python no está disponible
    if (error.message.includes('no encontrado') || error.message.includes('no está disponible') || error.code === 'ENOENT') {
      throw new Error(`Whisper: Python no está disponible. Verifica que ${PYTHON_CMD} esté instalado y en el PATH.`);
    }
    
    // Si el error menciona formato
    if (error.message.includes('format') || error.message.includes('codec')) {
      throw new Error(`Whisper: Error procesando audio. Formato puede no ser compatible. Detalles: ${error.message}`);
    }
    
    // Si el error es de Python o del script
    if (error.code !== undefined || stderr) {
      const errorDetails = stderr || error.message;
      const pythonError = errorDetails.includes('ImportError') || errorDetails.includes('ModuleNotFoundError');
      
      if (pythonError) {
        throw new Error(`Whisper: Dependencias de Python no instaladas. Ejecuta: pip install openai-whisper torch`);
      }
      
      // Si hay un código de salida no cero
      if (error.code !== undefined && error.code !== 0) {
        console.error(`[Whisper] Error de Python/Script (código ${error.code}):`, errorDetails.substring(0, 500));
        throw new Error(`Whisper: Error ejecutando script Python (código ${error.code}). Detalles: ${errorDetails.substring(0, 300)}`);
      }
      
      console.error(`[Whisper] Error de Python/Script:`, errorDetails.substring(0, 500));
      throw new Error(`Whisper: Error ejecutando script Python. Detalles: ${errorDetails.substring(0, 300)}`);
    }
    
    // Error genérico - asegurar que siempre retornamos un error manejable
    const errorMessage = error.message || 'Error desconocido';
    throw new Error(`Whisper: ${errorMessage}`);
  } finally {
    // Limpiar archivo temporal
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log(`[Whisper] Archivo temporal eliminado: ${tempFilePath}`);
      }
      if (needsCleanup && fs.existsSync(audioFile) && audioFile !== tempFilePath) {
        fs.unlinkSync(audioFile);
      }
    } catch (cleanupError) {
      console.warn(`[Whisper] Error limpiando archivos temporales:`, cleanupError.message);
    }
  }
}

module.exports = {
  transcribeWithWhisper
};

