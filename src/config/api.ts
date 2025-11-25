/**
 * Configuración centralizada de la API
 * Usa VITE_BACKEND_URL si está definida; por defecto usa la URL de Render
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://proyecto-salud-digital-2.onrender.com';
export const API_BASE_URL = `${BACKEND_URL}/api`;
export const DEFAULT_STT_PROVIDER = (import.meta.env.VITE_DEFAULT_STT_PROVIDER || 'huggingface').toLowerCase();
export const ENABLE_TTS = import.meta.env.VITE_ENABLE_TTS !== 'false';

// Log para debugging
console.log('🔧 Configuración API:', {
  BACKEND_URL,
  API_BASE_URL,
  DEFAULT_STT_PROVIDER,
  ENABLE_TTS
});
