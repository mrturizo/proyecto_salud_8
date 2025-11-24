const http = require('http');
const https = require('https');
const { API_BASE_URL } = require('./config');

console.log('🧪 Probando endpoint de login...');
console.log('📍 URL:', API_BASE_URL);

const postData = JSON.stringify({
  email: 'medico1@saludigital.edu.co',
  password: '1000000001'
});

// Parsear URL y determinar protocolo
const url = new URL(API_BASE_URL + '/auth/login');
const protocol = url.protocol === 'https:' ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
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

req.write(postData);
req.end();
