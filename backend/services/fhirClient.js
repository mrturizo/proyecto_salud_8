const fetch = require('node-fetch');

const BASE_URL = process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4';
const USERNAME = process.env.FHIR_USERNAME;
const PASSWORD = process.env.FHIR_PASSWORD;
const DEFAULT_MAX_RETRIES = parseInt(process.env.FHIR_MAX_RETRIES || '4', 10);
const BASE_DELAY_MS = parseInt(process.env.FHIR_BACKOFF_BASE_MS || '500', 10);
const MAX_DELAY_MS = parseInt(process.env.FHIR_BACKOFF_MAX_MS || '10000', 10);
const JITTER_MS = parseInt(process.env.FHIR_BACKOFF_JITTER_MS || '250', 10);
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 522, 524]);

function getAuthHeaders() {
  if (USERNAME && PASSWORD) {
    const token = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateDelay(attempt) {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * JITTER_MS);
  return Math.min(exponentialDelay + jitter, MAX_DELAY_MS);
}

async function fhirRequest(method, resourceType, body, resourceId, queryString, retries = DEFAULT_MAX_RETRIES) {
  const urlParts = [BASE_URL, resourceType];
  if (resourceId) {
    urlParts.push(resourceId);
  }
  let url = urlParts.join('/');
  if (queryString) {
    url += `?${queryString}`;
  }

  console.log(`[FHIR Client] ${method} ${url}`);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/fhir+json',
          Accept: 'application/fhir+json',
          ...getAuthHeaders()
        },
        body: body ? JSON.stringify(body) : undefined,
        timeout: 30000 // 30 segundos timeout
      });

      if (!response.ok) {
        const text = await response.text();
        let errorDetails = text;
        try {
          const errorJson = JSON.parse(text);
          errorDetails = errorJson.issue?.[0]?.diagnostics || errorJson.error || text;
        } catch {
          // Si no es JSON, usar el texto tal cual
        }
        
        const errorMsg = `FHIR ${method} ${resourceType} failed: ${response.status} - ${errorDetails}`;
        console.error(`[FHIR Client] Error (intento ${attempt + 1}/${retries + 1}): ${errorMsg}`);

        const shouldRetry =
          response.status >= 500 ||
          RETRYABLE_STATUS.has(response.status);

        if (shouldRetry && attempt < retries) {
          const delay = calculateDelay(attempt);
          console.warn(`[FHIR Client] Respuesta ${response.status}. Reintentando en ${delay}ms...`);
          await wait(delay);
          continue;
        }

        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log(`[FHIR Client] ${method} ${resourceType} success`);
      return result;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed') || error.message.includes('network')) {
        const errorMsg = `No se puede conectar al servidor FHIR en ${BASE_URL}. Verifica que el servidor esté corriendo o actualiza FHIR_BASE_URL en .env`;
        if (attempt < retries) {
          const delay = calculateDelay(attempt);
          console.log(`[FHIR Client] Error de conexión. Reintentando en ${delay}ms...`);
          await wait(delay);
          continue;
        }
        throw new Error(errorMsg);
      }
      
      // Si es el último intento o no es un error de red, lanzar el error
      if (attempt >= retries || !error.message.includes('timeout')) {
        throw error;
      }
      
      // Reintentar para timeouts
      const delay = calculateDelay(attempt);
      console.log(`[FHIR Client] Timeout. Reintentando en ${delay}ms...`);
      await wait(delay);
    }
  }
}

async function upsertPatient(patientResource, identifierValue) {
  if (!patientResource || patientResource.resourceType !== 'Patient') {
    throw new Error('Invalid Patient resource');
  }

  if (identifierValue) {
    let sanitizedId = String(identifierValue).replace(/[^A-Za-z0-9\-]/g, '');
    
    // HAPI FHIR requiere que los IDs asignados por el cliente tengan al menos un carácter no numérico
    // Si el ID es puramente numérico, agregamos un prefijo
    if (/^\d+$/.test(sanitizedId)) {
      sanitizedId = `id-${sanitizedId}`;
    }
    
    return fhirRequest('PUT', 'Patient', { ...patientResource, id: sanitizedId }, sanitizedId);
  }

  return fhirRequest('POST', 'Patient', patientResource);
}

async function createCondition(conditionResource) {
  if (!conditionResource || conditionResource.resourceType !== 'Condition') {
    throw new Error('Invalid Condition resource');
  }
  return fhirRequest('POST', 'Condition', conditionResource);
}

async function createMedication(medicationResource, medicationId) {
  if (!medicationResource || medicationResource.resourceType !== 'Medication') {
    throw new Error('Invalid Medication resource');
  }
  if (medicationId) {
    return fhirRequest('PUT', 'Medication', { ...medicationResource, id: medicationId }, medicationId);
  }
  return fhirRequest('POST', 'Medication', medicationResource);
}

async function createMedicationRequest(medicationRequestResource) {
  if (!medicationRequestResource || medicationRequestResource.resourceType !== 'MedicationRequest') {
    throw new Error('Invalid MedicationRequest resource');
  }
  return fhirRequest('POST', 'MedicationRequest', medicationRequestResource);
}

async function createEncounter(encounterResource) {
  if (!encounterResource || encounterResource.resourceType !== 'Encounter') {
    throw new Error('Invalid Encounter resource');
  }
  return fhirRequest('POST', 'Encounter', encounterResource);
}

async function createObservation(observationResource) {
  if (!observationResource || observationResource.resourceType !== 'Observation') {
    throw new Error('Invalid Observation resource');
  }
  return fhirRequest('POST', 'Observation', observationResource);
}

async function createComposition(compositionResource) {
  if (!compositionResource || compositionResource.resourceType !== 'Composition') {
    throw new Error('Invalid Composition resource');
  }
  return fhirRequest('POST', 'Composition', compositionResource);
}

async function createPractitioner(practitionerResource) {
  if (!practitionerResource || practitionerResource.resourceType !== 'Practitioner') {
    throw new Error('Invalid Practitioner resource');
  }
  return fhirRequest('POST', 'Practitioner', practitionerResource);
}

// ==================== READ OPERATIONS ====================

async function readResource(resourceType, resourceId) {
  if (!resourceType || !resourceId) {
    throw new Error('Resource type and ID are required');
  }
  return fhirRequest('GET', resourceType, null, resourceId);
}

async function readPatient(patientId) {
  return readResource('Patient', patientId);
}

async function readCondition(conditionId) {
  return readResource('Condition', conditionId);
}

async function readMedication(medicationId) {
  return readResource('Medication', medicationId);
}

async function readMedicationRequest(medicationRequestId) {
  return readResource('MedicationRequest', medicationRequestId);
}

async function readEncounter(encounterId) {
  return readResource('Encounter', encounterId);
}

async function readObservation(observationId) {
  return readResource('Observation', observationId);
}

async function readComposition(compositionId) {
  return readResource('Composition', compositionId);
}

async function readPractitioner(practitionerId) {
  return readResource('Practitioner', practitionerId);
}

// ==================== UPDATE OPERATIONS ====================

async function updateResource(resourceType, resourceId, resource) {
  if (!resourceType || !resourceId || !resource) {
    throw new Error('Resource type, ID and resource are required');
  }
  if (resource.resourceType !== resourceType) {
    throw new Error(`Resource type mismatch: expected ${resourceType}, got ${resource.resourceType}`);
  }
  return fhirRequest('PUT', resourceType, { ...resource, id: resourceId }, resourceId);
}

async function updatePatient(patientId, patientResource) {
  if (!patientResource || patientResource.resourceType !== 'Patient') {
    throw new Error('Invalid Patient resource');
  }
  return updateResource('Patient', patientId, patientResource);
}

async function updateCondition(conditionId, conditionResource) {
  if (!conditionResource || conditionResource.resourceType !== 'Condition') {
    throw new Error('Invalid Condition resource');
  }
  return updateResource('Condition', conditionId, conditionResource);
}

async function updateMedication(medicationId, medicationResource) {
  if (!medicationResource || medicationResource.resourceType !== 'Medication') {
    throw new Error('Invalid Medication resource');
  }
  return updateResource('Medication', medicationId, medicationResource);
}

async function updateMedicationRequest(medicationRequestId, medicationRequestResource) {
  if (!medicationRequestResource || medicationRequestResource.resourceType !== 'MedicationRequest') {
    throw new Error('Invalid MedicationRequest resource');
  }
  return updateResource('MedicationRequest', medicationRequestId, medicationRequestResource);
}

async function updateEncounter(encounterId, encounterResource) {
  if (!encounterResource || encounterResource.resourceType !== 'Encounter') {
    throw new Error('Invalid Encounter resource');
  }
  return updateResource('Encounter', encounterId, encounterResource);
}

async function updateObservation(observationId, observationResource) {
  if (!observationResource || observationResource.resourceType !== 'Observation') {
    throw new Error('Invalid Observation resource');
  }
  return updateResource('Observation', observationId, observationResource);
}

async function updateComposition(compositionId, compositionResource) {
  if (!compositionResource || compositionResource.resourceType !== 'Composition') {
    throw new Error('Invalid Composition resource');
  }
  return updateResource('Composition', compositionId, compositionResource);
}

async function updatePractitioner(practitionerId, practitionerResource) {
  if (!practitionerResource || practitionerResource.resourceType !== 'Practitioner') {
    throw new Error('Invalid Practitioner resource');
  }
  return updateResource('Practitioner', practitionerId, practitionerResource);
}

// ==================== DELETE OPERATIONS ====================

async function deleteResource(resourceType, resourceId) {
  if (!resourceType || !resourceId) {
    throw new Error('Resource type and ID are required');
  }
  return fhirRequest('DELETE', resourceType, null, resourceId);
}

async function deletePatient(patientId) {
  return deleteResource('Patient', patientId);
}

async function deleteCondition(conditionId) {
  return deleteResource('Condition', conditionId);
}

async function deleteMedication(medicationId) {
  return deleteResource('Medication', medicationId);
}

async function deleteMedicationRequest(medicationRequestId) {
  return deleteResource('MedicationRequest', medicationRequestId);
}

async function deleteEncounter(encounterId) {
  return deleteResource('Encounter', encounterId);
}

async function deleteObservation(observationId) {
  return deleteResource('Observation', observationId);
}

async function deleteComposition(compositionId) {
  return deleteResource('Composition', compositionId);
}

async function deletePractitioner(practitionerId) {
  return deleteResource('Practitioner', practitionerId);
}

// ==================== SEARCH OPERATIONS ====================

async function searchResources(resourceType, queryParams) {
  if (!resourceType) {
    throw new Error('Resource type is required');
  }
  
  // Construir query string desde objeto de parámetros
  const queryString = queryParams && Object.keys(queryParams).length > 0
    ? Object.entries(queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : null;
  
  return fhirRequest('GET', resourceType, null, null, queryString);
}

async function searchPatients(queryParams) {
  return searchResources('Patient', queryParams);
}

async function searchConditions(queryParams) {
  return searchResources('Condition', queryParams);
}

async function searchMedications(queryParams) {
  return searchResources('Medication', queryParams);
}

async function searchMedicationRequests(queryParams) {
  return searchResources('MedicationRequest', queryParams);
}

async function searchEncounters(queryParams) {
  return searchResources('Encounter', queryParams);
}

async function searchObservations(queryParams) {
  return searchResources('Observation', queryParams);
}

async function searchCompositions(queryParams) {
  return searchResources('Composition', queryParams);
}

async function searchPractitioners(queryParams) {
  return searchResources('Practitioner', queryParams);
}

// ==================== CAPABILITY STATEMENT ====================

async function getCapabilityStatement() {
  return fhirRequest('GET', 'metadata', null, null, null);
}

module.exports = {
  // CREATE operations
  upsertPatient,
  createCondition,
  createMedication,
  createMedicationRequest,
  createEncounter,
  createObservation,
  createComposition,
  createPractitioner,
  // READ operations
  readResource,
  readPatient,
  readCondition,
  readMedication,
  readMedicationRequest,
  readEncounter,
  readObservation,
  readComposition,
  readPractitioner,
  // UPDATE operations
  updateResource,
  updatePatient,
  updateCondition,
  updateMedication,
  updateMedicationRequest,
  updateEncounter,
  updateObservation,
  updateComposition,
  updatePractitioner,
  // DELETE operations
  deleteResource,
  deletePatient,
  deleteCondition,
  deleteMedication,
  deleteMedicationRequest,
  deleteEncounter,
  deleteObservation,
  deleteComposition,
  deletePractitioner,
  // SEARCH operations
  searchResources,
  searchPatients,
  searchConditions,
  searchMedications,
  searchMedicationRequests,
  searchEncounters,
  searchObservations,
  searchCompositions,
  searchPractitioners,
  // Metadata
  getCapabilityStatement,
  helpers: {
    BASE_URL
  }
};

