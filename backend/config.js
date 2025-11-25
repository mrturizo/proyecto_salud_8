/**
 * Configuración centralizada del Backend
 * Configura la URL del backend para uso en scripts y servicios
 */

// URL del backend - Siempre apunta a producción
const BACKEND_URL = 'https://proyecto-salud-digital-2.onrender.com';
const API_BASE_URL = `${BACKEND_URL}/api`;

// Log para debugging
console.log('🔧 Configuración Backend:', {
  BACKEND_URL,
  API_BASE_URL
});

module.exports = {
  BACKEND_URL,
  API_BASE_URL
};

