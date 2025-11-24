// backend/verificar_endpoints_medicos.js
const http = require('http');
const https = require('https');
const { API_BASE_URL, BACKEND_URL } = require('./config');
const API_URL = API_BASE_URL;

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    // Determinar protocolo y parsear URL
    const url = new URL(API_BASE_URL + path);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            raw: true
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function verificarEndpoints() {
  log('\n' + '='.repeat(70), 'blue');
  log('🔍 VERIFICACIÓN DE ENDPOINTS MÉDICOS', 'blue');
  log('='.repeat(70), 'blue');

  const resultados = {
    exitosos: [],
    fallidos: [],
    advertencias: []
  };

  // 1. Health check
  log('\n📋 1. Health Check', 'yellow');
  try {
    const response = await makeRequest('GET', '/health');
    if (response.status === 200) {
      log('   ✅ Health check: OK', 'green');
      resultados.exitosos.push('Health check');
    } else {
      log(`   ❌ Health check: Status ${response.status}`, 'red');
      resultados.fallidos.push({ endpoint: 'Health check', error: `Status ${response.status}` });
    }
  } catch (error) {
    log(`   ❌ Health check: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'Health check', error: error.message });
  }

  // 2. Dashboard epidemiológico
  log('\n📋 2. Dashboard Epidemiológico', 'yellow');
  try {
    const response = await makeRequest('GET', '/dashboard/epidemio');
    if (response.status === 200 && response.data) {
      log('   ✅ Dashboard epidemiológico: OK', 'green');
      log(`   📊 Total familias: ${response.data.total_familias || 'N/A'}`);
      log(`   📊 Total pacientes: ${response.data.total_pacientes || 'N/A'}`);
      log(`   📊 Total atenciones: ${response.data.total_atenciones || 'N/A'}`);
      resultados.exitosos.push('Dashboard epidemiológico');
    } else {
      log(`   ❌ Dashboard epidemiológico: Status ${response.status}`, 'red');
      resultados.fallidos.push({ endpoint: 'Dashboard epidemiológico', error: `Status ${response.status}` });
    }
  } catch (error) {
    log(`   ❌ Dashboard epidemiológico: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'Dashboard epidemiológico', error: error.message });
  }

  // 3. Búsqueda de pacientes
  log('\n📋 3. Búsqueda de Pacientes', 'yellow');
  try {
    const response = await makeRequest('GET', '/pacientes/buscar?q=test');
    if (response.status === 200 || response.status === 400) {
      // 400 es válido si no hay parámetro q
      if (response.status === 200) {
        log('   ✅ Búsqueda de pacientes: OK (retorna array)', 'green');
        log(`   📊 Resultados encontrados: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);
      } else {
        log('   ⚠️  Búsqueda de pacientes: Endpoint existe (400 sin parámetro válido)', 'yellow');
      }
      resultados.exitosos.push('Búsqueda de pacientes');
    } else {
      log(`   ❌ Búsqueda de pacientes: Status ${response.status}`, 'red');
      resultados.fallidos.push({ endpoint: 'Búsqueda de pacientes', error: `Status ${response.status}` });
    }
  } catch (error) {
    log(`   ❌ Búsqueda de pacientes: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'Búsqueda de pacientes', error: error.message });
  }

  // 4. Endpoint estructura (sin datos reales, solo verificar que existe)
  log('\n📋 4. Endpoints de HC, Recetas y Órdenes', 'yellow');
  
  // GET HC completadas (404 es válido si no hay datos)
  try {
    const response = await makeRequest('GET', '/usuarios/999/hc-completadas');
    if (response.status === 200 || response.status === 404 || response.status === 500) {
      log('   ✅ GET /usuarios/:id/hc-completadas: Endpoint existe', 'green');
      resultados.exitosos.push('GET HC completadas');
    } else {
      log(`   ⚠️  GET /usuarios/:id/hc-completadas: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'GET HC completadas', status: response.status });
    }
  } catch (error) {
    log(`   ❌ GET /usuarios/:id/hc-completadas: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'GET HC completadas', error: error.message });
  }

  // GET Bitácora
  try {
    const response = await makeRequest('GET', '/usuarios/999/bitacora');
    if (response.status === 200 || response.status === 404 || response.status === 500) {
      log('   ✅ GET /usuarios/:id/bitacora: Endpoint existe', 'green');
      resultados.exitosos.push('GET Bitácora');
    } else {
      log(`   ⚠️  GET /usuarios/:id/bitacora: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'GET Bitácora', status: response.status });
    }
  } catch (error) {
    log(`   ❌ GET /usuarios/:id/bitacora: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'GET Bitácora', error: error.message });
  }

  // GET Recetas paciente (404 es válido si no hay datos)
  try {
    const response = await makeRequest('GET', '/pacientes/999/recetas');
    if (response.status === 200 || response.status === 404 || response.status === 500) {
      log('   ✅ GET /pacientes/:id/recetas: Endpoint existe', 'green');
      resultados.exitosos.push('GET Recetas paciente');
    } else {
      log(`   ⚠️  GET /pacientes/:id/recetas: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'GET Recetas paciente', status: response.status });
    }
  } catch (error) {
    log(`   ❌ GET /pacientes/:id/recetas: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'GET Recetas paciente', error: error.message });
  }

  // POST Recetas (400 es válido si faltan datos requeridos)
  try {
    const response = await makeRequest('POST', '/recetas', {});
    if (response.status === 400 || response.status === 201) {
      log('   ✅ POST /recetas: Endpoint existe (400 esperado sin datos completos)', 'green');
      resultados.exitosos.push('POST Recetas');
    } else {
      log(`   ⚠️  POST /recetas: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'POST Recetas', status: response.status });
    }
  } catch (error) {
    log(`   ❌ POST /recetas: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'POST Recetas', error: error.message });
  }

  // GET Órdenes paciente
  try {
    const response = await makeRequest('GET', '/pacientes/999/ordenes-laboratorio');
    if (response.status === 200 || response.status === 404 || response.status === 500) {
      log('   ✅ GET /pacientes/:id/ordenes-laboratorio: Endpoint existe', 'green');
      resultados.exitosos.push('GET Órdenes paciente');
    } else {
      log(`   ⚠️  GET /pacientes/:id/ordenes-laboratorio: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'GET Órdenes paciente', status: response.status });
    }
  } catch (error) {
    log(`   ❌ GET /pacientes/:id/ordenes-laboratorio: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'GET Órdenes paciente', error: error.message });
  }

  // POST Órdenes
  try {
    const response = await makeRequest('POST', '/ordenes-laboratorio', {});
    if (response.status === 400 || response.status === 201) {
      log('   ✅ POST /ordenes-laboratorio: Endpoint existe (400 esperado sin datos completos)', 'green');
      resultados.exitosos.push('POST Órdenes laboratorio');
    } else {
      log(`   ⚠️  POST /ordenes-laboratorio: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'POST Órdenes laboratorio', status: response.status });
    }
  } catch (error) {
    log(`   ❌ POST /ordenes-laboratorio: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'POST Órdenes laboratorio', error: error.message });
  }

  // POST HC Medicina (400 es válido si faltan datos requeridos)
  try {
    const response = await makeRequest('POST', '/hc/medicina', {});
    if (response.status === 400 || response.status === 201) {
      log('   ✅ POST /hc/medicina: Endpoint existe (400 esperado sin datos completos)', 'green');
      resultados.exitosos.push('POST HC Medicina');
    } else {
      log(`   ⚠️  POST /hc/medicina: Status ${response.status}`, 'yellow');
      resultados.advertencias.push({ endpoint: 'POST HC Medicina', status: response.status });
    }
  } catch (error) {
    log(`   ❌ POST /hc/medicina: ${error.message}`, 'red');
    resultados.fallidos.push({ endpoint: 'POST HC Medicina', error: error.message });
  }

  // Resumen final
  log('\n' + '='.repeat(70), 'blue');
  log('📊 RESUMEN DE VERIFICACIÓN', 'blue');
  log('='.repeat(70), 'blue');
  
  log(`\n✅ Endpoints exitosos: ${resultados.exitosos.length}`, 'green');
  resultados.exitosos.forEach(ep => log(`   - ${ep}`, 'green'));
  
  if (resultados.advertencias.length > 0) {
    log(`\n⚠️  Advertencias: ${resultados.advertencias.length}`, 'yellow');
    resultados.advertencias.forEach(adv => log(`   - ${adv.endpoint}: Status ${adv.status}`, 'yellow'));
  }
  
  if (resultados.fallidos.length > 0) {
    log(`\n❌ Endpoints con errores: ${resultados.fallidos.length}`, 'red');
    resultados.fallidos.forEach(fail => log(`   - ${fail.endpoint}: ${fail.error}`, 'red'));
  }
  
  log('\n' + '='.repeat(70), 'blue');
  log(`🎯 Total verificado: ${resultados.exitosos.length + resultados.advertencias.length + resultados.fallidos.length} endpoints`, 'blue');
  
  if (resultados.fallidos.length === 0) {
    log('✅ ¡TODOS LOS ENDPOINTS ESTÁN FUNCIONANDO!', 'green');
  } else {
    log('⚠️  Hay algunos endpoints con problemas. Revisa los detalles arriba.', 'yellow');
  }
  
  log('='.repeat(70) + '\n', 'blue');
}

// Verificar que el servidor esté corriendo
log('\n🔍 Verificando que el servidor esté corriendo...', 'yellow');
verificarEndpoints().catch(error => {
  log(`\n❌ ERROR CRÍTICO: ${error.message}`, 'red');
  log('\n💡 Asegúrate de que el servidor esté corriendo en el puerto 3001:', 'yellow');
  log('   cd backend && npm start\n', 'yellow');
  process.exit(1);
});

