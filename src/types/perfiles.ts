// Tipos para perfiles de autocompletado

export interface PerfilAutocompletado {
  perfil_id: number;
  nombre_perfil: string;
  descripcion?: string;
  tipo_perfil: 'HC_Medicina' | 'HC_Psicologia' | 'HC_Enfermeria' | 'General';
  datos_perfil: DatosPerfilHC;
  creado_por_uid?: number;
  creado_por_nombre?: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface DatosPerfilHC {
  motivo_consulta?: string;
  enfoque_diferencial?: {
    ciclo_vida?: string;
    genero?: string;
    grupo_etnico?: string;
    orientacion_sexual?: string;
    discapacidad?: boolean;
    victima_violencia?: boolean;
    desplazamiento?: boolean;
    reclusion?: boolean;
    gestante_lactante?: boolean;
    trabajador_salud?: boolean;
  };
  enfermedad_actual?: string;
  antecedentes_familiares?: string;
  examen_fisico?: string;
  plan_manejo?: string;
  diagnostico_principal?: string;
  conducta_seguir?: string;
  evolucion?: string;
  analisis?: string;
  // Agregar más campos según se necesiten
  [key: string]: any;
}

export interface CrearPerfilPayload {
  nombre_perfil: string;
  descripcion?: string;
  tipo_perfil?: 'HC_Medicina' | 'HC_Psicologia' | 'HC_Enfermeria' | 'General';
  datos_perfil: DatosPerfilHC;
  creado_por_uid?: number;
}

export interface ActualizarPerfilPayload {
  nombre_perfil?: string;
  descripcion?: string;
  tipo_perfil?: 'HC_Medicina' | 'HC_Psicologia' | 'HC_Enfermeria' | 'General';
  datos_perfil?: DatosPerfilHC;
}

