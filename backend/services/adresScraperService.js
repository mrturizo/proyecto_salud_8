// backend/services/adresScraperService.js
// Orquestador para ejecutar el scraper de ADRES (Python) en modo interactivo

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function resolvePythonExecutable() {
  // Permite configurar explícitamente el ejecutable de Python
  // Ej.: set PYTHON_EXE=D:\...\venv\Scripts\python.exe
  if (process.env.PYTHON_EXE && process.env.PYTHON_EXE.trim().length > 0) {
    return process.env.PYTHON_EXE;
  }
  // En Windows es común tener 'py'. En otros, probar 'python3' primero.
  if (process.platform === 'win32') return 'py';
  return 'python3';
}

function getScraperDir() {
  return path.join(__dirname, '..', 'integrations', 'adres_scraper');
}

function getResultJsonPath() {
  return path.join(getScraperDir(), 'demo_resultado.json');
}

/**
 * Inicia el scraper en modo interactivo (requiere ingresar captcha en consola).
 * No espera el resultado; retorna inmediatamente con información básica.
 */
function startInteractiveConsulta(docType, docNumber, options = {}) {
  const pythonExe = resolvePythonExecutable();
  const scraperDir = getScraperDir();
  const cliPath = path.join(scraperDir, 'adres_scraper_cli.py');

  const args = [cliPath, '--doc-type', String(docType), '--doc-number', String(docNumber)];
  if (options.headless === true) {
    args.push('--headless');
  }

  console.log('[ADRES SCRAPER] Iniciando proceso:', pythonExe, args.join(' '));
  console.log('[ADRES SCRAPER] Directorio:', scraperDir);

  const child = spawn(pythonExe, args, {
    cwd: scraperDir,
    stdio: 'inherit', // importante: permite ver/ingresar el captcha en la misma consola
    windowsHide: false,
    detached: false
  });

  child.on('error', (err) => {
    console.error('[ADRES SCRAPER] Error al lanzar el proceso:', err);
  });

  child.on('exit', (code) => {
    console.log(`[ADRES SCRAPER] Proceso finalizado con código ${code}`);
  });

  // No esperamos a que termine, retornamos estado 202 para que el cliente
  // consulte luego el resultado desde el endpoint dedicado.
  return {
    started: true,
    pid: child.pid,
    scraperDir,
    resultPath: getResultJsonPath()
  };
}

/**
 * Lee el último resultado guardado en demo_resultado.json
 */
function readLastResult() {
  const resultPath = getResultJsonPath();
  if (!fs.existsSync(resultPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(resultPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('[ADRES SCRAPER] Error leyendo resultado:', err);
    return null;
  }
}

module.exports = {
  startInteractiveConsulta,
  readLastResult
};


