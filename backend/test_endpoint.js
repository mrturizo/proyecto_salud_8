const http = require('http');
const https = require('https');
const { API_BASE_URL } = require('./config');

console.log('🧪 Probando endpoint de demandas asignadas...');
console.log('📍 URL:', API_BASE_URL);

// Parsear URL y determinar protocolo
const url = new URL(API_BASE_URL + '/usuarios/5/demandas-asignadas');
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'GET'
};

const req = protocol.request(options, (res) => {
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📡 Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📋 Respuesta del servidor:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Respuesta raw:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error en la petición:', e.message);
  console.log('💡 Verifica que el backend esté accesible en:', API_BASE_URL);
});

req.setTimeout(5000, () => {
  console.error('❌ Timeout - el servidor no responde');
  req.destroy();
});

req.end();
