const API_URL = 'https://salud-digital-backend.onrender.com/api';

interface FhirResponse<T = any> {
  success: boolean;
  resource: T;
}

interface FhirBundleResponse {
  success: boolean;
  bundle: any;
}

interface FhirCapabilityResponse {
  success: boolean;
  capabilityStatement: any;
}

// Helper function for generic requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = `FHIR gateway error: ${response.status}`;
      try {
        const errorJson = JSON.parse(text);
        errorMessage += ` - ${errorJson.error || errorJson.message || text}`;
        if (errorJson.details) {
          errorMessage += ` (${errorJson.details})`;
        }
      } catch {
        errorMessage += ` - ${text}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error: any) {
    console.error(`❌ Error en request a ${endpoint}:`, error);
    throw error;
  }
}

async function post<T>(endpoint: string, body: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

async function get<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, {
    method: 'GET'
  });
}

async function put<T>(endpoint: string, body: any): Promise<T> {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

async function del<T>(endpoint: string): Promise<T> {
  return request<T>(endpoint, {
    method: 'DELETE'
  });
}

// ==================== CREATE OPERATIONS ====================

export async function syncPatient(resource: any, identifier?: string): Promise<FhirResponse> {
  return post<FhirResponse>('/fhir/patient', { resource, identifier });
}

export async function createCondition(resource: any): Promise<FhirResponse> {
  return post<FhirResponse>('/fhir/condition', { resource });
}

export async function createMedication(resource: any, id?: string): Promise<FhirResponse> {
  return post<FhirResponse>('/fhir/medication', { resource, id });
}

export async function createMedicationRequest(resource: any): Promise<FhirResponse> {
  return post<FhirResponse>('/fhir/medication-request', { resource });
}

// ==================== READ OPERATIONS ====================

export async function getPatient(id: string): Promise<FhirResponse> {
  return get<FhirResponse>(`/fhir/patient/${id}`);
}

export async function getCondition(id: string): Promise<FhirResponse> {
  return get<FhirResponse>(`/fhir/condition/${id}`);
}

export async function getMedication(id: string): Promise<FhirResponse> {
  return get<FhirResponse>(`/fhir/medication/${id}`);
}

export async function getMedicationRequest(id: string): Promise<FhirResponse> {
  return get<FhirResponse>(`/fhir/medication-request/${id}`);
}

// ==================== UPDATE OPERATIONS ====================

export async function updatePatient(id: string, resource: any): Promise<FhirResponse> {
  return put<FhirResponse>(`/fhir/patient/${id}`, { resource });
}

export async function updateCondition(id: string, resource: any): Promise<FhirResponse> {
  return put<FhirResponse>(`/fhir/condition/${id}`, { resource });
}

export async function updateMedication(id: string, resource: any): Promise<FhirResponse> {
  return put<FhirResponse>(`/fhir/medication/${id}`, { resource });
}

export async function updateMedicationRequest(id: string, resource: any): Promise<FhirResponse> {
  return put<FhirResponse>(`/fhir/medication-request/${id}`, { resource });
}

// ==================== DELETE OPERATIONS ====================

export async function deletePatient(id: string): Promise<{ success: boolean; message: string }> {
  return del<{ success: boolean; message: string }>(`/fhir/patient/${id}`);
}

export async function deleteCondition(id: string): Promise<{ success: boolean; message: string }> {
  return del<{ success: boolean; message: string }>(`/fhir/condition/${id}`);
}

export async function deleteMedication(id: string): Promise<{ success: boolean; message: string }> {
  return del<{ success: boolean; message: string }>(`/fhir/medication/${id}`);
}

export async function deleteMedicationRequest(id: string): Promise<{ success: boolean; message: string }> {
  return del<{ success: boolean; message: string }>(`/fhir/medication-request/${id}`);
}

// ==================== SEARCH OPERATIONS ====================

export async function searchPatients(params: Record<string, string>): Promise<FhirBundleResponse> {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return get<FhirBundleResponse>(`/fhir/patient?${queryString}`);
}

export async function searchConditions(params: Record<string, string>): Promise<FhirBundleResponse> {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return get<FhirBundleResponse>(`/fhir/condition?${queryString}`);
}

export async function searchMedications(params: Record<string, string>): Promise<FhirBundleResponse> {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return get<FhirBundleResponse>(`/fhir/medication?${queryString}`);
}

export async function searchMedicationRequests(params: Record<string, string>): Promise<FhirBundleResponse> {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return get<FhirBundleResponse>(`/fhir/medication-request?${queryString}`);
}

// ==================== METADATA ====================

export async function getCapabilityStatement(): Promise<FhirCapabilityResponse> {
  return get<FhirCapabilityResponse>('/fhir/metadata');
}

