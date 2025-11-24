const fetch = require('node-fetch');

const BASE_URL = process.env.FHIR_BASE_URL || 'http://localhost:8080/hapi-fhir-jpaserver/fhir';
const USERNAME = process.env.FHIR_USERNAME;
const PASSWORD = process.env.FHIR_PASSWORD;

function getAuthHeaders() {
  if (USERNAME && PASSWORD) {
    const token = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

async function fhirRequest(method, resourceType, body, resourceId, queryString) {
  const urlParts = [BASE_URL, resourceType];
  if (resourceId) {
    urlParts.push(resourceId);
  }
  let url = urlParts.join('/');
  if (queryString) {
    url += `?${queryString}`;
  }

  console.log(`[FHIR Client] ${method} ${url}`);
  
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
      const errorMsg = `FHIR ${method} ${resourceType} failed: ${response.status} ${text}`;
      console.error(`[FHIR Client] Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const result = await response.json();
    console.log(`[FHIR Client] ${method} ${resourceType} success`);
    return result;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      throw new Error(`No se puede conectar al servidor FHIR en ${BASE_URL}. Verifica que el servidor esté corriendo o actualiza FHIR_BASE_URL en .env`);
    }
    throw error;
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
  // READ operations
  readResource,
  readPatient,
  readCondition,
  readMedication,
  readMedicationRequest,
  // UPDATE operations
  updateResource,
  updatePatient,
  updateCondition,
  updateMedication,
  updateMedicationRequest,
  // DELETE operations
  deleteResource,
  deletePatient,
  deleteCondition,
  deleteMedication,
  deleteMedicationRequest,
  // SEARCH operations
  searchResources,
  searchPatients,
  searchConditions,
  searchMedications,
  searchMedicationRequests,
  // Metadata
  getCapabilityStatement,
  helpers: {
    BASE_URL
  }
};

