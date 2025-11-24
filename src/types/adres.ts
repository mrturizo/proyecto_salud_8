// Tipos para datos de consulta ADRES

export interface DatosADRES {
  nombres?: string;
  apellidos?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  eps?: string;
  regimen?: string;
  numero_afiliacion?: string;
  estado_afiliacion?: string;
  tipo_afiliado?: string;
  tipo_documento?: string;
  numero_documento?: string;
}

export interface ConsultaADRESResponse {
  success: boolean;
  datos?: DatosADRES;
  error?: string;
  message?: string;
}

