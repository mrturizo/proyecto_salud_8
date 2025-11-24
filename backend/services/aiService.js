/**
 * Servicio de Inteligencia Artificial
 * Maneja predicciones de ML y procesamiento de texto médico
 */

const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { mapToStrokeFeatures, validateStrokeData } = require('./dataMapper');

const MODELS_DIR = path.join(__dirname, '../models');
const MODEL_PATH = path.join(MODELS_DIR, 'stroke_model.pkl');
const PYTHON_SCRIPT_PATH = path.join(MODELS_DIR, 'predict_stroke.py');

/**
 * Valida que el entorno Python esté configurado correctamente
 * @returns {Object} { valid: boolean, errors: string[], pythonPath: string }
 */
async function validatePythonEnvironment() {
  const errors = [];
  let pythonPath = null;

  console.log('🔍 [AI] Iniciando validación de entorno Python...');

  // 1. Verificar que Python esté instalado
  console.log('🔍 [AI] Verificando instalación de Python...');
  const pythonCommands = ['python', 'python3', 'py'];
  for (const cmd of pythonCommands) {
    try {
      console.log(`🔍 [AI] Intentando comando: ${cmd}`);
      const version = execSync(`${cmd} --version`, { encoding: 'utf8', timeout: 5000 });
      pythonPath = cmd;
      console.log(`✅ [AI] Python encontrado: ${cmd} - ${version.trim()}`);
      break;
    } catch (error) {
      console.log(`⚠️ [AI] Comando ${cmd} no disponible: ${error.message}`);
      // Comando no disponible, continuar con el siguiente
    }
  }

  if (!pythonPath) {
    const errorMsg = 'Python no está instalado o no está en el PATH. Comandos probados: ' + pythonCommands.join(', ');
    console.error(`❌ [AI] ${errorMsg}`);
    errors.push(errorMsg);
    return { valid: false, errors, pythonPath: null };
  }

  // 2. Verificar dependencias de Python
  console.log('🔍 [AI] Verificando dependencias de Python...');
  const requiredModules = ['sklearn', 'numpy', 'pickle', 'json', 'sys'];
  const missingModules = [];
  
  for (const module of requiredModules) {
    try {
      // Usar stdio: 'pipe' para capturar errores correctamente
      // Importante: usar pythonPath que detectamos, no 'python' hardcodeado
      const command = `${pythonPath} -c "import ${module}; print('OK')"`;
      const result = execSync(command, {
        encoding: 'utf8',
        timeout: 10000, // Aumentar timeout a 10 segundos
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
        shell: true // Usar shell en Windows para mejor compatibilidad
      });
      console.log(`✅ [AI] Módulo ${module} disponible`);
    } catch (error) {
      // Capturar stderr para más información
      const errorOutput = error.stderr ? error.stderr.toString() : (error.stdout ? error.stdout.toString() : error.message);
      console.error(`❌ [AI] Módulo ${module} NO disponible`);
      console.error(`   Comando usado: ${pythonPath} -c "import ${module}"`);
      console.error(`   Error output: ${errorOutput.substring(0, 300)}`);
      console.error(`   Exit code: ${error.status || error.code}`);
      console.error(`   Error completo: ${error.toString().substring(0, 300)}`);
      missingModules.push(module);
    }
  }

  if (missingModules.length > 0) {
    // Mapear nombres de módulos a nombres de paquetes pip
    const moduleToPackage = {
      'sklearn': 'scikit-learn',
      'numpy': 'numpy',
      'pickle': '', // pickle es parte de la stdlib
      'json': '', // json es parte de la stdlib
      'sys': '' // sys es parte de la stdlib
    };
    
    const packagesToInstall = missingModules
      .map(m => moduleToPackage[m])
      .filter(p => p !== '');
    
    let installCommand = '';
    if (packagesToInstall.length > 0) {
      installCommand = `Instalar con: pip install ${packagesToInstall.join(' ')}`;
    }
    
    const errorMsg = `Dependencias Python faltantes: ${missingModules.join(', ')}. ${installCommand}`;
    console.error(`❌ [AI] ${errorMsg}`);
    errors.push(errorMsg);
    return { valid: false, errors, pythonPath };
  }
  console.log('✅ [AI] Todas las dependencias Python verificadas');

  // 3. Verificar que el script Python existe
  console.log(`🔍 [AI] Verificando script Python: ${PYTHON_SCRIPT_PATH}`);
  if (!fs.existsSync(PYTHON_SCRIPT_PATH)) {
    const errorMsg = `Script Python no encontrado: ${PYTHON_SCRIPT_PATH}`;
    console.error(`❌ [AI] ${errorMsg}`);
    errors.push(errorMsg);
    return { valid: false, errors, pythonPath };
  }
  console.log(`✅ [AI] Script Python encontrado: ${PYTHON_SCRIPT_PATH}`);

  // 4. Verificar que el modelo existe
  console.log(`🔍 [AI] Verificando modelo: ${MODEL_PATH}`);
  if (!fs.existsSync(MODEL_PATH)) {
    const errorMsg = `Modelo no encontrado: ${MODEL_PATH}`;
    console.error(`❌ [AI] ${errorMsg}`);
    errors.push(errorMsg);
    return { valid: false, errors, pythonPath };
  }
  
  const modelStats = fs.statSync(MODEL_PATH);
  const modelSizeMB = (modelStats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ [AI] Modelo encontrado: ${MODEL_PATH} (${modelSizeMB} MB)`);

  console.log('✅ [AI] Validación de entorno Python completada exitosamente');
  return { valid: true, errors: [], pythonPath };
}

/**
 * Predice riesgo de stroke usando modelo preentrenado
 * @param {Object} patientData - Datos del paciente desde la app
 * @returns {Promise<Object>} Resultado con probabilidad y nivel de riesgo
 */
async function predictStrokeRisk(patientData) {
  console.log('🔍 [AI] Iniciando predicción de stroke...');
  
  try {
    // Validar entorno Python antes de continuar
    console.log('🔍 [AI] Validando entorno Python...');
    const envValidation = await validatePythonEnvironment();
    if (!envValidation.valid) {
      const errorDetails = envValidation.errors.join('; ');
      console.error('❌ [AI] Validación de entorno falló:');
      envValidation.errors.forEach((err, idx) => {
        console.error(`   ${idx + 1}. ${err}`);
      });
      return {
        success: false,
        error: 'Entorno Python no configurado correctamente',
        details: errorDetails,
        errors: envValidation.errors // Incluir array de errores para más detalle
      };
    }

    // Validar datos mínimos
    console.log('🔍 [AI] Validando datos del paciente...');
    const validation = validateStrokeData(patientData);
    if (!validation.valid) {
      console.error('❌ [AI] Validación de datos falló:', validation.missingFields);
      return {
        success: false,
        error: `Faltan campos requeridos: ${validation.missingFields.join(', ')}`,
        missingFields: validation.missingFields
      };
    }
    console.log('✅ [AI] Datos del paciente validados');

    // Mapear datos de la app a features del modelo
    console.log('🔍 [AI] Mapeando datos a features del modelo...');
    const features = mapToStrokeFeatures(patientData);
    console.log('✅ [AI] Features mapeadas:', JSON.stringify(features, null, 2));

    // Ejecutar script Python para predicción
    console.log('🐍 [AI] Ejecutando script Python...');
    
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'text',
        pythonPath: envValidation.pythonPath,
        pythonOptions: ['-u', '-X', 'utf8'], // Unbuffered output y UTF-8
        scriptPath: MODELS_DIR,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8' // Forzar UTF-8 en Python
        }
      };

      const pyshell = new PythonShell('predict_stroke.py', options);
      
      // Timeout de 30 segundos para evitar procesos colgados
      const timeout = setTimeout(() => {
        pyshell.kill();
        console.error('❌ [AI] Timeout: Script Python tardó más de 30 segundos');
        reject({
          success: false,
          error: 'Timeout: El script Python tardó demasiado en ejecutarse',
          details: 'El proceso fue cancelado después de 30 segundos'
        });
      }, 30000);

      let resultData = '';
      let errorData = '';

      pyshell.on('message', (message) => {
        resultData += message;
        console.log('📥 [AI] Mensaje recibido de Python:', message.substring(0, 100));
      });

      pyshell.on('stderr', (stderr) => {
        errorData += stderr;
        console.error('⚠️ [AI] Python stderr:', stderr);
      });

      pyshell.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ [AI] Error ejecutando script Python:', error);
        console.error('❌ [AI] Error details:', error.toString());
        console.error('❌ [AI] Stack:', error.stack);
        reject({
          success: false,
          error: `Error ejecutando modelo: ${error.message || 'Error desconocido'}`,
          details: error.toString() + (errorData ? `\nStderr: ${errorData}` : '')
        });
      });

      // Enviar features al script y cerrar
      console.log('📤 [AI] Enviando features a Python...');
      pyshell.send(JSON.stringify(features));
      pyshell.end((err, code, signal) => {
        clearTimeout(timeout);
        
        if (err) {
          console.error('❌ [AI] Error en PythonShell:', err);
          console.error('❌ [AI] Exit code:', code);
          console.error('❌ [AI] Signal:', signal);
          console.error('❌ [AI] Stack:', err.stack);
          reject({
            success: false,
            error: `Error en script Python: ${err.message || 'Error desconocido'}`,
            details: err.toString() + (errorData ? `\nStderr: ${errorData}` : '') + (resultData ? `\nOutput: ${resultData}` : '')
          });
          return;
        }

        if (code !== 0) {
          console.error('❌ [AI] Script Python terminó con código:', code);
          console.error('❌ [AI] Output recibido:', resultData);
          console.error('❌ [AI] Stderr:', errorData);
          reject({
            success: false,
            error: `Script Python falló con código ${code}`,
            details: errorData || resultData || 'Sin detalles disponibles'
          });
          return;
        }

        try {
          // Limpiar resultado (puede tener saltos de línea o espacios)
          const cleanedData = resultData.trim();
          
          if (!cleanedData) {
            throw new Error('No se recibió respuesta del script Python');
          }

          console.log('🔍 [AI] Parseando resultado JSON...');
          console.log('📄 [AI] Resultado raw (primeros 200 chars):', cleanedData.substring(0, 200));
          
          // Parsear resultado JSON
          const result = JSON.parse(cleanedData);
          
          if (result.success) {
            console.log('✅ [AI] Predicción exitosa:', {
              riskLevel: result.risk_level,
              probability: result.probability
            });
            // Agregar recomendaciones basadas en nivel de riesgo
            result.recommendations = generateStrokeRecommendations(
              result.risk_level,
              result.probability,
              patientData
            );
            resolve(result);
          } else {
            console.error('❌ [AI] Predicción falló:', result.error);
            reject(result);
          }
        } catch (parseError) {
          console.error('❌ [AI] Error parseando resultado:', parseError);
          console.error('❌ [AI] Parse error message:', parseError.message);
          console.error('❌ [AI] Parse error stack:', parseError.stack);
          console.error('❌ [AI] Resultado recibido (raw, primeros 500 chars):', resultData.substring(0, 500));
          console.error('❌ [AI] Stderr:', errorData);
          reject({
            success: false,
            error: 'Error parseando resultado del modelo',
            details: `Parse error: ${parseError.message}\nOutput: ${resultData}\nStderr: ${errorData}`
          });
        }
      });
    });

  } catch (error) {
    console.error('❌ [AI] Error en predictStrokeRisk:', error);
    console.error('❌ [AI] Error message:', error.message);
    console.error('❌ [AI] Error stack:', error.stack);
    return {
      success: false,
      error: error.message || 'Error desconocido en predicción de stroke',
      details: error.toString()
    };
  }
}

/**
 * Genera recomendaciones basadas en el nivel de riesgo predicho
 * @param {string} riskLevel - 'low'|'medium'|'high'
 * @param {number} probability - Probabilidad (0-1)
 * @param {Object} patientData - Datos del paciente
 * @returns {Array<string>} Array de recomendaciones
 */
function generateStrokeRecommendations(riskLevel, probability, patientData) {
  const recommendations = [];

  if (riskLevel === 'high') {
    recommendations.push('⚠️ Riesgo alto de stroke detectado. Se recomienda evaluación médica inmediata.');
    recommendations.push('Considerar estudios complementarios: TAC cerebral, ecocardiograma.');
    recommendations.push('Control estricto de factores de riesgo: presión arterial, glucosa, lípidos.');
  } else if (riskLevel === 'medium') {
    recommendations.push('⚠️ Riesgo moderado de stroke. Seguimiento médico recomendado.');
    recommendations.push('Mantener control de factores de riesgo cardiovascular.');
    recommendations.push('Considerar evaluación neurológica preventiva.');
  } else {
    recommendations.push('✅ Riesgo bajo de stroke. Mantener estilo de vida saludable.');
    recommendations.push('Continuar con controles médicos regulares.');
  }

  // Recomendaciones específicas según factores de riesgo detectados
  if (patientData.hypertension || 
      (patientData.tensionSistolica && parseFloat(patientData.tensionSistolica) > 140)) {
    recommendations.push('Controlar presión arterial: dieta baja en sodio, ejercicio regular.');
  }

  if (patientData.glucometria && parseFloat(patientData.glucometria) > 100) {
    recommendations.push('Controlar niveles de glucosa: dieta balanceada, evitar azúcares refinados.');
  }

  const bmi = patientData.imc ? parseFloat(patientData.imc) : 
              (patientData.peso && patientData.talla ? 
               parseFloat(patientData.peso) / (parseFloat(patientData.talla) ** 2) : null);
  
  if (bmi && bmi > 30) {
    recommendations.push('Manejo de peso: dieta y ejercicio para reducir IMC.');
  }

  if (patientData.heart_disease || 
      (typeof patientData.antecedentesPersonales === 'string' && 
       patientData.antecedentesPersonales.toLowerCase().includes('cardiac'))) {
    recommendations.push('Seguimiento cardiológico regular debido a antecedentes cardiovasculares.');
  }

  return recommendations;
}

/**
 * Sugiere diagnósticos basados en síntomas (placeholder para futura implementación)
 * @param {string} symptoms - Texto con síntomas del paciente
 * @param {Object} patientData - Datos adicionales del paciente
 * @returns {Promise<Object>} Sugerencias de diagnóstico
 */
async function suggestDiagnosis(symptoms, patientData) {
  // TODO: Implementar con modelo de NLP cuando esté disponible
  return {
    success: false,
    error: 'Función en desarrollo. Se implementará con modelo de NLP.',
    suggestions: []
  };
}

/**
 * Genera resumen automático de consulta (placeholder para futura implementación)
 * @param {Object} clinicalNotes - Notas clínicas de la consulta
 * @returns {Promise<Object>} Resumen generado
 */
async function generateSummary(clinicalNotes) {
  // TODO: Implementar con modelo de summarization cuando esté disponible
  return {
    success: false,
    error: 'Función en desarrollo. Se implementará con modelo de NLP.',
    summary: ''
  };
}

module.exports = {
  predictStrokeRisk,
  suggestDiagnosis,
  generateSummary,
  generateStrokeRecommendations,
  validatePythonEnvironment
};

