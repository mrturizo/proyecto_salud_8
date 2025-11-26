const fetch = require('node-fetch');

const BASE_URL = process.env.FHIR_BASE_URL || 'https://hapi.fhir.org/baseR4';
const USERNAME = process.env.FHIR_USERNAME;
const PASSWORD = process.env.FHIR_PASSWORD;

function getAuthHeaders() {
  if (USERNAME && PASSWORD) {
    const token = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

async function fhirRequest(method, resourceType, body, resourceId, queryString, retries = 2) {
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
        
        // No reintentar para errores 4xx (errores del cliente)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMsg);
        }
        
        // Reintentar para errores 5xx o de red
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
          console.log(`[FHIR Client] Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
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
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[FHIR Client] Error de conexión. Reintentando en ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(errorMsg);
      }
      
      // Si es el último intento o no es un error de red, lanzar el error
      if (attempt >= retries || !error.message.includes('timeout')) {
        throw error;
      }
      
      // Reintentar para timeouts
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`[FHIR Client] Timeout. Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function upsertPatient(patientResource, identifierValue) {
  if (!patientResource || patientResource.resourceType !== 'Patient') {
    throw new Error('Invalid Patient resource');
  }

  if (identifierValue) {
    const sanitizedId = identifierValue.replace(/[^A-Za-z0-9\-]/g, '');
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
  // READ operations
  readResource,
  readPatient,
  readCondition,
  readMedication,
  readMedicationRequest,
  readEncounter,
  readObservation,
  readComposition,
  // UPDATE operations
  updateResource,
  updatePatient,
  updateCondition,
  updateMedication,
  updateMedicationRequest,
  updateEncounter,
  updateObservation,
  updateComposition,
  // DELETE operations
  deleteResource,
  deletePatient,
  deleteCondition,
  deleteMedication,
  deleteMedicationRequest,
  deleteEncounter,
  deleteObservation,
  deleteComposition,
  // SEARCH operations
  searchResources,
  searchPatients,
  searchConditions,
  searchMedications,
  searchMedicationRequests,
  searchEncounters,
  searchObservations,
  searchCompositions,
  // Metadata
  getCapabilityStatement,
  helpers: {
    BASE_URL
  }
};

