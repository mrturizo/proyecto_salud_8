const http = require('http');
const https = require('https');
const { API_BASE_URL } = require('./config');

console.log('🧪 Probando endpoints básicos...');
console.log('📍 URL del Backend:', API_BASE_URL);

// Determinar protocolo según la URL
const protocol = API_BASE_URL.includes('https') ? https : http;

// Función para probar un endpoint
function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`\n📡 Probando: ${url}`);
    
    const req = protocol.get(url, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Respuesta: ${data.substring(0, 100)}...`);
        resolve({ status: res.statusCode, data });
      });
    });
    
    req.on('error', (e) => {
      console.error(`   ❌ Error: ${e.message}`);
      reject(e);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Probar endpoints
async function runTests() {
  try {
    await testEndpoint('/test');
    await testEndpoint('/health');
    console.log('\n✅ Tests completados');
  } catch (error) {
    console.error('\n❌ Error en tests:', error.message);
    console.log('💡 Verifica que el servidor esté corriendo y accesible');
  }
}

runTests();
