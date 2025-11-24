// src/services/authService.ts
import { User, LoginCredentials } from '../types/auth';
import { PerfilAutocompletado, CrearPerfilPayload, ActualizarPerfilPayload } from '../types/perfiles';
import { ConsultaADRESResponse } from '../types/adres';
import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  team: string;
  document: string;
}

export interface LoginResponse {
  success: boolean;
  user: ApiUser;
}

export class AuthService {
  private static readonly SESSION_KEY = 'aps_user_session';

  // Método helper para peticiones GET
  static async get(url: string) {
    try {
      const response = await fetch(`${API_URL}${url}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error en GET:', error);
      throw error;
    }
  }

  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      console.log('Intentando login con:', credentials);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: credentials.username, 
          password: credentials.password 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error de autenticación');
      }

      const result: LoginResponse = await response.json();
      
      if (!result.success || !result.user) {
        throw new Error('Error en la respuesta del servidor');
      }

      // Mapear el usuario de la API al formato que espera tu frontend
      const user: User = {
        id: result.user.id.toString(),
        username: result.user.email,
        role: this.mapRole(result.user.role),
        name: result.user.name
      };

      // Datos adicionales para guardar en sesión (no requeridos por el tipo User)
      const sessionData = {
        ...user,
        email: result.user.email,
        team: result.user.team,
        document: result.user.document
      } as any;

      console.log('Login exitoso:', user);
      
      // Guardar sesión en localStorage
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      
      return user;
    } catch (error) {
      console.error('Error en login:', error);
      throw new Error(error instanceof Error ? error.message : 'Error de conexión con el servidor');
    }
  }

  static async getPacientesByFamilia(familiaId: number) {
    const response = await fetch(`${API_URL}/familias/${familiaId}/pacientes`);
    if (!response.ok) throw new Error('Error obteniendo pacientes');
    return response.json();
  }

  static async crearPaciente(data: {
    familia_id: number;
    numero_documento: string;
    tipo_documento: string;
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
    fecha_nacimiento?: string | null;
    genero?: string | null;
    telefono?: string | null;
    email?: string | null;
  }) {
    const response = await fetch(`${API_URL}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo crear el paciente');
    }
    return response.json();
  }
  // Mapear roles de la base de datos a los roles de tu frontend
  private static mapRole(dbRole: string): string {
    // Normalizar eliminando acentos y usando minúsculas para evitar
    // discrepancias por capitalización o tildes provenientes de la BD
    const normalize = (s: string) =>
      (s || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}+/gu, '')
        .toLowerCase()
        .trim();

    const key = normalize(dbRole);

    const roleMap: { [key: string]: string } = {
      'medico': 'medico',
      'psicologo': 'psicologo',
      'fisioterapeuta': 'fisioterapeuta',
      'nutricionista': 'nutricionista',
      'fonoaudiologo': 'fonoaudiologo',
      'odontologo': 'odontologo',
      'enfermero jefe': 'enfermero_jefe',
      'auxiliar de enfermeria': 'auxiliar_enfermeria',
      'administrativo': 'administrativo',
      'ente de salud publica': 'ente_salud_publica',
      'administrador': 'administrador'
    };

    return roleMap[key] || key;
  }

  static logout(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static getCurrentUser(): User | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;
      
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Error parsing session data:', error);
      this.logout();
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static hasRole(requiredRole: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === requiredRole;
  }

  // Nuevos métodos para obtener datos de la base de datos
  static async getFamilias() {
    try {
      const response = await fetch(`${API_URL}/familias`);
      if (!response.ok) throw new Error('Error obteniendo familias');
      return response.json();
    } catch (error) {
      console.error('Error fetching familias:', error);
      throw error;
    }
  }

  static async getFamiliaPorId(familiaId: number) {
    try {
      const response = await fetch(`${API_URL}/familias/${familiaId}`);
      if (!response.ok) throw new Error('Error obteniendo familia');
      return response.json();
    } catch (error) {
      console.error('Error fetching familia:', error);
      throw error;
    }
  }

  static async crearFamilia(data: {
    apellido_principal: string;
    direccion: string;
    barrio_vereda?: string | null;
    municipio: string;
    telefono_contacto?: string | null;
    creado_por_uid: number;
  }) {
    const response = await fetch(`${API_URL}/familias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo crear la familia');
    }
    return response.json();
  }

  static async getUsuariosPorRol(rol: string) {
    try {
      const response = await fetch(`${API_URL}/usuarios/rol/${rol}`);
      if (!response.ok) throw new Error('Error obteniendo usuarios');
      return response.json();
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      throw error;
    }
  }

  // Health check del servidor
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Servidor no disponible:', error);
      return false;
    }
  }

  // ==================== MÉTODOS DE CARACTERIZACIÓN ====================

  static async crearCaracterizacion(data: any) {
    try {
      const response = await fetch(`${API_URL}/caracterizaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error creando caracterización');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en crearCaracterizacion:', error);
      throw error;
    }
  }

  static async getCaracterizacionFamilia(familiaId: number) {
    try {
      const response = await fetch(`${API_URL}/familias/${familiaId}/caracterizacion`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No hay caracterización
        }
        throw new Error('Error obteniendo caracterización');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en getCaracterizacionFamilia:', error);
      throw error;
    }
  }

  static async getPacienteDetalle(pacienteId: number) {
    try {
      // Por ahora, obtener el paciente con su caracterización desde la familia
      // En el futuro esto podría ser un endpoint específico
      const response = await fetch(`${API_URL}/pacientes/${pacienteId}`);
      
      if (!response.ok) {
        throw new Error('Error obteniendo detalle del paciente');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en getPacienteDetalle:', error);
      throw error;
    }
  }

  static async getPacienteResumenClinico(pacienteId: number) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${pacienteId}/resumen-clinico`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Error obteniendo resumen clínico');
      }
      return response.json();
    } catch (error) {
      console.error('Error en getPacienteResumenClinico:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE PLANES DE CUIDADO ====================

  static async getPlanesCuidadoPaciente(pacienteId: number) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${pacienteId}/planes-cuidado`);
      if (!response.ok) throw new Error('Error obteniendo planes de cuidado');
      return response.json();
    } catch (error) {
      console.error('Error en getPlanesCuidadoPaciente:', error);
      throw error;
    }
  }

  static async crearPlanCuidado(data: any) {
    try {
      const response = await fetch(`${API_URL}/planes-cuidado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error creando plan de cuidado');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en crearPlanCuidado:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE DEMANDAS INDUCIDAS ====================

  static async getDemandasInducidasPaciente(pacienteId: number) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${pacienteId}/demandas-inducidas`);
      if (!response.ok) throw new Error('Error obteniendo demandas inducidas');
      return response.json();
    } catch (error) {
      console.error('Error en getDemandasInducidasPaciente:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS HC MEDICINA ====================
  static async crearHCMedicina(data: any) {
    const response = await fetch(`${API_URL}/hc/medicina`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error creando historia clínica');
    }
    return response.json();
  }

  static async getHCMedicina(atencionId: number) {
    const response = await fetch(`${API_URL}/hc/medicina/${atencionId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Error obteniendo historia clínica');
    }
    return response.json();
  }

  static async updateHCMedicina(atencionId: number, data: any) {
    const response = await fetch(`${API_URL}/hc/medicina/${atencionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Error actualizando historia clínica');
    }
    return response.json();
  }

  static async getHCCompletadas(usuarioId: number, desde?: string, hasta?: string) {
    try {
      let url = `${API_URL}/usuarios/${usuarioId}/hc-completadas`;
      const params = new URLSearchParams();
      if (desde) params.append('desde', desde);
      if (hasta) params.append('hasta', hasta);
      if (params.toString()) url += '?' + params.toString();
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error obteniendo HC completadas');
      return response.json();
    } catch (error) {
      console.error('Error en getHCCompletadas:', error);
      throw error;
    }
  }

  static async completarAtencion(atencionId: number) {
    try {
      const response = await fetch(`${API_URL}/atenciones/${atencionId}/completar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error completando atención');
      }
      return response.json();
    } catch (error) {
      console.error('Error en completarAtencion:', error);
      throw error;
    }
  }

  static async getBitacora(usuarioId: number, mes?: number, ano?: number) {
    try {
      let url = `${API_URL}/usuarios/${usuarioId}/bitacora`;
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes.toString());
      if (ano) params.append('ano', ano.toString());
      if (params.toString()) url += '?' + params.toString();
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error obteniendo bitácora');
      return response.json();
    } catch (error) {
      console.error('Error en getBitacora:', error);
      throw error;
    }
  }

  static async buscarPacientes(termino: string) {
    try {
      const response = await fetch(`${API_URL}/pacientes/buscar?q=${encodeURIComponent(termino)}`);
      if (!response.ok) throw new Error('Error buscando pacientes');
      return response.json();
    } catch (error) {
      console.error('Error en buscarPacientes:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE RECETAS ====================
  static async getRecetasPaciente(pacienteId: number) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${pacienteId}/recetas`);
      if (!response.ok) throw new Error('Error obteniendo recetas');
      return response.json();
    } catch (error) {
      console.error('Error en getRecetasPaciente:', error);
      throw error;
    }
  }

  static async crearReceta(data: any) {
    try {
      const response = await fetch(`${API_URL}/recetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error creando receta');
      }
      return response.json();
    } catch (error) {
      console.error('Error en crearReceta:', error);
      throw error;
    }
  }

  static async marcarRecetaImpresion(recetaId: number) {
    try {
      const response = await fetch(`${API_URL}/recetas/${recetaId}/imprimir`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Error marcando receta como impresa');
      return response.json();
    } catch (error) {
      console.error('Error en marcarRecetaImpresion:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE ÓRDENES DE LABORATORIO ====================
  static async getOrdenesPaciente(pacienteId: number) {
    try {
      const response = await fetch(`${API_URL}/pacientes/${pacienteId}/ordenes-laboratorio`);
      if (!response.ok) throw new Error('Error obteniendo órdenes de laboratorio');
      return response.json();
    } catch (error) {
      console.error('Error en getOrdenesPaciente:', error);
      throw error;
    }
  }

  static async crearOrdenLaboratorio(data: any) {
    try {
      const response = await fetch(`${API_URL}/ordenes-laboratorio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error creando orden de laboratorio');
      }
      return response.json();
    } catch (error) {
      console.error('Error en crearOrdenLaboratorio:', error);
      throw error;
    }
  }

  static async marcarOrdenImpresion(ordenId: number) {
    try {
      const response = await fetch(`${API_URL}/ordenes-laboratorio/${ordenId}/imprimir`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Error marcando orden como impresa');
      return response.json();
    } catch (error) {
      console.error('Error en marcarOrdenImpresion:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE DASHBOARD ====================
  static async getResumenActividad(usuarioId: number) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${usuarioId}/resumen-actividad`);
      if (!response.ok) throw new Error('Error obteniendo resumen de actividad');
      return response.json();
    } catch (error) {
      console.error('Error en getResumenActividad:', error);
      throw error;
    }
  }

  static async getDashboardEpidemio() {
    try {
      const response = await fetch(`${API_URL}/dashboard/epidemio`);
      if (!response.ok) throw new Error('Error obteniendo dashboard epidemiológico');
      return response.json();
    } catch (error) {
      console.error('Error en getDashboardEpidemio:', error);
      throw error;
    }
  }

  static async crearDemandaInducida(data: any) {
    try {
      const response = await fetch(`${API_URL}/demandas-inducidas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error creando demanda inducida');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error en crearDemandaInducida:', error);
      throw error;
    }
  }

  static async getDemandasAsignadas(usuarioId: number) {
    try {
      const response = await fetch(`${API_URL}/usuarios/${usuarioId}/demandas-asignadas`);
      if (!response.ok) throw new Error('Error obteniendo demandas asignadas');
      return response.json();
    } catch (error) {
      console.error('Error en getDemandasAsignadas:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS HC PSICOLOGIA ====================
  static async crearHCPsicologia(data: any) {
    const response = await fetch(`${API_URL}/hc/psicologia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error creando HC psicológica' }));
      throw new Error(error.error || 'Error creando historia clínica psicológica');
    }
    return response.json();
  }

  static async getHCPsicologia(atencionId: number) {
    const response = await fetch(`${API_URL}/hc/psicologia/${atencionId}`);
    if (!response.ok) throw new Error('Error obteniendo HC psicológica');
    return response.json();
  }

  static async updateHCPsicologia(atencionId: number, data: any) {
    const response = await fetch(`${API_URL}/hc/psicologia/${atencionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error actualizando HC psicológica');
    return response.json();
  }

  static async getHCPsicologiaPaciente(pacienteId: number) {
    const response = await fetch(`${API_URL}/pacientes/${pacienteId}/hc-psicologia`);
    if (!response.ok) throw new Error('Error obteniendo HC psicológicas del paciente');
    return response.json();
  }

  static async getHCPsicologiaCompletadas(usuarioId: number) {
    const response = await fetch(`${API_URL}/usuarios/${usuarioId}/hc-psicologia-completadas`);
    if (!response.ok) throw new Error('Error obteniendo HC psicológicas completadas');
    return response.json();
  }

  // ==================== MÉTODOS PERFILES AUTOCOMPLETADO ====================

  static async getPerfiles(tipoPerfil?: string, usuarioId?: number): Promise<PerfilAutocompletado[]> {
    try {
      const params = new URLSearchParams();
      if (tipoPerfil) params.append('tipo_perfil', tipoPerfil);
      if (usuarioId) params.append('usuario_id', usuarioId.toString());
      
      const url = `${API_URL}/perfiles-autocompletado${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 [getPerfiles] URL:', url);
      const response = await fetch(url);
      console.log('🔍 [getPerfiles] Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 [getPerfiles] Error response:', errorText);
        throw new Error(`Error obteniendo perfiles: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('🔍 [getPerfiles] Data recibida:', data);
      return data;
    } catch (error) {
      console.error('Error en getPerfiles:', error);
      throw error;
    }
  }

  static async getPerfil(id: number): Promise<PerfilAutocompletado> {
    try {
      const response = await fetch(`${API_URL}/perfiles-autocompletado/${id}`);
      if (!response.ok) throw new Error('Error obteniendo perfil');
      return response.json();
    } catch (error) {
      console.error('Error en getPerfil:', error);
      throw error;
    }
  }

  static async crearPerfil(payload: CrearPerfilPayload): Promise<PerfilAutocompletado> {
    try {
      const user = this.getCurrentUser();
      const response = await fetch(`${API_URL}/perfiles-autocompletado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          creado_por_uid: user?.id
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error creando perfil');
      }
      return response.json();
    } catch (error) {
      console.error('Error en crearPerfil:', error);
      throw error;
    }
  }

  static async actualizarPerfil(id: number, payload: ActualizarPerfilPayload): Promise<PerfilAutocompletado> {
    try {
      const response = await fetch(`${API_URL}/perfiles-autocompletado/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error actualizando perfil');
      }
      return response.json();
    } catch (error) {
      console.error('Error en actualizarPerfil:', error);
      throw error;
    }
  }

  static async eliminarPerfil(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/perfiles-autocompletado/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error eliminando perfil');
      }
    } catch (error) {
      console.error('Error en eliminarPerfil:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS CONSULTA ADRES ====================

  static async consultarADRES(numeroDocumento: string, tipoDocumento: string = 'CC'): Promise<ConsultaADRESResponse & { requiere_configuracion?: boolean }> {
    try {
      const url = `${API_URL}/pacientes/consultar-adres/${numeroDocumento}?tipo_documento=${tipoDocumento}`;
      console.log('🔍 [consultarADRES] URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        // Si es 503, significa que la API no está configurada
        if (response.status === 503 && data.requiere_configuracion) {
          return {
            success: false,
            message: data.message || 'La integración con ADRES no está configurada',
            datos: null,
            requiere_configuracion: true
          };
        }
        
        // Si es 404, significa que no se encontró información (no es un error crítico)
        if (response.status === 404) {
          return {
            success: false,
            message: data.message || 'No se encontró información del paciente',
            datos: null
          };
        }
        
        throw new Error(data.error || data.message || 'Error consultando ADRES');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error en consultarADRES:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
        message: 'No se pudo consultar ADRES. Puede ingresar los datos manualmente.',
        datos: null
      };
    }
  }

  // ==================== SCRAPER ADRES (MANUAL) ====================

  static async iniciarScraperADRES(numeroDocumento: string, tipoDocumento: string = 'CC'): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/adres-scraper/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_documento: numeroDocumento,
          tipo_documento: tipoDocumento
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error iniciando scraper ADRES:', error);
      throw error;
    }
  }

  static async obtenerResultadoScraperADRES(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/adres-scraper/resultado`);
      if (!response.ok) {
        if (response.status === 404) return null;
        const err = await response.text();
        throw new Error(err || `Error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo resultado scraper ADRES:', error);
      throw error;
    }
  }
}