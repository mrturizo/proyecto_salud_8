const fetch = require('node-fetch');
const FormData = require('form-data');
// Whisper deshabilitado temporalmente - causaba reinicios del servidor
// const { transcribeWithWhisper } = require('./whisperStt');

// Modelo predeterminado: Whisper-small es más ligero y generalmente disponible en el router gratuito
// Alternativas: openai/whisper-base, openai/whisper-medium
const HF_DEFAULT_MODEL =
  process.env.HF_STT_MODEL || 'openai/whisper-small';
// Proveedor por defecto: ElevenLabs (Whisper deshabilitado temporalmente)
const DEFAULT_PROVIDER = (process.env.STT_DEFAULT_PROVIDER || 'elevenlabs').toLowerCase();

async function transcribeWithHuggingFace({ audioBuffer, contentType, filename }) {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('HF_API_TOKEN no está configurado en el servidor');
  }

  // Intentamos múltiples endpoints ya que Hugging Face ha cambiado su API
  // 1. API de inferencia tradicional (puede seguir funcionando para algunos modelos)
  // 2. Router nuevo (puede no soportar todos los modelos de audio)
  
  const createFormData = () => {
    const form = new FormData();
    form.append('file', audioBuffer, { filename: filename || 'audio.webm', contentType: contentType || 'audio/webm' });
    return form;
  };
  
  // Intentamos primero con la API de inferencia tradicional
  let endpoint = `https://api-inference.huggingface.co/models/${HF_DEFAULT_MODEL}`;
  let form = createFormData();
  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders()
    },
    body: form
  });

  // Si falla con 410 (deprecado) o 404, intentamos con el router
  if (response.status === 410 || response.status === 404) {
    console.log(`[STT] API tradicional falló (${response.status}), intentando router...`);
    endpoint = `https://router.huggingface.co/models/${HF_DEFAULT_MODEL}`;
    form = createFormData();
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    // Si el router también falla, intentamos sin /models/
    if (response.status === 404) {
      console.log(`[STT] Router con /models/ falló, intentando sin /models/...`);
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
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`[STT] Error HuggingFace: ${response.status} - ${text.substring(0, 200)}`);
    
    // Mensaje más claro según el error
    if (response.status === 404) {
      throw new Error(`HuggingFace (404): El modelo ${HF_DEFAULT_MODEL} no está disponible en el plan gratuito. Intenta con ElevenLabs o cambia el modelo.`);
    } else if (response.status === 410) {
      throw new Error(`HuggingFace (410): El endpoint está deprecado. El modelo puede no estar disponible en el plan gratuito.`);
    } else {
      throw new Error(`HuggingFace (${response.status}): ${text.substring(0, 500)}`);
    }
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

// Whisper deshabilitado - retorna error controlado sin ejecutar nada
async function transcribeWithWhisper({ audioBuffer, contentType, filename }) {
  throw new Error('Whisper local está deshabilitado temporalmente. Por favor, usa ElevenLabs o Hugging Face como proveedor STT.');
}

const PROVIDERS = {
  whisper: transcribeWithWhisper,
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

