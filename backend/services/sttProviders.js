const fetch = require('node-fetch');
const FormData = require('form-data');

// Modelo predeterminado: Whisper-small es más ligero y generalmente disponible en el router gratuito
// Alternativas: openai/whisper-base, openai/whisper-medium
const HF_DEFAULT_MODEL =
  process.env.HF_STT_MODEL || 'openai/whisper-small';
const DEFAULT_PROVIDER = (process.env.STT_DEFAULT_PROVIDER || 'huggingface').toLowerCase();

async function transcribeWithHuggingFace({ audioBuffer, contentType, filename }) {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('HF_API_TOKEN no está configurado en el servidor');
  }

  // El router de Hugging Face: probamos ambos formatos posibles
  // Formato 1: https://router.huggingface.co/models/{model}
  // Formato 2: https://router.huggingface.co/{model}
  let endpoint = `https://router.huggingface.co/models/${HF_DEFAULT_MODEL}`;
  
  // Función auxiliar para crear FormData
  const createFormData = () => {
    const form = new FormData();
    form.append('file', audioBuffer, { filename: filename || 'audio.webm', contentType: contentType || 'audio/webm' });
    return form;
  };
  
  let form = createFormData();
  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders()
    },
    body: form
  });

  // Si falla con 404, intentamos sin /models/
  if (response.status === 404) {
    console.log(`[STT] Intentando formato alternativo sin /models/`);
    endpoint = `https://router.huggingface.co/${HF_DEFAULT_MODEL}`;
    form = createFormData();
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`[STT] Error HuggingFace: ${response.status} - ${text.substring(0, 200)}`);
    throw new Error(`HuggingFace (${response.status}): ${text.substring(0, 500)}`);
  }

  const data = await response.json().catch(() => null);

  if (!data) {
    return '';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => item?.text || item?.generated_text || '').join(' ').trim();
  }

  return data.text || data.generated_text || '';
}

async function transcribeWithElevenLabs({ audioBuffer, contentType, filename }) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no está configurado en el servidor');
  }

  const form = new FormData();
  form.append('file', audioBuffer, { filename: filename || 'audio.webm', contentType });
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'es');

  const sttUrl = 'https://api.elevenlabs.io/v1/speech-to-text';
  const response = await fetch(sttUrl, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, Accept: 'application/json', ...form.getHeaders() },
    body: form
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`ElevenLabs STT (${response.status}): ${errText}`);
  }

  const data = await response.json().catch(() => null);
  return data?.text || '';
}

const PROVIDERS = {
  huggingface: transcribeWithHuggingFace,
  elevenlabs: transcribeWithElevenLabs
};

async function transcribe({ provider, audioBuffer, contentType, filename }) {
  const selectedProvider = (provider || DEFAULT_PROVIDER).toLowerCase();
  const impl = PROVIDERS[selectedProvider];
  if (!impl) {
    throw new Error(`Proveedor STT no soportado: ${selectedProvider}`);
  }
  return impl({ audioBuffer, contentType, filename });
}

module.exports = {
  transcribe,
  DEFAULT_PROVIDER
};

