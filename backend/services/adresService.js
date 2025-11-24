// backend/services/adresService.js
// Servicio para consultar datos de pacientes desde ADRES/BDUA
// Integración con Apitude (https://apitude.co)

const fetch = require('node-fetch');
require('dotenv').config();

/**
 * Mapea tipo de documento a formato de Apitude
 */
function mapearTipoDocumento(tipoDocumento) {
  const mapeo = {
    'CC': 'cedula',
    'TI': 'cedula', // Apitude usa 'cedula' para ambos
    'CE': 'cedula'
  };
  return mapeo[tipoDocumento] || 'cedula';
}

/**
 * Consulta datos usando API de Apitude
 * @param {string} numeroDocumento - Número de documento
 * @param {string} tipoDocumento - Tipo de documento (CC, TI, CE)
 * @returns {Promise<Object|null>} Datos del paciente o null si no hay API key o no se encuentra
 */
async function consultarApitude(numeroDocumento, tipoDocumento = 'CC') {
  try {
    const apiKey = process.env.APITUDE_API_KEY;
    
    if (!apiKey) {
      console.log('[ADRES] Apitude API key no configurada. Agrega APITUDE_API_KEY en .env');
      return null;
    }

    const apiUrl = 'https://apitude.co/api/v1.0/requests/adres-co/';
    const documentType = mapearTipoDocumento(tipoDocumento);

    // Paso 1: Crear solicitud (POST)
    console.log(`[ADRES] Creando solicitud en Apitude para documento: ${numeroDocumento}`);
    
    const createResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document_number: numeroDocumento,
        document_type: documentType
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('[ADRES] Error creando solicitud en Apitude:', createResponse.status, errorText);
      return null;
    }

    const createData = await createResponse.json();
    const requestId = createData.request_id;

    if (!requestId) {
      console.error('[ADRES] No se recibió request_id de Apitude');
      return null;
    }

    console.log(`[ADRES] Solicitud creada, request_id: ${requestId}`);

    // Paso 2: Polling para obtener resultado (GET)
    const maxAttempts = 10;
    const delayMs = 2000; // 2 segundos entre intentos
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const getUrl = `https://apitude.co/api/v1.0/requests/adres-co/${requestId}/`;
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!getResponse.ok) {
        console.error(`[ADRES] Error obteniendo resultado (intento ${attempt}):`, getResponse.status);
        continue;
      }

      const resultData = await getResponse.json();
      
      // Si el resultado está completo y exitoso
      if (resultData.result && resultData.result.status === 200 && resultData.result.data) {
        const data = resultData.result.data;
        
        // Separar nombres y apellidos
        const nombresCompletos = (data.nombres || '').split(' ');
        const apellidosCompletos = (data.apellidos || '').split(' ');
        
        // Mapear respuesta de Apitude a formato estándar
        return {
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          primer_nombre: nombresCompletos[0] || '',
          segundo_nombre: nombresCompletos.slice(1).join(' ') || '',
          primer_apellido: apellidosCompletos[0] || '',
          segundo_apellido: apellidosCompletos.slice(1).join(' ') || '',
          fecha_nacimiento: data.fecha_de_nacimiento || null,
          eps: data.estado_afiliacion?.entidad || null,
          regimen: data.estado_afiliacion?.regimen || null,
          estado_afiliacion: data.estado_afiliacion?.estado || null,
          tipo_afiliado: data.estado_afiliacion?.tipo_de_afiliado || null,
          fecha_afiliacion: data.estado_afiliacion?.fecha_de_afiliacion_efectiva || null,
          municipio: data.municipio || null,
          departamento: data.departamento || null,
          tipo_identificacion: data.tipo_de_identificacion || tipoDocumento,
          numero_identificacion: data.numero_de_identificacion || numeroDocumento
        };
      }
      
      // Si el resultado es 404 (no encontrado)
      if (resultData.result && resultData.result.status === 404) {
        console.log('[ADRES] Documento no encontrado en ADRES');
        return null;
      }
      
      // Si aún está procesando, continuar polling
      if (resultData.result && resultData.result.status === 500) {
        console.log(`[ADRES] Servicio no disponible (intento ${attempt}), reintentando...`);
        continue;
      }
      
      // Si el mensaje dice que está completo pero no hay datos
      if (resultData.message === 'Request completed' && (!resultData.result || !resultData.result.data)) {
        return null;
      }
    }

    console.log('[ADRES] Timeout esperando resultado de Apitude');
    return null;
  } catch (error) {
    console.error('[ADRES] Error en consulta Apitude:', error);
    return null;
  }
}

/**
 * Consulta datos de un paciente por número de documento
 * Intenta usar Apitude primero, luego otras opciones
 * @param {string} numeroDocumento - Número de documento (cédula)
 * @param {string} tipoDocumento - Tipo de documento (CC, TI, CE)
 * @returns {Promise<Object|null>} Datos del paciente encontrados o null
 */
async function consultarADRES(numeroDocumento, tipoDocumento = 'CC') {
  try {
    console.log(`[ADRES] Consultando datos para documento: ${numeroDocumento} (${tipoDocumento})`);
    
    // Intentar con Apitude primero
    const resultadoApitude = await consultarApitude(numeroDocumento, tipoDocumento);
    if (resultadoApitude) {
      return resultadoApitude;
    }
    
    // Si Apitude no funciona o no está configurado, retornar null
    // Esto permite que el frontend maneje el caso y permita entrada manual
    return null;
  } catch (error) {
    console.error('[ADRES] Error consultando datos:', error);
    throw new Error(`Error consultando ADRES: ${error.message}`);
  }
}

/**
 * Consulta usando API de hiSmart (si está disponible)
 * Nota: Esta función requiere credenciales y puede tener costos
 */
async function consultarHiSmart(numeroDocumento, tipoDocumento) {
  try {
    const apiKey = process.env.HISMART_API_KEY;
    const apiUrl = process.env.HISMART_API_URL || 'https://hismart.com.co/toolbar/public/ApiRest/identity_validation';
    
    if (!apiKey) {
      console.log('[ADRES] HiSmart API key no configurada, omitiendo consulta');
      return null;
    }
    
    // Crear token de autenticación básica
    const authToken = Buffer.from(apiKey).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('document_type', tipoDocumento);
    formData.append('document_number', numeroDocumento);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    
    if (!response.ok) {
      console.error('[ADRES] Error en respuesta de hiSmart:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    // Mapear respuesta de hiSmart a formato estándar
    if (data && data.success) {
      return {
        nombres: data.first_name || data.nombres || '',
        apellidos: `${data.last_name || ''} ${data.second_last_name || ''}`.trim() || data.apellidos || '',
        fecha_nacimiento: data.birth_date || data.fecha_nacimiento || null,
        eps: data.eps || data.health_insurance || null,
        regimen: data.regimen || null,
        numero_afiliacion: data.affiliation_number || null,
        estado_afiliacion: data.affiliation_status || 'Activo'
      };
    }
    
    return null;
  } catch (error) {
    console.error('[ADRES] Error en consulta hiSmart:', error);
    return null;
  }
}

/**
 * Consulta usando API oficial de ADRES (cuando esté disponible)
 */
async function consultarADRESOficial(numeroDocumento, tipoDocumento) {
  try {
    const apiUrl = process.env.ADRES_API_URL;
    const apiKey = process.env.ADRES_API_KEY;
    
    if (!apiUrl || !apiKey) {
      console.log('[ADRES] API oficial no configurada');
      return null;
    }
    
    const response = await fetch(`${apiUrl}/consultar-afiliado`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tipo_documento: tipoDocumento,
        numero_documento: numeroDocumento
      })
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ADRES] Error en consulta oficial:', error);
    return null;
  }
}

module.exports = {
  consultarADRES,
  consultarApitude,
  consultarHiSmart,
  consultarADRESOficial
};

