import { API_BASE_URL } from '../config/api';

export interface TerminologyOption {
  code: string;
  display: string;
  system?: string;
  designation?: Array<Record<string, any>>;
}

const API_URL = API_BASE_URL;

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Terminology request failed: ${response.status}`);
  }
  return response.json();
}

export async function searchCIE10(query: string): Promise<TerminologyOption[]> {
  if (!query || query.length < 2) return [];
  return get<TerminologyOption[]>(`/terminology/cie10?query=${encodeURIComponent(query)}`);
}

export async function searchMedications(query: string): Promise<TerminologyOption[]> {
  if (!query || query.length < 2) return [];
  return get<TerminologyOption[]>(`/terminology/medications?query=${encodeURIComponent(query)}`);
}

interface ValidateCodePayload {
  type?: 'cie10' | 'medication';
  valueSetUrl?: string;
  system?: string;
  code: string;
  display?: string;
}

export async function validateCode(payload: ValidateCodePayload) {
  const response = await fetch(`${API_URL}/terminology/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Terminology validate failed: ${response.status} ${text}`);
  }

  return response.json();
}

