/**
 * Servicio de Inteligencia Artificial - Frontend
 * Cliente para interactuar con los endpoints de IA del backend
 */

const API_URL = 'https://salud-digital-backend.onrender.com/api';

export interface StrokePredictionRequest {
  age: number;
  gender?: string;
  estadoCivil?: string;
  tensionSistolica?: string | number;
  tensionDiastolica?: string | number;
  frecuenciaCardiaca?: string | number;
  peso?: string | number;
  talla?: string | number;
  imc?: string | number;
  glucometria?: string | number;
  antecedentesPersonales?: any;
  antecedentesFamiliares?: string;
  revisionPorSistemas?: any;
  // Nuevos campos
  territorio?: string;
  ocupacion?: string;
  smokingStatus?: string;
}

export interface StrokePredictionResponse {
  success: boolean;
  probability?: number;
  risk_level?: 'low' | 'medium' | 'high';
  prediction?: number;
  recommendations?: string[];
  error?: string;
  missingFields?: string[];
  details?: string;
}

export interface DiagnosisSuggestionResponse {
  success: boolean;
  suggestions?: Array<{
    diagnosis: string;
    confidence: number;
    icd10?: string;
  }>;
  error?: string;
}

export interface SummaryResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * Predice riesgo de stroke basado en datos del paciente
 */
export async function predictStrokeRisk(
  patientData: StrokePredictionRequest
): Promise<StrokePredictionResponse> {
  try {
    const response = await fetch(`${API_URL}/ai/predict/stroke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Error en predictStrokeRisk:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al predecir riesgo de stroke'
    };
  }
}

/**
 * Sugiere diagnósticos basados en síntomas (placeholder)
 */
export async function suggestDiagnosis(
  symptoms: string,
  patientData?: Partial<StrokePredictionRequest>
): Promise<DiagnosisSuggestionResponse> {
  try {
    const params = new URLSearchParams({
      symptoms
    });
    
    if (patientData) {
      params.append('patientData', JSON.stringify(patientData));
    }

    const response = await fetch(`${API_URL}/ai/suggest/diagnosis?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Error en suggestDiagnosis:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al sugerir diagnósticos'
    };
  }
}

/**
 * Genera resumen automático de consulta (placeholder)
 */
export async function generateSummary(
  clinicalNotes: {
    motivoConsulta?: string;
    enfermedadActual?: string;
    examenFisico?: string;
    diagnosticos?: string[];
  }
): Promise<SummaryResponse> {
  try {
    const response = await fetch(`${API_URL}/ai/generate/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clinicalNotes })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('❌ Error en generateSummary:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar resumen'
    };
  }
}

