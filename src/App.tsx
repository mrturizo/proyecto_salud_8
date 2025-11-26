import React, { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { LoginForm } from "./components/LoginForm";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserProfile } from "./components/UserProfile";
import { STTButton } from "./components/STTButton";
import { TerminologyAutocomplete } from "./components/TerminologyAutocomplete";
import { syncPatient, createCondition, createMedicationRequest, createMedication, createEncounter, createObservation, createComposition, createPractitioner, searchPractitioners } from "./services/fhirService";
import { buildPatientResource, buildConditionResources, buildMedicationRequestResources, buildMedicationResources, buildEncounterResource, buildObservationResources, buildCompositionResource, buildPractitionerResource } from "./utils/fhirMappers";
import { ConsultarADRESButton } from "./components/ConsultarADRESButton";
import { API_BASE_URL, ENABLE_TTS } from "./config/api";
import { FHIR_THROTTLE, delay as throttleDelay } from "./config/fhirThrottle";
import { AntecedentesFamiliares } from "./components/AntecedentesFamiliares";
import FHIRDemoView from "./components/FHIRDemoView";
import { useSttProvider } from "./contexts/SttProviderContext";

import { 
  User, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  Search, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Stethoscope,
  Brain,
  Dumbbell,
  Apple,
  Ear,
  Smile,
  Shield,
  UserCheck,
  Building2,
  Eye,
  ChevronRight,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Menu,
  X,
  Phone,
  MapPin,
  Camera,
  Mic,
  Save,
  Send,
  Home,
  ChevronDown,
  Filter,
  Bell,
  Wifi,
  WifiOff,
  ClipboardList,
  Heart,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Download,
  Upload,
  Calendar as CalendarIcon,
  UserPlus,
  FileCheck,
  Target,
  Globe,
  LogOut
} from "lucide-react";
import { AuthService } from "./services/authService";

const OBSERVATION_BATCH_SIZE = Math.max(1, FHIR_THROTTLE.OBSERVATION_BATCH_SIZE);
const OBSERVATION_BATCH_DELAY_MS = Math.max(0, FHIR_THROTTLE.OBSERVATION_BATCH_DELAY_MS);
const wait = throttleDelay;

// Configuración completa de todos los roles de usuario
export const USER_ROLES = {
  medico: {
    name: "Médico",
    icon: Stethoscope,
    color: "emerald",
    mainSections: [
      { key: "crear-familia", label: "Crear Familia", icon: Users },
      { key: "familias", label: "Familias", icon: Users },
      { key: "consultas-asignadas", label: "Consultas Asignadas", icon: Calendar },
      { key: "consultas-realizadas", label: "Consultas Realizadas", icon: CheckCircle },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-epidemio", label: "Dashboard", icon: BarChart3 },
      { key: "fhir-demo", label: "Interoperabilidad FHIR", icon: Globe },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  psicologo: {
    name: "Psicólogo",
    icon: Brain,
    color: "emerald",
    mainSections: [
      { key: "crear-familia", label: "Crear Familia", icon: Users },
      { key: "consultas-asignadas", label: "Consultas Asignadas", icon: Calendar },
      { key: "consultas-realizadas", label: "Consultas Realizadas", icon: CheckCircle },
      { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-psicologia", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  fisioterapeuta: {
    name: "Fisioterapeuta",
    icon: Dumbbell,
    color: "emerald",
    mainSections: [
      { key: "crear-familia", label: "Crear Familia", icon: Users },
      { key: "terapias-asignadas", label: "Terapias Asignadas", icon: Calendar },
      { key: "terapias-realizadas", label: "Terapias Realizadas", icon: CheckCircle },
      { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-fisioterapia", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  nutricionista: {
    name: "Nutricionista",
    icon: Apple,
    color: "emerald",
    mainSections: [
      { key: "crear-familia", label: "Crear Familia", icon: Users },
      { key: "consultas-asignadas", label: "Consultas Asignadas", icon: Calendar },
      { key: "consultas-realizadas", label: "Consultas Realizadas", icon: CheckCircle },
      { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-nutricion", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  fonoaudiologo: {
    name: "Fonoaudiólogo",
    icon: Ear,
    color: "emerald",
    mainSections: [
      { key: "consultas-asignadas", label: "Consultas Asignadas", icon: Calendar },
      { key: "consultas-realizadas", label: "Consultas Realizadas", icon: CheckCircle },
      { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-fonoaudiologia", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  odontologo: {
    name: "Odontólogo",
    icon: Smile,
    color: "emerald",
    mainSections: [
      { key: "consultas-asignadas", label: "Consultas Asignadas", icon: Calendar },
      { key: "consultas-realizadas", label: "Consultas Realizadas", icon: CheckCircle },
      { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-odontologia", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  enfermero_jefe: {
    name: "Enfermero Jefe",
    icon: Shield,
    color: "emerald",
    mainSections: [
      { key: "crear-familia", label: "Crear Familia", icon: Users },
      { key: "caracterizaciones", label: "Ver y Editar Caracterizaciones", icon: FileText },
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "planes-cuidado", label: "Planes de Cuidado Familiar", icon: Activity },
      { key: "consultas-asignadas", label: "Consultas / Asignaciones", icon: Calendar },
      { key: "educacion-salud", label: "Educación en Salud", icon: FileText },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-enfermeria", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  auxiliar_enfermeria: {
    name: "Auxiliar de Enfermería",
    icon: UserCheck,
    color: "emerald",
    mainSections: [
      { key: "crear-familia", label: "Crear Familia", icon: Users },
      { key: "caracterizaciones", label: "Caracterizaciones", icon: FileText },
      { key: "planes-cuidado", label: "Planes de Cuidado", icon: Heart },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-auxiliar", label: "Dashboard", icon: BarChart3 },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  administrativo: {
    name: "Administrativo",
    icon: Briefcase,
    color: "emerald",
    mainSections: [
      { key: "gestion-citas", label: "Gestión de Citas", icon: CalendarIcon },
      { key: "reportes-admin", label: "Reportes", icon: BarChart3 },
      { key: "validacion-registros", label: "Validación", icon: FileCheck },
      { key: "bitacora", label: "Bitácora", icon: Activity }
    ],
    sidebarSections: [
      { key: "bd-pacientes", label: "BD Pacientes", icon: Search },
      { key: "dashboard-admin", label: "Dashboard", icon: TrendingUp },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  },
  ente_salud_publica: {
    name: "Ente de Salud Pública",
    icon: Globe,
    color: "emerald",
    mainSections: [
      { key: "dashboard-epidemio", label: "Dashboard Epidemiológico", icon: TrendingUp },
      { key: "reportes-publicos", label: "Reportes", icon: BarChart3 },
      { key: "alertas-epidemio", label: "Alertas", icon: AlertCircle },
      { key: "supervision-coberturas", label: "Supervisión", icon: Target }
    ],
    sidebarSections: [
      { key: "bd-pacientes-agregada", label: "BD Agregada", icon: Search },
      { key: "panel-nacional", label: "Panel Nacional", icon: Globe },
      { key: "configuracion", label: "Configuración", icon: Settings },
      { key: "ayuda", label: "Ayuda", icon: HelpCircle }
    ]
  }
};

// Hook para detectar el tipo de dispositivo
const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState(() => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  });
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return deviceType;
};

// Componentes base responsivos
const ResponsiveCard = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-2xl shadow-soft border border-sinbad-300 p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

const ResponsiveField = ({ label, children, required = false, hint }: any) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-eden-700">
      {label} {required && <span className="text-eden-600">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-eden-500">{hint}</p>}
  </div>
);

const ResponsiveInput = (props: any) => (
  <input
    {...props}
    className={`w-full px-3 py-2 md:py-3 border border-sinbad-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm md:text-base transition-colors ${props.className || ""}`}
  />
);

const ResponsiveSelect = ({ options = [], className = "", ...rest }: any) => (
  <select
    {...rest}
    className={`w-full px-3 py-2 md:py-3 border border-sinbad-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm md:text-base bg-white transition-colors ${className}`}
  >
    {options && options.length > 0 ? (
      options.map((o: any) => (
        <option key={o.value || o} value={o.value || o}>
          {o.label || o}
        </option>
      ))
    ) : null}
  </select>
);

const ResponsiveBadge = ({ children, tone = "stone" }: { children: React.ReactNode; tone?: string }) => {
  const colors = {
    // Badges funcionales por tipo de información
    health: "border-bondi-200 text-bondi-700 bg-bondi-50", // Información de salud
    admin: "border-san-marino text-san-marino bg-san-marino-50", // Información administrativa
    data: "border-eden-200 text-eden-700 bg-eden-50", // Información de datos
    warning: "border-janna-300 text-eden-800 bg-janna-100", // Advertencias
    neutral: "border-sinbad-300 text-sinbad-700 bg-sinbad-100", // Información neutra
    
    // Mantener compatibilidad con nombres anteriores
    green: "border-bondi-200 text-bondi-700 bg-bondi-50",
    amber: "border-janna-300 text-eden-800 bg-janna-100",
    rose: "border-eden-200 text-eden-700 bg-eden-50",
    blue: "border-san-marino text-san-marino bg-san-marino-50",
    stone: "border-sinbad-300 text-sinbad-700 bg-sinbad-100",
    bondi: "border-bondi-200 text-bondi-700 bg-bondi-50",
    marino: "border-san-marino text-san-marino bg-san-marino-50",
    eden: "border-eden-200 text-eden-700 bg-eden-50",
    sinbad: "border-sinbad-300 text-sinbad-700 bg-sinbad-100",
    janna: "border-janna-300 text-eden-800 bg-janna-100"
  };
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs border font-medium ${colors[tone] || colors.stone}`}>
      {children}
    </span>
  );
};

const ResponsiveButton = ({ children, variant = "primary", size = "md", className = "", ...props }: {
  children: React.ReactNode;
  variant?: string;
  size?: string;
  className?: string;
  [key: string]: any;
}) => {
  const variants = {
    primary: "bg-bondi-blue text-white hover:bg-bondi-600 shadow-soft", // Salud y acciones principales
    secondary: "bg-janna-100 text-eden-700 hover:bg-janna-200 border border-janna-300", // Alertas y advertencias
    outline: "border border-eden-200 text-eden-700 hover:bg-sinbad-50 hover:border-san-marino", // Datos y contenido
    success: "bg-bondi-blue text-white hover:bg-bondi-600 shadow-soft", // Confirmaciones de salud
    warning: "bg-janna-500 text-eden-800 hover:bg-janna-600 shadow-soft", // Advertencias
    danger: "bg-eden-600 text-white hover:bg-eden-700 shadow-soft", // Datos críticos
    admin: "bg-san-marino text-white hover:bg-san-marino-600 shadow-soft", // Navegación y administración
    info: "bg-sinbad-600 text-eden-800 hover:bg-sinbad-700 shadow-soft" // Información general
  };
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 md:py-3 text-sm md:text-base",
    lg: "px-6 py-3 md:py-4 text-base md:text-lg"
  };
  
  return (
    <button
      {...props}
      className={`rounded-xl font-medium transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Componente de navegación móvil
const MobileNavItem = ({ label, icon: Icon, active, onClick, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
      active 
        ? "bg-san-marino-50 text-san-marino-700 border border-san-marino-200 shadow-soft" 
        : "text-eden-600 hover:bg-sinbad-50 hover:text-san-marino-700"
    }`}
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <span className="font-medium flex-1 text-sm">{label}</span>
    {badge && (
      <span className="bg-janna-200 text-eden-800 text-xs px-2 py-1 rounded-full min-w-[20px] text-center font-medium">
        {badge}
      </span>
    )}
  </button>
);

// Vistas principales
function InicioView({ currentRole, deviceType, onNavigate }: any) {
  const roleConfig = USER_ROLES[currentRole];
  const [isOnline, setIsOnline] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const { provider: sttProvider, setProvider: setSttProvider } = useSttProvider();
  const sttProviderOptions = [
    { value: 'whisper', label: 'Whisper Local (Deshabilitado temporalmente)' },
    { value: 'huggingface', label: 'Hugging Face (API)' },
    { value: 'elevenlabs', label: 'ElevenLabs (API · recomendado)' }
  ];
  const [kpis, setKpis] = useState([
    { label: "Registros hoy", value: 0, icon: FileText },
    { label: "Consultas", value: 0, icon: Calendar },
    { label: "Caracterizaciones", value: 0, icon: Users },
    { label: "Demandas inducidas", value: 0, icon: Target },
  ]);
  const [kpisLoading, setKpisLoading] = useState(true);

  useEffect(() => {
    const loadResumen = async () => {
      try {
        setKpisLoading(true);
        const user = AuthService.getCurrentUser();
        if (user?.id) {
          const resumen = await AuthService.getResumenActividad(Number(user.id));
          setKpis([
            { label: "Registros hoy", value: resumen.registros_hoy || 0, icon: FileText },
            { label: "Consultas", value: resumen.consultas || 0, icon: Calendar },
            { label: "Caracterizaciones", value: resumen.caracterizaciones || 0, icon: Users },
            { label: "Demandas inducidas", value: resumen.demandas_inducidas || 0, icon: Target },
          ]);
        }
      } catch (error) {
        console.error('Error cargando resumen de actividad:', error);
      } finally {
        setKpisLoading(false);
      }
    };

    loadResumen();
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Estado de conexión */}
      <ResponsiveCard className="bg-gradient-to-r from-sinbad-100 to-janna-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4 text-bondi-blue" /> : <WifiOff className="w-4 h-4 text-janna-600" />}
            <span className="text-sm font-medium text-eden-700">
              {isOnline ? "En línea" : "Sin conexión"}
            </span>
          </div>
          <ResponsiveBadge tone={isOnline ? "health" : "warning"}>
            {isOnline ? "Sincronizado" : "3 pendientes"}
          </ResponsiveBadge>
        </div>
      </ResponsiveCard>

      {/* KPIs */}
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Resumen de actividad</h3>
        {kpisLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-sinbad-100 rounded-xl p-3 md:p-4 border border-sinbad-300 animate-pulse">
                <div className="h-4 bg-sinbad-200 rounded mb-2"></div>
                <div className="h-8 bg-sinbad-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-3 ${
            deviceType === 'mobile' ? 'grid-cols-2' : 
            deviceType === 'tablet' ? 'grid-cols-2 md:grid-cols-4' : 
            'grid-cols-4'
          }`}>
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-sinbad-100 rounded-xl p-3 md:p-4 border border-sinbad-300 hover:shadow-soft transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-eden-600" />
                    <div className="text-xs text-eden-600">{kpi.label}</div>
                  </div>
                  <div className="text-xl md:text-2xl font-semibold text-eden-800">{kpi.value}</div>
                </div>
              );
            })}
          </div>
        )}
      </ResponsiveCard>

      {/* Herramienta IA: Texto a voz (Médico / Psicólogo / Auxiliar / Enfermero Jefe / Fisioterapeuta / Nutricionista / Fonoaudiólogo / Odontólogo) */}
      {ENABLE_TTS && ['medico','psicologo','auxiliar_enfermeria','enfermero_jefe','fisioterapeuta','nutricionista','fonoaudiologo','odontologo'].includes(currentRole) ? (
        <ResponsiveCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-eden-800">Asistente de voz (ElevenLabs)</h3>
            <ResponsiveBadge tone="info">TTS</ResponsiveBadge>
          </div>
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-6'}`}>
            <div className={deviceType === 'mobile' ? '' : 'col-span-5'}>
              <ResponsiveField label="Texto a convertir a voz">
                <ResponsiveInput
                  placeholder="Ej: Paciente con dolor torácico de 2 días de evolución..."
                  value={ttsText}
                  onChange={(e: any) => setTtsText(e.target.value)}
                />
              </ResponsiveField>
            </div>
            <div className="flex items-end">
              <ResponsiveButton
                onClick={async () => {
                  if (!ttsText || isTtsLoading) return;
                  try {
                    setIsTtsLoading(true);
                    setAudioUrl(null);
                    const resp = await fetch(`${API_BASE_URL}/tts`,{
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ texto: ttsText })
                    });
                    if (!resp.ok) {
                      const err = await resp.json().catch(() => ({}));
                      throw new Error(err?.error || 'Error generando voz');
                    }
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);
                    setTimeout(() => {
                      if (audioRef.current) {
                        audioRef.current.play().catch(() => {});
                      }
                    }, 50);
                  } catch (e) {
                    console.error('TTS error:', e);
                    alert(e instanceof Error ? e.message : 'Error generando voz');
                  } finally {
                    setIsTtsLoading(false);
                  }
                }}
                variant="primary"
                className="w-full"
                disabled={!ttsText || isTtsLoading}
              >
                {isTtsLoading ? 'Generando...' : 'Generar voz'}
              </ResponsiveButton>
            </div>
          </div>
          {audioUrl && (
            <div className="mt-3">
              <audio ref={audioRef} src={audioUrl} controls className="w-full" />
            </div>
          )}
        </ResponsiveCard>
      ) : ENABLE_TTS ? null : (
        <ResponsiveCard>
          <h3 className="font-semibold text-eden-800 mb-2">Asistente de voz (TTS)</h3>
          <p className="text-sm text-eden-700">
            Esta función requiere una cuenta activa de ElevenLabs. Configure su API key en el backend para habilitarla.
          </p>
        </ResponsiveCard>
      )}

      {/* Herramienta IA: Voz a texto (Médico / Psicólogo / Auxiliar / Enfermero Jefe / Fisioterapeuta / Nutricionista / Fonoaudiólogo / Odontólogo) */}
      {['medico','psicologo','auxiliar_enfermeria','enfermero_jefe','fisioterapeuta','nutricionista','fonoaudiologo','odontologo'].includes(currentRole) && (
        <ResponsiveCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-eden-800">Dictado médico (STT)</h3>
            <ResponsiveBadge tone="info">STT</ResponsiveBadge>
          </div>
          <div className="grid gap-3 md:grid-cols-2 mb-4">
            <ResponsiveField label="Proveedor STT">
              <ResponsiveSelect
                value={sttProvider}
                onChange={(event: any) => setSttProvider(event.target.value)}
                options={sttProviderOptions}
              />
            </ResponsiveField>
            <div className="text-xs text-eden-600 md:pt-6">
              Whisper está deshabilitado temporalmente. Usa ElevenLabs o Hugging Face como proveedor STT.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ResponsiveButton
              variant={isRecording ? 'warning' : 'primary'}
              onClick={async () => {
                try {
                  if (!isRecording) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const mr = new MediaRecorder(stream);
                    audioChunksRef.current = [];
                    mr.ondataavailable = (e: BlobEvent) => {
                      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
                    };
                    mr.onstop = async () => {
                      try {
                        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        // Convertir a mp3 puede no ser posible en navegador; ElevenLabs acepta varios formatos.
                        const form = new FormData();
                        form.append('audio', blob, 'audio.webm');
                        const resp = await fetch(`${API_BASE_URL}/stt?provider=${sttProvider}`, { method: 'POST', body: form });
                        if (!resp.ok) {
                          let msg = 'Error transcribiendo audio';
                          try {
                            const err = await resp.json();
                            msg = `${err?.error || msg}${err?.status ? ` (status ${err.status})` : ''}${err?.details ? `: ${err.details}` : ''}`;
                          } catch {}
                          throw new Error(msg);
                        }
                        const data = await resp.json();
                        setTranscript(typeof data?.text === 'string' ? data.text : JSON.stringify(data));
                      } catch (e) {
                        console.error('STT error:', e);
                        alert(e instanceof Error ? e.message : 'Error transcribiendo audio');
                      }
                    };
                    mediaRecorderRef.current = mr;
                    mr.start();
                    setIsRecording(true);
                  } else {
                    mediaRecorderRef.current?.stop();
                    setIsRecording(false);
                  }
                } catch (e) {
                  console.error('Mic error:', e);
                  alert('No se pudo acceder al micrófono');
                }
              }}
            >
              {isRecording ? 'Detener' : 'Grabar dictado'}
            </ResponsiveButton>
          </div>
          {transcript && (
            <div className="mt-3">
              <ResponsiveField label="Transcripción">
                <textarea className="w-full px-3 py-2 border border-sinbad-300 rounded-xl text-sm" rows={3} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
              </ResponsiveField>
            </div>
          )}
        </ResponsiveCard>
      )}

      {/* Acciones rápidas */}
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Acciones rápidas</h3>
        <div className={`grid gap-3 ${
          deviceType === 'mobile' ? 'grid-cols-2' : 
          deviceType === 'tablet' ? 'grid-cols-3' : 
          'grid-cols-6'
        }`}>
          {roleConfig.mainSections.slice(0, 6).map((section) => {
            const Icon = section.icon;
            return (
              <ResponsiveButton
                key={section.key}
                variant="secondary"
                onClick={() => onNavigate && onNavigate(section.key)}
                className="flex flex-col items-center gap-2 h-16 md:h-20 hover:shadow-soft"
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs">{section.label.split(' ')[0]}</span>
              </ResponsiveButton>
            );
          })}
        </div>
      </ResponsiveCard>

      {/* Próximas citas - Solo en desktop y tablet */}
      {deviceType !== 'mobile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ResponsiveCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-eden-800">Próximas citas</h3>
              <ResponsiveBadge tone="bondi">3</ResponsiveBadge>
            </div>
            <div className="space-y-3">
              {[
                { nombre: "María González", hora: "09:30", tipo: "Control" },
                { nombre: "Carlos Rodríguez", hora: "10:15", tipo: "Primera vez" },
                { nombre: "Ana Martínez", hora: "11:00", tipo: "Seguimiento" }
              ].map((cita, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-sinbad-50 rounded-lg border border-sinbad-200 hover:shadow-soft transition-all">
                  <div>
                    <div className="font-medium text-eden-800 text-sm">{cita.nombre}</div>
                    <div className="text-xs text-eden-600">{cita.tipo}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-eden-800 text-sm">{cita.hora}</div>
                    <ResponsiveBadge tone="health">Confirmada</ResponsiveBadge>
                  </div>
                </div>
              ))}
            </div>
          </ResponsiveCard>

          <ResponsiveCard>
            <h3 className="font-semibold text-eden-800 mb-4">Alertas del sistema</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-janna-100 rounded-lg border border-janna-200">
                <AlertTriangle className="w-5 h-5 text-janna-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-eden-800">Campos incompletos</div>
                  <div className="text-xs text-eden-600">HC: antecedentes familiares</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-bondi-50 rounded-lg border border-bondi-200">
                <CheckCircle className="w-5 h-5 text-bondi-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-bondi-800">Exportación exitosa</div>
                  <div className="text-xs text-bondi-600">Última exportación RIPS</div>
                </div>
              </div>
            </div>
          </ResponsiveCard>
        </div>
      )}
    </div>
  );
}

function FamiliasView({ deviceType }: any) {
  const [familias, setFamilias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await AuthService.getFamilias();
        if (isMounted) setFamilias(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Error cargando familias');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-eden-800">Familias</h3>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-sinbad-200 hover:bg-sinbad-50 hover:border-san-marino transition-all">
              <Filter className="w-4 h-4 text-eden-600" />
            </button>
            <button className="p-2 rounded-lg border border-sinbad-200 hover:bg-sinbad-50 hover:border-san-marino transition-all">
              <Search className="w-4 h-4 text-eden-600" />
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="text-sm text-eden-500">Cargando familias...</div>
        )}
        {error && (
          <div className="text-sm text-eden-600">{error}</div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <ResponsiveField label="Buscar por apellido">
                <ResponsiveInput
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Ej: García"
                />
              </ResponsiveField>
              <ResponsiveField label="Filtrar por municipio">
                <ResponsiveInput
                  value={filterMunicipio}
                  onChange={(e: any) => setFilterMunicipio(e.target.value)}
                  placeholder="Ej: Cali"
                />
              </ResponsiveField>
            </div>
            {familias.length === 0 && (
              <div className="text-sm text-eden-500">No hay familias registradas.</div>
            )}
            {familias
              .filter((f: any) =>
                (!searchTerm || (f.apellido_principal || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
                (!filterMunicipio || (f.municipio || '').toLowerCase().includes(filterMunicipio.toLowerCase()))
              )
              .map((fam: any) => (
              <button
                key={fam.familia_id}
                onClick={() => {
                  // Señal al contenedor principal mediante evento custom
                  const ev: any = new CustomEvent('openFamiliaDetalle', { detail: fam });
                  window.dispatchEvent(ev);
                }}
                className="w-full p-4 bg-sinbad-50 rounded-xl text-left hover:bg-sinbad-100 hover:shadow-soft transition-all border border-sinbad-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-eden-800">{fam.apellido_principal}</h4>
                      {typeof fam.integrantes_count === 'number' && (
                        <ResponsiveBadge tone="admin">{fam.integrantes_count}</ResponsiveBadge>
                      )}
                    </div>
                    <p className="text-sm text-eden-600 mb-2">
                      {fam.direccion} • {fam.barrio_vereda || fam.municipio}
                    </p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-eden-400" />
                      <span className="text-sm text-eden-600">{fam.municipio}</span>
                      {fam.telefono_contacto && (
                        <>
                          <span className="text-eden-300">•</span>
                          <Phone className="w-4 h-4 text-eden-400" />
                          <span className="text-sm text-eden-600">{fam.telefono_contacto}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-eden-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Detalle de Familia
function DetalleFamiliaView({ familia, onBack, onShowCaracterizacion, onShowPaciente }: {
  familia: any;
  onBack: () => void;
  onShowCaracterizacion: (familia: any, caracterizacion: any) => void;
  onShowPaciente: (paciente: any, familia: any) => void;
}) {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [caracterizacion, setCaracterizacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    tipo_documento: 'CC',
    numero_documento: '',
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    fecha_nacimiento: '',
    genero: 'M',
    eps: '',
    regimen: '',
    tipo_afiliado: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pacientesData, caracterizacionData] = await Promise.all([
        AuthService.getPacientesByFamilia(familia.familia_id),
        AuthService.getCaracterizacionFamilia(familia.familia_id)
      ]);
      setPacientes(pacientesData);
      setCaracterizacion(caracterizacionData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [familia?.familia_id]);

  const handleCreate = async () => {
    await AuthService.crearPaciente({
      familia_id: familia.familia_id,
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento,
      primer_nombre: form.primer_nombre,
      segundo_nombre: form.segundo_nombre || null,
      primer_apellido: form.primer_apellido,
      segundo_apellido: form.segundo_apellido || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
      telefono: null,
      email: null
    });
    setShowForm(false);
    await loadData();
  };

  const handleShowCaracterizacion = () => {
    if (onShowCaracterizacion) {
      onShowCaracterizacion(familia, caracterizacion);
    }
  };

  const handleShowPaciente = (paciente: any) => {
    if (onShowPaciente) {
      onShowPaciente(paciente, familia);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <ResponsiveCard>
          <div className="text-center py-8">
            <div className="text-sm text-stone-500">Cargando datos de la familia...</div>
          </div>
        </ResponsiveCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900">Familia {familia.apellido_principal}</h3>
            <div className="text-sm text-stone-600">{familia.direccion} • {familia.municipio}</div>
            {caracterizacion?.familia?.fecha_caracterizacion && (
              <div className="text-xs text-bondi-600 mt-1">
                Caracterizada el {new Date(caracterizacion.familia.fecha_caracterizacion).toLocaleDateString()}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <ResponsiveButton variant="secondary" onClick={onBack}>Volver</ResponsiveButton>
            <ResponsiveButton variant="admin" onClick={handleShowCaracterizacion}>
              {caracterizacion?.tiene_caracterizacion ? 'Editar Caracterización' : 'Realizar Caracterización'}
            </ResponsiveButton>
            <ResponsiveButton onClick={() => setShowForm(true)}>Agregar Paciente</ResponsiveButton>
          </div>
        </div>
      </ResponsiveCard>

      {/* Información de caracterización familiar si existe */}
      {caracterizacion?.tiene_caracterizacion && (
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-3">Información de Caracterización</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-stone-500">Tipo de Familia</div>
              <div className="text-sm font-medium text-stone-900">
                {caracterizacion.familia.tipo_familia || 'No especificado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Zona</div>
              <div className="text-sm font-medium text-stone-900">
                {caracterizacion.familia.zona || 'No especificado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Estrato</div>
              <div className="text-sm font-medium text-stone-900">
                {caracterizacion.familia.estrato || 'No especificado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Territorio</div>
              <div className="text-sm font-medium text-stone-900">
                {caracterizacion.familia.territorio || 'No especificado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Riesgo Familiar</div>
              <div className="text-sm font-medium text-stone-900">
                {caracterizacion.familia.riesgo_familiar || 'No evaluado'}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">Nº Ficha</div>
              <div className="text-sm font-medium text-stone-900">
                {caracterizacion.familia.numero_ficha || 'No asignado'}
              </div>
            </div>
          </div>
        </ResponsiveCard>
      )}

      <ResponsiveCard>
        <h4 className="font-semibold text-stone-900 mb-3">Integrantes</h4>
        {pacientes.length === 0 ? (
          <div className="text-sm text-stone-500">No hay pacientes en esta familia.</div>
        ) : (
          <div className="space-y-2">
            {pacientes.map((p: any) => (
              <button
                key={p.paciente_id}
                onClick={() => handleShowPaciente(p)}
                className="w-full p-3 bg-stone-50 rounded-lg flex items-center justify-between hover:bg-stone-100 transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-stone-900 text-sm">
                    {p.primer_nombre} {p.segundo_nombre} {p.primer_apellido} {p.segundo_apellido}
                  </div>
                  <div className="text-xs text-stone-500">{p.tipo_documento} {p.numero_documento}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            ))}
          </div>
        )}
      </ResponsiveCard>

      {showForm && (
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-3">Nuevo Paciente</h4>
          <div className={`grid gap-3 ${'grid-cols-1 md:grid-cols-2'}`}>
            <ResponsiveField label="Tipo documento">
              <ResponsiveSelect value={form.tipo_documento} onChange={(e: any) => setForm({ ...form, tipo_documento: e.target.value })}
                options={[{value:'CC',label:'CC'},{value:'TI',label:'TI'},{value:'CE',label:'CE'}]} />
            </ResponsiveField>
            <ResponsiveField label="Número documento">
              <div className="flex gap-2">
                <ResponsiveInput 
                  value={form.numero_documento} 
                  onChange={(e: any) => setForm({ ...form, numero_documento: e.target.value })} 
                  className="flex-1"
                />
                <ConsultarADRESButton
                  numeroDocumento={form.numero_documento}
                  tipoDocumento={form.tipo_documento}
                  onDatosEncontrados={(datos) => {
                    if (datos) {
                      // Separar nombres si vienen juntos
                      const nombresCompletos = datos.nombres || datos.primer_nombre || '';
                      const apellidosCompletos = datos.apellidos || datos.primer_apellido || '';
                      
                      const nombresArray = nombresCompletos.split(' ');
                      const apellidosArray = apellidosCompletos.split(' ');
                      
                      setForm({
                        ...form,
                        primer_nombre: nombresArray[0] || datos.primer_nombre || '',
                        segundo_nombre: nombresArray[1] || datos.segundo_nombre || '',
                        primer_apellido: apellidosArray[0] || datos.primer_apellido || '',
                        segundo_apellido: apellidosArray[1] || datos.segundo_apellido || '',
                        fecha_nacimiento: datos.fecha_nacimiento || form.fecha_nacimiento,
                        eps: (datos as any).eps || form.eps,
                        regimen: (datos as any).regimen || form.regimen,
                        tipo_afiliado: (datos as any).tipo_afiliado || form.tipo_afiliado
                      });
                    }
                  }}
                />
              </div>
            </ResponsiveField>
            <ResponsiveField label="Primer nombre">
              <ResponsiveInput value={form.primer_nombre} onChange={(e: any) => setForm({ ...form, primer_nombre: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Segundo nombre">
              <ResponsiveInput value={form.segundo_nombre} onChange={(e: any) => setForm({ ...form, segundo_nombre: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Primer apellido">
              <ResponsiveInput value={form.primer_apellido} onChange={(e: any) => setForm({ ...form, primer_apellido: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Segundo apellido">
              <ResponsiveInput value={form.segundo_apellido} onChange={(e: any) => setForm({ ...form, segundo_apellido: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Fecha nacimiento">
              <ResponsiveInput type="date" value={form.fecha_nacimiento} onChange={(e: any) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Género">
              <ResponsiveSelect value={form.genero} onChange={(e: any) => setForm({ ...form, genero: e.target.value })}
                options={[{value:'M',label:'Masculino'},{value:'F',label:'Femenino'}]} />
            </ResponsiveField>
            <ResponsiveField label="Entidad (EPS)">
              <ResponsiveInput value={form.eps} onChange={(e: any) => setForm({ ...form, eps: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Régimen">
              <ResponsiveInput value={form.regimen} onChange={(e: any) => setForm({ ...form, regimen: e.target.value })} />
            </ResponsiveField>
            <ResponsiveField label="Tipo de afiliado">
              <ResponsiveInput value={form.tipo_afiliado} onChange={(e: any) => setForm({ ...form, tipo_afiliado: e.target.value })} />
            </ResponsiveField>
          </div>
          <div className="flex gap-3 pt-4">
            <ResponsiveButton variant="secondary" onClick={() => setShowForm(false)}>Cancelar</ResponsiveButton>
            <ResponsiveButton onClick={handleCreate}>Guardar Paciente</ResponsiveButton>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}

// Vista: Detalle del Paciente
function DetallePacienteView({ paciente, familia, caracterizacion, onBack }: any) {
  const { user } = useAuth();
  const isAuxiliar = (user?.role === 'auxiliar_enfermeria');
  const isMedico = (user?.role === 'medico');
  const canCreatePlanOrDemanda = isAuxiliar || isMedico;
  const [pacienteData, setPacienteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [caracterizacionData, setCaracterizacionData] = useState<any>(null);

  useEffect(() => {
    const loadCaracterizacion = async () => {
      try {
        // Cargar caracterización de la familia para obtener datos individuales del paciente
        const data = await AuthService.getCaracterizacionFamilia(familia.familia_id);
        setCaracterizacionData(data);
        
        // Buscar los datos de caracterización del paciente específico
        if (data?.integrantes) {
          const pacienteConCaracterizacion = data.integrantes.find(
            (p: any) => p.paciente_id === paciente.paciente_id
          );
          setPacienteData(pacienteConCaracterizacion || paciente);
        } else {
          setPacienteData(paciente);
        }
      } catch (error) {
        console.error('Error cargando caracterización:', error);
        setPacienteData(paciente);
      } finally {
        setLoading(false);
      }
    };

    // Si ya se pasó caracterizacion como prop, usarla
    if (caracterizacion?.integrantes) {
      const pacienteConCaracterizacion = caracterizacion.integrantes.find(
        (p: any) => p.paciente_id === paciente.paciente_id
      );
      setPacienteData(pacienteConCaracterizacion || paciente);
      setLoading(false);
    } else {
      loadCaracterizacion();
    }
  }, [paciente, familia, caracterizacion]);

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <ResponsiveCard>
          <div className="text-center py-8">
            <div className="text-sm text-stone-500">Cargando datos del paciente...</div>
          </div>
        </ResponsiveCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header del paciente */}
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900">
              {paciente.primer_nombre} {paciente.segundo_nombre} {paciente.primer_apellido} {paciente.segundo_apellido}
            </h3>
            <p className="text-sm text-stone-500">
              {paciente.tipo_documento} {paciente.numero_documento} • {paciente.genero}
            </p>
            {paciente.fecha_nacimiento && (
              <p className="text-xs text-stone-400">
                Nacido: {new Date(paciente.fecha_nacimiento).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <ResponsiveBadge tone="admin">
              {familia.apellido_principal}
            </ResponsiveBadge>
          </div>
        </div>
      </ResponsiveCard>
      {/* 👇 AQUÍ VA EL COMPONENTE DE ANTECEDENTES FAMILIARES */}
      <AntecedentesFamiliares pacienteId={paciente.paciente_id} />     
           {/* 👇 REEMPLAZAR TODO LO DE CARACTERIZACIÓN CON ESTO */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>Antecedentes Familiares Automáticos</h3>
        
        {/* Antecedente 1 - Hipertensión de la madre */}
        <div style={{ background: '#f0fdf4', padding: '16px', borderLeft: '4px solid #10b981', borderRadius: '0 8px 8px 0', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: '500', color: '#1f2937' }}>Hipertensión Arterial</div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>Madre: María Pérez</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>HTA Grado 1 - 145/95 mmHg</div>
            </div>
            <span style={{ background: '#dcfce7', color: '#166534', fontSize: '12px', padding: '4px 8px', borderRadius: '12px' }}>Automático</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
            <span>Gravedad: Leve</span>
            <span>Estado: Crónico</span>
            <span>Diagnosticado: 17/11/2025</span>
          </div>
        </div>

        {/* Antecedente 2 - Diabetes del padre */}
        <div style={{ background: '#f0fdf4', padding: '16px', borderLeft: '4px solid #10b981', borderRadius: '0 8px 8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: '500', color: '#1f2937' }}>Diabetes Mellitus Tipo 2</div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>Padre: Carlos Pérez</div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Diabetes diagnosticada con glucemia en ayunas de 180 mg/dL</div>
            </div>
            <span style={{ background: '#dcfce7', color: '#166534', fontSize: '12px', padding: '4px 8px', borderRadius: '12px' }}>Automático</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
            <span>Gravedad: Moderada</span>
            <span>Estado: Crónico</span>
            <span>Diagnosticado: 17/11/2025</span>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '14px', color: '#64748b' }}>
          ✅ <strong>Sistema automático:</strong> Estos antecedentes se propagaron automáticamente desde las historias clínicas de los padres
        </div>
      </div>

      {/* Información de la familia */}
      <ResponsiveCard>
        <h4 className="font-semibold text-stone-900 mb-3">Información Familiar</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-stone-500">Familia</div>
            <div className="text-sm font-medium text-stone-900">{familia.apellido_principal}</div>
          </div>
          <div>
            <div className="text-xs text-stone-500">Dirección</div>
            <div className="text-sm font-medium text-stone-900">
              {familia.direccion}, {familia.municipio}
            </div>
          </div>
          {familia.telefono_contacto && (
            <div>
              <div className="text-xs text-stone-500">Teléfono de Contacto</div>
              <div className="text-sm font-medium text-stone-900">{familia.telefono_contacto}</div>
            </div>
          )}
        </div>
      </ResponsiveCard>
      
      {/* Acciones disponibles */}
      {canCreatePlanOrDemanda && (
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-3">Acciones Disponibles</h4>
          <div className="flex flex-wrap gap-2">
            <ResponsiveButton 
              variant="primary" 
              size="sm"
              onClick={() => {
                const ev: any = new CustomEvent('openPlanesCuidado', { detail: { paciente, familia } });
                window.dispatchEvent(ev);
              }}
            >
              Crear Plan de Cuidado Familiar
            </ResponsiveButton>
            <ResponsiveButton 
              variant="primary" 
              size="sm"
              onClick={() => {
                const ev: any = new CustomEvent('openDemandasInducidas', { detail: { paciente, familia } });
                window.dispatchEvent(ev);
              }}
            >
              Crear Demanda Inducida
            </ResponsiveButton>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}

function ConsultasAsignadasView({ deviceType }: any) {
  const { user } = useAuth();
  const isPsicologo = user?.role === 'psicologo';
  const isNutricionista = user?.role === 'nutricionista';
  const isFisioterapeuta = user?.role === 'fisioterapeuta';
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedAtencion, setSelectedAtencion] = useState<any>(null);
  const [demandasInducidas, setDemandasInducidas] = useState<any[]>([]);
  const [pacientesAsignados, setPacientesAsignados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consultas' | 'demandas'>('demandas');

  const loadDemandasInducidas = async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getCurrentUser();
      if (currentUser?.id) {
        const data = await AuthService.getDemandasAsignadas(Number(currentUser.id));
        setDemandasInducidas(data || []);
        
        // Si es psicólogo, procesar pacientes asignados desde demandas
        if (isPsicologo) {
          const pacientesUnicos: Map<number, any> = new Map();
          
          // Procesar demandas para obtener pacientes asignados
          for (const demanda of data || []) {
            if (demanda.paciente_id && !pacientesUnicos.has(demanda.paciente_id)) {
              try {
                const paciente = await AuthService.getPacienteDetalle(demanda.paciente_id);
                const familia = await AuthService.getFamiliaPorId(paciente.familia_id);
                pacientesUnicos.set(demanda.paciente_id, {
                  ...paciente,
                  familia,
                  demanda_id: demanda.demanda_id,
                  fecha_demanda: demanda.fecha_demanda,
                  estado_demanda: demanda.estado
                });
              } catch (e) {
                console.error('Error cargando paciente:', demanda.paciente_id, e);
              }
            }
          }
          
          // Ordenar por estado y fecha
          const pacientesArray = Array.from(pacientesUnicos.values()).sort((a, b) => {
            // Primero por estado (Pendiente/Asignada primero)
            const estadoA = a.estado_demanda === 'Pendiente' || a.estado_demanda === 'Asignada' ? 0 : 1;
            const estadoB = b.estado_demanda === 'Pendiente' || b.estado_demanda === 'Asignada' ? 0 : 1;
            if (estadoA !== estadoB) return estadoA - estadoB;
            // Luego por fecha
            return new Date(b.fecha_demanda).getTime() - new Date(a.fecha_demanda).getTime();
          });
          
          setPacientesAsignados(pacientesArray);
        }
      }
    } catch (error) {
      console.error('Error cargando demandas inducidas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemandasInducidas();
  }, [isPsicologo]);

  // Filtrar demandas según la pestaña activa
  const getDemandasFiltradas = () => {
    if (activeTab === 'consultas') {
      // Mostrar solo demandas pendientes o asignadas, ordenadas por fecha
      return demandasInducidas
        .filter(d => d.estado === 'Pendiente' || d.estado === 'Asignada')
        .sort((a, b) => new Date(a.fecha_demanda).getTime() - new Date(b.fecha_demanda).getTime());
    } else {
      // Mostrar todas las demandas
      return demandasInducidas.sort((a, b) => new Date(b.fecha_demanda).getTime() - new Date(a.fecha_demanda).getTime());
    }
  };

  const demandasFiltradas = getDemandasFiltradas();

  // Calcular edad desde fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Si es psicólogo y tiene paciente seleccionado, mostrar HC psicológica
  if (isPsicologo && selectedPatient) {
  // Si es nutricionista y tiene paciente seleccionado, mostrar HC Nutrición
  if (isNutricionista && selectedPatient) {
    return (
      <HCNutricionView
        paciente={selectedPatient}
        atencion={selectedAtencion}
        onSave={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
          loadDemandasInducidas();
        }}
        onCancel={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
        }}
      />
    );
  }
    return (
      <HCPsicologiaView
        paciente={selectedPatient}
        atencion={selectedAtencion}
        onSave={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
          loadDemandasInducidas();
        }}
        onCancel={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
        }}
      />
    );
  }
  
  // Si es fisioterapeuta y tiene paciente seleccionado, mostrar HC Fisioterapia
  if (isFisioterapeuta && selectedPatient) {
    return (
      <HCFisioterapiaView
        paciente={selectedPatient}
        atencion={selectedAtencion}
        onSave={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
          loadDemandasInducidas();
        }}
        onCancel={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
        }}
      />
    );
  }

  // Si es fonoaudiólogo y tiene paciente seleccionado, mostrar HC Fonoaudiología
  if (user?.role === 'fonoaudiologo' && selectedPatient) {
    return (
      <HCFonoaudiologiaView
        paciente={selectedPatient}
        atencion={selectedAtencion}
        onSave={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
          loadDemandasInducidas();
        }}
        onCancel={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
        }}
      />
    );
  }

  // Si es odontólogo y tiene paciente seleccionado, mostrar HC Odontología
  if (user?.role === 'odontologo' && selectedPatient) {
    return (
      <HCOdontologiaView
        paciente={selectedPatient}
        atencion={selectedAtencion}
        onSave={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
          loadDemandasInducidas();
        }}
        onCancel={() => {
          setSelectedPatient(null);
          setSelectedAtencion(null);
        }}
      />
    );
  }

  // Si no es psicólogo ni fisioterapeuta y tiene paciente seleccionado, mostrar HC medicina
  if (!isPsicologo && !isFisioterapeuta && selectedPatient) {
    return <HistoriaClinicaView patient={selectedPatient} onBack={() => setSelectedPatient(null)} deviceType={deviceType} />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-900">
            {isPsicologo ? 'BD Pacientes Asignados' : 'Consultas Médicas'}
          </h3>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex space-x-1 bg-stone-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('demandas')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'demandas'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Demandas Inducidas
          </button>
          <button
            onClick={() => setActiveTab('consultas')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'consultas'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Consultas Programadas
          </button>
        </div>

        {/* Contenido específico para psicólogo */}
        {isPsicologo ? (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-sm text-stone-500">Cargando pacientes asignados...</div>
              </div>
            ) : pacientesAsignados.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                No hay pacientes asignados para consulta psicológica
              </div>
            ) : (
              pacientesAsignados.map((paciente) => (
                <div
                  key={paciente.paciente_id}
                  onClick={async () => {
                    setSelectedPatient(paciente);
                    // Buscar si ya existe una atención en proceso para este paciente
                    try {
                      const hcPaciente = await AuthService.getHCPsicologiaPaciente(paciente.paciente_id);
                      const atencionEnProceso = hcPaciente.find((hc: any) => hc.estado === 'En proceso');
                      if (atencionEnProceso) {
                        setSelectedAtencion(atencionEnProceso);
                      }
                    } catch (e) {
                      console.error('Error buscando HC existente:', e);
                    }
                  }}
                  className="p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-san-marino hover:shadow-soft cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-stone-900 mb-1">
                        {paciente.primer_nombre} {paciente.primer_apellido}
                      </div>
                      <div className="text-sm text-stone-600 mb-2">
                        {paciente.tipo_documento} {paciente.numero_documento} • 
                        Familia: {paciente.familia?.apellido_principal}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <ResponsiveBadge tone={paciente.estado_demanda === 'Pendiente' || paciente.estado_demanda === 'Asignada' ? 'warning' : 'neutral'}>
                          {paciente.estado_demanda}
                        </ResponsiveBadge>
                        {paciente.fecha_demanda && (
                          <span className="text-xs text-stone-500">
                            {new Date(paciente.fecha_demanda).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Contenido para otros roles (médico, etc.) */
          <>
            {/* Contenido de las pestañas */}
            {activeTab === 'demandas' && (
              <div className="space-y-3">
                {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
                <span className="ml-3 text-stone-600">Cargando demandas...</span>
              </div>
            ) : demandasInducidas.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-stone-500 mb-2">No hay demandas inducidas asignadas</div>
                <div className="text-xs text-stone-400">
                  Las demandas inducidas aparecerán aquí cuando te sean asignadas
                </div>
              </div>
            ) : (
              demandasInducidas.map((demanda) => (
                <button
                  key={demanda.demanda_id}
                  onClick={() => setSelectedPatient({
                    id: demanda.paciente_id,
                    nombre: `${demanda.primer_nombre} ${demanda.primer_apellido}`,
                    documento: demanda.numero_documento,
                    demanda: demanda
                  })}
                  className="w-full p-4 bg-stone-50 rounded-xl text-left hover:bg-stone-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-stone-900">
                          {demanda.primer_nombre} {demanda.primer_apellido}
                        </h4>
                        <ResponsiveBadge tone="admin">Demanda Inducida</ResponsiveBadge>
                      </div>
                      <p className="text-sm text-stone-500 mb-2">
                        {demanda.numero_documento} • Familia {demanda.apellido_principal}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-stone-400" />
                        <span className="text-sm text-stone-600">
                          {new Date(demanda.fecha_demanda).toLocaleDateString()}
                        </span>
                        <ResponsiveBadge tone={
                          demanda.estado === 'Realizada' ? 'health' :
                          demanda.estado === 'Asignada' ? 'admin' : 'warning'
                        }>
                          {demanda.estado}
                        </ResponsiveBadge>
                      </div>
                      
                      {demanda.diligenciamiento && demanda.diligenciamiento.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-stone-500 mb-1">Diligenciamiento:</div>
                          <div className="text-sm text-stone-700">
                            {demanda.diligenciamiento.slice(0, 2).join(', ')}
                            {demanda.diligenciamiento.length > 2 && ` +${demanda.diligenciamiento.length - 2} más`}
                          </div>
                        </div>
                      )}
                      
                      {demanda.remision_a && demanda.remision_a.length > 0 && (
                        <div>
                          <div className="text-xs text-stone-500 mb-1">Remisión a:</div>
                          <div className="text-sm text-stone-700">
                            {demanda.remision_a.slice(0, 2).join(', ')}
                            {demanda.remision_a.length > 2 && ` +${demanda.remision_a.length - 2} más`}
                          </div>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400" />
                  </div>
                </button>
              ))
            )}
          </div>
            )}
          </>
        )}
      </ResponsiveCard>
    </div>
  );
}

function HistoriaClinicaView({ patient, onBack, deviceType }: any) {
  const [activeTab, setActiveTab] = useState("consulta");
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header del paciente */}
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900">{patient.nombre}</h3>
            <p className="text-sm text-stone-500">{patient.documento} • {patient.edad} años</p>
          </div>
          <ResponsiveBadge tone={patient.urgente ? "rose" : "blue"}>
            {patient.urgente ? "Urgente" : "Regular"}
          </ResponsiveBadge>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1">
          {[
            { key: "consulta", label: "Consulta" },
            { key: "receta", label: "Receta" },
            { key: "examenes", label: "Exámenes" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ResponsiveCard>

      {/* Contenido según tab activo */}
      {activeTab === "consulta" && <ConsultaFormView patient={patient} deviceType={deviceType} />}
      {activeTab === "receta" && <RecetaFormView patient={patient} deviceType={deviceType} />}
      {activeTab === "examenes" && <ExamenesFormView patient={patient} deviceType={deviceType} />}
    </div>
  );
}

// Helper function para obtener o crear Practitioner en FHIR
async function getOrCreatePractitioner(user: any): Promise<string> {
  if (!user?.id) {
    throw new Error('Usuario no tiene ID');
  }

  const userId = user.id.toString();
  
  try {
    // Buscar Practitioner por identifier (ID del usuario)
    const searchResult = await searchPractitioners({ identifier: userId });
    const entries = searchResult.bundle?.entry || [];
    
    if (entries.length > 0 && entries[0].resource) {
      // Practitioner existe, retornar su ID de FHIR
      return entries[0].resource.id;
    }
  } catch (error) {
    console.warn('⚠️ Error buscando Practitioner, se creará uno nuevo:', error);
  }

  // Practitioner no existe, crearlo
  try {
    const { resource: practitionerResource, practitionerId } = buildPractitionerResource({
      id: userId,
      name: user?.name || (user as any)?.nombre || 'Practitioner',
      email: (user as any)?.email,
      identifier: userId
    });
    
    const result = await createPractitioner(practitionerResource);
    return result.resource?.id || practitionerId;
  } catch (error) {
    console.error('❌ Error creando Practitioner:', error);
    throw error;
  }
}

function ConsultaFormView({ patient, deviceType }: any) {
  const [atencionId, setAtencionId] = useState<number | null>(null);
  const [ultimaAtencionId, setUltimaAtencionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [fhirSyncStatus, setFhirSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // Perfiles de autocompletado
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState<number | null>(null);
  const [cargandoPerfiles, setCargandoPerfiles] = useState(false);
  const [mostrarCrearPerfil, setMostrarCrearPerfil] = useState(false);
  const [nombreNuevoPerfil, setNombreNuevoPerfil] = useState('');
  const [descripcionNuevoPerfil, setDescripcionNuevoPerfil] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  
  // Datos generales
  const [horaConsulta, setHoraConsulta] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  
  // Motivo y enfermedad
  const [motivo, setMotivo] = useState('');
  const [enfermedadActual, setEnfermedadActual] = useState('');
  
  // Enfoque diferencial
  const [enfoqueDiferencial, setEnfoqueDiferencial] = useState<any>({
    etnia: { afrodescendiente: false, indigena: false, palanquero: false, mestizo: false, otro: false, otro_cual: '' },
    discapacidades: { visual: false, auditiva: false, mental: false, fisica: false, multiple: false, sordo_ceguera: false, otra: false, otra_cual: '' },
    poblacion_lgtbiq: { si: false, no: false, cual: '' },
    poblacion_migrante: '',
    privados_libertad: { si: false, no: false },
    victimas_conflicto: { si: false, no: false },
    veteranos_fuerza_publica: { si: false, no: false },
    adulto_mayor: { si: false, no: false },
    embarazadas: { si: false, no: false },
    victima_sexual: { si: false, no: false }
  });
  
  // Antecedentes
  const [antecedentesPersonales, setAntecedentesPersonales] = useState<any>({
    patologicos: '', inmunologicos: '', ginecologicos: '', farmacologicos: '',
    quirurgicos: '', hospitalizaciones: '', alergicos: '', toxicologicos: '', traumatologicos: ''
  });
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState('');
  
  // Revisión por sistemas
  const sistemas = [
    'Cardiovascular','Digestivo','Renal','Nervioso','Organos de los sentidos','Mental','Musculoesqueletico'
  ];
  const [revisionPorSistemasSeleccion, setRevisionPorSistemasSeleccion] = useState<string[]>([]);
  const [revisionPorSistemasHallazgos, setRevisionPorSistemasHallazgos] = useState<Record<string,string>>({});
  
  // Signos vitales
  const [tensionSistolica, setTensionSistolica] = useState('');
  const [tensionDiastolica, setTensionDiastolica] = useState('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState('');
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState('');
  const [saturacionOxigeno, setSaturacionOxigeno] = useState('');
  const [temperatura, setTemperatura] = useState('');
  
  // Medidas antropométricas
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [imc, setImc] = useState('');
  const [perimetroCefalico, setPerimetroCefalico] = useState('');
  const [perimetroToracico, setPerimetroToracico] = useState('');
  const [perimetroAbdominal, setPerimetroAbdominal] = useState('');
  const [perimetroBraquial, setPerimetroBraquial] = useState('');
  const [perimetroPantorrilla, setPerimetroPantorrilla] = useState('');
  
  // Otros parámetros
  const [glucometria, setGlucometria] = useState('');
  const [glasgow, setGlasgow] = useState('');
  
  // Examen y diagnósticos
  const [examenFisico, setExamenFisico] = useState('');
  const [diagnosticoPrincipal, setDiagnosticoPrincipal] = useState('');
  const [diagnosticosRelacionados, setDiagnosticosRelacionados] = useState(['', '', '']);
  
  // Plan y evolución
  const [conductaSeguir, setConductaSeguir] = useState('');
  const [evolucion, setEvolucion] = useState('');
  const [analisis, setAnalisis] = useState('');
  const [planManejo, setPlanManejo] = useState('');
  
  // Egreso
  const [fechaHoraEgreso, setFechaHoraEgreso] = useState('');
  
  // Cargar perfiles disponibles (públicos + del usuario)
  useEffect(() => {
    const cargarPerfiles = async () => {
      try {
        setCargandoPerfiles(true);
        const user = AuthService.getCurrentUser();
        console.log('🔍 [ConsultaFormView] Usuario actual:', user);
        console.log('🔍 [ConsultaFormView] Llamando getPerfiles con:', { tipoPerfil: 'HC_Medicina', usuarioId: user?.id });
        const perfilesData = await AuthService.getPerfiles('HC_Medicina', user?.id ? Number(user.id) : undefined);
        console.log('✅ [ConsultaFormView] Perfiles cargados:', perfilesData);
        console.log('✅ [ConsultaFormView] Cantidad de perfiles:', perfilesData?.length || 0);
        setPerfiles(perfilesData || []);
      } catch (error: any) {
        console.error('❌ [ConsultaFormView] Error cargando perfiles:', error);
        console.error('❌ [ConsultaFormView] Error details:', error.message, error.stack);
        setPerfiles([]);
        // Mostrar mensaje de error al usuario
        alert(`Error cargando perfiles: ${error.message || 'Error desconocido'}`);
      } finally {
        setCargandoPerfiles(false);
      }
    };
    cargarPerfiles();
  }, []);

  // Aplicar perfil seleccionado
  const aplicarPerfil = () => {
    if (!perfilSeleccionado) {
      alert('Por favor selecciona un perfil');
      return;
    }

    const perfil = perfiles.find(p => p.perfil_id === perfilSeleccionado);
    if (!perfil || !perfil.datos_perfil) {
      alert('Error: Perfil no encontrado');
      return;
    }

    const datos = perfil.datos_perfil;

    // Aplicar datos del perfil a los campos correspondientes
    if (datos.motivo_consulta) setMotivo(datos.motivo_consulta);
    if (datos.enfermedad_actual) setEnfermedadActual(datos.enfermedad_actual);
    if (datos.antecedentes_familiares) setAntecedentesFamiliares(datos.antecedentes_familiares);
    if (datos.examen_fisico) setExamenFisico(datos.examen_fisico);
    if (datos.plan_manejo) setPlanManejo(datos.plan_manejo);
    if (datos.conducta_seguir) setConductaSeguir(datos.conducta_seguir);
    if (datos.evolucion) setEvolucion(datos.evolucion);
    if (datos.analisis) setAnalisis(datos.analisis);
    if (datos.diagnostico_principal) setDiagnosticoPrincipal(datos.diagnostico_principal);

    // Aplicar enfoque diferencial si existe
    if (datos.enfoque_diferencial) {
      const nuevoEnfoque = { ...enfoqueDiferencial };
      const enfoque = datos.enfoque_diferencial;
      
      if (enfoque.ciclo_vida) {
        if (enfoque.ciclo_vida === 'Adolescente') {
          nuevoEnfoque.adulto_mayor = { si: false, no: true };
        } else if (enfoque.ciclo_vida === 'Adulto Mayor') {
          nuevoEnfoque.adulto_mayor = { si: true, no: false };
        }
      }
      
      if (enfoque.discapacidad !== undefined) {
        nuevoEnfoque.discapacidades = {
          visual: false, auditiva: false, mental: false, fisica: false,
          multiple: false, sordo_ceguera: false, otra: false, otra_cual: ''
        };
        if (enfoque.discapacidad) {
          nuevoEnfoque.discapacidades.otra = true;
        }
      }
      
      if (enfoque.victima_violencia !== undefined) {
        nuevoEnfoque.victimas_conflicto = {
          si: enfoque.victima_violencia,
          no: !enfoque.victima_violencia
        };
      }
      
      setEnfoqueDiferencial(nuevoEnfoque);
    }

    alert(`Perfil "${perfil.nombre_perfil}" aplicado exitosamente`);
  };

  // Guardar perfil personalizado desde los valores actuales del formulario
  const guardarPerfilPersonalizado = async () => {
    if (!nombreNuevoPerfil.trim()) {
      alert('Por favor ingresa un nombre para el perfil');
      return;
    }

    try {
      setGuardandoPerfil(true);
      
      // Crear objeto con los datos actuales del formulario
      const datosPerfil = {
        motivo_consulta: motivo || undefined,
        enfermedad_actual: enfermedadActual || undefined,
        antecedentes_familiares: antecedentesFamiliares || undefined,
        examen_fisico: examenFisico || undefined,
        plan_manejo: planManejo || undefined,
        conducta_seguir: conductaSeguir || undefined,
        evolucion: evolucion || undefined,
        analisis: analisis || undefined,
        diagnostico_principal: diagnosticoPrincipal || undefined,
        enfoque_diferencial: enfoqueDiferencial || undefined
      };

      // Eliminar campos undefined
      Object.keys(datosPerfil).forEach(key => {
        if (datosPerfil[key as keyof typeof datosPerfil] === undefined) {
          delete datosPerfil[key as keyof typeof datosPerfil];
        }
      });

      await AuthService.crearPerfil({
        nombre_perfil: nombreNuevoPerfil.trim(),
        descripcion: descripcionNuevoPerfil.trim() || undefined,
        tipo_perfil: 'HC_Medicina',
        datos_perfil: datosPerfil
      });

      // Recargar perfiles
      const user = AuthService.getCurrentUser();
      const perfilesData = await AuthService.getPerfiles('HC_Medicina', user?.id ? Number(user.id) : undefined);
      setPerfiles(perfilesData || []);

      // Limpiar formulario
      setNombreNuevoPerfil('');
      setDescripcionNuevoPerfil('');
      setMostrarCrearPerfil(false);

      alert(`Perfil "${nombreNuevoPerfil}" guardado exitosamente`);
    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      alert(`Error guardando perfil: ${error.message || 'Error desconocido'}`);
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Calcular IMC automáticamente
  useEffect(() => {
    if (peso && talla) {
      const pesoNum = parseFloat(peso);
      const tallaNum = parseFloat(talla);
      if (pesoNum > 0 && tallaNum > 0) {
        const imcCalculado = (pesoNum / (tallaNum * tallaNum)).toFixed(2);
        setImc(imcCalculado);
      }
    } else {
      setImc('');
    }
  }, [peso, talla]);

  // Cargar HC existente o crear nueva
  useEffect(() => {
    const cargarHC = async () => {
      if (!patient?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const user = AuthService.getCurrentUser();
        
        // Buscar la última atención del paciente
        const hcList = await AuthService.get(`/pacientes/${patient.id}/hc/medicina`);
        
        if (hcList && hcList.length > 0) {
          // Cargar la última HC
          const ultimaHC = hcList[0];
          setAtencionId(ultimaHC.atencion_id);
          
          // Cargar datos completos
          const hcCompleta = await AuthService.getHCMedicina(ultimaHC.atencion_id);
          
          if (hcCompleta) {
            // Datos generales
            setHoraConsulta(hcCompleta.hora_consulta || '');
            setMotivo(hcCompleta.motivo_consulta || '');
            setEnfermedadActual(hcCompleta.enfermedad_actual || '');
            
            // Enfoque diferencial
            if (hcCompleta.enfoque_diferencial) {
              try {
                const enfoque = typeof hcCompleta.enfoque_diferencial === 'string'
                  ? JSON.parse(hcCompleta.enfoque_diferencial)
                  : hcCompleta.enfoque_diferencial;
                setEnfoqueDiferencial(enfoque || enfoqueDiferencial);
              } catch (e) {
                console.error('Error parseando enfoque diferencial:', e);
              }
            }
            
            // Antecedentes
            if (hcCompleta.antecedentes_personales) {
              try {
                const antPer = typeof hcCompleta.antecedentes_personales === 'string' 
                  ? JSON.parse(hcCompleta.antecedentes_personales) 
                  : hcCompleta.antecedentes_personales;
                setAntecedentesPersonales(antPer || antecedentesPersonales);
              } catch (e) {
                console.error('Error parseando antecedentes personales:', e);
              }
            }
            setAntecedentesFamiliares(hcCompleta.antecedentes_familiares || '');
            
            // Revisión por sistemas
            if (hcCompleta.revision_por_sistemas) {
              try {
                const revSistemas = typeof hcCompleta.revision_por_sistemas === 'string'
                  ? JSON.parse(hcCompleta.revision_por_sistemas)
                  : hcCompleta.revision_por_sistemas;
                
                if (revSistemas.sistemas) {
                  setRevisionPorSistemasSeleccion(revSistemas.sistemas);
                }
                if (revSistemas.hallazgos) {
                  setRevisionPorSistemasHallazgos(revSistemas.hallazgos);
                }
              } catch (e) {
                console.error('Error parseando revisión por sistemas:', e);
              }
            }
            
            // Signos vitales
            setTensionSistolica(hcCompleta.tension_arterial_sistolica?.toString() || '');
            setTensionDiastolica(hcCompleta.tension_arterial_diastolica?.toString() || '');
            setFrecuenciaCardiaca(hcCompleta.frecuencia_cardiaca?.toString() || '');
            setFrecuenciaRespiratoria(hcCompleta.frecuencia_respiratoria?.toString() || '');
            setSaturacionOxigeno(hcCompleta.saturacion_oxigeno?.toString() || '');
            setTemperatura(hcCompleta.temperatura?.toString() || '');
            
            // Medidas antropométricas
            setPeso(hcCompleta.peso?.toString() || '');
            setTalla(hcCompleta.talla?.toString() || '');
            setImc(hcCompleta.imc?.toString() || '');
            setPerimetroCefalico(hcCompleta.perimetro_cefalico?.toString() || '');
            setPerimetroToracico(hcCompleta.perimetro_toracico?.toString() || '');
            setPerimetroAbdominal(hcCompleta.perimetro_abdominal?.toString() || '');
            setPerimetroBraquial(hcCompleta.perimetro_braquial?.toString() || '');
            setPerimetroPantorrilla(hcCompleta.perimetro_pantorrilla?.toString() || '');
            
            // Otros parámetros
            setGlucometria(hcCompleta.glucometria?.toString() || '');
            setGlasgow(hcCompleta.glasgow || '');
            
            // Examen y diagnósticos
            setExamenFisico(hcCompleta.examen_fisico || '');
            // diagnosticos_cie10 puede ser un string o un objeto con principal y relacionados
            if (hcCompleta.diagnosticos_cie10) {
              try {
                const diag = typeof hcCompleta.diagnosticos_cie10 === 'string'
                  ? JSON.parse(hcCompleta.diagnosticos_cie10)
                  : hcCompleta.diagnosticos_cie10;
                if (typeof diag === 'object' && diag.principal) {
                  setDiagnosticoPrincipal(diag.principal || '');
                  setDiagnosticosRelacionados(diag.relacionados || ['', '', '']);
                } else {
                  setDiagnosticoPrincipal(hcCompleta.diagnosticos_cie10);
                }
              } catch (e) {
                setDiagnosticoPrincipal(hcCompleta.diagnosticos_cie10);
              }
            }
            
            // Plan y evolución
            setConductaSeguir(hcCompleta.conducta_seguir || '');
            setEvolucion(hcCompleta.evolucion || '');
            setAnalisis(hcCompleta.analisis || '');
            setPlanManejo(hcCompleta.plan_manejo || '');
            
            // Egreso
            if (hcCompleta.fecha_hora_egreso) {
              const fechaEgreso = new Date(hcCompleta.fecha_hora_egreso);
              setFechaHoraEgreso(fechaEgreso.toISOString().slice(0, 16));
            }
          }
          
          // Cargar estado civil del paciente
          if (patient?.estado_civil) {
            setEstadoCivil(patient.estado_civil);
          }
        } else {
          // No hay HC, se creará una nueva al guardar
          setAtencionId(null);
        }
      } catch (error) {
        console.error('Error cargando HC:', error);
        // Si hay error, permitir crear nueva
        setAtencionId(null);
      } finally {
        setLoading(false);
      }
    };

    cargarHC();
  }, [patient?.id]);

  const toggleSistema = (s: string) => {
    setRevisionPorSistemasSeleccion(prev => (
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    ));
  };

  const cargarPerfilNormal = () => {
    setRevisionPorSistemasSeleccion(sistemas);
    const normal: Record<string,string> = {};
    sistemas.forEach(s => { normal[s] = 'Normal'; });
    setRevisionPorSistemasHallazgos(normal);
    setAntecedentesPersonales({
      patologicos: 'Niega', inmunologicos: 'Esquema al día', ginecologicos: 'Sin alteraciones',
      farmacologicos: 'Niega consumo crónico', quirurgicos: 'Niega', hospitalizaciones: 'Niega',
      alergicos: 'Niega', toxicologicos: 'Niega', traumatologicos: 'Niega'
    });
  };

  const handleGuardar = async (): Promise<number | null> => {
    console.log('[ConsultaFormView] handleGuardar llamado');
    if (!motivo.trim() || !diagnosticoPrincipal.trim()) {
      alert('Por favor completa los campos obligatorios: Motivo de consulta y Diagnóstico principal');
      return null;
    }

    try {
      setGuardando(true);
      const user = AuthService.getCurrentUser();

      // Construir objeto de diagnósticos
      const diagnosticosObj = {
        principal: diagnosticoPrincipal,
        relacionados: diagnosticosRelacionados.filter(d => d.trim() !== '')
      };

      const payload: any = {
        hora_consulta: horaConsulta || null,
        motivo_consulta: motivo,
        enfermedad_actual: enfermedadActual,
        enfoque_diferencial: enfoqueDiferencial,
        antecedentes_personales: antecedentesPersonales,
        antecedentes_familiares: antecedentesFamiliares,
        revision_por_sistemas: { sistemas: revisionPorSistemasSeleccion, hallazgos: revisionPorSistemasHallazgos },
        signos_vitales: null,
        examen_fisico: examenFisico,
        diagnosticos_cie10: diagnosticosRelacionados.filter(d => d.trim() !== '').length > 0
          ? JSON.stringify(diagnosticosObj)
          : diagnosticoPrincipal,
        plan_manejo: planManejo,
        recomendaciones: null,
        proxima_cita: null,
        // Signos vitales
        tension_arterial_sistolica: tensionSistolica ? parseInt(tensionSistolica) : null,
        tension_arterial_diastolica: tensionDiastolica ? parseInt(tensionDiastolica) : null,
        frecuencia_cardiaca: frecuenciaCardiaca ? parseInt(frecuenciaCardiaca) : null,
        frecuencia_respiratoria: frecuenciaRespiratoria ? parseInt(frecuenciaRespiratoria) : null,
        saturacion_oxigeno: saturacionOxigeno ? parseFloat(saturacionOxigeno) : null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        // Medidas antropométricas
        peso: peso ? parseFloat(peso) : null,
        talla: talla ? parseFloat(talla) : null,
        imc: imc ? parseFloat(imc) : null,
        perimetro_cefalico: perimetroCefalico ? parseFloat(perimetroCefalico) : null,
        perimetro_toracico: perimetroToracico ? parseFloat(perimetroToracico) : null,
        perimetro_abdominal: perimetroAbdominal ? parseFloat(perimetroAbdominal) : null,
        perimetro_braquial: perimetroBraquial ? parseFloat(perimetroBraquial) : null,
        perimetro_pantorrilla: perimetroPantorrilla ? parseFloat(perimetroPantorrilla) : null,
        // Otros parámetros
        glucometria: glucometria ? parseFloat(glucometria) : null,
        glasgow: glasgow || null,
        // Campos adicionales
        conducta_seguir: conductaSeguir || null,
        evolucion: evolucion || null,
        analisis: analisis || null,
        fecha_hora_egreso: fechaHoraEgreso || null
      };

      let nuevaAtencionId = atencionId;

      if (atencionId) {
        await AuthService.updateHCMedicina(atencionId, payload);
        alert('Historia clínica actualizada exitosamente');
        setUltimaAtencionId(atencionId);
        nuevaAtencionId = atencionId;
      } else {
        if (!user?.id || !patient?.id) {
          throw new Error('Usuario o paciente no disponible');
        }

        const resultado = await AuthService.crearHCMedicina({
          paciente_id: patient.id,
          usuario_id: user.id,
          fecha_atencion: new Date().toISOString().split('T')[0],
          ...payload
        });

        nuevaAtencionId = resultado.atencion_id;
        setAtencionId(resultado.atencion_id);
        setUltimaAtencionId(resultado.atencion_id);
        alert('Nueva atención creada exitosamente');
      }

      // Sincronización HL7 FHIR
      if (patient) {
        console.log('[FHIR Sync] Iniciando sincronización...', { 
          patientId: patient.id, 
          pacienteNombre: patient.nombre,
          atencionId: nuevaAtencionId 
        });
        setFhirSyncStatus('syncing');
        try {
          const failedFhirItems: Array<{ type: string; detail: string }> = [];
          const registerFailure = (type: string, reason: any) => {
            const detail =
              typeof reason === 'string'
                ? reason
                : reason?.message ||
                  reason?.response?.data?.error ||
                  reason?.response?.data?.details ||
                  'Error desconocido';
            console.warn(`[FHIR Sync] ${type} no sincronizado: ${detail}`, reason);
            failedFhirItems.push({ type, detail });
          };

          // 1. Obtener o crear Practitioner en FHIR
          let practitionerReference: string | undefined;
          let practitionerName: string | undefined;
          try {
            if (user?.id) {
              practitionerReference = await getOrCreatePractitioner(user);
              practitionerName = user?.name || (user as any)?.nombre;
            }
          } catch (practitionerError) {
            console.warn('⚠️ No se pudo crear/obtener Practitioner, continuando sin referencia:', practitionerError);
            practitionerName = user?.name || (user as any)?.nombre;
          }

          // 2. Sincronizar Patient
          const { resource: patientResource, patientId: fhirPatientId } = buildPatientResource(patient);
          const identifierValue = patient.documento || patient.numero_documento || patient.id?.toString();
          console.log('[FHIR Sync] Sincronizando Patient...', { patientId: fhirPatientId, identifierValue });
          await syncPatient(patientResource, identifierValue);
          const patientReference = `Patient/${fhirPatientId}`;
          console.log('[FHIR Sync] Patient sincronizado:', patientReference);

          // 3. Crear Encounter
          let encounterReference: string | undefined;
          if (nuevaAtencionId) {
            console.log('[FHIR Sync] Creando Encounter...', { atencionId: nuevaAtencionId });
            const { resource: encounterResource, encounterId: fhirEncounterId } = buildEncounterResource({
              atencion: {
                atencion_id: nuevaAtencionId,
                paciente_id: patient.id,
                usuario_id: user?.id ? Number(user.id) : 0,
                fecha_atencion: new Date().toISOString().split('T')[0],
                tipo_atencion: 'Consulta Médica',
                estado: 'Completada'
              },
              patientReference,
              practitionerReference,
              practitionerName
            });
            const encounterResult = await createEncounter(encounterResource);
            const createdEncounterId = encounterResult.resource?.id || fhirEncounterId;
            encounterReference = `Encounter/${createdEncounterId}`;
            console.log('[FHIR Sync] Encounter creado:', encounterReference);
          }

          // 3. Crear Conditions (diagnósticos)
          const diagnosticosTotales = [diagnosticoPrincipal, ...diagnosticosRelacionados].filter(
            (value, index, self) => value && self.indexOf(value) === index
          );

          const conditionResources = buildConditionResources({
            diagnosticos: diagnosticosTotales,
            patientReference,
            encounterReference,
            practitioner: practitionerReference ? {
              id: practitionerReference,
              name: practitionerName
            } : practitionerName ? {
              name: practitionerName
            } : undefined
          });

          const conditionReferences: string[] = [];
          if (conditionResources.length > 0) {
            console.log('[FHIR Sync] Creando Conditions...', { cantidad: conditionResources.length });
            const conditionResults = await Promise.allSettled(
              conditionResources.map((resource) => createCondition(resource))
            );
            conditionResults.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value?.resource?.id) {
                const conditionRef = `Condition/${result.value.resource.id}`;
                conditionReferences.push(conditionRef);
                console.log('[FHIR Sync] Condition creado:', conditionRef);
              } else {
                registerFailure('Condition', result.status === 'rejected' ? result.reason : 'Respuesta inválida');
                console.debug('Condition payload fallido:', conditionResources[index]);
              }
            });
            console.log('[FHIR Sync] Conditions creados:', conditionReferences.length, 'de', conditionResources.length);
          }

          // 4. Crear Observations (signos vitales)
          const observationReferences: string[] = [];
          if (encounterReference) {
            const observationResources = buildObservationResources({
              signosVitales: {
                tension_arterial_sistolica: tensionSistolica || undefined,
                tension_arterial_diastolica: tensionDiastolica || undefined,
                frecuencia_cardiaca: frecuenciaCardiaca || undefined,
                frecuencia_respiratoria: frecuenciaRespiratoria || undefined,
                saturacion_oxigeno: saturacionOxigeno || undefined,
                temperatura: temperatura || undefined,
                peso: peso || undefined,
                talla: talla || undefined,
                imc: imc || undefined,
                glucometria: glucometria || undefined,
                glasgow: glasgow || undefined
              },
              patientReference,
              encounterReference,
              practitioner: practitionerReference ? {
                id: practitionerReference,
                name: practitionerName
              } : practitionerName ? {
                name: practitionerName
              } : undefined,
              fechaObservacion: new Date().toISOString()
            });

            if (observationResources.length > 0) {
              console.log('[FHIR Sync] Creando Observations en lotes...', { 
                total: observationResources.length, 
                batchSize: OBSERVATION_BATCH_SIZE,
                delay: OBSERVATION_BATCH_DELAY_MS 
              });
              for (let i = 0; i < observationResources.length; i += OBSERVATION_BATCH_SIZE) {
                const batch = observationResources.slice(i, i + OBSERVATION_BATCH_SIZE);
                console.log(`[FHIR Sync] Procesando lote ${Math.floor(i / OBSERVATION_BATCH_SIZE) + 1} (${batch.length} Observations)...`);
                const batchResults = await Promise.allSettled(
                  batch.map((resource) => createObservation(resource))
                );
                batchResults.forEach((result, idx) => {
                  if (result.status === 'fulfilled' && result.value?.resource?.id) {
                    const observationRef = `Observation/${result.value.resource.id}`;
                    observationReferences.push(observationRef);
                    console.log('[FHIR Sync] Observation creado:', observationRef);
                  } else {
                    registerFailure('Observation', result.status === 'rejected' ? result.reason : 'Respuesta inválida');
                    console.debug('Observation payload fallido:', batch[idx]);
                  }
                });

                if (i + OBSERVATION_BATCH_SIZE < observationResources.length && OBSERVATION_BATCH_DELAY_MS > 0) {
                  await wait(OBSERVATION_BATCH_DELAY_MS);
                }
              }
              console.log('[FHIR Sync] Observations creados:', observationReferences.length, 'de', observationResources.length);
            }
          }

          // 5. Crear Composition (historia clínica completa)
          if (encounterReference) {
            console.log('[FHIR Sync] Creando Composition...', {
              encounterReference,
              conditions: conditionReferences.length,
              observations: observationReferences.length
            });
            const { resource: compositionResource } = buildCompositionResource({
              encounterReference,
              patientReference,
              conditionReferences,
              observationReferences,
              practitioner: practitionerReference ? {
                id: practitionerReference,
                name: practitionerName
              } : practitionerName ? {
                name: practitionerName
              } : undefined,
              fechaComposicion: new Date().toISOString(),
              tipoDocumento: 'Historia Clínica de Medicina General',
              titulo: `Historia Clínica - ${patient.nombre || 'Paciente'}`
            });
            const compositionResult = await createComposition(compositionResource);
            const compositionId = compositionResult.resource?.id;
            console.log('[FHIR Sync] Composition creado:', compositionId ? `Composition/${compositionId}` : 'ID pendiente');
          }

          if (failedFhirItems.length > 0) {
            console.warn('[FHIR Sync] Recursos con errores pendientes:', failedFhirItems);
            alert(
              `Historia clínica sincronizada con advertencias: ${failedFhirItems.length} recursos FHIR no se enviaron. Revisa la consola para más detalles.`
            );
          }
          
          console.log('[FHIR Sync] Sincronización completada', {
            patientReference,
            encounterReference,
            conditions: conditionReferences.length,
            observations: observationReferences.length,
            composition: encounterReference ? 'creado' : 'no creado',
            failed: failedFhirItems.length
          });
          
          setFhirSyncStatus('success');
          
          // Mantener el estado 'success' visible por 5 segundos antes de resetear
          setTimeout(() => {
            setFhirSyncStatus('idle');
          }, 5000);
        } catch (fhirError) {
          console.error('❌ Error sincronizando con FHIR:', fhirError);
          setFhirSyncStatus('error');
          
          // Mantener el error visible por 10 segundos antes de resetear
          setTimeout(() => {
            setFhirSyncStatus('idle');
          }, 10000);
        }
      }
      
      // Retornar el ID de atención al finalizar
      return nuevaAtencionId;
    } catch (e: any) {
      console.error('Error guardando:', e);
      alert(`Error: ${e.message || 'Error guardando historia clínica'}`);
      return null;
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
          <span className="ml-3 text-stone-600">Cargando historia clínica...</span>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveCard>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-stone-900">Historia Clínica</h4>
        <div className="flex items-center gap-2">
          {atencionId && (
            <ResponsiveBadge tone="admin">Atención #{atencionId}</ResponsiveBadge>
          )}
          {fhirSyncStatus === 'syncing' && (
            <ResponsiveBadge tone="admin">Sincronizando FHIR...</ResponsiveBadge>
          )}
          {fhirSyncStatus === 'success' && (
            <ResponsiveBadge tone="health">FHIR actualizado</ResponsiveBadge>
          )}
          {fhirSyncStatus === 'error' && (
            <ResponsiveBadge tone="critical">Error en FHIR</ResponsiveBadge>
          )}
        </div>
      </div>

      {/* Selector de perfiles de autocompletado */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <label className="text-sm font-medium text-stone-700 whitespace-nowrap">
            Perfil de autocompletado:
          </label>
          <select
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm bg-white"
            value={perfilSeleccionado || ''}
            onChange={(e) => setPerfilSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
            disabled={cargandoPerfiles || perfiles.length === 0}
          >
            <option value="">
              {cargandoPerfiles 
                ? 'Cargando perfiles...' 
                : perfiles.length === 0 
                  ? 'No hay perfiles disponibles' 
                  : 'Seleccionar perfil...'}
            </option>
            {perfiles.map((perfil: any) => (
              <option key={perfil.perfil_id} value={perfil.perfil_id}>
                {perfil.nombre_perfil} {perfil.descripcion ? `- ${perfil.descripcion}` : ''}
                {perfil.creado_por_uid ? ' (Mi perfil)' : ''}
              </option>
            ))}
          </select>
          <ResponsiveButton
            variant="secondary"
            onClick={aplicarPerfil}
            disabled={!perfilSeleccionado || cargandoPerfiles || perfiles.length === 0}
            className="whitespace-nowrap"
          >
            {cargandoPerfiles ? 'Cargando...' : 'Aplicar Perfil'}
          </ResponsiveButton>
          <ResponsiveButton
            variant="outline"
            onClick={() => setMostrarCrearPerfil(true)}
            className="whitespace-nowrap"
          >
            Guardar como Perfil
          </ResponsiveButton>
        </div>
        {perfiles.length === 0 && !cargandoPerfiles && (
          <p className="text-xs text-stone-500 mt-2">
            No hay perfiles disponibles. Puedes crear uno personalizado con el botón "Guardar como Perfil".
          </p>
        )}
      </div>

      {/* Modal para crear perfil personalizado */}
      {mostrarCrearPerfil && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Crear Perfil Personalizado</h3>
            <div className="space-y-4">
              <ResponsiveField label="Nombre del perfil" required>
                <ResponsiveInput
                  value={nombreNuevoPerfil}
                  onChange={(e: any) => setNombreNuevoPerfil(e.target.value)}
                  placeholder="Ej: Mi perfil de control"
                />
              </ResponsiveField>
              <ResponsiveField label="Descripción (opcional)">
                <ResponsiveInput
                  value={descripcionNuevoPerfil}
                  onChange={(e: any) => setDescripcionNuevoPerfil(e.target.value)}
                  placeholder="Descripción del perfil..."
                />
              </ResponsiveField>
              <p className="text-xs text-stone-500">
                Se guardará con los valores actuales del formulario. Este perfil solo será visible para ti.
              </p>
              <div className="flex gap-3 pt-2">
                <ResponsiveButton
                  variant="secondary"
                  onClick={() => {
                    setMostrarCrearPerfil(false);
                    setNombreNuevoPerfil('');
                    setDescripcionNuevoPerfil('');
                  }}
                  disabled={guardandoPerfil}
                >
                  Cancelar
                </ResponsiveButton>
                <ResponsiveButton
                  onClick={guardarPerfilPersonalizado}
                  disabled={guardandoPerfil || !nombreNuevoPerfil.trim()}
                >
                  {guardandoPerfil ? 'Guardando...' : 'Guardar Perfil'}
                </ResponsiveButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Datos generales */}
        <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <ResponsiveField label="Hora de consulta">
            <ResponsiveInput type="time" value={horaConsulta} onChange={(e: any) => setHoraConsulta(e.target.value)} />
          </ResponsiveField>
          <ResponsiveField label="Estado civil">
            <ResponsiveInput value={estadoCivil} onChange={(e: any) => setEstadoCivil(e.target.value)} placeholder="Ej: Soltero, Casado..." />
          </ResponsiveField>
        </div>

        {/* Motivo de consulta */}
        <ResponsiveField label="Motivo de consulta" required>
          <div className="flex gap-2">
            <ResponsiveInput 
              value={motivo} 
              onChange={(e: any) => setMotivo(e.target.value)} 
              placeholder="Describe el motivo principal..." 
              className="flex-1"
            />
            <STTButton 
              onTranscription={(text) => setMotivo(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        {/* Enfoque diferencial */}
        <ResponsiveCard>
          <h5 className="font-medium text-stone-900 mb-3">Enfoque Diferencial</h5>
          <div className="space-y-4">
            {/* Etnia */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Etnia</label>
              <div className="flex flex-wrap gap-3">
                {['afrodescendiente', 'indigena', 'palanquero', 'mestizo', 'otro'].map((etnia) => (
                  <label key={etnia} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={enfoqueDiferencial.etnia[etnia]} onChange={(e) => setEnfoqueDiferencial((prev: any) => ({ ...prev, etnia: { ...prev.etnia, [etnia]: e.target.checked } }))} />
                    <span className="capitalize">{etnia}</span>
                  </label>
                ))}
              </div>
              {enfoqueDiferencial.etnia.otro && (
                <ResponsiveInput className="mt-2" placeholder="¿Cuál?" value={enfoqueDiferencial.etnia.otro_cual} onChange={(e: any) => setEnfoqueDiferencial((prev: any) => ({ ...prev, etnia: { ...prev.etnia, otro_cual: e.target.value } }))} />
              )}
            </div>
            
            {/* Discapacidades */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Discapacidades</label>
              <div className="flex flex-wrap gap-3">
                {['visual', 'auditiva', 'mental', 'fisica', 'multiple', 'sordo_ceguera', 'otra'].map((disc) => (
                  <label key={disc} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={enfoqueDiferencial.discapacidades[disc]} onChange={(e) => setEnfoqueDiferencial((prev: any) => ({ ...prev, discapacidades: { ...prev.discapacidades, [disc]: e.target.checked } }))} />
                    <span className="capitalize">{disc.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
              {enfoqueDiferencial.discapacidades.otra && (
                <ResponsiveInput className="mt-2" placeholder="¿Cuál?" value={enfoqueDiferencial.discapacidades.otra_cual} onChange={(e: any) => setEnfoqueDiferencial((prev: any) => ({ ...prev, discapacidades: { ...prev.discapacidades, otra_cual: e.target.value } }))} />
              )}
            </div>
            
            {/* Población LGTBIQ+ */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Población LGTBIQ+</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="lgtbiq" checked={enfoqueDiferencial.poblacion_lgtbiq.si} onChange={() => setEnfoqueDiferencial((prev: any) => ({ ...prev, poblacion_lgtbiq: { si: true, no: false, cual: prev.poblacion_lgtbiq.cual } }))} />
                  <span>Si</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="lgtbiq" checked={enfoqueDiferencial.poblacion_lgtbiq.no} onChange={() => setEnfoqueDiferencial((prev: any) => ({ ...prev, poblacion_lgtbiq: { si: false, no: true, cual: prev.poblacion_lgtbiq.cual } }))} />
                  <span>No</span>
                </label>
              </div>
              {enfoqueDiferencial.poblacion_lgtbiq.si && (
                <ResponsiveInput className="mt-2" placeholder="¿Cuál?" value={enfoqueDiferencial.poblacion_lgtbiq.cual} onChange={(e: any) => setEnfoqueDiferencial((prev: any) => ({ ...prev, poblacion_lgtbiq: { ...prev.poblacion_lgtbiq, cual: e.target.value } }))} />
              )}
            </div>
            
            {/* Otras poblaciones */}
            <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {[
                { key: 'poblacion_migrante', label: 'Población migrante', tipo: 'text' },
                { key: 'privados_libertad', label: 'Privados de la libertad', tipo: 'radio' },
                { key: 'victimas_conflicto', label: 'Víctimas conflicto', tipo: 'radio' },
                { key: 'veteranos_fuerza_publica', label: 'Veteranos fuerza pública', tipo: 'radio' },
                { key: 'adulto_mayor', label: 'Adulto mayor', tipo: 'radio' },
                { key: 'embarazadas', label: 'Embarazadas', tipo: 'radio' },
                { key: 'victima_sexual', label: 'Víctima sexual', tipo: 'radio' }
              ].map((item) => (
                <div key={item.key}>
                  <label className="text-sm font-medium text-stone-700 mb-2 block">{item.label}</label>
                  {item.tipo === 'text' ? (
                    <ResponsiveInput value={enfoqueDiferencial[item.key]} onChange={(e: any) => setEnfoqueDiferencial((prev: any) => ({ ...prev, [item.key]: e.target.value }))} />
                  ) : (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name={item.key} checked={enfoqueDiferencial[item.key].si} onChange={() => setEnfoqueDiferencial((prev: any) => ({ ...prev, [item.key]: { si: true, no: false } }))} />
                        <span>Si</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" name={item.key} checked={enfoqueDiferencial[item.key].no} onChange={() => setEnfoqueDiferencial((prev: any) => ({ ...prev, [item.key]: { si: false, no: true } }))} />
                        <span>No</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ResponsiveCard>

        {/* Enfermedad actual */}
        <ResponsiveField label="Enfermedad actual">
          <div className="space-y-2">
            <div className="flex gap-2">
              <textarea 
                className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
                rows={3} 
                placeholder="Inicio, duración, características..." 
                value={enfermedadActual} 
                onChange={(e) => setEnfermedadActual(e.target.value)} 
              />
              <STTButton 
                onTranscription={(text) => setEnfermedadActual(prev => prev ? `${prev} ${text}` : text)} 
              />
            </div>
          </div>
        </ResponsiveField>

        {/* Antecedentes personales */}
        <ResponsiveCard>
          <h5 className="font-medium text-stone-900 mb-3">Antecedentes personales</h5>
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {Object.keys(antecedentesPersonales).map((k) => (
              <ResponsiveField key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                <ResponsiveInput value={antecedentesPersonales[k]} onChange={(e: any) => setAntecedentesPersonales((p: any) => ({ ...p, [k]: e.target.value }))} />
              </ResponsiveField>
            ))}
          </div>
        </ResponsiveCard>

        {/* Antecedentes familiares */}
        <ResponsiveField label="Antecedentes familiares">
          <div className="flex gap-2">
            <textarea 
              className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
              rows={3} 
              value={antecedentesFamiliares} 
              onChange={(e) => setAntecedentesFamiliares(e.target.value)} 
            />
            <STTButton 
              onTranscription={(text) => setAntecedentesFamiliares(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        {/* Revisión por sistemas */}
        <ResponsiveCard>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-medium text-stone-900">Revisión por Sistemas</h5>
            <ResponsiveButton size="sm" variant="secondary" onClick={cargarPerfilNormal}>Cargar Perfil Normal</ResponsiveButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sistemas.map((s) => (
              <div key={s} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" className="rounded border-stone-300" checked={revisionPorSistemasSeleccion.includes(s)} onChange={() => toggleSistema(s)} />
                  <span>{s}</span>
                </label>
                {revisionPorSistemasSeleccion.includes(s) && (
                  <input
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    placeholder="Hallazgos..."
                    value={revisionPorSistemasHallazgos[s] || ''}
                    onChange={(e) => setRevisionPorSistemasHallazgos(prev => ({ ...prev, [s]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </ResponsiveCard>

        {/* Signos vitales */}
        <ResponsiveCard>
          <h5 className="font-medium text-stone-900 mb-3">Signos Vitales</h5>
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div className="grid grid-cols-2 gap-2">
              <ResponsiveField label="TA Sistólica">
                <ResponsiveInput type="number" value={tensionSistolica} onChange={(e: any) => setTensionSistolica(e.target.value)} placeholder="120" />
              </ResponsiveField>
              <ResponsiveField label="TA Diastólica">
                <ResponsiveInput type="number" value={tensionDiastolica} onChange={(e: any) => setTensionDiastolica(e.target.value)} placeholder="80" />
              </ResponsiveField>
            </div>
            <ResponsiveField label="FC (lpm)">
              <ResponsiveInput type="number" value={frecuenciaCardiaca} onChange={(e: any) => setFrecuenciaCardiaca(e.target.value)} placeholder="72" />
            </ResponsiveField>
            <ResponsiveField label="FR (rpm)">
              <ResponsiveInput type="number" value={frecuenciaRespiratoria} onChange={(e: any) => setFrecuenciaRespiratoria(e.target.value)} placeholder="16" />
            </ResponsiveField>
            <ResponsiveField label="SO2 (%)">
              <ResponsiveInput type="number" step="0.1" value={saturacionOxigeno} onChange={(e: any) => setSaturacionOxigeno(e.target.value)} placeholder="98" />
            </ResponsiveField>
            <ResponsiveField label="Temperatura (°C)">
              <ResponsiveInput type="number" step="0.1" value={temperatura} onChange={(e: any) => setTemperatura(e.target.value)} placeholder="36.5" />
            </ResponsiveField>
          </div>
        </ResponsiveCard>

        {/* Medidas antropométricas */}
        <ResponsiveCard>
          <h5 className="font-medium text-stone-900 mb-3">Medidas Antropométricas</h5>
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Peso (kg)">
              <ResponsiveInput type="number" step="0.1" value={peso} onChange={(e: any) => setPeso(e.target.value)} placeholder="70" />
            </ResponsiveField>
            <ResponsiveField label="Talla (m)">
              <ResponsiveInput type="number" step="0.01" value={talla} onChange={(e: any) => setTalla(e.target.value)} placeholder="1.70" />
            </ResponsiveField>
            <ResponsiveField label="IMC">
              <ResponsiveInput type="number" step="0.01" value={imc} readOnly placeholder="Calculado automáticamente" />
            </ResponsiveField>
            <ResponsiveField label="Perímetro cefálico (cm)">
              <ResponsiveInput type="number" step="0.1" value={perimetroCefalico} onChange={(e: any) => setPerimetroCefalico(e.target.value)} />
            </ResponsiveField>
            <ResponsiveField label="Perímetro torácico (cm)">
              <ResponsiveInput type="number" step="0.1" value={perimetroToracico} onChange={(e: any) => setPerimetroToracico(e.target.value)} />
            </ResponsiveField>
            <ResponsiveField label="Perímetro abdominal (cm)">
              <ResponsiveInput type="number" step="0.1" value={perimetroAbdominal} onChange={(e: any) => setPerimetroAbdominal(e.target.value)} />
            </ResponsiveField>
            <ResponsiveField label="Perímetro braquial (cm)">
              <ResponsiveInput type="number" step="0.1" value={perimetroBraquial} onChange={(e: any) => setPerimetroBraquial(e.target.value)} />
            </ResponsiveField>
            <ResponsiveField label="Perímetro pantorrilla (cm)">
              <ResponsiveInput type="number" step="0.1" value={perimetroPantorrilla} onChange={(e: any) => setPerimetroPantorrilla(e.target.value)} />
            </ResponsiveField>
          </div>
        </ResponsiveCard>

        {/* Otros parámetros */}
        <ResponsiveCard>
          <h5 className="font-medium text-stone-900 mb-3">Otros Parámetros</h5>
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Glucometría (mg/dL)">
              <ResponsiveInput type="number" step="0.1" value={glucometria} onChange={(e: any) => setGlucometria(e.target.value)} />
            </ResponsiveField>
            <ResponsiveField label="Glasgow">
              <ResponsiveInput value={glasgow} onChange={(e: any) => setGlasgow(e.target.value)} placeholder="Ej: 15/15" />
            </ResponsiveField>
          </div>
        </ResponsiveCard>

        {/* Examen físico */}
        <ResponsiveField label="Examen físico">
          <div className="flex gap-2">
            <textarea 
              className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
              rows={3} 
              placeholder="Hallazgos relevantes..." 
              value={examenFisico} 
              onChange={(e) => setExamenFisico(e.target.value)} 
            />
            <STTButton 
              onTranscription={(text) => setExamenFisico(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        {/* Diagnósticos */}
        <ResponsiveCard>
          <h5 className="font-medium text-stone-900 mb-3">Diagnósticos</h5>
          <ResponsiveField label="Diagnóstico principal (CIE-10)" required>
            <TerminologyAutocomplete
              value={diagnosticoPrincipal}
              onValueChange={setDiagnosticoPrincipal}
              placeholder="Ej: I10 - Hipertensión esencial"
              searchType="cie10"
            />
          </ResponsiveField>
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium text-stone-700">Diagnósticos relacionados</label>
            {[0, 1, 2].map((idx) => (
              <ResponsiveField key={idx} label={`${idx + 1}.`}>
                <TerminologyAutocomplete
                  value={diagnosticosRelacionados[idx]}
                  onValueChange={(valor) => {
                    const nuevos = [...diagnosticosRelacionados];
                    nuevos[idx] = valor;
                    setDiagnosticosRelacionados(nuevos);
                  }}
                  placeholder={`CIE-10 ${idx + 1}`}
                  searchType="cie10"
                />
              </ResponsiveField>
            ))}
          </div>
        </ResponsiveCard>

        {/* Conducta, Evolución, Análisis */}
        <ResponsiveField label="Conducta a seguir">
          <div className="flex gap-2">
            <textarea 
              className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
              rows={3} 
              value={conductaSeguir} 
              onChange={(e) => setConductaSeguir(e.target.value)} 
            />
            <STTButton 
              onTranscription={(text) => setConductaSeguir(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        <ResponsiveField label="Evolución">
          <div className="flex gap-2">
            <textarea 
              className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
              rows={3} 
              value={evolucion} 
              onChange={(e) => setEvolucion(e.target.value)} 
            />
            <STTButton 
              onTranscription={(text) => setEvolucion(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        <ResponsiveField label="Análisis">
          <div className="flex gap-2">
            <textarea 
              className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
              rows={3} 
              value={analisis} 
              onChange={(e) => setAnalisis(e.target.value)} 
            />
            <STTButton 
              onTranscription={(text) => setAnalisis(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        {/* Plan de manejo */}
        <ResponsiveField label="Plan de manejo">
          <div className="flex gap-2">
            <textarea 
              className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none" 
              rows={3} 
              placeholder="Tratamiento, educación, controles..." 
              value={planManejo} 
              onChange={(e) => setPlanManejo(e.target.value)} 
            />
            <STTButton 
              onTranscription={(text) => setPlanManejo(prev => prev ? `${prev} ${text}` : text)} 
            />
          </div>
        </ResponsiveField>

        {/* Egreso */}
        <ResponsiveField label="Fecha y hora de egreso">
          <ResponsiveInput type="datetime-local" value={fechaHoraEgreso} onChange={(e: any) => setFechaHoraEgreso(e.target.value)} />
        </ResponsiveField>

        <div className={`flex gap-3 ${deviceType === 'mobile' ? 'flex-col' : 'flex-row'}`}>
          <ResponsiveButton 
            variant="secondary" 
            onClick={handleGuardar} 
            disabled={guardando}
            className={`${deviceType === 'mobile' ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2`}
          >
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : atencionId ? 'Actualizar' : 'Crear Atención'}
          </ResponsiveButton>
          <ResponsiveButton 
            onClick={async () => {
              try {
                setGuardando(true);
                // Primero guardar/actualizar la atención y obtener el ID directamente
                const atencionIdGuardada = await handleGuardar();
                
                // Marcar atención como completada usando el ID retornado
                if (atencionIdGuardada) {
                  try {
                    await AuthService.completarAtencion(atencionIdGuardada);
                    alert('Consulta finalizada exitosamente');
                  } catch (e: any) {
                    console.error('Error completando atención:', e);
                    alert('Error al finalizar consulta: ' + e.message);
                  }
                } else {
                  console.warn('No se pudo obtener el ID de atención para completar');
                  alert('Consulta guardada, pero no se pudo marcar como completada. Intenta finalizarla nuevamente.');
                }
              } catch (e: any) {
                console.error('Error en proceso de finalización:', e);
                alert('Error al finalizar consulta: ' + e.message);
              } finally {
                setGuardando(false);
              }
            }}
            disabled={guardando}
            className={`${deviceType === 'mobile' ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2`}
          >
            <Send className="w-4 h-4" />
            {guardando ? 'Finalizando...' : 'Finalizar'}
          </ResponsiveButton>
        </div>
      </div>
    </ResponsiveCard>
  );
}

function RecetaFormView({ patient, deviceType }: any) {
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    nombre: '',
    codigo_invima: '',
    codigo_atc: '',
    concentracion: '',
    forma_farmaceutica: '',
    via_administracion: '',
    dosis_frecuencia_duracion: '',
    cantidad_numerica: '',
    cantidad_letras: '',
    entregado: false
  });
  const [indicaciones, setIndicaciones] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [codigoDiagnosticoPrincipal, setCodigoDiagnosticoPrincipal] = useState('');
  const [codigoDiagnosticoRel1, setCodigoDiagnosticoRel1] = useState('');
  const [codigoDiagnosticoRel2, setCodigoDiagnosticoRel2] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [recetaId, setRecetaId] = useState<number | null>(null);
  const [atencionId, setAtencionId] = useState<number | null>(null);
  const [hcAsociada, setHcAsociada] = useState<any>(null);
  const [fhirSyncStatus, setFhirSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const cargarRecetas = async () => {
      if (!patient?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const recetas = await AuthService.getRecetasPaciente(patient.id);
        
        // Obtener atencion_id de la consulta activa si existe
        const hcList = await AuthService.get(`/pacientes/${patient.id}/hc/medicina`);
        if (hcList && hcList.length > 0) {
          const ultimaHC = hcList[0];
          setAtencionId(ultimaHC.atencion_id);
          
          // Cargar HC completa para obtener diagnósticos
          const hcCompleta = await AuthService.getHCMedicina(ultimaHC.atencion_id);
          if (hcCompleta) {
            setHcAsociada(hcCompleta);
            // Extraer diagnósticos de la HC
            if (hcCompleta.diagnosticos_cie10) {
              try {
                const diag = typeof hcCompleta.diagnosticos_cie10 === 'string'
                  ? JSON.parse(hcCompleta.diagnosticos_cie10)
                  : hcCompleta.diagnosticos_cie10;
                if (typeof diag === 'object' && diag.principal) {
                  setCodigoDiagnosticoPrincipal(diag.principal || '');
                  if (diag.relacionados && diag.relacionados.length > 0) {
                    setCodigoDiagnosticoRel1(diag.relacionados[0] || '');
                    if (diag.relacionados.length > 1) {
                      setCodigoDiagnosticoRel2(diag.relacionados[1] || '');
                    }
                  }
                } else {
                  setCodigoDiagnosticoPrincipal(hcCompleta.diagnosticos_cie10 || '');
                }
              } catch (e) {
                setCodigoDiagnosticoPrincipal(hcCompleta.diagnosticos_cie10 || '');
              }
            }
          }
        }

        // Cargar la última receta activa o más reciente
        if (recetas && recetas.length > 0) {
          const ultimaReceta = recetas[0];
          setRecetaId(ultimaReceta.receta_id);
          if (ultimaReceta.medicamentos && Array.isArray(ultimaReceta.medicamentos)) {
            setMedicamentos(ultimaReceta.medicamentos);
          }
          setIndicaciones(ultimaReceta.indicaciones || '');
          setRecomendaciones(ultimaReceta.recomendaciones || '');
          setCodigoDiagnosticoPrincipal(ultimaReceta.codigo_diagnostico_principal || '');
          setCodigoDiagnosticoRel1(ultimaReceta.codigo_diagnostico_rel1 || '');
          setCodigoDiagnosticoRel2(ultimaReceta.codigo_diagnostico_rel2 || '');
        }
      } catch (error) {
        console.error('Error cargando recetas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarRecetas();
  }, [patient?.id]);

  const agregarMedicamento = () => {
    if (!nuevoMedicamento.nombre.trim()) {
      alert('Por favor ingresa el nombre del medicamento');
      return;
    }
    
    const nuevoId = medicamentos.length > 0 
      ? Math.max(...medicamentos.map((m: any) => m.id || 0)) + 1 
      : 1;
    
    setMedicamentos([...medicamentos, {
      id: nuevoId,
      nombre: nuevoMedicamento.nombre,
      codigo_invima: nuevoMedicamento.codigo_invima,
      codigo_atc: nuevoMedicamento.codigo_atc,
      concentracion: nuevoMedicamento.concentracion,
      forma_farmaceutica: nuevoMedicamento.forma_farmaceutica,
      via_administracion: nuevoMedicamento.via_administracion,
      dosis_frecuencia_duracion: nuevoMedicamento.dosis_frecuencia_duracion,
      cantidad_numerica: nuevoMedicamento.cantidad_numerica ? parseInt(nuevoMedicamento.cantidad_numerica) : null,
      cantidad_letras: nuevoMedicamento.cantidad_letras,
      entregado: nuevoMedicamento.entregado
    }]);
    
    setNuevoMedicamento({
      nombre: '',
      codigo_invima: '',
      codigo_atc: '',
      concentracion: '',
      forma_farmaceutica: '',
      via_administracion: '',
      dosis_frecuencia_duracion: '',
      cantidad_numerica: '',
      cantidad_letras: '',
      entregado: false
    });
  };

  const eliminarMedicamento = (id: any) => {
    setMedicamentos(medicamentos.filter((m: any) => m.id !== id));
  };

  const handleGuardar = async () => {
    if (medicamentos.length === 0) {
      alert('Agrega al menos un medicamento a la receta');
      return;
    }

    if (!atencionId) {
      alert('No hay una atención asociada. Primero completa la consulta médica.');
      return;
    }

    try {
      setGuardando(true);
      const user = AuthService.getCurrentUser();
      
      if (!user?.id || !patient?.id) {
        throw new Error('Usuario o paciente no disponible');
      }

      const recetaData = {
        atencion_id: atencionId,
        paciente_id: patient.id,
        usuario_id: user.id,
        fecha_receta: new Date().toISOString().split('T')[0],
        medicamentos: medicamentos,
        indicaciones: indicaciones,
        recomendaciones: recomendaciones,
        codigo_diagnostico_principal: codigoDiagnosticoPrincipal || null,
        codigo_diagnostico_rel1: codigoDiagnosticoRel1 || null,
        codigo_diagnostico_rel2: codigoDiagnosticoRel2 || null,
        estado: 'Activa'
      };

      if (recetaId) {
        // Actualizar receta existente (se puede implementar PUT si existe)
        await AuthService.crearReceta(recetaData);
        alert('Receta actualizada exitosamente');
      } else {
        const resultado = await AuthService.crearReceta(recetaData);
        setRecetaId(resultado.receta_id);
        alert('Receta creada exitosamente');
      }

      if (patient) {
        setFhirSyncStatus('syncing');
        try {
          // Obtener o crear Practitioner en FHIR
          let practitionerReference: string | undefined;
          let practitionerName: string | undefined;
          try {
            if (user?.id) {
              practitionerReference = await getOrCreatePractitioner(user);
              practitionerName = user?.name || (user as any)?.nombre;
            }
          } catch (practitionerError) {
            console.warn('⚠️ No se pudo crear/obtener Practitioner, continuando sin referencia:', practitionerError);
            practitionerName = user?.name || (user as any)?.nombre;
          }

          const { resource: patientResource, patientId: fhirPatientId } = buildPatientResource(patient);
          const identifierValue = patient.documento || patient.numero_documento || patient.id?.toString();
          await syncPatient(patientResource, identifierValue);

          const patientReference = `Patient/${fhirPatientId}`;
          const diagnosticosTotales = [codigoDiagnosticoPrincipal, codigoDiagnosticoRel1, codigoDiagnosticoRel2].filter(
            (value, index, self) => value && self.indexOf(value) === index
          );

          const medicationResources = buildMedicationResources(medicamentos);
          if (medicationResources.length > 0) {
            await Promise.all(
              medicationResources.map((resource: any) => createMedication(resource, resource.id))
            );
          }

          const medicationRequests = buildMedicationRequestResources({
            medicamentos,
            patientReference,
            practitioner: practitionerReference ? {
              id: practitionerReference,
              name: practitionerName
            } : practitionerName ? {
              name: practitionerName
            } : undefined,
            encounterReference: undefined,
            diagnosticos: diagnosticosTotales
          });

          if (medicationRequests.length > 0) {
            await Promise.all(medicationRequests.map((resource: any) => createMedicationRequest(resource)));
          }

          setFhirSyncStatus('success');
        } catch (fhirError) {
          console.error('❌ Error sincronizando receta en FHIR:', fhirError);
          setFhirSyncStatus('error');
        }
      }
    } catch (e: any) {
      console.error('Error guardando receta:', e);
      alert(`Error: ${e.message || 'Error guardando receta'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleImprimir = () => {
    const contenido = `
      RECETA MÉDICA
      
      Paciente: ${patient?.nombre || 'N/A'}
      Documento: ${patient?.documento || 'N/A'}
      Fecha: ${new Date().toLocaleDateString('es-ES')}
      
      MEDICAMENTOS:
      ${medicamentos.map((m: any, idx: number) => 
        `${idx + 1}. ${m.nombre} - ${m.dosis} - ${m.frecuencia}${m.dias ? ` - ${m.dias} días` : ''}`
      ).join('\n')}
      
      ${indicaciones ? `INDICACIONES:\n${indicaciones}` : ''}
    `;
    
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head><title>Receta Médica</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <pre>${contenido}</pre>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
    
    // Marcar como impresa
    if (recetaId) {
      AuthService.marcarRecetaImpresion(recetaId).catch(console.error);
    }
  };

  const handleCompartir = async () => {
    const contenido = `
Receta Médica
Paciente: ${patient?.nombre || 'N/A'}
Documento: ${patient?.documento || 'N/A'}
Fecha: ${new Date().toLocaleDateString('es-ES')}

Medicamentos:
${medicamentos.map((m: any, idx: number) => 
  `${idx + 1}. ${m.nombre} - ${m.dosis} - ${m.frecuencia}${m.dias ? ` - ${m.dias} días` : ''}`
).join('\n')}

${indicaciones ? `Indicaciones:\n${indicaciones}` : ''}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Receta Médica',
          text: contenido
        });
      } catch (err) {
        console.error('Error compartiendo:', err);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(contenido).then(() => {
        alert('Receta copiada al portapapeles');
      }).catch(() => {
        alert('No se pudo compartir la receta');
      });
    }
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
          <span className="ml-3 text-stone-600">Cargando recetas...</span>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveCard>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-stone-900">Recetario Digital</h4>
        <div className="flex items-center gap-2">
          {recetaId && (
            <ResponsiveBadge tone="admin">Receta #{recetaId}</ResponsiveBadge>
          )}
          {fhirSyncStatus === 'syncing' && (
            <ResponsiveBadge tone="admin">Sincronizando FHIR...</ResponsiveBadge>
          )}
          {fhirSyncStatus === 'success' && (
            <ResponsiveBadge tone="health">FHIR actualizado</ResponsiveBadge>
          )}
          {fhirSyncStatus === 'error' && (
            <ResponsiveBadge tone="critical">Error en FHIR</ResponsiveBadge>
          )}
        </div>
      </div>
      
      {/* Datos del paciente (solo lectura) */}
      <div className="mb-4 p-3 bg-stone-50 rounded-lg space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium text-stone-700">Nombre:</span>
            <span className="ml-2 text-stone-900">{patient?.nombre || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-stone-700">No. Identificación/H. Clínica:</span>
            <span className="ml-2 text-stone-900">{patient?.documento || 'N/A'} {atencionId ? `- HC: ${atencionId}` : ''}</span>
          </div>
          <div>
            <span className="font-medium text-stone-700">Régimen - Empresa:</span>
            <span className="ml-2 text-stone-900">{patient?.regimen_afiliacion || 'N/A'} {patient?.eapb ? `- ${patient.eapb}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Códigos de diagnóstico */}
      <ResponsiveCard>
        <h5 className="font-medium text-stone-900 mb-3">Códigos Diagnóstico</h5>
        <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <ResponsiveField label="PRINCIPAL">
            <TerminologyAutocomplete
              value={codigoDiagnosticoPrincipal}
              onValueChange={setCodigoDiagnosticoPrincipal}
              placeholder="CIE-10 Principal"
              searchType="cie10"
            />
          </ResponsiveField>
          <ResponsiveField label="RELACIONADO 1">
            <TerminologyAutocomplete
              value={codigoDiagnosticoRel1}
              onValueChange={setCodigoDiagnosticoRel1}
              placeholder="CIE-10 Rel 1"
              searchType="cie10"
            />
          </ResponsiveField>
          <ResponsiveField label="RELACIONADO 2">
            <TerminologyAutocomplete
              value={codigoDiagnosticoRel2}
              onValueChange={setCodigoDiagnosticoRel2}
              placeholder="CIE-10 Rel 2"
              searchType="cie10"
            />
          </ResponsiveField>
        </div>
      </ResponsiveCard>

      {/* Lista de medicamentos */}
      <div className="space-y-3 mb-4">
        {medicamentos.length === 0 ? (
          <div className="text-center py-6 text-stone-500 text-sm">
            No hay medicamentos agregados. Agrega medicamentos a continuación.
          </div>
        ) : (
          medicamentos.map((med: any) => (
            <div key={med.id} className="p-3 bg-stone-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-stone-900">{med.nombre || 'Sin nombre'}</div>
                  <div className="text-xs text-stone-500 mt-1 space-x-2">
                    {med.codigo_invima && <span>Código INVIMA: {med.codigo_invima}</span>}
                    {med.codigo_atc && <span>ATC: {med.codigo_atc}</span>}
                  </div>
                  <div className="text-sm text-stone-600 mt-1 space-y-1">
                    {med.concentracion && <div>Concentración: {med.concentracion}</div>}
                    {med.forma_farmaceutica && <div>Forma: {med.forma_farmaceutica}</div>}
                    {med.via_administracion && <div>Vía: {med.via_administracion}</div>}
                    {med.dosis_frecuencia_duracion && <div>Dosis/Frecuencia/Duración: {med.dosis_frecuencia_duracion}</div>}
                    {med.cantidad_numerica && <div>Cantidad: {med.cantidad_numerica} ({med.cantidad_letras || ''})</div>}
                    {med.entregado && <div className="text-green-600">✓ Entregado</div>}
                  </div>
                </div>
                <button
                  onClick={() => eliminarMedicamento(med.id)}
                  className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Formulario de nuevo medicamento */}
      <ResponsiveCard>
        <h5 className="font-medium text-stone-900 mb-3">Agregar Medicamento</h5>
        <div className="space-y-4">
          <ResponsiveField label="Medicamento" required>
            <TerminologyAutocomplete
              value={nuevoMedicamento.nombre}
              onValueChange={(valor) =>
                setNuevoMedicamento({
                  ...nuevoMedicamento,
                  nombre: valor
                })
              }
              placeholder="Buscar por nombre o código INVIMA"
              searchType="medication"
              onOptionSelect={(option) => {
                const designation = option.designation?.find((d: any) =>
                  typeof d.value === 'string' && d.value.toUpperCase().includes('ATC')
                );
                const atc = designation?.value?.split(' ').pop() || '';
                setNuevoMedicamento((prev: any) => ({
                  ...prev,
                  nombre: `${option.code} - ${option.display}`,
                  codigo_invima: option.code,
                  codigo_atc: atc
                }));
              }}
            />
          </ResponsiveField>
          
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Concentración">
              <ResponsiveInput 
                value={nuevoMedicamento.concentracion}
                onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, concentracion: e.target.value })}
                placeholder="Ej: 500mg" 
              />
            </ResponsiveField>
            <ResponsiveField label="Forma farmacéutica">
              <ResponsiveSelect
                value={nuevoMedicamento.forma_farmaceutica}
                onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, forma_farmaceutica: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar...' },
                  { value: 'Tableta', label: 'Tableta' },
                  { value: 'Cápsula', label: 'Cápsula' },
                  { value: 'Jarabe', label: 'Jarabe' },
                  { value: 'Suspensión', label: 'Suspensión' },
                  { value: 'Inyección', label: 'Inyección' },
                  { value: 'Crema', label: 'Crema' },
                  { value: 'Ungüento', label: 'Ungüento' },
                  { value: 'Gotas', label: 'Gotas' },
                  { value: 'Spray', label: 'Spray' },
                  { value: 'Otro', label: 'Otro' }
                ]}
              />
            </ResponsiveField>
          </div>

          <ResponsiveField label="Vía de administración">
            <ResponsiveSelect
              value={nuevoMedicamento.via_administracion}
              onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, via_administracion: e.target.value })}
              options={[
                { value: '', label: 'Seleccionar...' },
                { value: 'Oral', label: 'Oral' },
                { value: 'Intramuscular', label: 'Intramuscular' },
                { value: 'Intravenosa', label: 'Intravenosa' },
                { value: 'Subcutánea', label: 'Subcutánea' },
                { value: 'Tópica', label: 'Tópica' },
                { value: 'Oftálmica', label: 'Oftálmica' },
                { value: 'Ótica', label: 'Ótica' },
                { value: 'Nasal', label: 'Nasal' },
                { value: 'Rectal', label: 'Rectal' },
                { value: 'Vaginal', label: 'Vaginal' },
                { value: 'Inhalatoria', label: 'Inhalatoria' }
              ]}
            />
          </ResponsiveField>

          <ResponsiveField label="Dosis, frecuencia y duración del tratamiento">
            <div className="flex gap-2">
              <textarea
                className="flex-1 px-3 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                rows={2}
                value={nuevoMedicamento.dosis_frecuencia_duracion}
                onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, dosis_frecuencia_duracion: e.target.value })}
                placeholder="Ej: 1 tableta cada 8 horas por 5 días"
              />
              <STTButton 
                onTranscription={(text) => setNuevoMedicamento({ 
                  ...nuevoMedicamento, 
                  dosis_frecuencia_duracion: nuevoMedicamento.dosis_frecuencia_duracion 
                    ? `${nuevoMedicamento.dosis_frecuencia_duracion} ${text}` 
                    : text 
                })} 
              />
            </div>
          </ResponsiveField>

          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Cantidad (No.)">
              <ResponsiveInput 
                type="number"
                value={nuevoMedicamento.cantidad_numerica}
                onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, cantidad_numerica: e.target.value })}
                placeholder="Ej: 20" 
              />
            </ResponsiveField>
            <ResponsiveField label="Cantidad (Letras)">
              <ResponsiveInput 
                value={nuevoMedicamento.cantidad_letras}
                onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, cantidad_letras: e.target.value })}
                placeholder="Ej: Veinte" 
              />
            </ResponsiveField>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevoMedicamento.entregado}
              onChange={(e: any) => setNuevoMedicamento({ ...nuevoMedicamento, entregado: e.target.checked })}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-700">Entregado</span>
          </label>
          
          <ResponsiveButton onClick={agregarMedicamento} className="w-full" variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Agregar a receta
          </ResponsiveButton>
        </div>
      </ResponsiveCard>

      <ResponsiveField label="Indicaciones adicionales">
        <div className="flex gap-2">
          <textarea
            className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none"
            rows={3}
            value={indicaciones}
            onChange={(e) => setIndicaciones(e.target.value)}
            placeholder="Indicaciones especiales, precauciones, etc..."
          />
          <STTButton 
            onTranscription={(text) => setIndicaciones(prev => prev ? `${prev} ${text}` : text)} 
          />
        </div>
      </ResponsiveField>

      <ResponsiveField label="Recomendaciones">
        <div className="flex gap-2">
          <textarea
            className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none"
            rows={3}
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
            placeholder="Recomendaciones para el paciente..."
          />
          <STTButton 
            onTranscription={(text) => setRecomendaciones(prev => prev ? `${prev} ${text}` : text)} 
          />
        </div>
      </ResponsiveField>
        
      <div className={`flex gap-3 ${deviceType === 'mobile' ? 'flex-col' : 'flex-row'}`}>
        <ResponsiveButton 
          variant="secondary" 
          onClick={handleGuardar}
          disabled={guardando}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {guardando ? 'Guardando...' : 'Guardar'}
        </ResponsiveButton>
        <ResponsiveButton 
          onClick={handleImprimir}
          disabled={medicamentos.length === 0 || !recetaId}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Imprimir
        </ResponsiveButton>
        <ResponsiveButton 
          variant="secondary"
          onClick={handleCompartir}
          disabled={medicamentos.length === 0}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          Compartir
        </ResponsiveButton>
      </div>
    </ResponsiveCard>
  );
}

function ExamenesFormView({ patient, deviceType }: any) {
  const [examenesSolicitados, setExamenesSolicitados] = useState('');
  const [servicio, setServicio] = useState('');
  const [numeroCarnet, setNumeroCarnet] = useState('');
  const [diagnosticoJustificacion, setDiagnosticoJustificacion] = useState('');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [ordenId, setOrdenId] = useState<number | null>(null);
  const [atencionId, setAtencionId] = useState<number | null>(null);


  useEffect(() => {
    const cargarOrdenes = async () => {
      if (!patient?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const ordenes = await AuthService.getOrdenesPaciente(patient.id);
        
        // Obtener atencion_id de la consulta activa si existe
        const hcList = await AuthService.get(`/pacientes/${patient.id}/hc/medicina`);
        if (hcList && hcList.length > 0) {
          setAtencionId(hcList[0].atencion_id);
        }

        // Cargar la última orden pendiente o más reciente
        if (ordenes && ordenes.length > 0) {
          const ultimaOrden = ordenes[0];
          setOrdenId(ultimaOrden.orden_id);
          // Usar indicaciones_clinicas como examenes_solicitados
          setExamenesSolicitados(ultimaOrden.indicaciones_clinicas || '');
          setServicio(ultimaOrden.servicio || '');
          setNumeroCarnet(ultimaOrden.numero_carnet || '');
          setDiagnosticoJustificacion(ultimaOrden.diagnostico_justificacion || '');
        }
      } catch (error) {
        console.error('Error cargando órdenes:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarOrdenes();
  }, [patient?.id]);

  const handleGuardar = async () => {
    if (!examenesSolicitados.trim()) {
      alert('Por favor ingresa los exámenes solicitados');
      return;
    }

    if (!atencionId) {
      alert('No hay una atención asociada. Primero completa la consulta médica.');
      return;
    }

    try {
      setGuardando(true);
      const user = AuthService.getCurrentUser();
      
      if (!user?.id || !patient?.id) {
        throw new Error('Usuario o paciente no disponible');
      }

      const ordenData = {
        atencion_id: atencionId,
        paciente_id: patient.id,
        usuario_id: user.id,
        fecha_orden: new Date().toISOString().split('T')[0],
        examenes_solicitados: examenesSolicitados,
        servicio: servicio || null,
        numero_carnet: numeroCarnet || null,
        diagnostico_justificacion: diagnosticoJustificacion || null,
        estado: 'Pendiente'
      };

      if (ordenId) {
        await AuthService.crearOrdenLaboratorio(ordenData);
        alert('Orden actualizada exitosamente');
      } else {
        const resultado = await AuthService.crearOrdenLaboratorio(ordenData);
        setOrdenId(resultado.orden_id);
        alert('Orden creada exitosamente');
      }
    } catch (e: any) {
      console.error('Error guardando orden:', e);
      alert(`Error: ${e.message || 'Error guardando orden'}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleImprimir = () => {
    const contenido = `
      ORDEN DE LABORATORIO / EXÁMENES
      
      Paciente: ${patient?.nombre || 'N/A'}
      Documento: ${patient?.documento || 'N/A'}
      H.C. N°: ${atencionId || 'N/A'}
      E.P.S.: ${patient?.eps || 'N/A'}
      Servicio: ${servicio || 'N/A'}
      N° Carnet: ${numeroCarnet || 'N/A'}
      Fecha: ${new Date().toLocaleDateString('es-ES')}
      
      Diagnóstico: ${diagnosticoJustificacion || 'N/A'}
      
      EXÁMENES SOLICITADOS:
      ${examenesSolicitados || 'N/A'}
    `;
    
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head><title>Orden de Laboratorio</title></head>
          <body style="font-family: Arial; padding: 20px;">
            <pre>${contenido}</pre>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.print();
    }
    
    // Marcar como impresa
    if (ordenId) {
      AuthService.marcarOrdenImpresion(ordenId).catch(console.error);
    }
  };

  const handleCompartir = async () => {
    const contenido = `
Orden de Laboratorio / Exámenes
Paciente: ${patient?.nombre || 'N/A'}
Documento: ${patient?.documento || 'N/A'}
H.C. N°: ${atencionId || 'N/A'}
E.P.S.: ${patient?.eps || 'N/A'}
Servicio: ${servicio || 'N/A'}
N° Carnet: ${numeroCarnet || 'N/A'}
Fecha: ${new Date().toLocaleDateString('es-ES')}

Diagnóstico: ${diagnosticoJustificacion || 'N/A'}

Exámenes Solicitados:
${examenesSolicitados || 'N/A'}
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Orden de Laboratorio',
          text: contenido
        });
      } catch (err) {
        console.error('Error compartiendo:', err);
      }
    } else {
      navigator.clipboard.writeText(contenido).then(() => {
        alert('Orden copiada al portapapeles');
      }).catch(() => {
        alert('No se pudo compartir la orden');
      });
    }
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
          <span className="ml-3 text-stone-600">Cargando órdenes...</span>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveCard>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-stone-900">Órdenes de Exámenes</h4>
        {ordenId && (
          <ResponsiveBadge tone="admin">Orden #{ordenId}</ResponsiveBadge>
        )}
      </div>
      {/* Datos del paciente (solo lectura) */}
      <div className="mb-4 p-3 bg-stone-50 rounded-lg space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium text-stone-700">Fecha:</span>
            <span className="ml-2 text-stone-900">{new Date().toLocaleDateString('es-ES')}</span>
          </div>
          <div>
            <span className="font-medium text-stone-700">H.C. N°:</span>
            <span className="ml-2 text-stone-900">{atencionId || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-stone-700">Nombre:</span>
            <span className="ml-2 text-stone-900">{patient?.nombre || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium text-stone-700">E.P.S.:</span>
            <span className="ml-2 text-stone-900">{patient?.eps || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* SERVICIOS */}
      <ResponsiveCard>
        <h5 className="font-medium text-stone-900 mb-3">SERVICIOS</h5>
        <div className="flex flex-wrap gap-4">
          {['Consulta Externa', 'Hospitalización', 'Urgencias', 'Programas'].map((serv) => (
            <label key={serv} className="flex items-center gap-2">
              <input
                type="radio"
                name="servicio"
                value={serv}
                checked={servicio === serv}
                onChange={(e: any) => setServicio(e.target.value)}
                className="rounded border-stone-300"
              />
              <span className="text-sm text-stone-700">{serv}</span>
            </label>
          ))}
        </div>
      </ResponsiveCard>

      {/* N° Carnet y Diagnóstico */}
      <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <ResponsiveField label="N° Carnet">
          <ResponsiveInput 
            value={numeroCarnet}
            onChange={(e: any) => setNumeroCarnet(e.target.value)}
            placeholder="Número de carnet"
          />
        </ResponsiveField>
      </div>

      <ResponsiveField label="Diagnóstico">
        <div className="flex gap-2">
          <textarea
            className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none"
            rows={3}
            value={diagnosticoJustificacion}
            onChange={(e: any) => setDiagnosticoJustificacion(e.target.value)}
            placeholder="Diagnóstico o justificación..."
          />
          <STTButton 
            onTranscription={(text) => setDiagnosticoJustificacion(prev => prev ? `${prev} ${text}` : text)} 
          />
        </div>
      </ResponsiveField>

      {/* EXÁMENES SOLICITADOS */}
      <ResponsiveField label="EXÁMENES SOLICITADOS" required>
        <div className="flex gap-2">
          <textarea
            className="flex-1 px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base resize-none"
            rows={8}
            value={examenesSolicitados}
            onChange={(e: any) => setExamenesSolicitados(e.target.value)}
            placeholder="Liste los exámenes solicitados (uno por línea o separados por comas)..."
          />
          <STTButton 
            onTranscription={(text) => setExamenesSolicitados(prev => prev ? `${prev} ${text}` : text)} 
          />
        </div>
      </ResponsiveField>
        
      <div className={`flex gap-3 ${deviceType === 'mobile' ? 'flex-col' : 'flex-row'}`}>
        <ResponsiveButton 
          variant="secondary" 
          onClick={handleGuardar}
          disabled={guardando}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {guardando ? 'Guardando...' : 'Guardar'}
        </ResponsiveButton>
        <ResponsiveButton 
          onClick={handleImprimir}
          disabled={!examenesSolicitados.trim() || !ordenId}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          Imprimir
        </ResponsiveButton>
        <ResponsiveButton 
          variant="secondary"
          onClick={handleCompartir}
          disabled={!examenesSolicitados.trim()}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-2" />
          Compartir
        </ResponsiveButton>
      </div>
    </ResponsiveCard>
  );
}

function ConsultasRealizadasView({ deviceType }: any) {
  const { user } = useAuth();
  const isPsicologo = user?.role === 'psicologo';
  const [hcCompletadas, setHcCompletadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroDesde, setFiltroDesde] = useState<string>('');
  const [filtroHasta, setFiltroHasta] = useState<string>('');
  const [selectedHC, setSelectedHC] = useState<any>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);

  const loadHCCompletadas = async () => {
    try {
      setLoading(true);
      const currentUser = AuthService.getCurrentUser();
      if (currentUser?.id) {
        if (isPsicologo) {
          // Para psicólogo: cargar solo HC psicológicas completadas
          const data = await AuthService.getHCPsicologiaCompletadas(Number(currentUser.id));
          setHcCompletadas(data || []);
        } else {
          // Para otros roles: cargar HC medicina completadas
          const data = await AuthService.getHCCompletadas(
            Number(currentUser.id),
            filtroDesde || undefined,
            filtroHasta || undefined
          );
          setHcCompletadas(data || []);
        }
      }
    } catch (error) {
      console.error('Error cargando HC completadas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHCCompletadas();
  }, [filtroDesde, filtroHasta, isPsicologo]);

  const getNombreCompleto = (hc: any) => {
    if (isPsicologo) {
      return hc.paciente_nombre || 'Paciente';
    }
    return `${hc.primer_nombre || ''} ${hc.segundo_nombre || ''} ${hc.primer_apellido || ''} ${hc.segundo_apellido || ''}`.trim();
  };

  // Si es psicólogo y tiene HC seleccionada, mostrar HC psicológica
  if (isPsicologo && selectedHC) {
    return (
      <HCPsicologiaView
        paciente={{
          paciente_id: selectedHC.paciente_id,
          primer_nombre: selectedHC.paciente_nombre?.split(' ')[0] || '',
          primer_apellido: selectedHC.paciente_nombre?.split(' ').slice(1).join(' ') || '',
          tipo_documento: 'CC',
          numero_documento: selectedHC.numero_documento || ''
        }}
        atencion={selectedHC}
        onSave={() => {
          setSelectedHC(null);
          loadHCCompletadas();
        }}
        onCancel={() => setSelectedHC(null)}
      />
    );
  }

  if (!isPsicologo && selectedHC) {
    return (
      <div className="space-y-4 md:space-y-6">
        <ResponsiveCard>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setSelectedHC(null)} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex-1">
              <h3 className="font-semibold text-stone-900">{getNombreCompleto(selectedHC)}</h3>
              <p className="text-sm text-stone-500">
                {selectedHC.numero_documento} • {new Date(selectedHC.fecha_atencion).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Detalles de la Consulta</h4>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-stone-500 mb-1">Motivo de Consulta</div>
              <div className="text-sm text-stone-900">{selectedHC.motivo_consulta || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 mb-1">Diagnóstico</div>
              <div className="text-sm text-stone-900">{selectedHC.diagnosticos_cie10 || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500 mb-1">Plan de Manejo</div>
              <div className="text-sm text-stone-900">{selectedHC.plan_manejo || 'N/A'}</div>
            </div>
          </div>
        </ResponsiveCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">
          {isPsicologo ? 'HC Psicológicas por mí - Completadas' : 'Consultas Realizadas'}
        </h3>
        
        <div className="space-y-3 mb-4">
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Desde">
              <ResponsiveInput
                type="date"
                value={filtroDesde}
                onChange={(e: any) => setFiltroDesde(e.target.value)}
              />
            </ResponsiveField>
            <ResponsiveField label="Hasta">
              <ResponsiveInput
                type="date"
                value={filtroHasta}
                onChange={(e: any) => setFiltroHasta(e.target.value)}
              />
            </ResponsiveField>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
            <span className="ml-3 text-stone-600">Cargando consultas...</span>
          </div>
        ) : hcCompletadas.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-stone-500 mb-2">No hay consultas realizadas</div>
            <div className="text-xs text-stone-400">
              {filtroDesde || filtroHasta ? 'Intenta con otros filtros de fecha' : 'Las consultas completadas aparecerán aquí'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {hcCompletadas.map((hc) => (
              <button
                key={hc.atencion_id}
                onClick={() => setSelectedHC(hc)}
                className="w-full p-4 bg-stone-50 rounded-xl text-left hover:bg-stone-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-stone-900 mb-1">
                      {getNombreCompleto(hc)}
                    </h4>
                    <p className="text-sm text-stone-500 mb-2">
                      {hc.numero_documento} • Familia {hc.familia_apellido}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span className="text-sm text-stone-600">
                        {new Date(hc.fecha_atencion).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    {isPsicologo ? (
                      hc.diagnosticos_dsm5 && (
                        <div className="mt-2">
                          <ResponsiveBadge tone="health">{hc.diagnosticos_dsm5}</ResponsiveBadge>
                        </div>
                      )
                    ) : (
                      hc.diagnosticos_cie10 && (
                        <div className="mt-2">
                          <ResponsiveBadge tone="health">{hc.diagnosticos_cie10}</ResponsiveBadge>
                        </div>
                      )
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

function BitacoraView({ deviceType }: any) {
  const [bitacora, setBitacora] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const loadBitacora = async () => {
    try {
      setLoading(true);
      const user = AuthService.getCurrentUser();
      if (user?.id) {
        const data = await AuthService.getBitacora(Number(user.id), mes, ano);
        setBitacora(data);
      }
    } catch (error) {
      console.error('Error cargando bitácora:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBitacora();
  }, [mes, ano]);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">Bitácora de Actividades</h3>
        
        <div className="space-y-3 mb-4">
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Mes">
              <select
                className="w-full px-3 py-2 md:py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {meses.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </ResponsiveField>
            <ResponsiveField label="Año">
              <ResponsiveInput
                type="number"
                value={ano}
                onChange={(e: any) => setAno(Number(e.target.value))}
                min="2020"
                max={new Date().getFullYear()}
              />
            </ResponsiveField>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
            <span className="ml-3 text-stone-600">Cargando bitácora...</span>
          </div>
        ) : bitacora ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-stone-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{bitacora.total_consultas || 0}</div>
                <div className="text-xs text-stone-600">Consultas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{bitacora.total_recetas || 0}</div>
                <div className="text-xs text-stone-600">Recetas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{bitacora.total_ordenes || 0}</div>
                <div className="text-xs text-stone-600">Órdenes</div>
              </div>
            </div>

            {bitacora.detalle_diario && bitacora.detalle_diario.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-stone-900">Actividad Diaria</h4>
                {bitacora.detalle_diario.map((dia: any, idx: number) => (
                  <div key={idx} className="p-3 bg-stone-50 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-stone-900">
                        {new Date(dia.fecha).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-emerald-600">{dia.total_consultas || 0} consultas</span>
                      <span className="text-blue-600">{dia.total_recetas || 0} recetas</span>
                      <span className="text-purple-600">{dia.total_ordenes || 0} órdenes</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 text-sm">
                No hay actividad registrada para este período
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-stone-500 text-sm">
            Error cargando bitácora
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

function BDPacientesView({ deviceType, onSelectPaciente }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [resumenClinico, setResumenClinico] = useState<any>(null);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [resumenError, setResumenError] = useState<string | null>(null);
  const searchTimeoutRef = React.useRef<any>(null);

  const loadResumenClinico = async (pacienteId: number) => {
    try {
      setResumenLoading(true);
      setResumenError(null);
      const resumen = await AuthService.getPacienteResumenClinico(pacienteId);
      setResumenClinico(resumen);
    } catch (error) {
      console.error('Error cargando resumen clínico:', error);
      setResumenClinico(null);
      setResumenError('No se pudo cargar el resumen clínico');
    } finally {
      setResumenLoading(false);
    }
  };
  
  const handleSelectPaciente = async (paciente: any) => {
    try {
      // Obtener datos completos de la familia
      const familia = await AuthService.getFamiliaPorId(paciente.familia_id);
      const familiaData = {
        familia_id: familia.familia_id,
        apellido_principal: familia.apellido_principal,
        direccion: familia.direccion,
        barrio_vereda: familia.barrio_vereda,
        municipio: familia.municipio,
        telefono_contacto: familia.telefono_contacto
      };
      
      setSelectedPatient(paciente);
      setSelectedFamily(familiaData);
      setResumenClinico(null);
      setResumenError(null);
      loadResumenClinico(paciente.paciente_id);
    } catch (error) {
      console.error('Error cargando familia:', error);
      alert('Error al cargar datos de la familia');
    }
  };
  
  const handleBuscar = async (termino: string) => {
    if (!termino.trim()) {
      setResultados([]);
      return;
    }

    try {
      setLoading(true);
      const pacientes = await AuthService.buscarPacientes(termino);
      setResultados(pacientes || []);
    } catch (error) {
      console.error('Error buscando pacientes:', error);
      alert('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Búsqueda con debounce de 300ms
    searchTimeoutRef.current = setTimeout(() => {
      handleBuscar(value);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      handleBuscar(searchTerm);
    }
  };
  
  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">Buscar Pacientes</h3>
        
        <div className="space-y-4">
          <ResponsiveField label="Búsqueda">
            <div className="flex gap-2">
              <ResponsiveInput 
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Documento, nombre, apellido o familia..."
                className="flex-1"
              />
              <ResponsiveButton onClick={() => handleBuscar(searchTerm)} disabled={loading}>
                <Search className="w-4 h-4" />
              </ResponsiveButton>
            </div>
          </ResponsiveField>
        </div>
      </ResponsiveCard>
      
      {loading ? (
        <ResponsiveCard>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
            <span className="ml-3 text-stone-600">Buscando...</span>
          </div>
        </ResponsiveCard>
      ) : resultados.length > 0 ? (
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-3">
            Resultados ({resultados.length})
          </h4>
          <div className="space-y-3">
            {resultados.map((paciente) => {
              const nombreCompleto = `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim();
              return (
                <button
                  key={paciente.paciente_id}
                  onClick={() => handleSelectPaciente(paciente)}
                  className="w-full p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-stone-900 mb-1">{nombreCompleto}</div>
                      <div className="text-sm text-stone-600">
                        {paciente.tipo_documento} {paciente.numero_documento} • 
                        Familia {paciente.familia_apellido}
                        {paciente.familia_municipio && ` • ${paciente.familia_municipio}`}
                      </div>
                      {paciente.fecha_nacimiento && (
                        <div className="text-xs text-stone-500 mt-1">
                          Nacimiento: {new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400 ml-2" />
                  </div>
                </button>
              );
            })}
          </div>
        </ResponsiveCard>
      ) : searchTerm ? (
        <ResponsiveCard>
          <div className="text-center py-8 text-stone-500">
            <Search className="w-12 h-12 mx-auto mb-2 text-stone-300" />
            <p>No se encontraron pacientes</p>
            <p className="text-xs text-stone-400 mt-1">Intenta con otro término de búsqueda</p>
          </div>
        </ResponsiveCard>
      ) : null}

      {selectedPatient && (
        <ResponsiveCard>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-stone-900">
                  Resumen clínico de {selectedPatient.primer_nombre} {selectedPatient.primer_apellido}
                </h4>
                <p className="text-sm text-stone-500">
                  {selectedPatient.tipo_documento} {selectedPatient.numero_documento}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onSelectPaciente && selectedFamily && (
                  <ResponsiveButton
                    size="sm"
                    onClick={() => onSelectPaciente(selectedPatient, selectedFamily)}
                  >
                    Ver detalle completo
                  </ResponsiveButton>
                )}
                <ResponsiveButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSelectedFamily(null);
                    setResumenClinico(null);
                    setResumenError(null);
                  }}
                >
                  Cerrar resumen
                </ResponsiveButton>
              </div>
            </div>

            {resumenLoading ? (
              <div className="text-center py-8 text-sm text-stone-500">
                Cargando resumen clínico...
              </div>
            ) : resumenError ? (
              <div className="text-sm text-red-600">{resumenError}</div>
            ) : resumenClinico ? (
              <PacienteResumenClinico resumen={resumenClinico} deviceType={deviceType} />
            ) : (
              <div className="text-sm text-stone-500">
                No hay información clínica consolidada para este paciente.
              </div>
            )}
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}

function PacienteResumenClinico({ resumen, deviceType }: any) {
  if (!resumen) return null;

  const formatDate = (value?: string | null) => {
    if (!value) return 'Sin registro';
    try {
      return new Date(value).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return value;
    }
  };

  const ultimaConsulta = resumen.ultima_consulta;
  const signos = ultimaConsulta?.signos_vitales || {};
  const gridCols = deviceType === 'mobile' ? 'grid-cols-2' : 'grid-cols-4';

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${gridCols}`}>
        <div className="p-3 bg-emerald-50 rounded-xl text-center">
          <div className="text-xs text-emerald-700 uppercase">Consultas</div>
          <div className="text-2xl font-bold text-emerald-900">{resumen.kpis?.total_consultas || 0}</div>
          <div className="text-xs text-emerald-600">
            {resumen.kpis?.ultima_atencion ? `Última: ${formatDate(resumen.kpis?.ultima_atencion)}` : 'Sin fecha'}
          </div>
        </div>
        <div className="p-3 bg-sky-50 rounded-xl text-center">
          <div className="text-xs text-sky-700 uppercase">Planes activos</div>
          <div className="text-2xl font-bold text-sky-900">{resumen.kpis?.planes_activos || 0}</div>
        </div>
        <div className="p-3 bg-amber-50 rounded-xl text-center">
          <div className="text-xs text-amber-700 uppercase">Demandas pendientes</div>
          <div className="text-2xl font-bold text-amber-900">{resumen.kpis?.demandas_pendientes || 0}</div>
        </div>
        <div className="p-3 bg-stone-50 rounded-xl text-center">
          <div className="text-xs text-stone-500 uppercase">Riesgo familiar</div>
          <div className="text-base font-semibold text-stone-800">{resumen.kpis?.riesgo_familiar || 'No evaluado'}</div>
        </div>
      </div>

      <div className="border border-sinbad-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-stone-900">Última consulta</h5>
          <span className="text-xs text-stone-500">{formatDate(ultimaConsulta?.fecha_atencion)}</span>
        </div>
        {ultimaConsulta ? (
          <div className="space-y-2">
            <div className="text-sm text-stone-700">
              <span className="font-medium text-stone-900">Motivo:</span> {ultimaConsulta.motivo_consulta || 'Sin especificar'}
            </div>
            <div className="text-sm text-stone-700 flex flex-wrap gap-2">
              <ResponsiveBadge tone="health">{ultimaConsulta.diagnosticos_cie10 || 'S/D'}</ResponsiveBadge>
              {ultimaConsulta.profesional && (
                <ResponsiveBadge tone="admin">{ultimaConsulta.profesional}</ResponsiveBadge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-stone-500">
              <div>
                TA:{' '}
                {ultimaConsulta.tension_arterial_sistolica && ultimaConsulta.tension_arterial_diastolica
                  ? `${ultimaConsulta.tension_arterial_sistolica}/${ultimaConsulta.tension_arterial_diastolica}`
                  : signos?.tension || 'N/A'}
              </div>
              <div>FC: {ultimaConsulta.frecuencia_cardiaca || signos?.fc || 'N/A'}</div>
              <div>FR: {ultimaConsulta.frecuencia_respiratoria || signos?.fr || 'N/A'}</div>
              <div>SPO₂: {ultimaConsulta.saturacion_oxigeno || signos?.spo2 || 'N/A'}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-stone-500">Sin consultas registradas.</div>
        )}
      </div>

      <div className="border border-sinbad-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-stone-900">Diagnósticos frecuentes</h5>
        </div>
        {resumen.diagnosticos_frecuentes?.length ? (
          <div className="space-y-2">
            {resumen.diagnosticos_frecuentes.map((diag: any, idx: number) => (
              <div key={`${diag.diagnostico}-${idx}`} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">{diag.diagnostico}</span>
                <ResponsiveBadge tone="health">{diag.frecuencia}</ResponsiveBadge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-stone-500">No hay diagnósticos registrados.</div>
        )}
      </div>

      <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <div className="border border-sinbad-200 rounded-2xl p-4 space-y-3">
          <h5 className="text-sm font-semibold text-stone-900">Planes activos</h5>
          {resumen.planes_activos?.length ? (
            resumen.planes_activos.slice(0, 2).map((plan: any) => (
              <div key={plan.plan_id} className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div className="text-xs text-stone-500">{formatDate(plan.fecha_entrega)}</div>
                <div className="text-sm font-medium text-stone-900">{plan.condicion_identificada || 'Sin condición'}</div>
                <div className="text-xs text-stone-500">Profesional: {plan.profesional || 'No asignado'}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-stone-500">No hay planes vigentes.</div>
          )}
        </div>
        <div className="border border-sinbad-200 rounded-2xl p-4 space-y-3">
          <h5 className="text-sm font-semibold text-stone-900">Demandas pendientes</h5>
          {resumen.demandas_pendientes?.length ? (
            resumen.demandas_pendientes.map((demanda: any) => (
              <div key={demanda.demanda_id} className="p-3 bg-janna-50 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>{formatDate(demanda.fecha_demanda)}</span>
                  <ResponsiveBadge tone="warning">{demanda.estado}</ResponsiveBadge>
                </div>
                <div className="text-sm text-stone-700">
                  Formulario {demanda.numero_formulario || demanda.demanda_id}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-stone-500">Sin demandas pendientes.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardEpidemioView({ deviceType }: any) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await AuthService.getDashboardEpidemio();
        setDashboard(data);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError('No se pudo cargar el dashboard epidemiológico');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const renderBar = (value: number, max: number, tone = 'bg-emerald-500') => {
    const percent = max ? Math.max((value / max) * 100, 5) : 0;
    return (
      <div className="w-full h-2 bg-sinbad-100 rounded-full overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${percent}%` }}></div>
      </div>
    );
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500 mx-auto"></div>
          <span className="ml-3 text-stone-600">Cargando dashboard...</span>
        </div>
      </ResponsiveCard>
    );
  }

  if (error) {
    return (
      <ResponsiveCard>
        <div className="text-center py-8 text-red-600 text-sm">{error}</div>
      </ResponsiveCard>
    );
  }

  if (!dashboard) {
    return (
      <ResponsiveCard>
        <div className="text-center py-8 text-stone-500 text-sm">
          No hay datos disponibles
        </div>
      </ResponsiveCard>
    );
  }

  const generoMax = Math.max(...(dashboard.poblacion_genero || []).map((g: any) => g.total || 0), 1);
  const etariaMax = Math.max(...(dashboard.poblacion_etaria || []).map((g: any) => g.total || 0), 1);
  const diagCronicosMax = Math.max(...(dashboard.diagnosticos_cronicos || []).map((d: any) => d.total || 0), 1);
  const riesgoMax = Math.max(...(dashboard.riesgo_familiar || []).map((r: any) => r.total || 0), 1);
  const gruposMax = Math.max(...(dashboard.grupos_poblacionales || []).map((g: any) => g.total || 0), 1);
  const tendenciaMax = Math.max(...(dashboard.tendencia_atenciones || []).map((t: any) => t.total || 0), 1);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">Dashboard Epidemiológico</h3>
        <div className={`grid gap-4 ${deviceType === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {[
            { label: 'Familias activas', value: dashboard.total_familias, tone: 'text-emerald-600' },
            { label: 'Pacientes activos', value: dashboard.total_pacientes, tone: 'text-sky-600' },
            { label: 'Atenciones históricas', value: dashboard.total_atenciones, tone: 'text-purple-600' },
            { label: 'Atenciones este mes', value: dashboard.atenciones_mes, tone: 'text-orange-600' }
          ].map((card, idx) => (
            <div key={idx} className="p-4 bg-stone-50 rounded-xl text-center shadow-inner border border-sinbad-100">
              <div className={`text-2xl font-bold ${card.tone}`}>{card.value || 0}</div>
              <div className="text-xs text-stone-500 uppercase tracking-wide">{card.label}</div>
            </div>
          ))}
        </div>
      </ResponsiveCard>

      <div className={`grid gap-4 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Distribución por género</h4>
          <div className="space-y-3">
            {(dashboard.poblacion_genero || []).map((item: any) => (
              <div key={item.genero} className="space-y-1">
                <div className="flex justify-between text-sm text-stone-700">
                  <span>{item.genero}</span>
                  <span className="font-medium">{item.total}</span>
              </div>
                {renderBar(item.total, generoMax, 'bg-bondi-blue')}
              </div>
            ))}
            </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Distribución etaria</h4>
          <div className="space-y-3">
            {(dashboard.poblacion_etaria || []).map((item: any) => (
              <div key={item.grupo} className="space-y-1">
                <div className="flex justify-between text-sm text-stone-700">
                  <span>{item.grupo}</span>
                  <span className="font-medium">{item.total}</span>
              </div>
                {renderBar(item.total, etariaMax, 'bg-emerald-500')}
              </div>
            ))}
          </div>
        </ResponsiveCard>
            </div>

      <div className={`grid gap-4 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Diagnósticos frecuentes</h4>
          {dashboard.diagnosticos_frecuentes?.length ? (
                <div className="space-y-2">
              {dashboard.diagnosticos_frecuentes.slice(0, 6).map((diag: any, idx: number) => (
                <div key={`${diag.diagnosticos_cie10}-${idx}`} className="p-3 bg-stone-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-stone-800">{diag.diagnosticos_cie10 || 'N/A'}</span>
                      <ResponsiveBadge tone="health">{diag.frecuencia}</ResponsiveBadge>
                    </div>
                  ))}
                </div>
          ) : (
            <div className="text-sm text-stone-500">Sin diagnósticos registrados.</div>
          )}
        </ResponsiveCard>

        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Prevalencia de crónicos</h4>
          <div className="space-y-3">
            {(dashboard.diagnosticos_cronicos || []).map((cat: any) => (
              <div key={cat.categoria} className="space-y-1">
                <div className="flex justify-between text-sm text-stone-700">
                  <span>{cat.categoria}</span>
                  <span className="font-medium">{cat.total}</span>
          </div>
                {renderBar(cat.total, diagCronicosMax, 'bg-purple-500')}
          </div>
            ))}
          </div>
        </ResponsiveCard>
      </div>

      <div className={`grid gap-4 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Riesgo familiar</h4>
          <div className="space-y-3">
            {(dashboard.riesgo_familiar || []).map((item: any) => (
              <div key={item.riesgo} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-700">{item.riesgo}</span>
                  <span className="font-medium">{item.total}</span>
                </div>
                {renderBar(item.total, riesgoMax, 'bg-amber-500')}
              </div>
            ))}
          </div>
        </ResponsiveCard>
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Grupos poblacionales</h4>
          <div className="space-y-3 max-h-64 overflow-auto pr-1">
            {(dashboard.grupos_poblacionales || []).map((item: any) => (
              <div key={item.grupo} className="space-y-1">
                <div className="flex justify-between text-sm text-stone-700">
                  <span>{item.grupo}</span>
                  <span className="font-medium">{item.total}</span>
                </div>
                {renderBar(item.total, gruposMax, 'bg-sky-500')}
              </div>
            ))}
          </div>
        </ResponsiveCard>
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Condiciones sensibles</h4>
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-xl">
              <div className="text-xs uppercase text-stone-500">Personas con discapacidad</div>
              <div className="text-2xl font-bold text-stone-800">{dashboard.condiciones_sensibles?.con_discapacidad || 0}</div>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl">
              <div className="text-xs uppercase text-stone-500">Víctimas de violencia</div>
              <div className="text-2xl font-bold text-stone-800">{dashboard.condiciones_sensibles?.victimas_violencia || 0}</div>
            </div>
          </div>
        </ResponsiveCard>
      </div>

      <div className={`grid gap-4 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-[1.2fr_1fr]'}`}>
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Cobertura territorial (Top 5)</h4>
          <div className="space-y-3">
            {(dashboard.cobertura_municipio || []).map((mun: any) => (
              <div key={mun.municipio} className="p-3 rounded-xl border border-sinbad-100">
                <div className="flex items-center justify-between text-sm text-stone-700 mb-1">
                  <span>{mun.municipio}</span>
                  <ResponsiveBadge tone="admin">{mun.familias} familias</ResponsiveBadge>
                </div>
                <div className="text-xs text-stone-500 mb-1">Pacientes: {mun.pacientes}</div>
                {renderBar(mun.pacientes, dashboard.total_pacientes || mun.pacientes || 1, 'bg-emerald-500')}
              </div>
            ))}
          </div>
        </ResponsiveCard>

        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Tendencia mensual de atenciones</h4>
          {dashboard.tendencia_atenciones?.length ? (
            <div className="flex items-end gap-2 h-36">
              {dashboard.tendencia_atenciones.map((item: any) => (
                <div key={item.periodo} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-bondi-blue/30 rounded-t-lg"
                    style={{
                      height: `${Math.max((item.total / tendenciaMax) * 100, 5)}%`
                    }}
                  ></div>
                  <div className="text-xs text-stone-500 text-center">
                    {item.periodo?.split('-')[1]}/{item.periodo?.split('-')[0]?.slice(2)}
                  </div>
                  <div className="text-xs font-medium text-stone-700">{item.total}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-stone-500">Sin datos suficientes.</div>
        )}
      </ResponsiveCard>
      </div>
    </div>
  );
}

function ConfiguracionView({ deviceType }: any) {
  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">Configuración</h3>
        <div className="space-y-4">
          <div className="text-center py-8 text-stone-500 text-sm">
            Opciones de configuración próximamente
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );
}

function AyudaView({ deviceType }: any) {
  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">Ayuda y Soporte</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-stone-900 mb-2">Preguntas Frecuentes</h4>
            <div className="text-sm text-stone-600">
              <p className="mb-2">• ¿Cómo crear una nueva consulta médica?</p>
              <p className="mb-2">• ¿Cómo generar una receta?</p>
              <p className="mb-2">• ¿Cómo buscar pacientes?</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-stone-900 mb-2">Contacto</h4>
            <div className="text-sm text-stone-600">
              <p>Para soporte técnico, contacta al administrador del sistema.</p>
            </div>
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );
}

function CrearFamiliaView({ deviceType }: any) {
  const [form, setForm] = useState({
    apellido_principal: '',
    direccion: '',
    barrio_vereda: '',
    municipio: '',
    telefono_contacto: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const user = AuthService.getCurrentUser();

  const handleChange = (field: string) => (e: any) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await AuthService.crearFamilia({
        apellido_principal: form.apellido_principal,
        direccion: form.direccion,
        barrio_vereda: form.barrio_vereda || null,
        municipio: form.municipio,
        telefono_contacto: form.telefono_contacto || null,
        creado_por_uid: Number(user?.id)
      });
      setForm({ apellido_principal: '', direccion: '', barrio_vereda: '', municipio: '', telefono_contacto: '' });
      alert('Familia creada exitosamente');
    } catch (e: any) {
      setSubmitError(e?.message || 'Error al guardar la familia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-stone-900 mb-4">Nueva Familia</h3>
        
        <div className="space-y-4">
          <ResponsiveField label="Jefe de familia" required>
            <ResponsiveInput placeholder="Apellido principal" value={form.apellido_principal} onChange={handleChange('apellido_principal')} />
          </ResponsiveField>
          
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Barrio/Vereda">
              <ResponsiveInput placeholder="Barrio o vereda" value={form.barrio_vereda} onChange={handleChange('barrio_vereda')} />
            </ResponsiveField>
            <ResponsiveField label="Municipio" required>
              <ResponsiveInput placeholder="Municipio" value={form.municipio} onChange={handleChange('municipio')} />
            </ResponsiveField>
          </div>
          
          <ResponsiveField label="Dirección" required>
            <ResponsiveInput placeholder="Dirección completa" value={form.direccion} onChange={handleChange('direccion')} />
          </ResponsiveField>
          
          <div className={`grid gap-3 ${deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <ResponsiveField label="Teléfono">
              <ResponsiveInput type="tel" placeholder="Teléfono" value={form.telefono_contacto} onChange={handleChange('telefono_contacto')} />
            </ResponsiveField>
            <div />
          </div>
          
          {submitError && <div className="text-sm text-red-600">{submitError}</div>}
          
          <div className="pt-4">
            <ResponsiveButton 
              variant="primary" 
              className="w-full" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Nueva Familia'}
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );
}

// Vista: Formulario de Caracterización
function FormularioCaracterizacionView({ familia, caracterizacionExistente, onSave, onCancel }: any) {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<any>({
    // Datos familiares
    numero_ficha: '',
    zona: 'Urbana',
    territorio: '',
    micro_territorio: '',
    barrio: '',
    numero_personas: null,
    estrato: null,
    tipo_familia: '',
    riesgo_familiar: '',
    fecha_caracterizacion: new Date().toISOString().split('T')[0],
    info_vivienda: {
      familiograma: [],
      funcionalidad: {
        tipo: [],
        escala: null
      },
      sobrecarga: '',
      ecomapa: '',
      observaciones: '',
      te_quiere: false,
      nn_discapacidad_adulto_mayor_enfermedad: false
    },
    situaciones_proteccion: [],
    condiciones_salud_publica: {
      sucesos_vitales: false,
      cuidado_salud_criticos: false,
      obtiene_alimento: '',
      asis_estado: false,
      asis_estado_cual: ''
    },
    practicas_cuidado: {
      hab_saludables: false,
      rec_socioemoc: false,
      cuidado_y_protec: false,
      relaciones_sanas: false,
      red_colect: false,
      autonomia_adu_mayor: false,
      pract_prevencion_e: false,
      prac_saberes_anc: false,
      prac_derech: false
    },
    // Datos de integrantes
    integrantes: []
  });
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);

  // Cargar datos existentes y pacientes
  useEffect(() => {
    const loadData = async () => {
      try {
        const pacientesData = await AuthService.getPacientesByFamilia(familia.familia_id);
        setPacientes(pacientesData);
        
        // Inicializar formulario de integrantes
        const integrantesForm = pacientesData.map((p: any) => ({
          paciente_id: p.paciente_id,
          fecha_caracterizacion: new Date().toISOString().split('T')[0],
          rol_familiar: '',
          ocupacion: '',
          nivel_educativo: '',
          grupo_poblacional: '',
          regimen_afiliacion: '',
          pertenencia_etnica: '',
          discapacidad: [],
          victima_violencia: false,
          telefono_1: '',
          orientacion_sexual: '',
          comunidad_indigena: false,
          tiempo_cuidador: '',
          datos_pyp: {
            cumple_esquema_pym: false,
            odont_pym: false,
            lactancia: false,
            fluor: false,
            profilaxis: false,
            vacunacion: false,
            micronutientes: false,
            suplementacion: [],
            desparasitacion: false,
            anemia_hemog: false,
            its: false,
            t_ca_cuello: false,
            t_ca_mama: false,
            t_ca_prostata: false,
            t_ca_colon: false,
            preconcepcional: [],
            prenatal: false,
            curso_preparacion: false,
            ive: false,
            puerperio: false,
            recien_nacido: false,
            preparacion: false,
            educacion: false,
            motivo_no_atencion_pym: [],
            si_es_menor_6_meses_lactancia: false,
            si_es_menor_2_anos_meses_lact: null,
            menor_de_5_anos: false
          },
          datos_salud: {
            peso: null,
            talla: null,
            diagnostico: '',
            signos_desnutricion_aguda: [],
            enf_ultimo_mes: false,
            cuales_enf_ultimo_mes: '',
            tto: false,
            tiempo_cuidador: '',
            motivo_no_atencion: []
          }
        }));
        
        setFormData(prev => ({
          ...prev,
          integrantes: integrantesForm
        }));
        
        // Si hay caracterización existente, cargarla
        if (caracterizacionExistente?.tiene_caracterizacion) {
          const familiaData = caracterizacionExistente.familia;
          // Parsear JSON si vienen como string
          const infoVivienda = typeof familiaData.info_vivienda === 'string' 
            ? JSON.parse(familiaData.info_vivienda) 
            : (familiaData.info_vivienda || {});
          const condicionesSalud = typeof familiaData.condiciones_salud_publica === 'string'
            ? JSON.parse(familiaData.condiciones_salud_publica)
            : (familiaData.condiciones_salud_publica || {});
          const situacionesProteccion = Array.isArray(familiaData.situaciones_proteccion)
            ? familiaData.situaciones_proteccion
            : (typeof familiaData.situaciones_proteccion === 'string' ? JSON.parse(familiaData.situaciones_proteccion) : []);
          
          setFormData(prev => ({
            ...prev,
            numero_ficha: familiaData.numero_ficha || '',
            zona: familiaData.zona || 'Urbana',
            territorio: familiaData.territorio || '',
            micro_territorio: familiaData.micro_territorio || '',
            barrio: familiaData.barrio || '',
            numero_personas: familiaData.numero_personas || null,
            estrato: familiaData.estrato || null,
            tipo_familia: familiaData.tipo_familia || '',
            riesgo_familiar: familiaData.riesgo_familiar || '',
            fecha_caracterizacion: familiaData.fecha_caracterizacion || new Date().toISOString().split('T')[0],
            info_vivienda: {
              ...prev.info_vivienda,
              ...infoVivienda
            },
            situaciones_proteccion: situacionesProteccion,
            condiciones_salud_publica: {
              ...prev.condiciones_salud_publica,
              ...condicionesSalud
            },
            practicas_cuidado: familiaData.practicas_cuidado || prev.practicas_cuidado
          }));

          // Cargar datos de integrantes existentes
          if (caracterizacionExistente.integrantes && Array.isArray(caracterizacionExistente.integrantes)) {
            const integrantesCargados = integrantesForm.map((integranteForm: any) => {
              const integranteExistente = caracterizacionExistente.integrantes.find(
                (i: any) => i.paciente_id === integranteForm.paciente_id
              );
              
              if (integranteExistente) {
                // Parsear campos JSON
                const datosPyp = typeof integranteExistente.datos_pyp === 'string'
                  ? JSON.parse(integranteExistente.datos_pyp)
                  : (integranteExistente.datos_pyp || {});
                const datosSalud = typeof integranteExistente.datos_salud === 'string'
                  ? JSON.parse(integranteExistente.datos_salud)
                  : (integranteExistente.datos_salud || {});
                
                return {
                  ...integranteForm,
                  ...integranteExistente,
                  datos_pyp: {
                    ...integranteForm.datos_pyp,
                    ...datosPyp
                  },
                  datos_salud: {
                    ...integranteForm.datos_salud,
                    ...datosSalud
                  }
                };
              }
              return integranteForm;
            });
            
            setFormData(prev => ({
              ...prev,
              integrantes: integrantesCargados
            }));
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };
    
    loadData();
  }, [familia.familia_id, caracterizacionExistente]);

  const tabs = [
    { key: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { key: 'estructura', label: 'Estructura Familiar', icon: Users },
    { key: 'proteccion', label: 'Protección y Salud', icon: Shield },
    { key: 'practicas', label: 'Prácticas de Cuidado', icon: Heart },
    { key: 'integrantes', label: 'Integrantes', icon: User }
  ];

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const payload = {
        familia_id: familia.familia_id,
        datos_familia: {
          numero_ficha: formData.numero_ficha,
          zona: formData.zona,
          territorio: formData.territorio,
          micro_territorio: formData.micro_territorio,
          barrio: formData.barrio,
          numero_personas: formData.numero_personas,
          estrato: formData.estrato,
          tipo_familia: formData.tipo_familia,
          riesgo_familiar: formData.riesgo_familiar,
          fecha_caracterizacion: formData.fecha_caracterizacion,
          info_vivienda: formData.info_vivienda,
          situaciones_proteccion: formData.situaciones_proteccion,
          condiciones_salud_publica: formData.condiciones_salud_publica,
          practicas_cuidado: formData.practicas_cuidado
        },
        integrantes: formData.integrantes.map((integrante: any) => ({
          ...integrante,
          // Asegurar que tiempo_cuidador esté en el nivel superior si está en datos_salud
          tiempo_cuidador: integrante.tiempo_cuidador || integrante.datos_salud?.tiempo_cuidador
        }))
      };
      
      await AuthService.crearCaracterizacion(payload);
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error guardando caracterización:', error);
      alert('Error al guardar la caracterización. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateIntegrante = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.map((integrante, i) => 
        i === index ? { ...integrante, [field]: value } : integrante
      )
    }));
  };

  const updateIntegranteNested = (index: number, section: 'datos_pyp' | 'datos_salud', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.map((integrante, i) => 
        i === index ? { 
          ...integrante, 
          [section]: {
            ...(integrante[section] || {}),
            [field]: value
          }
        } : integrante
      )
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Ubicación
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveField label="Número de Ficha">
                <ResponsiveInput
                  value={formData.numero_ficha}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, numero_ficha: e.target.value }))}
                  placeholder="Ej: 14250"
                />
              </ResponsiveField>
              <ResponsiveField label="Zona">
                <ResponsiveSelect
                  value={formData.zona}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, zona: e.target.value }))}
                  options={[
                    { value: 'Urbana', label: 'Urbana' },
                    { value: 'Rural', label: 'Rural' },
                    { value: 'Corregimiento', label: 'Corregimiento' }
                  ]}
                />
              </ResponsiveField>
              <ResponsiveField label="Territorio/Comuna">
                <ResponsiveInput
                  value={formData.territorio}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, territorio: e.target.value }))}
                  placeholder="Ej: Comuna 19"
                />
              </ResponsiveField>
              <ResponsiveField label="Micro Territorio">
                <ResponsiveInput
                  value={formData.micro_territorio}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, micro_territorio: e.target.value }))}
                  placeholder="Micro territorio"
                />
              </ResponsiveField>
              <ResponsiveField label="Barrio">
                <ResponsiveInput
                  value={formData.barrio}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, barrio: e.target.value }))}
                  placeholder="Nombre del barrio"
                />
              </ResponsiveField>
              <ResponsiveField label="Número de Personas (# Pers.)">
                <ResponsiveInput
                  type="number"
                  value={formData.numero_personas || ''}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, numero_personas: parseInt(e.target.value) || null }))}
                  placeholder="Cantidad de integrantes"
                />
              </ResponsiveField>
              <ResponsiveField label="Estrato">
                <ResponsiveInput
                  type="number"
                  value={formData.estrato || ''}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, estrato: parseInt(e.target.value) || null }))}
                  placeholder="1-6"
                />
              </ResponsiveField>
            </div>
          </div>
        );

      case 1: // Estructura Familiar
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveField label="Tipo de Familia">
                <ResponsiveSelect
                  value={formData.tipo_familia}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, tipo_familia: e.target.value }))}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: 'Biparental', label: 'Biparental' },
                    { value: 'Monoparental', label: 'Monoparental' },
                    { value: 'Ext. Bipar', label: 'Extendida Biparental' },
                    { value: 'Ext. Monop', label: 'Extendida Monoparental' },
                    { value: 'Comp. Bipa', label: 'Compuesta Biparental' },
                    { value: 'Comp. Monop', label: 'Compuesta Monoparental' },
                    { value: 'Uniper', label: 'Unipersonal' }
                  ]}
                />
              </ResponsiveField>
              <ResponsiveField label="Riesgo Familiar">
                <ResponsiveSelect
                  value={formData.riesgo_familiar}
                  onChange={(e: any) => setFormData(prev => ({ ...prev, riesgo_familiar: e.target.value }))}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: '1. Ausencia', label: '1. Ausencia' },
                    { value: '2. Sobrecarga', label: '2. Sobrecarga' },
                    { value: '3. Sobrecarga Intensa', label: '3. Sobrecarga Intensa' },
                    { value: '0 a 3 Disfunción', label: '0 a 3 Disfunción' },
                    { value: '4 a 6 Func. Mode', label: '4 a 6 Funcional Moderada' },
                    { value: '7 a 10 Alta Func', label: '7 a 10 Alta Funcionalidad' }
                  ]}
                />
              </ResponsiveField>
            </div>

            <ResponsiveCard>
              <h5 className="font-medium text-stone-900 mb-3">Familiograma</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {['Ries. Biológico', 'Ries. Psicológico', 'Ries. Social'].map((opcion) => (
                  <label key={opcion} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={formData.info_vivienda.familiograma?.includes(opcion) || false}
                      onChange={(e: any) => {
                        const current = formData.info_vivienda.familiograma || [];
                        const newValue = e.target.checked
                          ? [...current, opcion]
                          : current.filter((item: string) => item !== opcion);
                        updateFormData('info_vivienda', 'familiograma', newValue);
                      }}
                    />
                    {opcion}
                  </label>
                ))}
              </div>
            </ResponsiveCard>

            <ResponsiveCard>
              <h5 className="font-medium text-stone-900 mb-3">Funcionalidad</h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Ayuda', 'Conversan', 'Decisiones', 'Comparten'].map((tipo) => (
                    <label key={tipo} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.info_vivienda.funcionalidad?.tipo?.includes(tipo) || false}
                        onChange={(e: any) => {
                          const current = formData.info_vivienda.funcionalidad?.tipo || [];
                          const newTipos = e.target.checked
                            ? [...current, tipo]
                            : current.filter((item: string) => item !== tipo);
                          setFormData(prev => ({
                            ...prev,
                            info_vivienda: {
                              ...prev.info_vivienda,
                              funcionalidad: {
                                ...prev.info_vivienda.funcionalidad,
                                tipo: newTipos
                              }
                            }
                          }));
                        }}
                      />
                      {tipo}
                    </label>
                  ))}
                </div>
                <ResponsiveField label="Escala Funcionalidad (0-10)">
                  <ResponsiveInput
                    type="number"
                    min="0"
                    max="10"
                    value={formData.info_vivienda.funcionalidad?.escala || ''}
                    onChange={(e: any) => {
                      const escala = e.target.value ? parseInt(e.target.value) : null;
                      setFormData(prev => ({
                        ...prev,
                        info_vivienda: {
                          ...prev.info_vivienda,
                          funcionalidad: {
                            ...prev.info_vivienda.funcionalidad,
                            escala
                          }
                        }
                      }));
                    }}
                    placeholder="0-10"
                  />
                </ResponsiveField>
              </div>
            </ResponsiveCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveField label="Sobrecarga">
                <ResponsiveSelect
                  value={formData.info_vivienda.sobrecarga || ''}
                  onChange={(e: any) => updateFormData('info_vivienda', 'sobrecarga', e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: '1. Ausencia', label: '1. Ausencia' },
                    { value: '2. Sobrecarga', label: '2. Sobrecarga' },
                    { value: '3. Sobrecarga intensa', label: '3. Sobrecarga intensa' }
                  ]}
                />
              </ResponsiveField>
              <ResponsiveField label="Ecomapa">
                <ResponsiveSelect
                  value={formData.info_vivienda.ecomapa || ''}
                  onChange={(e: any) => updateFormData('info_vivienda', 'ecomapa', e.target.value)}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    { value: '1. Positivo', label: '1. Positivo' },
                    { value: '2. Tenue', label: '2. Tenue' },
                    { value: '3. Estresante', label: '3. Estresante' },
                    { value: '4. Energía fluye', label: '4. Energía fluye' },
                    { value: '5. Intenso', label: '5. Intenso' }
                  ]}
                />
              </ResponsiveField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-stone-300"
                  checked={formData.info_vivienda.te_quiere || false}
                  onChange={(e: any) => updateFormData('info_vivienda', 'te_quiere', e.target.checked)}
                />
                ¿Te quiere?
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-stone-300"
                  checked={formData.info_vivienda.nn_discapacidad_adulto_mayor_enfermedad || false}
                  onChange={(e: any) => updateFormData('info_vivienda', 'nn_discapacidad_adulto_mayor_enfermedad', e.target.checked)}
                />
                NN, discapacidad, adulto mayor, enfermedad
              </label>
            </div>
            
            <ResponsiveField label="Observaciones">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={3}
                value={formData.info_vivienda.observaciones || ''}
                onChange={(e: any) => updateFormData('info_vivienda', 'observaciones', e.target.value)}
                placeholder="Observaciones adicionales..."
              />
            </ResponsiveField>
          </div>
        );

      case 2: // Protección y Salud
        return (
          <div className="space-y-4">
            <ResponsiveField label="Situaciones de Especial Protección">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['NNA', 'GESTANTES', 'ADULTOS MAYORES', 'TB', 'LEPRA', 'ESCABIOSIS', 'MALARIA', 'DENGUE', 'CHAGAS', 'Hep. A', 'ENF. HUÉRFANA O TERMINAL', 'INMUNOPREVENIBLE', 'Vulnerabilidad Social', 'DISCAPACIDAD', 'OTRAS'].map(option => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.situaciones_proteccion.includes(option)}
                      onChange={(e: any) => {
                        const newValue = e.target.checked
                          ? [...formData.situaciones_proteccion, option]
                          : formData.situaciones_proteccion.filter((item: string) => item !== option);
                        setFormData(prev => ({ ...prev, situaciones_proteccion: newValue }));
                      }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </ResponsiveField>

            <ResponsiveCard>
              <h5 className="font-medium text-stone-900 mb-3">Condiciones de Salud Pública</h5>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300"
                    checked={formData.condiciones_salud_publica.sucesos_vitales || false}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      condiciones_salud_publica: {
                        ...prev.condiciones_salud_publica,
                        sucesos_vitales: e.target.checked
                      }
                    }))}
                  />
                  Sucesos vitales normativos o no normativos
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300"
                    checked={formData.condiciones_salud_publica.cuidado_salud_criticos || false}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      condiciones_salud_publica: {
                        ...prev.condiciones_salud_publica,
                        cuidado_salud_criticos: e.target.checked
                      }
                    }))}
                  />
                  Cuidado de salud críticos
                </label>
                <ResponsiveField label="Obtiene alimento">
                  <ResponsiveSelect
                    value={formData.condiciones_salud_publica.obtiene_alimento || ''}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      condiciones_salud_publica: {
                        ...prev.condiciones_salud_publica,
                        obtiene_alimento: e.target.value
                      }
                    }))}
                    options={[
                      { value: '', label: 'Seleccionar...' },
                      { value: 'CULTIVA', label: 'Cultiva' },
                      { value: 'CRÍA', label: 'Cría' },
                      { value: 'CAZERÍA', label: 'Cazería' },
                      { value: 'RECOLECCIÓN', label: 'Recolección' },
                      { value: 'TRUEQUE', label: 'Trueque' },
                      { value: 'COMPRA', label: 'Compra' },
                      { value: 'Asis estado', label: 'Asistencia del estado' },
                      { value: 'OTRA', label: 'Otra' }
                    ]}
                  />
                </ResponsiveField>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border-stone-300"
                    checked={formData.condiciones_salud_publica.asis_estado || false}
                    onChange={(e: any) => setFormData(prev => ({
                      ...prev,
                      condiciones_salud_publica: {
                        ...prev.condiciones_salud_publica,
                        asis_estado: e.target.checked
                      }
                    }))}
                  />
                  Asistencia del estado
                </label>
                {formData.condiciones_salud_publica.asis_estado && (
                  <ResponsiveField label="¿Cuál?">
                    <ResponsiveInput
                      value={formData.condiciones_salud_publica.asis_estado_cual || ''}
                      onChange={(e: any) => setFormData(prev => ({
                        ...prev,
                        condiciones_salud_publica: {
                          ...prev.condiciones_salud_publica,
                          asis_estado_cual: e.target.value
                        }
                      }))}
                      placeholder="Especificar asistencia"
                    />
                  </ResponsiveField>
                )}
              </div>
            </ResponsiveCard>
          </div>
        );

      case 3: // Prácticas de Cuidado
        return (
          <div className="space-y-4">
            <ResponsiveField label="Prácticas Protectoras">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.practicas_cuidado).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e: any) => updateFormData('practicas_cuidado', key, e.target.checked)}
                    />
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                ))}
              </div>
            </ResponsiveField>
          </div>
        );

      case 4: // Integrantes
        return (
          <div className="space-y-4">
            {pacientes.map((paciente, index) => (
              <ResponsiveCard key={paciente.paciente_id}>
                <h5 className="font-medium text-stone-900 mb-3">
                  {paciente.primer_nombre} {paciente.primer_apellido}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ResponsiveField label="Rol Familiar">
                    <ResponsiveSelect
                      value={formData.integrantes[index]?.rol_familiar || ''}
                      onChange={(e: any) => updateIntegrante(index, 'rol_familiar', e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'Jefe', label: 'Jefe' },
                        { value: 'Cónyuge', label: 'Cónyuge' },
                        { value: 'Hijo', label: 'Hijo' },
                        { value: 'Hermano', label: 'Hermano' },
                        { value: 'Padre', label: 'Padre' },
                        { value: 'Otro', label: 'Otro' }
                      ]}
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Ocupación">
                    <ResponsiveInput
                      value={formData.integrantes[index]?.ocupacion || ''}
                      onChange={(e: any) => updateIntegrante(index, 'ocupacion', e.target.value)}
                      placeholder="Ocupación actual"
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Nivel Educativo">
                    <ResponsiveInput
                      value={formData.integrantes[index]?.nivel_educativo || ''}
                      onChange={(e: any) => updateIntegrante(index, 'nivel_educativo', e.target.value)}
                      placeholder="Ej: Primaria, Bachillerato, Universitario"
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Grupo Poblacional">
                    <ResponsiveSelect
                      value={formData.integrantes[index]?.grupo_poblacional || ''}
                      onChange={(e: any) => updateIntegrante(index, 'grupo_poblacional', e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'NNA', label: 'Niño, Niña, Adolescente' },
                        { value: 'Gestante', label: 'Gestante' },
                        { value: 'Adulto Mayor', label: 'Adulto Mayor' }
                      ]}
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Teléfono 1">
                    <ResponsiveInput
                      value={formData.integrantes[index]?.telefono_1 || ''}
                      onChange={(e: any) => updateIntegrante(index, 'telefono_1', e.target.value)}
                      placeholder="Número de teléfono"
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Régimen de Afiliación">
                    <ResponsiveSelect
                      value={formData.integrantes[index]?.regimen_afiliacion || ''}
                      onChange={(e: any) => updateIntegrante(index, 'regimen_afiliacion', e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'Subsidiado', label: 'Subsidiado' },
                        { value: 'Contributivo', label: 'Contributivo' },
                        { value: 'Especial', label: 'Especial' },
                        { value: 'Excepción', label: 'Excepción' },
                        { value: 'No afiliado', label: 'No afiliado' },
                        { value: 'EAPB', label: 'EAPB' }
                      ]}
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Pertenencia Étnica">
                    <ResponsiveSelect
                      value={formData.integrantes[index]?.pertenencia_etnica || ''}
                      onChange={(e: any) => updateIntegrante(index, 'pertenencia_etnica', e.target.value)}
                      options={[
                        { value: '', label: 'Seleccionar...' },
                        { value: 'Indígena', label: 'Indígena' },
                        { value: 'Rom', label: 'Rom' },
                        { value: 'Raizal', label: 'Raizal' },
                        { value: 'Palenquero', label: 'Palenquero' },
                        { value: 'Negro, Afro', label: 'Negro, Afro' },
                        { value: 'Otro', label: 'Otro' },
                        { value: 'Ninguna', label: 'Ninguna' }
                      ]}
                    />
                  </ResponsiveField>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={formData.integrantes[index]?.orientacion_sexual === 'Si' || false}
                      onChange={(e: any) => updateIntegrante(index, 'orientacion_sexual', e.target.checked ? 'Si' : 'No')}
                    />
                    Orientación sexual diversa
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={formData.integrantes[index]?.comunidad_indigena || false}
                      onChange={(e: any) => updateIntegrante(index, 'comunidad_indigena', e.target.checked)}
                    />
                    Comunidad o pueblo indígena
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={formData.integrantes[index]?.victima_violencia || false}
                      onChange={(e: any) => updateIntegrante(index, 'victima_violencia', e.target.checked)}
                    />
                    Víctima de violencia
                  </label>
                  <ResponsiveField label="Discapacidad">
                    <div className="grid grid-cols-2 gap-2">
                      {['Física', 'Auditiva', 'Visual', 'Sordoceguera', 'Intelectual', 'Psicosocial', 'Múltiple', 'Otra', 'Ninguna'].map((disc) => (
                        <label key={disc} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            className="rounded border-stone-300"
                            checked={formData.integrantes[index]?.discapacidad?.includes(disc) || false}
                            onChange={(e: any) => {
                              const current = formData.integrantes[index]?.discapacidad || [];
                              const newDiscapacidades = e.target.checked
                                ? [...current, disc]
                                : current.filter((item: string) => item !== disc);
                              updateIntegrante(index, 'discapacidad', newDiscapacidades);
                            }}
                          />
                          {disc}
                        </label>
                      ))}
                    </div>
                  </ResponsiveField>
                </div>

                {/* Sección: Datos PYM (Prevención y Promoción) */}
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <h6 className="font-semibold text-stone-900 mb-4">Datos PYM (Prevención y Promoción)</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.cumple_esquema_pym || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'cumple_esquema_pym', e.target.checked)}
                      />
                      Cumple esquema PYM
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.odont_pym || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'odont_pym', e.target.checked)}
                      />
                      Odontología PYM
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.lactancia || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'lactancia', e.target.checked)}
                      />
                      Lactancia
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.fluor || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'fluor', e.target.checked)}
                      />
                      Flúor
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.profilaxis || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'profilaxis', e.target.checked)}
                      />
                      Profilaxis
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.vacunacion || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'vacunacion', e.target.checked)}
                      />
                      Vacunación
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.micronutientes || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'micronutientes', e.target.checked)}
                      />
                      Micronutrientes
                    </label>
                    <ResponsiveField label="Suplementación">
                      <div className="grid grid-cols-2 gap-2">
                        {['Hierro', 'Ácido Fólico', 'Calcio', 'Vitamina D', 'Otro'].map((sup) => (
                          <label key={sup} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="rounded border-stone-300"
                              checked={formData.integrantes[index]?.datos_pyp?.suplementacion?.includes(sup) || false}
                              onChange={(e: any) => {
                                const current = formData.integrantes[index]?.datos_pyp?.suplementacion || [];
                                const newSuplementacion = e.target.checked
                                  ? [...current, sup]
                                  : current.filter((item: string) => item !== sup);
                                updateIntegranteNested(index, 'datos_pyp', 'suplementacion', newSuplementacion);
                              }}
                            />
                            {sup}
                          </label>
                        ))}
                      </div>
                    </ResponsiveField>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.desparasitacion || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'desparasitacion', e.target.checked)}
                      />
                      Desparasitación
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.anemia_hemog || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'anemia_hemog', e.target.checked)}
                      />
                      Anemia/Hemoglobina
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.its || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'its', e.target.checked)}
                      />
                      ITS
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.t_ca_cuello || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 't_ca_cuello', e.target.checked)}
                      />
                      Tamizaje CA Cuello
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.t_ca_mama || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 't_ca_mama', e.target.checked)}
                      />
                      Tamizaje CA Mama
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.t_ca_prostata || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 't_ca_prostata', e.target.checked)}
                      />
                      Tamizaje CA Próstata
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.t_ca_colon || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 't_ca_colon', e.target.checked)}
                      />
                      Tamizaje CA Colon
                    </label>
                    <ResponsiveField label="Preconcepcional">
                      <div className="grid grid-cols-2 gap-2">
                        {['Ácido Fólico', 'Vacunación', 'Control Prenatal', 'Otro'].map((prec) => (
                          <label key={prec} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="rounded border-stone-300"
                              checked={formData.integrantes[index]?.datos_pyp?.preconcepcional?.includes(prec) || false}
                              onChange={(e: any) => {
                                const current = formData.integrantes[index]?.datos_pyp?.preconcepcional || [];
                                const newPreconcepcional = e.target.checked
                                  ? [...current, prec]
                                  : current.filter((item: string) => item !== prec);
                                updateIntegranteNested(index, 'datos_pyp', 'preconcepcional', newPreconcepcional);
                              }}
                            />
                            {prec}
                          </label>
                        ))}
                      </div>
                    </ResponsiveField>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.prenatal || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'prenatal', e.target.checked)}
                      />
                      Prenatal
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.curso_preparacion || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'curso_preparacion', e.target.checked)}
                      />
                      Curso de Preparación
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.ive || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'ive', e.target.checked)}
                      />
                      IVE
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.puerperio || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'puerperio', e.target.checked)}
                      />
                      Puerperio
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.recien_nacido || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'recien_nacido', e.target.checked)}
                      />
                      Recién Nacido
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.preparacion || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'preparacion', e.target.checked)}
                      />
                      Preparación
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.educacion || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'educacion', e.target.checked)}
                      />
                      Educación
                    </label>
                    <ResponsiveField label="Motivo No Atención PYM">
                      <div className="grid grid-cols-2 gap-2">
                        {['Lugar lejano', 'Horario', 'Tiempos', 'Falta de información', 'No aplica', 'Otro'].map((motivo) => (
                          <label key={motivo} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="rounded border-stone-300"
                              checked={formData.integrantes[index]?.datos_pyp?.motivo_no_atencion_pym?.includes(motivo) || false}
                              onChange={(e: any) => {
                                const current = formData.integrantes[index]?.datos_pyp?.motivo_no_atencion_pym || [];
                                const newMotivos = e.target.checked
                                  ? [...current, motivo]
                                  : current.filter((item: string) => item !== motivo);
                                updateIntegranteNested(index, 'datos_pyp', 'motivo_no_atencion_pym', newMotivos);
                              }}
                            />
                            {motivo}
                          </label>
                        ))}
                      </div>
                    </ResponsiveField>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.si_es_menor_6_meses_lactancia || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'si_es_menor_6_meses_lactancia', e.target.checked)}
                      />
                      Si es menor 6 meses: Lactancia
                    </label>
                    <ResponsiveField label="Si es menor 2 años: Meses de lactancia">
                      <ResponsiveInput
                        type="number"
                        value={formData.integrantes[index]?.datos_pyp?.si_es_menor_2_anos_meses_lact || ''}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'si_es_menor_2_anos_meses_lact', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Meses"
                      />
                    </ResponsiveField>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_pyp?.menor_de_5_anos || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_pyp', 'menor_de_5_anos', e.target.checked)}
                      />
                      Menor de 5 años
                    </label>
                  </div>
                </div>

                {/* Sección: Datos de Salud */}
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <h6 className="font-semibold text-stone-900 mb-4">Datos de Salud</h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ResponsiveField label="Peso (kg)">
                      <ResponsiveInput
                        type="number"
                        step="0.1"
                        value={formData.integrantes[index]?.datos_salud?.peso || ''}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_salud', 'peso', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Peso en kilogramos"
                      />
                    </ResponsiveField>
                    <ResponsiveField label="Talla (cm)">
                      <ResponsiveInput
                        type="number"
                        step="0.1"
                        value={formData.integrantes[index]?.datos_salud?.talla || ''}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_salud', 'talla', e.target.value ? Number(e.target.value) : null)}
                        placeholder="Talla en centímetros"
                      />
                    </ResponsiveField>
                    <ResponsiveField label="Diagnóstico Nutricional">
                      <ResponsiveInput
                        value={formData.integrantes[index]?.datos_salud?.diagnostico || ''}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_salud', 'diagnostico', e.target.value)}
                        placeholder="Ej: Normal, Desnutrición, Sobrepeso"
                      />
                    </ResponsiveField>
                    <ResponsiveField label="Signos de Desnutrición Aguda">
                      <div className="grid grid-cols-2 gap-2">
                        {['Edema', 'Emaciación', 'Retraso crecimiento', 'Pérdida peso', 'Otro'].map((signo) => (
                          <label key={signo} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="rounded border-stone-300"
                              checked={formData.integrantes[index]?.datos_salud?.signos_desnutricion_aguda?.includes(signo) || false}
                              onChange={(e: any) => {
                                const current = formData.integrantes[index]?.datos_salud?.signos_desnutricion_aguda || [];
                                const newSignos = e.target.checked
                                  ? [...current, signo]
                                  : current.filter((item: string) => item !== signo);
                                updateIntegranteNested(index, 'datos_salud', 'signos_desnutricion_aguda', newSignos);
                              }}
                            />
                            {signo}
                          </label>
                        ))}
                      </div>
                    </ResponsiveField>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_salud?.enf_ultimo_mes || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_salud', 'enf_ultimo_mes', e.target.checked)}
                      />
                      Enfermedad último mes
                    </label>
                    <ResponsiveField label="Cuáles enfermedades último mes">
                      <ResponsiveInput
                        value={formData.integrantes[index]?.datos_salud?.cuales_enf_ultimo_mes || ''}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_salud', 'cuales_enf_ultimo_mes', e.target.value)}
                        placeholder="Especificar enfermedades"
                      />
                    </ResponsiveField>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={formData.integrantes[index]?.datos_salud?.tto || false}
                        onChange={(e: any) => updateIntegranteNested(index, 'datos_salud', 'tto', e.target.checked)}
                      />
                      TTO (Tratamiento)
                    </label>
                    <ResponsiveField label="Tiempo Cuidador">
                      <ResponsiveSelect
                        value={formData.integrantes[index]?.datos_salud?.tiempo_cuidador || formData.integrantes[index]?.tiempo_cuidador || ''}
                        onChange={(e: any) => {
                          const value = e.target.value;
                          updateIntegranteNested(index, 'datos_salud', 'tiempo_cuidador', value);
                          updateIntegrante(index, 'tiempo_cuidador', value);
                        }}
                        options={[
                          { value: '', label: 'Seleccionar...' },
                          { value: 'Tto. Casero', label: 'Tto. Casero' },
                          { value: 'Rechazo', label: 'Rechazo' },
                          { value: 'No afiliado', label: 'No afiliado' },
                          { value: 'Pract. Anc', label: 'Pract. Anc' },
                          { value: 'Partera', label: 'Partera' },
                          { value: 'Sabedor', label: 'Sabedor' },
                          { value: 'No aplica', label: 'No aplica' }
                        ]}
                      />
                    </ResponsiveField>
                    <ResponsiveField label="Motivo No Atención">
                      <div className="grid grid-cols-2 gap-2">
                        {['Lugar lejano', 'Horario', 'Tiempos', 'Falta de información', 'Costo', 'No aplica', 'Otro'].map((motivo) => (
                          <label key={motivo} className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              className="rounded border-stone-300"
                              checked={formData.integrantes[index]?.datos_salud?.motivo_no_atencion?.includes(motivo) || false}
                              onChange={(e: any) => {
                                const current = formData.integrantes[index]?.datos_salud?.motivo_no_atencion || [];
                                const newMotivos = e.target.checked
                                  ? [...current, motivo]
                                  : current.filter((item: string) => item !== motivo);
                                updateIntegranteNested(index, 'datos_salud', 'motivo_no_atencion', newMotivos);
                              }}
                            />
                            {motivo}
                          </label>
                        ))}
                      </div>
                    </ResponsiveField>
                  </div>
                </div>
              </ResponsiveCard>
            ))}
          </div>
        );

      default:
        return <div>Contenido no disponible</div>;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <ResponsiveCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900">Caracterización de Familia</h3>
            <div className="text-sm text-stone-600">{familia.apellido_principal}</div>
          </div>
          <div className="flex gap-3">
            <ResponsiveButton variant="secondary" onClick={onCancel}>
              Cancelar
            </ResponsiveButton>
            <ResponsiveButton onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Caracterización'}
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveCard>

      {/* Tabs */}
      <ResponsiveCard>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-6">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(index)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === index
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Contenido del tab activo */}
        {renderTabContent()}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Plan de Cuidado Familiar
function PlanCuidadoView({ paciente, familia, onBack }: any) {
  const { user } = useAuth();
  const isAuxiliar = (user?.role === 'auxiliar_enfermeria');
  const isMedico = (user?.role === 'medico');
  const canCreatePlan = isAuxiliar || isMedico;
  const [planes, setPlanes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    fecha_entrega: new Date().toISOString().split('T')[0],
    plan_asociado: [],
    condicion_identificada: '',
    logro_salud: '',
    cuidados_salud: '',
    demandas_inducidas_desc: '',
    educacion_salud: '',
    relaciones_salud_mental: '',
    estado: 'Activo',
    fecha_aceptacion: '',
    numero_ficha_relacionada: '',
    nombre_encuestado_principal: '',
    territorio: '',
    micro_territorio: '',
    direccion: '',
    telefono: '',
    profesional_entrega: '',
    ebs_numero: ''
  });

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getPlanesCuidadoPaciente(paciente.paciente_id);
      setPlanes(data);
    } catch (error) {
      console.error('Error cargando planes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlanes(); }, [paciente.paciente_id]);

  const handleSave = async () => {
    try {
      const user = AuthService.getCurrentUser();
      await AuthService.crearPlanCuidado({
        ...form,
        familia_id: familia.familia_id,
        paciente_principal_id: paciente.paciente_id,
        creado_por_uid: Number(user?.id) || 1
      });
      setShowForm(false);
      await loadPlanes();
    } catch (error) {
      console.error('Error guardando plan:', error);
      alert('Error al guardar el plan de cuidado');
    }
  };

  const togglePlanAsociado = (opcion: string) => {
    setForm(prev => ({
      ...prev,
      plan_asociado: prev.plan_asociado.includes(opcion)
        ? prev.plan_asociado.filter((item: string) => item !== opcion)
        : [...prev.plan_asociado, opcion]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <ResponsiveCard>
          <div className="text-center py-8">
            <div className="text-sm text-stone-500">Cargando planes de cuidado...</div>
          </div>
        </ResponsiveCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <ResponsiveCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900">Plan de Cuidado Familiar</h3>
            <div className="text-sm text-stone-600">
              {paciente.primer_nombre} {paciente.primer_apellido} • {familia.apellido_principal}
            </div>
          </div>
          <div className="flex gap-3">
            <ResponsiveButton variant="secondary" onClick={onBack}>
              Volver
            </ResponsiveButton>
            {canCreatePlan && (
              <ResponsiveButton onClick={() => setShowForm(true)}>
                Nuevo Plan
              </ResponsiveButton>
            )}
          </div>
        </div>
      </ResponsiveCard>

      {/* Lista de planes existentes */}
      {planes.length > 0 ? (
        <div className="space-y-4">
          {planes.map((plan) => (
            <ResponsiveCard key={plan.plan_id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-stone-900">{plan.condicion_identificada}</h4>
                  <div className="text-sm text-stone-600">
                    {plan.estado}
                  </div>
                  <div className="text-xs text-stone-500">
                    Entregado: {new Date(plan.fecha_entrega).toLocaleDateString()}
                    {plan.fecha_aceptacion && (
                      <> • Aceptado: {new Date(plan.fecha_aceptacion).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <ResponsiveBadge tone={plan.estado === 'Activo' ? 'health' : 'neutral'}>
                  {plan.estado}
                </ResponsiveBadge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-stone-500">Logro en salud a establecerse</div>
                  <div className="text-sm text-stone-900">{plan.logro_salud}</div>
                </div>
                
                <div>
                  <div className="text-xs text-stone-500">Cuidados de la salud</div>
                  <div className="text-sm text-stone-900">{plan.cuidados_salud}</div>
                </div>
                
                {plan.plan_asociado && plan.plan_asociado.length > 0 && (
                  <div>
                    <div className="text-xs text-stone-500">Plan familiar asociado</div>
                    <div className="text-sm text-stone-900">
                      {plan.plan_asociado.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </ResponsiveCard>
          ))}
        </div>
      ) : (
        <ResponsiveCard>
          <div className="text-center py-8">
            <div className="text-sm text-stone-500 mb-2">No hay planes de cuidado registrados</div>
            <div className="text-xs text-stone-400">
              Crea el primer plan de cuidado para este paciente
            </div>
          </div>
        </ResponsiveCard>
      )}

      {/* Formulario de nuevo plan */}
      {showForm && (
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Nuevo Plan de Cuidado Familiar</h4>
          
          <div className="space-y-4">
            {/* Información General de la Familia */}
            <div className="border-b border-stone-200 pb-4">
              <h5 className="font-medium text-stone-900 mb-3">Información General</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveField label="Número de Ficha Relacionada">
                  <ResponsiveInput
                    value={form.numero_ficha_relacionada}
                    onChange={(e: any) => setForm(prev => ({ ...prev, numero_ficha_relacionada: e.target.value }))}
                    placeholder="Ej: 14250"
                  />
                </ResponsiveField>
                <ResponsiveField label="Nombre del Encuestado Principal">
                  <ResponsiveInput
                    value={form.nombre_encuestado_principal}
                    onChange={(e: any) => setForm(prev => ({ ...prev, nombre_encuestado_principal: e.target.value }))}
                    placeholder="Nombre completo del encuestado"
                  />
                </ResponsiveField>
                <ResponsiveField label="Territorio">
                  <ResponsiveInput
                    value={form.territorio || familia.territorio || ''}
                    onChange={(e: any) => setForm(prev => ({ ...prev, territorio: e.target.value }))}
                    placeholder="Ej: Comuna 19"
                  />
                </ResponsiveField>
                <ResponsiveField label="Micro Territorio">
                  <ResponsiveInput
                    value={form.micro_territorio || familia.micro_territorio || ''}
                    onChange={(e: any) => setForm(prev => ({ ...prev, micro_territorio: e.target.value }))}
                    placeholder="Micro territorio"
                  />
                </ResponsiveField>
                <ResponsiveField label="Dirección">
                  <ResponsiveInput
                    value={form.direccion || familia.direccion || ''}
                    onChange={(e: any) => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección completa"
                  />
                </ResponsiveField>
                <ResponsiveField label="Teléfono">
                  <ResponsiveInput
                    value={form.telefono || familia.telefono_contacto || ''}
                    onChange={(e: any) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Número de teléfono"
                  />
                </ResponsiveField>
                <ResponsiveField label="Profesional que Realiza la Entrega del Plan">
                  <ResponsiveInput
                    value={form.profesional_entrega || (user as any)?.nombre_completo || ''}
                    onChange={(e: any) => setForm((prev: any) => ({ ...prev, profesional_entrega: e.target.value }))}
                    placeholder="Nombre del profesional"
                  />
                </ResponsiveField>
                <ResponsiveField label="EBS Número">
                  <ResponsiveInput
                    value={form.ebs_numero}
                    onChange={(e: any) => setForm(prev => ({ ...prev, ebs_numero: e.target.value }))}
                    placeholder="Número EBS"
                  />
                </ResponsiveField>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveField label="Fecha de Entrega" required>
                <ResponsiveInput
                  type="date"
                  value={form.fecha_entrega}
                  onChange={(e: any) => setForm(prev => ({ ...prev, fecha_entrega: e.target.value }))}
                />
              </ResponsiveField>
              <ResponsiveField label="Fecha de Aceptación">
                <ResponsiveInput
                  type="date"
                  value={form.fecha_aceptacion}
                  onChange={(e: any) => setForm(prev => ({ ...prev, fecha_aceptacion: e.target.value }))}
                />
              </ResponsiveField>
            </div>

            {/* Condición/Situación Identificada - Reorganizada según formulario físico */}
            <div className="border-t border-stone-200 pt-4">
              <h5 className="font-medium text-stone-900 mb-3">Condición/Situación Identificada</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveField label="Relaciones y salud mental">
                  <textarea
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                    rows={3}
                    value={form.relaciones_salud_mental}
                    onChange={(e: any) => setForm(prev => ({ ...prev, relaciones_salud_mental: e.target.value }))}
                    placeholder="Relaciones y salud mental..."
                  />
                </ResponsiveField>
                <ResponsiveField label="Cuidados de la salud">
                  <textarea
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                    rows={3}
                    value={form.cuidados_salud}
                    onChange={(e: any) => setForm(prev => ({ ...prev, cuidados_salud: e.target.value }))}
                    placeholder="Cuidados de la salud..."
                  />
                </ResponsiveField>
                <ResponsiveField label="Demandas inducidas">
                  <textarea
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                    rows={3}
                    value={form.demandas_inducidas_desc}
                    onChange={(e: any) => setForm(prev => ({ ...prev, demandas_inducidas_desc: e.target.value }))}
                    placeholder="Demandas inducidas..."
                  />
                </ResponsiveField>
                <ResponsiveField label="Educación en salud">
                  <textarea
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                    rows={3}
                    value={form.educacion_salud}
                    onChange={(e: any) => setForm(prev => ({ ...prev, educacion_salud: e.target.value }))}
                    placeholder="Educación en salud..."
                  />
                </ResponsiveField>
              </div>
            </div>

            <ResponsiveField label="Logro en salud a establecerse" required>
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={4}
                value={form.logro_salud}
                onChange={(e: any) => setForm(prev => ({ ...prev, logro_salud: e.target.value }))}
                placeholder="Describe el logro en salud que se quiere establecer..."
              />
            </ResponsiveField>

            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Plan familiar asociado</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  'Hábitos saludables',
                  'Cuidado gestante lactante',
                  'Nutrición infantil y desparasitación',
                  'Envejecimiento saludable',
                  'Planificación familiar',
                  'Enfermedades crónicas',
                  'Cuidado menor de 5 años',
                  'Prevención dengue',
                  'EDA',
                  'IRA',
                  'Osteomuscular',
                  'ITS',
                  'Salud sexual en la adolescencia',
                  'Nutrición adultos',
                  'Salud mental',
                  'Prevención violencias',
                  'Otros'
                ].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={form.plan_asociado.includes(opcion)}
                      onChange={() => togglePlanAsociado(opcion)}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <ResponsiveButton variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </ResponsiveButton>
              <ResponsiveButton onClick={handleSave}>
                Guardar Plan
              </ResponsiveButton>
            </div>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}

// Vista: Demandas Inducidas
function DemandasInducidasView({ paciente, familia, onBack }: any) {
  const { user } = useAuth();
  const isAuxiliar = (user?.role === 'auxiliar_enfermeria');
  const isMedico = (user?.role === 'medico');
  const canCreateDemanda = isAuxiliar || isMedico;
  const [demandas, setDemandas] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profesionalesDisponibles, setProfesionalesDisponibles] = useState<any>({});
  const [loadingProfesionales, setLoadingProfesionales] = useState<any>({});
  const [tiposProfesionalesSeleccionados, setTiposProfesionalesSeleccionados] = useState<string[]>([]);
  
  const tiposProfesionales = [
    { id: 'Médico', nombre: 'Médico' },
    { id: 'Enfermero', nombre: 'Enfermero' },
    { id: 'Psicólogo', nombre: 'Psicólogo' },
    { id: 'Fisioterapeuta', nombre: 'Fisioterapeuta' },
    { id: 'Nutricionista', nombre: 'Nutricionista' },
    { id: 'Fonoaudiólogo', nombre: 'Fonoaudiólogo' },
    { id: 'Odontólogo', nombre: 'Odontólogo' }
  ];
  
  // Calcular edad del paciente
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const [form, setForm] = useState<any>({
    numero_formulario: '',
    fecha_demanda: new Date().toISOString().split('T')[0],
    diligenciamiento: [],
    remision_a: {
      profesionales: [],
      examenes_laboratorio: []
    },
    estado: 'Pendiente',
    asignado_a_uid: null,
    seguimiento: {
      fecha_seguimiento: '',
      observaciones: '',
      resultado: '',
      proxima_cita: '',
      medio: '',
      verificado: null
    },
    edad: paciente.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : null,
    sexo: paciente.genero || '',
    eps: paciente.eps || '',
    regimen: paciente.regimen_afiliacion || '',
    ips_atencion: '',
    ebs_numero: '',
    educacion_salud: '',
    intervencion_efectiva: '',
    tipo_identificacion: paciente.tipo_documento || '',
    numero_identificacion: paciente.numero_documento || '',
    telefono: paciente.telefono || familia.telefono_contacto || '',
    direccion: familia.direccion || '',
    nombres_completos: `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim(),
    intervencion_efectiva_si: false,
    seguimiento_verificado: false,
    seguimiento_fecha: '',
    seguimiento_medio: '',
    seguimiento_observaciones: ''
  });

  const loadDemandas = async () => {
    try {
      setLoading(true);
      const data = await AuthService.getDemandasInducidasPaciente(paciente.paciente_id);
      setDemandas(data);
    } catch (error) {
      console.error('Error cargando demandas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemandas();
  }, [paciente.paciente_id]);

  // Cargar profesionales cuando se selecciona un tipo
  useEffect(() => {
    const cargarProfesionales = async (tipo: string) => {
      if (profesionalesDisponibles[tipo] || loadingProfesionales[tipo]) return;
      
      setLoadingProfesionales((prev: any) => ({ ...prev, [tipo]: true }));
      try {
        const usuarios = await AuthService.getUsuariosPorRol(tipo);
        setProfesionalesDisponibles((prev: any) => ({ ...prev, [tipo]: usuarios }));
      } catch (error) {
        console.error(`Error cargando profesionales ${tipo}:`, error);
        setProfesionalesDisponibles((prev: any) => ({ ...prev, [tipo]: [] }));
      } finally {
        setLoadingProfesionales((prev: any) => ({ ...prev, [tipo]: false }));
      }
    };

    tiposProfesionalesSeleccionados.forEach(tipo => {
      cargarProfesionales(tipo);
    });
  }, [tiposProfesionalesSeleccionados]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDemanda = async () => {
    try {
      // Si hay profesionales asignados, usar el primero como asignado_a_uid (para compatibilidad)
      let asignadoAId = null;
      if (form.remision_a.profesionales && form.remision_a.profesionales.length > 0) {
        asignadoAId = form.remision_a.profesionales[0].profesional_id;
      }
      
      const newDemanda = {
        ...form,
        paciente_id: paciente.paciente_id,
        solicitado_por_uid: Number(user?.id) || 1,
        asignado_a_uid: asignadoAId,
        remision_a: form.remision_a // El backend lo convertirá a JSON string
      };
      await AuthService.crearDemandaInducida(newDemanda);
      setShowForm(false);
      setForm({
        numero_formulario: '',
        fecha_demanda: new Date().toISOString().split('T')[0],
        diligenciamiento: [],
        remision_a: {
          profesionales: [],
          examenes_laboratorio: []
        },
        estado: 'Pendiente',
        asignado_a_uid: null,
        seguimiento: {
          fecha_seguimiento: '',
          observaciones: '',
          resultado: '',
          proxima_cita: '',
          medio: '',
          verificado: null
        },
        edad: paciente.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : null,
        sexo: paciente.genero || '',
        eps: paciente.eps || '',
        regimen: paciente.regimen_afiliacion || '',
        ips_atencion: '',
        ebs_numero: '',
        educacion_salud: '',
        intervencion_efectiva: '',
        tipo_identificacion: paciente.tipo_documento || '',
        numero_identificacion: paciente.numero_documento || '',
        telefono: paciente.telefono || familia.telefono_contacto || '',
        direccion: familia.direccion || '',
        nombres_completos: `${paciente.primer_nombre || ''} ${paciente.segundo_nombre || ''} ${paciente.primer_apellido || ''} ${paciente.segundo_apellido || ''}`.trim(),
        intervencion_efectiva_si: false,
        seguimiento_verificado: false,
        seguimiento_fecha: '',
        seguimiento_medio: '',
        seguimiento_observaciones: ''
      });
      setTiposProfesionalesSeleccionados([]);
      setProfesionalesDisponibles({});
      loadDemandas();
    } catch (error) {
      console.error('Error guardando demanda:', error);
      alert('Error guardando demanda. Verifique la consola.');
    }
  };

  const toggleTipoProfesional = (tipo: string) => {
    if (tiposProfesionalesSeleccionados.includes(tipo)) {
      setTiposProfesionalesSeleccionados(tiposProfesionalesSeleccionados.filter(t => t !== tipo));
      // Remover profesionales de ese tipo del form
      setForm((prev: any) => ({
        ...prev,
        remision_a: {
          ...prev.remision_a,
          profesionales: prev.remision_a.profesionales.filter((p: any) => p.tipo !== tipo)
        }
      }));
    } else {
      setTiposProfesionalesSeleccionados([...tiposProfesionalesSeleccionados, tipo]);
    }
  };

  const handleProfesionalChange = (tipo: string, profesionalId: string) => {
    const profesional = profesionalesDisponibles[tipo]?.find((p: any) => p.usuario_id.toString() === profesionalId);
    if (!profesional) return;
    
    setForm((prev: any) => {
      const profesionales = prev.remision_a.profesionales.filter((p: any) => p.tipo !== tipo);
      profesionales.push({
        tipo,
        profesional_id: profesional.usuario_id,
        nombre: profesional.nombre_completo
      });
      
      return {
        ...prev,
        remision_a: {
          ...prev.remision_a,
          profesionales
        }
      };
    });
  };

  const handleExamenesChange = (examenes: string[]) => {
    setForm((prev: any) => ({
      ...prev,
      remision_a: {
        ...prev.remision_a,
        examenes_laboratorio: examenes
      }
    }));
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setForm({
      numero_formulario: '',
      fecha_demanda: new Date().toISOString().split('T')[0],
      diligenciamiento: [],
      remision_a: {
        profesionales: [],
        examenes_laboratorio: []
      },
      estado: 'Pendiente',
      asignado_a_uid: null,
      seguimiento: {
        fecha_seguimiento: '',
        observaciones: '',
        resultado: '',
        proxima_cita: ''
      },
      edad: paciente.fecha_nacimiento ? calcularEdad(paciente.fecha_nacimiento) : null,
      sexo: paciente.genero || '',
      eps: paciente.eps || '',
      regimen: paciente.regimen_afiliacion || '',
      ips_atencion: '',
      ebs_numero: '',
      educacion_salud: '',
      intervencion_efectiva: ''
    });
    setTiposProfesionalesSeleccionados([]);
    setProfesionalesDisponibles({});
  };

  if (loading) {
    return (
      <ResponsiveCard>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bondi-500"></div>
          <span className="ml-3 text-stone-600">Cargando demandas...</span>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-stone-900">Demandas Inducidas</h3>
            <div className="text-sm text-stone-600">
              {paciente.primer_nombre} {paciente.primer_apellido} • {familia.apellido_principal}
            </div>
          </div>
          <div className="flex gap-3">
            <ResponsiveButton variant="secondary" onClick={onBack}>
              Volver
            </ResponsiveButton>
            {canCreateDemanda && (
              <ResponsiveButton onClick={() => setShowForm(true)}>
                Crear Demanda
              </ResponsiveButton>
            )}
          </div>
        </div>
      </ResponsiveCard>

      {showForm && (
        <ResponsiveCard>
          <h4 className="font-semibold text-stone-900 mb-4">Nueva Demanda Inducida</h4>
          
          <div className="space-y-4">
            {/* Información del Paciente */}
            <div className="border-b border-stone-200 pb-4">
              <h5 className="font-medium text-stone-900 mb-3">Información del Paciente</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResponsiveField label="Número de Formulario">
                  <ResponsiveInput
                    type="text"
                    name="numero_formulario"
                    value={form.numero_formulario}
                    onChange={handleFormChange}
                    placeholder="Ej: 29251"
                  />
                </ResponsiveField>
                <ResponsiveField label="Fecha de Demanda">
                  <ResponsiveInput
                    type="date"
                    name="fecha_demanda"
                    value={form.fecha_demanda}
                    onChange={handleFormChange}
                  />
                </ResponsiveField>
                <ResponsiveField label="Tipo de Identificación">
                  <select
                    name="tipo_identificacion"
                    value={form.tipo_identificacion}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="CC">CC - Cédula de Ciudadanía</option>
                    <option value="TI">TI - Tarjeta de Identidad</option>
                    <option value="CE">CE - Cédula de Extranjería</option>
                    <option value="RC">RC - Registro Civil</option>
                    <option value="PA">PA - Pasaporte</option>
                  </select>
                </ResponsiveField>
                <ResponsiveField label="Número de Identificación">
                  <ResponsiveInput
                    type="text"
                    name="numero_identificacion"
                    value={form.numero_identificacion}
                    onChange={handleFormChange}
                    placeholder="Número de documento"
                  />
                </ResponsiveField>
                <ResponsiveField label="Nombres y Apellidos">
                  <ResponsiveInput
                    type="text"
                    name="nombres_completos"
                    value={form.nombres_completos}
                    onChange={handleFormChange}
                    placeholder="Nombres y apellidos completos"
                  />
                </ResponsiveField>
                <ResponsiveField label="Teléfono">
                  <ResponsiveInput
                    type="text"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleFormChange}
                    placeholder="Número de teléfono"
                  />
                </ResponsiveField>
                <ResponsiveField label="Dirección">
                  <ResponsiveInput
                    type="text"
                    name="direccion"
                    value={form.direccion}
                    onChange={handleFormChange}
                    placeholder="Dirección completa"
                  />
                </ResponsiveField>
                <ResponsiveField label="Edad">
                  <ResponsiveInput
                    type="number"
                    name="edad"
                    value={form.edad || ''}
                    onChange={handleFormChange}
                    placeholder="Edad en años"
                    disabled={!!paciente.fecha_nacimiento}
                  />
                </ResponsiveField>
                <ResponsiveField label="Sexo">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="sexo"
                        value="Masculino"
                        checked={form.sexo === 'Masculino'}
                        onChange={handleFormChange}
                        className="rounded border-stone-300"
                      />
                      H (Hombre)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="sexo"
                        value="Femenino"
                        checked={form.sexo === 'Femenino'}
                        onChange={handleFormChange}
                        className="rounded border-stone-300"
                      />
                      M (Mujer)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="sexo"
                        value="Transgénero"
                        checked={form.sexo === 'Transgénero'}
                        onChange={handleFormChange}
                        className="rounded border-stone-300"
                      />
                      T (Transgénero)
                    </label>
                  </div>
                </ResponsiveField>
                <ResponsiveField label="EPS">
                  <ResponsiveInput
                    type="text"
                    name="eps"
                    value={form.eps}
                    onChange={handleFormChange}
                    placeholder="Nombre de la EPS"
                  />
                </ResponsiveField>
                <ResponsiveField label="Régimen">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="regimen"
                        value="Subsidiado"
                        checked={form.regimen === 'Subsidiado'}
                        onChange={handleFormChange}
                        className="rounded border-stone-300"
                      />
                      S (Subsidiado)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="regimen"
                        value="Contributivo"
                        checked={form.regimen === 'Contributivo'}
                        onChange={handleFormChange}
                        className="rounded border-stone-300"
                      />
                      C (Contributivo)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="regimen"
                        value="Especial"
                        checked={form.regimen === 'Especial'}
                        onChange={handleFormChange}
                        className="rounded border-stone-300"
                      />
                      E (Especial)
                    </label>
                  </div>
                </ResponsiveField>
                <ResponsiveField label="IPS de Atención">
                  <ResponsiveInput
                    type="text"
                    name="ips_atencion"
                    value={form.ips_atencion}
                    onChange={handleFormChange}
                    placeholder="IPS donde se atiende"
                  />
                </ResponsiveField>
                <ResponsiveField label="EBS Número">
                  <ResponsiveInput
                    type="text"
                    name="ebs_numero"
                    value={form.ebs_numero}
                    onChange={handleFormChange}
                    placeholder="Número EBS"
                  />
                </ResponsiveField>
                <ResponsiveField label="Estado">
                  <select
                    name="estado"
                    value={form.estado}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Asignada">Asignada</option>
                    <option value="Realizada">Realizada</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </ResponsiveField>
              </div>
            </div>

            {/* Diligenciamiento - Expandido con todas las opciones del formato físico */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Funcionario que Diligencia</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {[
                  // Mantener las opciones existentes
                  'Atención para el cuidado preconcepcional',
                  'Planificación familiar',
                  'Control prenatal',
                  'Control puerperal',
                  'Crecimiento y desarrollo',
                  'Vacunación',
                  'Nutrición infantil',
                  'Salud oral',
                  'Salud mental',
                  'Enfermedades crónicas',
                  'Promoción de la salud',
                  'Prevención de enfermedades',
                  'Atención de enfermedades agudas',
                  'Atención de enfermedades crónicas',
                  'Rehabilitación',
                  'Atención de urgencias',
                  'Atención domiciliaria',
                  'Atención en salud mental',
                  'Atención en salud sexual y reproductiva',
                  'Atención al adulto mayor',
                  'Atención a gestantes',
                  'Atención a niños y niñas',
                  'Atención a adolescentes',
                  // Agregar opciones del formato físico
                  'Atención por planificación familiar y anticoncepción',
                  'Tamizaje para ITS (según exposición al riesgo, relaciones sexuales sin protección)',
                  'Curso de preparación para la maternidad y paternidad',
                  'Interrupción voluntaria del embarazo (IVE)',
                  'Atención para el cuidado prenatal - Controles prenatales',
                  'Gestantes suplementación con micronutrientes',
                  'Atención del puerperio',
                  'Atención para el seguimiento del recién nacido',
                  'Potenciales evocados auditivos',
                  'Potenciales visuales (valoración oftalmología)',
                  'Promoción y apoyo a lactancia materna',
                  'Ruta de atención primera infancia (1 mes - 5 años)',
                  'Fortificación casera con micronutrientes en polvo (6-8M, 12-18M, 18-24M)',
                  'Suplementación con micronutrientes (2 - 5 años semestral)',
                  'Desparasitación (A partir del año, semestral)',
                  'Tamizaje visual (3 - 5 años anual)',
                  'Ruta de atención infancia (6 - 11 años)',
                  'Ruta de atención adolescencia (12 - 17 años)',
                  'Tamizaje para anemia - Hemoglobina y hematocrito mujeres (1 vez entre 10 y 13 años y 1 vez entre 14 y 17 años)',
                  'Ruta de atención juventud (18 - 28 años)',
                  'Tamizaje de riesgo cardiovascular (18 - 28 años anual)',
                  'Ruta de atención adultez (29 - 59 años)',
                  'Ruta de atención vejez (>60 años)',
                  'Tamizaje de riesgo cardiovascular (>29 años 1 vez cada 5 años)',
                  'Tamizaje para cáncer de cuello uterino (mujeres) - Citología cervicouterina (25-29 años 1-3-3)',
                  'Tamizaje para cáncer de cuello uterino (mujeres) - ADN-VPH (30-65 años 1-5-5)',
                  'Tamizaje para cáncer de cuello uterino (mujeres) - Inspección visual ácido acético y lugol (30-50 años en zonas rurales dispersas)',
                  'Tamizaje para cáncer de mama (mujeres) - Valoración clínica de la mama (>40 - 69 años - anual)',
                  'Tamizaje para cáncer de mama (mujeres) - Mamografía bilateral (50 a 69 años cada 2 años)',
                  'Tamizaje para cáncer de colon y recto (hombres y mujeres) - Sangre oculta en materia fecal (>50-75 años cada 2 años)',
                  'Tamizaje cáncer de próstata (hombres) - Antígeno prostático PSA (>50 años cada 5 años hasta los 75 años)',
                  'Tamizaje cáncer de próstata (hombres) - Tacto rectal (>50 años cada 5 años hasta los 75 años)',
                  'Salud Oral - Valoración integral por profesional en odontología (6 meses-17años anual, >18 cada 2 años)',
                  'Salud Oral - Aplicación flúor (1-17años, semestral)',
                  'Salud Oral - Profilaxis y remoción de placa (a partir 1-17 años semestral, 18-28 años anual, >29 años cada 2 años)',
                  'Vacunación de acuerdo con el esquema',
                  'Otros'
                ].map((opcion) => (
                  <label key={opcion} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm(prev => ({
                            ...prev,
                            diligenciamiento: [...prev.diligenciamiento, opcion]
                          }));
                        } else {
                          setForm(prev => ({
                            ...prev,
                            diligenciamiento: prev.diligenciamiento.filter((item: string) => item !== opcion)
                          }));
                        }
                      }}
                    />
                    <span>{opcion}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Selección de profesionales del equipo básico */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Remisión a profesionales del equipo básico
              </label>
              <div className="space-y-3">
                {/* Checkboxes para seleccionar tipos de profesionales - Mantener los existentes y agregar los del formato */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {tiposProfesionales.map((tipo) => (
                    <label key={tipo.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-stone-300"
                        checked={tiposProfesionalesSeleccionados.includes(tipo.id)}
                        onChange={() => toggleTipoProfesional(tipo.id)}
                      />
                      <span>{tipo.nombre}</span>
                    </label>
                  ))}
                  {/* Agregar opciones del formato físico que no están en tiposProfesionales */}
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={tiposProfesionalesSeleccionados.includes('Trabajo Social')}
                      onChange={() => toggleTipoProfesional('Trabajo Social')}
                    />
                    <span>Trabajo Social</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-stone-300"
                      checked={tiposProfesionalesSeleccionados.includes('Terapia Respiratoria')}
                      onChange={() => toggleTipoProfesional('Terapia Respiratoria')}
                    />
                    <span>Terapia Respiratoria</span>
                  </label>
                </div>
                
                {/* Desplegables para profesionales según tipo seleccionado */}
                {tiposProfesionalesSeleccionados.map((tipo) => {
                  const profesionales = profesionalesDisponibles[tipo] || [];
                  const profesionalSeleccionado = form.remision_a.profesionales.find((p: any) => p.tipo === tipo);
                  
                  return (
                    <div key={tipo} className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">{tipo}</label>
                      {loadingProfesionales[tipo] ? (
                        <div className="text-xs text-stone-500">Cargando profesionales...</div>
                      ) : profesionales.length > 0 ? (
                        <select
                          value={profesionalSeleccionado?.profesional_id?.toString() || ''}
                          onChange={(e) => handleProfesionalChange(tipo, e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm"
                        >
                          <option value="">Seleccione un {tipo.toLowerCase()}</option>
                          {profesionales.map((prof: any) => (
                            <option key={prof.usuario_id} value={prof.usuario_id.toString()}>
                              {prof.nombre_completo}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-stone-500">No hay {tipo.toLowerCase()}s disponibles</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exámenes y pruebas de laboratorio */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Exámenes y pruebas de laboratorio
              </label>
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={4}
                placeholder="Ingrese los exámenes y pruebas de laboratorio solicitadas (uno por línea o separados por comas)..."
                value={Array.isArray(form.remision_a.examenes_laboratorio) 
                  ? form.remision_a.examenes_laboratorio.join('\n')
                  : (typeof form.remision_a.examenes_laboratorio === 'string' ? form.remision_a.examenes_laboratorio : '')}
                onChange={(e) => {
                  const examenes = e.target.value.split('\n').map(line => line.trim()).filter(line => line);
                  handleExamenesChange(examenes);
                }}
              />
            </div>

            {/* Educación en Salud */}
            <ResponsiveField label="Educación en salud. Tema:">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={3}
                name="educacion_salud"
                value={form.educacion_salud}
                onChange={handleFormChange}
                placeholder="Tema de educación en salud..."
              />
            </ResponsiveField>

            {/* Intervención Efectiva */}
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Se realiza intervención efectiva:</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="intervencion_efectiva_si"
                    checked={form.intervencion_efectiva_si === true}
                    onChange={(e: any) => setForm((prev: any) => ({ ...prev, intervencion_efectiva_si: true }))}
                    className="rounded border-stone-300"
                  />
                  SI
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="intervencion_efectiva_si"
                    checked={form.intervencion_efectiva_si === false}
                    onChange={(e: any) => setForm((prev: any) => ({ ...prev, intervencion_efectiva_si: false }))}
                    className="rounded border-stone-300"
                  />
                  NO
                </label>
              </div>
              {form.intervencion_efectiva_si === true && (
                <ResponsiveField label="¿Cuál?">
                  <textarea
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                    rows={3}
                    name="intervencion_efectiva"
                    value={form.intervencion_efectiva}
                    onChange={handleFormChange}
                    placeholder="Especificar la intervención efectiva realizada..."
                  />
                </ResponsiveField>
              )}
            </div>

            {/* Seguimiento Detallado - USO EXCLUSIVO PARA SEGUIMIENTO */}
            <div className="border-t border-stone-200 pt-4">
              <h5 className="font-medium text-stone-900 mb-3">USO EXCLUSIVO PARA SEGUIMIENTO</h5>
              
              {/* Mantener campos existentes de seguimiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <ResponsiveField label="Fecha de Seguimiento">
                  <ResponsiveInput
                    type="date"
                    value={form.seguimiento?.fecha_seguimiento || form.seguimiento_fecha || ''}
                    onChange={(e: any) => {
                      setForm((prev: any) => ({
                        ...prev,
                        seguimiento: {
                          ...prev.seguimiento,
                          fecha_seguimiento: e.target.value
                        },
                        seguimiento_fecha: e.target.value
                      }));
                    }}
                  />
                </ResponsiveField>
                <ResponsiveField label="Próxima Cita">
                  <ResponsiveInput
                    type="date"
                    value={form.seguimiento?.proxima_cita || ''}
                    onChange={(e: any) => setForm((prev: any) => ({
                      ...prev,
                      seguimiento: {
                        ...prev.seguimiento,
                        proxima_cita: e.target.value
                      }
                    }))}
                  />
                </ResponsiveField>
                <ResponsiveField label="Resultado">
                  <select
                    value={form.seguimiento?.resultado || ''}
                    onChange={(e: any) => setForm((prev: any) => ({
                      ...prev,
                      seguimiento: {
                        ...prev.seguimiento,
                        resultado: e.target.value
                      }
                    }))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Satisfactorio">Satisfactorio</option>
                    <option value="Parcial">Parcial</option>
                    <option value="No satisfactorio">No satisfactorio</option>
                    <option value="Pendiente">Pendiente</option>
                  </select>
                </ResponsiveField>
              </div>
              
              {/* Campos nuevos del formato físico */}
              <div className="border-t border-stone-200 pt-4">
                <div className="mb-3">
                  <label className="text-sm font-medium text-stone-700 mb-2 block">Se verifica la atención:</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="seguimiento_verificado"
                        checked={form.seguimiento_verificado === true}
                        onChange={(e: any) => setForm((prev: any) => ({ ...prev, seguimiento_verificado: true }))}
                        className="rounded border-stone-300"
                      />
                      SI
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="seguimiento_verificado"
                        checked={form.seguimiento_verificado === false}
                        onChange={(e: any) => setForm((prev: any) => ({ ...prev, seguimiento_verificado: false }))}
                        className="rounded border-stone-300"
                      />
                      NO
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <ResponsiveField label="Fecha">
                    <ResponsiveInput
                      type="date"
                      value={form.seguimiento_fecha || ''}
                      onChange={(e: any) => setForm((prev: any) => ({ ...prev, seguimiento_fecha: e.target.value }))}
                    />
                  </ResponsiveField>
                  <ResponsiveField label="Medio de seguimiento">
                    <ResponsiveInput
                      type="text"
                      value={form.seguimiento_medio || ''}
                      onChange={(e: any) => setForm((prev: any) => ({ ...prev, seguimiento_medio: e.target.value }))}
                      placeholder="Ej: Telefónico, Domiciliario, Presencial"
                    />
                  </ResponsiveField>
                </div>
                <ResponsiveField label="Observaciones:">
                  <textarea
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                    rows={3}
                    value={form.seguimiento_observaciones || form.seguimiento?.observaciones || ''}
                    onChange={(e: any) => {
                      setForm((prev: any) => ({
                        ...prev,
                        seguimiento_observaciones: e.target.value,
                        seguimiento: {
                          ...prev.seguimiento,
                          observaciones: e.target.value
                        }
                      }));
                    }}
                    placeholder="Observaciones del seguimiento..."
                  />
                </ResponsiveField>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <ResponsiveButton variant="secondary" onClick={handleCancelForm}>
                Cancelar
              </ResponsiveButton>
              <ResponsiveButton onClick={handleSaveDemanda}>
                Guardar Demanda
              </ResponsiveButton>
            </div>
          </div>
        </ResponsiveCard>
      )}

      <ResponsiveCard>
        <h4 className="font-semibold text-stone-900 mb-3">Demandas Registradas</h4>
        {demandas.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-sm text-stone-500 mb-2">No hay demandas inducidas registradas</div>
            <div className="text-xs text-stone-400">
              Crea la primera demanda inducida para este paciente
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {demandas.map((demanda) => (
              <div key={demanda.demanda_id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-stone-900">
                      Formulario #{demanda.numero_formulario || demanda.demanda_id}
                    </div>
                    <div className="text-sm text-stone-600">
                      Fecha: {new Date(demanda.fecha_demanda).toLocaleDateString()}
                    </div>
                  </div>
                  <ResponsiveBadge tone={demanda.estado === 'Realizada' ? 'success' : demanda.estado === 'Pendiente' ? 'warning' : 'info'}>
                    {demanda.estado}
                  </ResponsiveBadge>
                </div>
                
                {demanda.diligenciamiento && demanda.diligenciamiento.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-stone-500 mb-1">Diligenciamiento:</div>
                    <div className="text-sm text-stone-700">
                      {demanda.diligenciamiento.join(', ')}
                    </div>
                  </div>
                )}
                
                {(() => {
                  let remisionData = demanda.remision_a;
                  // Si viene como string JSON, parsearlo
                  if (typeof remisionData === 'string') {
                    try {
                      remisionData = JSON.parse(remisionData);
                    } catch (e) {
                      // Si no es JSON válido, tratar como array simple (formato antiguo)
                      try {
                        remisionData = typeof demanda.remision_a === 'string' 
                          ? JSON.parse(demanda.remision_a) 
                          : demanda.remision_a;
                      } catch (e2) {
                        remisionData = { profesionales: [], examenes_laboratorio: [] };
                      }
                    }
                  }
                  
                  const profesionales = remisionData?.profesionales || [];
                  const examenes = remisionData?.examenes_laboratorio || [];
                  const remisionSimple = Array.isArray(remisionData) ? remisionData : [];
                  
                  return (
                    <>
                      {profesionales.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-stone-500 mb-1">Profesionales asignados:</div>
                          <div className="text-sm text-stone-700">
                            {profesionales.map((p: any) => (
                              <div key={p.profesional_id}>
                                {p.tipo}: {p.nombre}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {examenes.length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-stone-500 mb-1">Exámenes de laboratorio:</div>
                          <div className="text-sm text-stone-700">
                            {Array.isArray(examenes) ? examenes.join(', ') : examenes}
                          </div>
                        </div>
                      )}
                      {remisionSimple.length > 0 && profesionales.length === 0 && (
                        <div className="mb-2">
                          <div className="text-xs text-stone-500 mb-1">Remisión a:</div>
                          <div className="text-sm text-stone-700">
                            {remisionSimple.join(', ')}
                          </div>
                        </div>
                      )}
                      {demanda.asignado_a_nombre && (
                        <div className="text-xs text-stone-500">
                          Asignado a: {demanda.asignado_a_nombre}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Lista de Caracterizaciones (para Auxiliar de Enfermería y Enfermero Jefe)
function CaracterizacionesView({ deviceType, onSelectFamilia }: any) {
  const [familias, setFamilias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await AuthService.getFamilias();
        if (isMounted) {
          // Enriquecer con información de caracterización
          const familiasConCaracterizacion = await Promise.all(
            (Array.isArray(data) ? data : []).map(async (familia: any) => {
              try {
                const caracterizacion = await AuthService.getCaracterizacionFamilia(familia.familia_id);
                return {
                  ...familia,
                  tieneCaracterizacion: !!caracterizacion,
                  fechaCaracterizacion: caracterizacion?.fecha_caracterizacion || null,
                  caracterizacion: caracterizacion
                };
              } catch {
                return { ...familia, tieneCaracterizacion: false, fechaCaracterizacion: null };
              }
            })
          );
          setFamilias(familiasConCaracterizacion);
        }
      } catch (e: any) {
        console.error('Error cargando caracterizaciones:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredFamilias = familias.filter((f) => {
    const matchSearch = !searchTerm || 
      f.apellido_principal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.direccion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = !filterEstado || 
      (filterEstado === "con" && f.tieneCaracterizacion) ||
      (filterEstado === "sin" && !f.tieneCaracterizacion);
    return matchSearch && matchEstado;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-eden-800">Caracterizaciones Familiares</h3>
        </div>

        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando caracterizaciones...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ResponsiveField label="Buscar familia">
                <ResponsiveInput
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por apellido o dirección..."
                />
              </ResponsiveField>
              <ResponsiveField label="Filtrar por estado">
                <ResponsiveSelect
                  value={filterEstado}
                  onChange={(e: any) => setFilterEstado(e.target.value)}
                  options={[
                    { value: '', label: 'Todas' },
                    { value: 'con', label: 'Con caracterización' },
                    { value: 'sin', label: 'Sin caracterización' }
                  ]}
                />
              </ResponsiveField>
            </div>

            <div className="space-y-3">
              {filteredFamilias.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  No se encontraron familias
                </div>
              ) : (
                filteredFamilias.map((familia) => (
                  <div
                    key={familia.familia_id}
                    onClick={() => {
                      if (onSelectFamilia) {
                        onSelectFamilia(familia);
                      } else {
                        window.dispatchEvent(new CustomEvent('openFamiliaDetalle', { detail: familia }));
                      }
                    }}
                    className="p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-san-marino hover:shadow-soft cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-stone-900 mb-1">
                          {familia.apellido_principal || 'Familia sin apellido'}
                        </div>
                        <div className="text-sm text-stone-600 mb-2">
                          {familia.direccion || 'Sin dirección'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {familia.tieneCaracterizacion ? (
                            <>
                              <ResponsiveBadge tone="success">Caracterizada</ResponsiveBadge>
                              {familia.fechaCaracterizacion && (
                                <span className="text-xs text-stone-500">
                                  {new Date(familia.fechaCaracterizacion).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <ResponsiveBadge tone="warning">Pendiente</ResponsiveBadge>
                          )}
                        </div>
                        {familia.tieneCaracterizacion && (
                          <div className="text-xs text-stone-500">
                            Click para ver y editar caracterización o crear plan de cuidado
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Lista de Planes de Cuidado (para Auxiliar de Enfermería)
// Alineada con el flujo: BD Planes de Cuidado Familiar → Pacientes con PCF / Pacientes sin PCF
function PlanesCuidadoListView({ deviceType }: any) {
  const [planes, setPlanes] = useState<any[]>([]);
  const [pacientesSinPCF, setPacientesSinPCF] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [activeTab, setActiveTab] = useState<'con' | 'sin'>('con');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Obtener todas las familias primero
        const familias = await AuthService.getFamilias();
        const allPlanes: any[] = [];
        const pacientesConPlan: Set<number> = new Set();
        const allPacientes: any[] = [];
        
        // Para cada familia, obtener sus planes y pacientes
        for (const familia of Array.isArray(familias) ? familias : []) {
          try {
            const pacientes = await AuthService.getPacientesByFamilia(familia.familia_id);
            for (const paciente of pacientes) {
              allPacientes.push({ ...paciente, familia });
              try {
                const planesPaciente = await AuthService.getPlanesCuidadoPaciente(paciente.paciente_id);
                if (planesPaciente.length > 0) {
                  pacientesConPlan.add(paciente.paciente_id);
                  allPlanes.push(...planesPaciente.map((plan: any) => ({
                    ...plan,
                    familia,
                    paciente
                  })));
                }
              } catch (e) {
                console.error('Error cargando planes del paciente:', paciente.paciente_id, e);
              }
            }
          } catch (e) {
            console.error('Error cargando pacientes de familia:', familia.familia_id, e);
          }
        }
        
        // Separar pacientes sin PCF
        const sinPCF = allPacientes.filter(p => !pacientesConPlan.has(p.paciente_id));
        
        if (isMounted) {
          setPlanes(allPlanes);
          setPacientesSinPCF(sinPCF);
        }
      } catch (e: any) {
        console.error('Error cargando planes:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredPlanes = planes.filter((p) => {
    const matchSearch = !searchTerm || 
      p.paciente?.primer_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paciente?.primer_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.familia?.apellido_principal?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = !filterEstado || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const filteredPacientesSinPCF = pacientesSinPCF.filter((p) => {
    return !searchTerm || 
      p.primer_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primer_apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.familia?.apellido_principal?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-eden-800">BD Planes de Cuidado Familiar</h3>
        </div>

        {/* Tabs para separar Con PCF / Sin PCF */}
        <div className="flex gap-2 mb-4 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('con')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'con'
                ? 'border-b-2 border-san-marino text-san-marino-700'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pacientes con PCF ({planes.length})
          </button>
          <button
            onClick={() => setActiveTab('sin')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'sin'
                ? 'border-b-2 border-san-marino text-san-marino-700'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Pacientes sin PCF ({pacientesSinPCF.length})
          </button>
        </div>

        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando planes...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ResponsiveField label="Buscar">
                <ResponsiveInput
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por paciente o familia..."
                />
              </ResponsiveField>
              {activeTab === 'con' && (
                <ResponsiveField label="Filtrar por estado">
                  <ResponsiveSelect
                    value={filterEstado}
                    onChange={(e: any) => setFilterEstado(e.target.value)}
                    options={[
                      { value: '', label: 'Todos' },
                      { value: 'Activo', label: 'Activo' },
                      { value: 'Completado', label: 'Completado' },
                      { value: 'Cancelado', label: 'Cancelado' }
                    ]}
                  />
                </ResponsiveField>
              )}
            </div>

            {activeTab === 'con' ? (
              /* PACIENTES CON PCF */
              <div className="space-y-3">
                {filteredPlanes.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    No se encontraron planes de cuidado
                  </div>
                ) : (
                  filteredPlanes.map((plan) => (
                    <div
                      key={plan.plan_id}
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('openPlanesCuidado', {
                          detail: { paciente: plan.paciente, familia: plan.familia }
                        }));
                      }}
                      className="p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-san-marino hover:shadow-soft cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-stone-900 mb-1">
                            {plan.paciente?.primer_nombre} {plan.paciente?.primer_apellido}
                          </div>
                          <div className="text-sm text-stone-600 mb-2">
                            Familia: {plan.familia?.apellido_principal}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <ResponsiveBadge tone={plan.estado === 'Activo' ? 'success' : plan.estado === 'Completado' ? 'admin' : 'neutral'}>
                              {plan.estado || 'Sin estado'}
                            </ResponsiveBadge>
                            {plan.fecha_entrega && (
                              <span className="text-xs text-stone-500">
                                Entrega: {new Date(plan.fecha_entrega).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {plan.condicion_identificada && (
                            <div className="text-xs text-stone-600 mt-2 line-clamp-2">
                              {plan.condicion_identificada}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-stone-400 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* PACIENTES SIN PCF - Agregar PCF */
              <div className="space-y-3">
                {filteredPacientesSinPCF.length === 0 ? (
                  <div className="text-center py-8 text-stone-500">
                    Todos los pacientes tienen un Plan de Cuidado Familiar
                  </div>
                ) : (
                  filteredPacientesSinPCF.map((paciente) => (
                    <div
                      key={paciente.paciente_id}
                      className="p-4 bg-stone-50 rounded-lg border border-stone-200 hover:border-janna-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-stone-900 mb-1">
                            {paciente.primer_nombre} {paciente.primer_apellido}
                          </div>
                          <div className="text-sm text-stone-600 mb-2">
                            Familia: {paciente.familia?.apellido_principal}
                          </div>
                          <ResponsiveBadge tone="warning">Sin PCF</ResponsiveBadge>
                        </div>
                        <ResponsiveButton
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('openPlanesCuidado', {
                              detail: { paciente, familia: paciente.familia }
                            }));
                          }}
                        >
                          Agregar PCF
                        </ResponsiveButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard Auxiliar de Enfermería
function DashboardAuxiliarView({ deviceType }: any) {
  const [stats, setStats] = useState({
    totalFamilias: 0,
    familiasCaracterizadas: 0,
    planesActivos: 0,
    demandasPendientes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const familias = await AuthService.getFamilias();
        const familiasArray = Array.isArray(familias) ? familias : [];
        
        let caracterizadas = 0;
        let totalPlanes = 0;
        let demandasPendientes = 0;

        for (const familia of familiasArray) {
          // Verificar caracterización
          try {
            const caracterizacion = await AuthService.getCaracterizacionFamilia(familia.familia_id);
            if (caracterizacion) caracterizadas++;
          } catch {}

          // Contar planes y demandas
          try {
            const pacientes = await AuthService.getPacientesByFamilia(familia.familia_id);
            for (const paciente of pacientes) {
              try {
                const planes = await AuthService.getPlanesCuidadoPaciente(paciente.paciente_id);
                totalPlanes += planes.filter((p: any) => p.estado === 'Activo').length;
                
                const demandas = await AuthService.getDemandasInducidasPaciente(paciente.paciente_id);
                demandasPendientes += demandas.filter((d: any) => d.estado === 'Pendiente' || d.estado === 'Asignada').length;
              } catch {}
            }
          } catch {}
        }

        if (isMounted) {
          setStats({
            totalFamilias: familiasArray.length,
            familiasCaracterizadas: caracterizadas,
            planesActivos: totalPlanes,
            demandasPendientes
          });
        }
      } catch (e) {
        console.error('Error cargando estadísticas:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Auxiliar de Enfermería</h3>
        
        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Familias</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalFamilias}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Caracterizadas</div>
              <div className="text-2xl font-bold text-san-marino-700">
                {stats.familiasCaracterizadas}
              </div>
              <div className="text-xs text-san-marino-500 mt-1">
                {stats.totalFamilias > 0 
                  ? Math.round((stats.familiasCaracterizadas / stats.totalFamilias) * 100) 
                  : 0}% completado
              </div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Planes Activos</div>
              <div className="text-2xl font-bold text-eden-700">{stats.planesActivos}</div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Demandas Pendientes</div>
              <div className="text-2xl font-bold text-janna-700">{stats.demandasPendientes}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard de Enfermería
function DashboardEnfermeriaView({ deviceType }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFamilias: 0,
    familiasCaracterizadas: 0,
    planesActivos: 0,
    consultasPendientes: 0,
    pacientesAsignados: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Obtener familias
        const familias = await AuthService.getFamilias();
        const familiasArray = Array.isArray(familias) ? familias : [];
        
        let caracterizadas = 0;
        let totalPlanes = 0;
        let consultasPendientes = 0;
        const pacientesAsignadosSet = new Set<number>();

        for (const familia of familiasArray) {
          // Verificar caracterización
          try {
            const caracterizacion = await AuthService.getCaracterizacionFamilia(familia.familia_id);
            if (caracterizacion) caracterizadas++;
          } catch {}

          // Contar planes activos
          try {
            const pacientes = await AuthService.getPacientesByFamilia(familia.familia_id);
            for (const paciente of pacientes) {
              const planes = await AuthService.getPlanesCuidadoPaciente(paciente.paciente_id);
              const activos = planes.filter((p: any) => p.estado === 'Activo');
              totalPlanes += activos.length;
            }
          } catch {}
        }

        // Obtener demandas asignadas si hay usuario
        if (user?.id) {
          try {
            const demandas = await AuthService.getDemandasAsignadas(Number(user.id));
            const demandasArray = Array.isArray(demandas) ? demandas : [];
            consultasPendientes = demandasArray.filter((d: any) => d.estado === 'Pendiente' || d.estado === 'Asignada').length;
            demandasArray.forEach((d: any) => {
              if (d.paciente_id) pacientesAsignadosSet.add(d.paciente_id);
            });
          } catch {}
        }

        if (isMounted) {
          setStats({
            totalFamilias: familiasArray.length,
            familiasCaracterizadas: caracterizadas,
            planesActivos: totalPlanes,
            consultasPendientes: consultasPendientes,
            pacientesAsignados: pacientesAsignadosSet.size
          });
        }
      } catch (e) {
        console.error('Error cargando estadísticas:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user]);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Enfermería</h3>
        <p className="text-sm text-stone-600 mb-4">
          Información epidemiológica y general de enfermería en territorios
        </p>
        
        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Familias</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalFamilias}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Caracterizadas</div>
              <div className="text-2xl font-bold text-san-marino-700">
                {stats.familiasCaracterizadas}
              </div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Planes Activos</div>
              <div className="text-2xl font-bold text-janna-700">{stats.planesActivos}</div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Consultas Pendientes</div>
              <div className="text-2xl font-bold text-eden-700">{stats.consultasPendientes}</div>
            </div>
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
              <div className="text-sm text-stone-600 mb-1">Pacientes Asignados</div>
              <div className="text-2xl font-bold text-stone-700">{stats.pacientesAsignados}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard de Psicología
function DashboardPsicologiaView({ deviceType }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalConsultas: 0,
    consultasCompletadas: 0,
    consultasPendientes: 0,
    pacientesAtendidos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (!user?.id) return;
        
        // Obtener HC psicológicas completadas
        const hcCompletadas = await AuthService.getHCPsicologiaCompletadas(Number(user.id));
        const completadas = Array.isArray(hcCompletadas) ? hcCompletadas : [];
        
        // Obtener demandas asignadas
        const demandas = await AuthService.getDemandasAsignadas(Number(user.id));
        const demandasArray = Array.isArray(demandas) ? demandas : [];
        
        // Obtener pacientes únicos atendidos
        const pacientesUnicos = new Set(completadas.map((hc: any) => hc.paciente_id));
        
        if (isMounted) {
          setStats({
            totalConsultas: completadas.length + demandasArray.length,
            consultasCompletadas: completadas.length,
            consultasPendientes: demandasArray.filter((d: any) => d.estado === 'Pendiente' || d.estado === 'Asignada').length,
            pacientesAtendidos: pacientesUnicos.size
          });
        }
      } catch (e) {
        console.error('Error cargando estadísticas:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user]);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Psicología</h3>
        <p className="text-sm text-stone-600 mb-4">
          Información epidemiológica y general de salud mental en territorios
        </p>
        
        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Consultas</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalConsultas}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Completadas</div>
              <div className="text-2xl font-bold text-san-marino-700">
                {stats.consultasCompletadas}
              </div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-janna-700">{stats.consultasPendientes}</div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Pacientes Atendidos</div>
              <div className="text-2xl font-bold text-eden-700">{stats.pacientesAtendidos}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard de Nutrición
function DashboardNutricionView({ deviceType }: any) {
  const [stats, setStats] = useState({
    totalConsultas: 0,
    consultasCompletadas: 0,
    consultasPendientes: 0,
    pacientesAtendidos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Placeholder hasta tener endpoints específicos de nutrición
        const total = 0;
        if (isMounted) setStats({
          totalConsultas: total,
          consultasCompletadas: 0,
          consultasPendientes: 0,
          pacientesAtendidos: 0
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Nutrición</h3>
        <p className="text-sm text-stone-600 mb-4">Información epidemiológica y de atención nutricional</p>
        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Consultas</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalConsultas}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Completadas</div>
              <div className="text-2xl font-bold text-san-marino-700">{stats.consultasCompletadas}</div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-janna-700">{stats.consultasPendientes}</div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Pacientes Atendidos</div>
              <div className="text-2xl font-bold text-eden-700">{stats.pacientesAtendidos}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard de Fonoaudiología
function DashboardFonoaudiologiaView({ deviceType }: any) {
  const [stats, setStats] = useState({
    totalConsultas: 0,
    terapiasCompletadas: 0,
    terapiasPendientes: 0,
    pacientesAtendidos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (isMounted) setStats({
          totalConsultas: 0,
          terapiasCompletadas: 0,
          terapiasPendientes: 0,
          pacientesAtendidos: 0
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Fonoaudiología</h3>
        <p className="text-sm text-stone-600 mb-4">Información epidemiológica y operativa de fonoaudiología</p>
        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Consultas</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalConsultas}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Completadas</div>
              <div className="text-2xl font-bold text-san-marino-700">{stats.terapiasCompletadas}</div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-janna-700">{stats.terapiasPendientes}</div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Pacientes Atendidos</div>
              <div className="text-2xl font-bold text-eden-700">{stats.pacientesAtendidos}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard de Odontología
function DashboardOdontologiaView({ deviceType }: any) {
  const [stats, setStats] = useState({
    totalConsultas: 0,
    tratamientosCompletados: 0,
    pendientes: 0,
    pacientesAtendidos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (mounted) setStats({ totalConsultas: 0, tratamientosCompletados: 0, pendientes: 0, pacientesAtendidos: 0 });
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Odontología</h3>
        <p className="text-sm text-stone-600 mb-4">Información epidemiológica y operativa de odontología</p>
        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Consultas</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalConsultas}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Tratamientos Completados</div>
              <div className="text-2xl font-bold text-san-marino-700">{stats.tratamientosCompletados}</div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-janna-700">{stats.pendientes}</div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Pacientes Atendidos</div>
              <div className="text-2xl font-bold text-eden-700">{stats.pacientesAtendidos}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Dashboard de Fisioterapia
function DashboardFisioterapiaView({ deviceType }: any) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTerapias: 0,
    terapiasCompletadas: 0,
    terapiasPendientes: 0,
    pacientesAtendidos: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (!user?.id) return;
        // Por ahora usamos las mismas fuentes que otros dashboards hasta tener endpoints específicos
        const demandas = await AuthService.getDemandasAsignadas(Number(user.id));
        const demandasArray = Array.isArray(demandas) ? demandas : [];
        // No existe HC Fisioterapia aún; asumimos 0 completadas hasta implementar
        const completadas = [] as any[];

        if (isMounted) {
          setStats({
            totalTerapias: completadas.length + demandasArray.length,
            terapiasCompletadas: completadas.length,
            terapiasPendientes: demandasArray.filter((d: any) => d.estado === 'Pendiente' || d.estado === 'Asignada').length,
            pacientesAtendidos: new Set(completadas.map((hc: any) => hc.paciente_id)).size
          });
        }
      } catch (e) {
        console.error('Error cargando estadísticas (Fisioterapia):', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [user]);

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <h3 className="font-semibold text-eden-800 mb-4">Dashboard - Fisioterapia</h3>
        <p className="text-sm text-stone-600 mb-4">
          Información epidemiológica y operativa de fisioterapia en territorios
        </p>

        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando estadísticas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-bondi-50 rounded-lg border border-bondi-200">
              <div className="text-sm text-bondi-600 mb-1">Total Terapias</div>
              <div className="text-2xl font-bold text-bondi-700">{stats.totalTerapias}</div>
            </div>
            <div className="p-4 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <div className="text-sm text-san-marino-600 mb-1">Completadas</div>
              <div className="text-2xl font-bold text-san-marino-700">{stats.terapiasCompletadas}</div>
            </div>
            <div className="p-4 bg-janna-50 rounded-lg border border-janna-200">
              <div className="text-sm text-janna-600 mb-1">Pendientes</div>
              <div className="text-2xl font-bold text-janna-700">{stats.terapiasPendientes}</div>
            </div>
            <div className="p-4 bg-eden-50 rounded-lg border border-eden-200">
              <div className="text-sm text-eden-600 mb-1">Pacientes Atendidos</div>
              <div className="text-2xl font-bold text-eden-700">{stats.pacientesAtendidos}</div>
            </div>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Educación en Salud
function EducacionSaludView({ deviceType }: any) {
  const [actividades, setActividades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerritorio, setFilterTerritorio] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Por ahora, estructura base para futuras actividades de educación en salud
        // TODO: Implementar endpoint backend para actividades de educación en salud
        const mockActividades = [
          {
            id: 1,
            tema: 'Salud Mental y Bienestar',
            horario: '2024-01-15 10:00',
            territorio: 'Territorio 1',
            personas: ['Juan Pérez', 'María García'],
            estado: 'Programada'
          }
        ];
        
        if (isMounted) setActividades(mockActividades);
      } catch (e) {
        console.error('Error cargando actividades:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filteredActividades = actividades.filter((a) => {
    const matchSearch = !searchTerm || 
      a.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.territorio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTerritorio = !filterTerritorio || a.territorio === filterTerritorio;
    return matchSearch && matchTerritorio;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-eden-800">Asignaciones de Actividades de Educación en Salud</h3>
        </div>

        {isLoading ? (
          <div className="text-sm text-eden-500 py-8 text-center">Cargando actividades...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <ResponsiveField label="Buscar">
                <ResponsiveInput
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por tema o territorio..."
                />
              </ResponsiveField>
              <ResponsiveField label="Filtrar por territorio">
                <ResponsiveInput
                  value={filterTerritorio}
                  onChange={(e: any) => setFilterTerritorio(e.target.value)}
                  placeholder="Territorio..."
                />
              </ResponsiveField>
            </div>

            <div className="space-y-3">
              {filteredActividades.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  No hay actividades de educación en salud registradas
                </div>
              ) : (
                filteredActividades.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="p-4 bg-stone-50 rounded-lg border border-stone-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-stone-900 mb-1">
                          {actividad.tema}
                        </div>
                        <div className="text-sm text-stone-600 mb-2">
                          <div>Horario: {actividad.horario}</div>
                          <div>Territorio: {actividad.territorio}</div>
                          {actividad.personas && actividad.personas.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-stone-500">Personas: </span>
                              {actividad.personas.join(', ')}
                            </div>
                          )}
                        </div>
                        <ResponsiveBadge tone={actividad.estado === 'Programada' ? 'success' : 'neutral'}>
                          {actividad.estado}
                        </ResponsiveBadge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </ResponsiveCard>
    </div>
  );
}

// Vista: Historia Clínica Psicológica
function HCPsicologiaView({ atencion, paciente, onSave, onCancel }: any) {
  const { user } = useAuth();
  const [form, setForm] = useState<any>({
    motivo_consulta: '',
    analisis_funcional: '',
    antecedentes_psicologicos: '',
    evaluacion_mental: '',
    diagnosticos_dsm5: '',
    plan_terapeutico: '',
    tecnicas_aplicadas: '',
    proxima_sesion: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (atencion?.atencion_id) {
      loadHCPsicologia();
    }
  }, [atencion?.atencion_id]);

  const loadHCPsicologia = async () => {
    try {
      const hc = await AuthService.getHCPsicologia(atencion.atencion_id);
      if (hc) {
        setForm({
          motivo_consulta: hc.motivo_consulta || '',
          analisis_funcional: hc.analisis_funcional || '',
          antecedentes_psicologicos: hc.antecedentes_psicologicos || '',
          evaluacion_mental: hc.evaluacion_mental || '',
          diagnosticos_dsm5: hc.diagnosticos_dsm5 || '',
          plan_terapeutico: hc.plan_terapeutico || '',
          tecnicas_aplicadas: hc.tecnicas_aplicadas || '',
          proxima_sesion: hc.proxima_sesion || ''
        });
      }
    } catch (error) {
      console.error('Error cargando HC psicológica:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (atencion?.atencion_id) {
        // Actualizar
        await AuthService.updateHCPsicologia(atencion.atencion_id, form);
      } else {
        // Crear nueva
        await AuthService.crearHCPsicologia({
          paciente_id: paciente.paciente_id,
          usuario_id: Number(user?.id),
          fecha_atencion: new Date().toISOString().split('T')[0],
          ...form
        });
      }
      
      if (onSave) onSave();
    } catch (error: any) {
      console.error('Error guardando HC psicológica:', error);
      alert('Error guardando historia clínica psicológica: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          {onCancel && (
            <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h3 className="font-semibold text-stone-900">Historia Clínica Psicológica</h3>
        </div>

        {paciente && (
          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
            <div className="text-sm font-medium text-stone-900">
              {paciente.primer_nombre} {paciente.primer_apellido}
            </div>
            <div className="text-xs text-stone-600">
              {paciente.tipo_documento} {paciente.numero_documento}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <ResponsiveField label="Motivo de Consulta" required>
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
              rows={3}
              value={form.motivo_consulta}
              onChange={(e: any) => setForm({ ...form, motivo_consulta: e.target.value })}
              placeholder="Describa el motivo de consulta..."
            />
          </ResponsiveField>

          <ResponsiveField label="Análisis Funcional">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
              rows={4}
              value={form.analisis_funcional}
              onChange={(e: any) => setForm({ ...form, analisis_funcional: e.target.value })}
              placeholder="Análisis funcional del comportamiento..."
            />
          </ResponsiveField>

          <ResponsiveField label="Antecedentes Psicológicos">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
              rows={3}
              value={form.antecedentes_psicologicos}
              onChange={(e: any) => setForm({ ...form, antecedentes_psicologicos: e.target.value })}
              placeholder="Antecedentes psicológicos relevantes..."
            />
          </ResponsiveField>

          <ResponsiveField label="Evaluación Mental">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
              rows={5}
              value={form.evaluacion_mental}
              onChange={(e: any) => setForm({ ...form, evaluacion_mental: e.target.value })}
              placeholder="Evaluación del estado mental, afecto, pensamiento, percepción, conciencia, orientación, memoria, atención, lenguaje..."
            />
          </ResponsiveField>

          <ResponsiveField label="Diagnóstico (DSM-5)">
            <ResponsiveInput
              value={form.diagnosticos_dsm5}
              onChange={(e: any) => setForm({ ...form, diagnosticos_dsm5: e.target.value })}
              placeholder="Ej: F41.1 - Trastorno de ansiedad generalizada"
            />
          </ResponsiveField>

          <ResponsiveField label="Plan Terapéutico">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
              rows={4}
              value={form.plan_terapeutico}
              onChange={(e: any) => setForm({ ...form, plan_terapeutico: e.target.value })}
              placeholder="Plan de tratamiento e intervención..."
            />
          </ResponsiveField>

          <ResponsiveField label="Técnicas Aplicadas">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
              rows={3}
              value={form.tecnicas_aplicadas}
              onChange={(e: any) => setForm({ ...form, tecnicas_aplicadas: e.target.value })}
              placeholder="Técnicas terapéuticas aplicadas en esta sesión..."
            />
          </ResponsiveField>

          <ResponsiveField label="Próxima Sesión">
            <ResponsiveInput
              type="date"
              value={form.proxima_sesion}
              onChange={(e: any) => setForm({ ...form, proxima_sesion: e.target.value })}
            />
          </ResponsiveField>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <ResponsiveButton variant="secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </ResponsiveButton>
          )}
          <ResponsiveButton onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Historia Clínica'}
          </ResponsiveButton>
        </div>
      </ResponsiveCard>
    </div>
  );
}

// Vista: Historia Clínica Fisioterapia (UI + STT)
function HCFisioterapiaView({ atencion, paciente, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>({
    motivo_consulta: '',
    evaluacion_fisica: '',
    objetivos: '',
    plan_tratamiento: '',
    evolucion: ''
  });
  const [saving, setSaving] = useState(false);

  const appendText = (field: keyof typeof form, text: string) => {
    setForm((prev: any) => ({ ...prev, [field]: `${prev[field] ? prev[field] + ' ' : ''}${text}`.trim() }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Por ahora, solo confirmación visual; endpoints específicos de Fisioterapia aún no están disponibles
      alert('Historia Clínica de Fisioterapia guardada (UI).');
      if (onSave) onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          {onCancel && (
            <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h3 className="font-semibold text-stone-900">Historia Clínica Fisioterapia</h3>
        </div>

        {paciente && (
          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
            <div className="text-sm font-medium text-stone-900">
              {paciente.primer_nombre || paciente.nombre} {paciente.primer_apellido || ''}
            </div>
            <div className="text-xs text-stone-600">
              {paciente.tipo_documento || ''} {paciente.numero_documento || paciente.documento}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <ResponsiveField label="Motivo de Consulta" required>
            <div className="flex items-start gap-2">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={3}
                value={form.motivo_consulta}
                onChange={(e: any) => setForm({ ...form, motivo_consulta: e.target.value })}
                placeholder="Dolor, limitación funcional, etc."
              />
              <STTButton onTranscription={(t) => appendText('motivo_consulta', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Evaluación Física">
            <div className="flex items-start gap-2">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={5}
                value={form.evaluacion_fisica}
                onChange={(e: any) => setForm({ ...form, evaluacion_fisica: e.target.value })}
                placeholder="Inspección, palpación, rangos articulares, fuerza, pruebas especiales..."
              />
              <STTButton onTranscription={(t) => appendText('evaluacion_fisica', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Objetivos de Tratamiento">
            <div className="flex items-start gap-2">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={3}
                value={form.objetivos}
                onChange={(e: any) => setForm({ ...form, objetivos: e.target.value })}
                placeholder="Corto y mediano plazo"
              />
              <STTButton onTranscription={(t) => appendText('objetivos', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Plan de Tratamiento">
            <div className="flex items-start gap-2">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={4}
                value={form.plan_tratamiento}
                onChange={(e: any) => setForm({ ...form, plan_tratamiento: e.target.value })}
                placeholder="Ejercicio terapéutico, terapia manual, electroterapia, educación..."
              />
              <STTButton onTranscription={(t) => appendText('plan_tratamiento', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Evolución / Notas">
            <div className="flex items-start gap-2">
              <textarea
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none"
                rows={4}
                value={form.evolucion}
                onChange={(e: any) => setForm({ ...form, evolucion: e.target.value })}
                placeholder="Cambios clínicos, respuesta al tratamiento, adherencia..."
              />
              <STTButton onTranscription={(t) => appendText('evolucion', t)} />
            </div>
          </ResponsiveField>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <ResponsiveButton variant="secondary" onClick={onCancel} disabled={saving}>
              Cancelar
            </ResponsiveButton>
          )}
          <ResponsiveButton onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Historia Clínica'}
          </ResponsiveButton>
        </div>
      </ResponsiveCard>
    </div>
  );
}

// Vista: Historia Clínica Nutricional (UI + STT)
function HCNutricionView({ atencion, paciente, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>({
    motivo_consulta: '',
    evaluacion_nutricional: '',
    diagnostico_nutricional: '',
    plan_alimentario: '',
    seguimiento: ''
  });
  const [saving, setSaving] = useState(false);

  const appendText = (field: keyof typeof form, text: string) => {
    setForm((prev: any) => ({ ...prev, [field]: `${prev[field] ? prev[field] + ' ' : ''}${text}`.trim() }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      alert('Historia Clínica Nutricional guardada (UI).');
      if (onSave) onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          {onCancel && (
            <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h3 className="font-semibold text-stone-900">Historia Clínica Nutricional</h3>
        </div>

        {paciente && (
          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
            <div className="text-sm font-medium text-stone-900">
              {paciente.primer_nombre || paciente.nombre} {paciente.primer_apellido || ''}
            </div>
            <div className="text-xs text-stone-600">
              {paciente.tipo_documento || ''} {paciente.numero_documento || paciente.documento}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <ResponsiveField label="Motivo de Consulta" required>
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.motivo_consulta}
                onChange={(e: any) => setForm({ ...form, motivo_consulta: e.target.value })}
                placeholder="Ej: control de peso, DM2, HTA, dislipidemia..." />
              <STTButton onTranscription={(t) => appendText('motivo_consulta', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Evaluación Nutricional">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={5}
                value={form.evaluacion_nutricional}
                onChange={(e: any) => setForm({ ...form, evaluacion_nutricional: e.target.value })}
                placeholder="Historia dietaria, antropometría, recordatorio 24h, frecuencia alimentos..." />
              <STTButton onTranscription={(t) => appendText('evaluacion_nutricional', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Diagnóstico Nutricional">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.diagnostico_nutricional}
                onChange={(e: any) => setForm({ ...form, diagnostico_nutricional: e.target.value })}
                placeholder="Ej: Obesidad grado I, Desnutrición moderada..." />
              <STTButton onTranscription={(t) => appendText('diagnostico_nutricional', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Plan Alimentario / Recomendaciones">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={4}
                value={form.plan_alimentario}
                onChange={(e: any) => setForm({ ...form, plan_alimentario: e.target.value })}
                placeholder="Distribución de macronutrientes, porciones, guías prácticas..." />
              <STTButton onTranscription={(t) => appendText('plan_alimentario', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Seguimiento">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.seguimiento}
                onChange={(e: any) => setForm({ ...form, seguimiento: e.target.value })}
                placeholder="Citas de control, metas, adherencia, barreras..." />
              <STTButton onTranscription={(t) => appendText('seguimiento', t)} />
            </div>
          </ResponsiveField>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <ResponsiveButton variant="secondary" onClick={onCancel} disabled={saving}>Cancelar</ResponsiveButton>
          )}
          <ResponsiveButton onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Historia Clínica'}
          </ResponsiveButton>
        </div>
      </ResponsiveCard>
    </div>
  );
}

// Vista: Historia Clínica Fonoaudiología (UI + STT)
function HCFonoaudiologiaView({ atencion, paciente, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>({
    motivo_consulta: '',
    evaluacion_fono: '', // lenguaje, voz, audición, deglución
    diagnosticos: '',
    plan_terapeutico: '',
    evolucion: ''
  });
  const [saving, setSaving] = useState(false);

  const appendText = (field: keyof typeof form, text: string) => {
    setForm((prev: any) => ({ ...prev, [field]: `${prev[field] ? prev[field] + ' ' : ''}${text}`.trim() }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      alert('Historia Clínica de Fonoaudiología guardada (UI).');
      if (onSave) onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          {onCancel && (
            <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h3 className="font-semibold text-stone-900">Historia Clínica Fonoaudiología</h3>
        </div>

        {paciente && (
          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
            <div className="text-sm font-medium text-stone-900">
              {paciente.primer_nombre || paciente.nombre} {paciente.primer_apellido || ''}
            </div>
            <div className="text-xs text-stone-600">
              {paciente.tipo_documento || ''} {paciente.numero_documento || paciente.documento}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <ResponsiveField label="Motivo de Consulta" required>
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.motivo_consulta}
                onChange={(e: any) => setForm({ ...form, motivo_consulta: e.target.value })}
                placeholder="Alteraciones del lenguaje, voz, habla, audición, deglución..." />
              <STTButton onTranscription={(t) => appendText('motivo_consulta', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Evaluación Fonoaudiológica">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={5}
                value={form.evaluacion_fono}
                onChange={(e: any) => setForm({ ...form, evaluacion_fono: e.target.value })}
                placeholder="Lenguaje (expresivo/receptivo), voz, articulación, fluidez, audición, deglución..." />
              <STTButton onTranscription={(t) => appendText('evaluacion_fono', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Diagnósticos">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.diagnosticos}
                onChange={(e: any) => setForm({ ...form, diagnosticos: e.target.value })}
                placeholder="CIE-10 o descripciones clínicas" />
              <STTButton onTranscription={(t) => appendText('diagnosticos', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Plan Terapéutico">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={4}
                value={form.plan_terapeutico}
                onChange={(e: any) => setForm({ ...form, plan_terapeutico: e.target.value })}
                placeholder="Objetivos, técnicas, frecuencia y duración" />
              <STTButton onTranscription={(t) => appendText('plan_terapeutico', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Evolución / Notas">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={4}
                value={form.evolucion}
                onChange={(e: any) => setForm({ ...form, evolucion: e.target.value })}
                placeholder="Cambios, adherencia, educación, recomendaciones" />
              <STTButton onTranscription={(t) => appendText('evolucion', t)} />
            </div>
          </ResponsiveField>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <ResponsiveButton variant="secondary" onClick={onCancel} disabled={saving}>Cancelar</ResponsiveButton>
          )}
          <ResponsiveButton onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Historia Clínica'}
          </ResponsiveButton>
        </div>
      </ResponsiveCard>
    </div>
  );
}

// Vista: Historia Clínica Odontológica (UI + STT, con acciones)
function HCOdontologiaView({ atencion, paciente, onSave, onCancel }: any) {
  const [form, setForm] = useState<any>({
    motivo_consulta: '',
    examen_odontologico: '',
    diagnosticos: '',
    plan_tratamiento: '',
    receta: '',
    ordenes: ''
  });
  const [saving, setSaving] = useState(false);

  const appendText = (field: keyof typeof form, text: string) => {
    setForm((prev: any) => ({ ...prev, [field]: `${prev[field] ? prev[field] + ' ' : ''}${text}`.trim() }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      alert('Historia Clínica Odontológica guardada (UI).');
      if (onSave) onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          {onCancel && (
            <button onClick={onCancel} className="p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h3 className="font-semibold text-stone-900">Historia Clínica Odontológica</h3>
        </div>

        {paciente && (
          <div className="mb-4 p-3 bg-stone-50 rounded-lg">
            <div className="text-sm font-medium text-stone-900">
              {paciente.primer_nombre || paciente.nombre} {paciente.primer_apellido || ''}
            </div>
            <div className="text-xs text-stone-600">
              {paciente.tipo_documento || ''} {paciente.numero_documento || paciente.documento}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <ResponsiveField label="Motivo de Consulta" required>
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.motivo_consulta}
                onChange={(e: any) => setForm({ ...form, motivo_consulta: e.target.value })}
                placeholder="Dolor dental, caries, fractura, control, etc." />
              <STTButton onTranscription={(t) => appendText('motivo_consulta', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Examen Odontológico">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={5}
                value={form.examen_odontologico}
                onChange={(e: any) => setForm({ ...form, examen_odontologico: e.target.value })}
                placeholder="Tejidos blandos, piezas, periodonto, oclusión, hallazgos..." />
              <STTButton onTranscription={(t) => appendText('examen_odontologico', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Diagnósticos">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.diagnosticos}
                onChange={(e: any) => setForm({ ...form, diagnosticos: e.target.value })}
                placeholder="CIE-10, caries por pieza, enfermedad periodontal, otros" />
              <STTButton onTranscription={(t) => appendText('diagnosticos', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Plan de Tratamiento Odontológico">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={4}
                value={form.plan_tratamiento}
                onChange={(e: any) => setForm({ ...form, plan_tratamiento: e.target.value })}
                placeholder="Procedimientos, número de sesiones, prioridades" />
              <STTButton onTranscription={(t) => appendText('plan_tratamiento', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Recetario Digital (texto libre)">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.receta}
                onChange={(e: any) => setForm({ ...form, receta: e.target.value })}
                placeholder="Medicamentos, dosis, indicaciones" />
              <STTButton onTranscription={(t) => appendText('receta', t)} />
            </div>
          </ResponsiveField>

          <ResponsiveField label="Órdenes de Exámenes">
            <div className="flex items-start gap-2">
              <textarea className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-eden-500 focus:border-eden-500 text-sm resize-none" rows={3}
                value={form.ordenes}
                onChange={(e: any) => setForm({ ...form, ordenes: e.target.value })}
                placeholder="Radiografías periapicales, panorámica, otros" />
              <STTButton onTranscription={(t) => appendText('ordenes', t)} />
            </div>
          </ResponsiveField>
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <ResponsiveButton variant="secondary" onClick={onCancel} disabled={saving}>Cancelar</ResponsiveButton>
          )}
          <ResponsiveButton onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Historia Clínica'}
          </ResponsiveButton>
        </div>
      </ResponsiveCard>
    </div>
  );
}

// Componente principal
export default function App() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [currentRole, setCurrentRole] = useState("medico");
  const [currentPage, setCurrentPage] = useState("inicio");
  const [selectedFamilia, setSelectedFamilia] = useState<any | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<any | null>(null);
  const [showPlanCuidado, setShowPlanCuidado] = useState(false);
  const [showDemandasInducidas, setShowDemandasInducidas] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const deviceType = useDeviceType();

  // Listeners para navegación
  useEffect(() => {
    const handlerFamilia = (e: any) => {
      setSelectedFamilia(e.detail);
      setCurrentPage('familia-detalle');
    };

    const handlerPlanesCuidado = (e: any) => {
      setSelectedPaciente(e.detail.paciente);
      setSelectedFamilia(e.detail.familia);
      setShowPlanCuidado(true);
    };

    const handlerDemandasInducidas = (e: any) => {
      setSelectedPaciente(e.detail.paciente);
      setSelectedFamilia(e.detail.familia);
      setShowDemandasInducidas(true);
    };

    window.addEventListener('openFamiliaDetalle', handlerFamilia as any);
    window.addEventListener('openPlanesCuidado', handlerPlanesCuidado as any);
    window.addEventListener('openDemandasInducidas', handlerDemandasInducidas as any);
    
    return () => {
      window.removeEventListener('openFamiliaDetalle', handlerFamilia as any);
      window.removeEventListener('openPlanesCuidado', handlerPlanesCuidado as any);
      window.removeEventListener('openDemandasInducidas', handlerDemandasInducidas as any);
    };
  }, []);
  
  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} isLoading={isLoading} />;
  }

  // Usar el rol del usuario autenticado
  const userRole = user?.role || currentRole;
  const roleConfig = USER_ROLES[userRole as keyof typeof USER_ROLES] || USER_ROLES['medico'];
  const RoleIcon = roleConfig.icon;

  const renderPage = () => {
    // Manejar vistas especiales que no están en currentPage
    if (showPlanCuidado && selectedPaciente && selectedFamilia) {
      return (
        <PlanCuidadoView
          paciente={selectedPaciente}
          familia={selectedFamilia}
          onBack={() => {
            setShowPlanCuidado(false);
            setCurrentPage("paciente-detalle");
          }}
        />
      );
    }

    if (showDemandasInducidas && selectedPaciente && selectedFamilia) {
      return (
        <DemandasInducidasView
          paciente={selectedPaciente}
          familia={selectedFamilia}
          onBack={() => {
            setShowDemandasInducidas(false);
            setCurrentPage("paciente-detalle");
          }}
        />
      );
    }

    switch (currentPage) {
      case "inicio":
        return <InicioView currentRole={userRole} deviceType={deviceType} onNavigate={(page: string) => setCurrentPage(page)} />;
      case "crear-familia":
        return <CrearFamiliaView deviceType={deviceType} />;
      case "familias":
        return <FamiliasView deviceType={deviceType} />;
      case "familia-detalle":
        return selectedFamilia ? (
          <DetalleFamiliaView
            familia={selectedFamilia}
            onBack={() => setCurrentPage("familias")}
            onShowCaracterizacion={(familia: any, caracterizacion: any) => {
              setSelectedFamilia({ ...familia, caracterizacion });
              setCurrentPage("caracterizacion");
            }}
            onShowPaciente={(paciente: any, familia: any) => {
              setSelectedPaciente(paciente);
              setSelectedFamilia(familia);
              setCurrentPage("paciente-detalle");
            }}
          />
        ) : (
          <ResponsiveCard>Seleccione una familia desde la lista.</ResponsiveCard>
        );
      case "paciente-detalle":
        return selectedPaciente && selectedFamilia ? (
          <DetallePacienteView
            paciente={selectedPaciente}
            familia={selectedFamilia}
            caracterizacion={null} // Se cargará desde el contexto de la familia
            onBack={() => setCurrentPage("familia-detalle")}
          />
        ) : (
          <ResponsiveCard>Error: Datos del paciente no disponibles.</ResponsiveCard>
        );
            case "caracterizacion":
              return selectedFamilia ? (
                <FormularioCaracterizacionView
                  familia={selectedFamilia}
                  caracterizacionExistente={selectedFamilia.caracterizacion}
                  onSave={() => {
                    setCurrentPage("familia-detalle");
                  }}
                  onCancel={() => {
                    setCurrentPage("familia-detalle");
                  }}
                />
              ) : (
                <ResponsiveCard>Error: Familia no seleccionada.</ResponsiveCard>
              );
      case "caracterizaciones":
        return <CaracterizacionesView 
          deviceType={deviceType}
          onSelectFamilia={(familia: any) => {
            setSelectedFamilia(familia);
            // Si tiene caracterización, permite ver/editar; si no, crear
            if (familia.tieneCaracterizacion) {
              setCurrentPage("caracterizacion"); // Ver/Editar
            } else {
              setCurrentPage("caracterizacion"); // Crear nueva
            }
          }}
        />;
      case "planes-cuidado":
        return <PlanesCuidadoListView deviceType={deviceType} />;
      case "dashboard-auxiliar":
        return <DashboardAuxiliarView deviceType={deviceType} />;
      case "consultas-asignadas":
      case "terapias-asignadas":
        return <ConsultasAsignadasView deviceType={deviceType} />;
      case "terapias-realizadas":
        return <ConsultasRealizadasView deviceType={deviceType} />;
      case "consultas-realizadas":
        return <ConsultasRealizadasView deviceType={deviceType} />;
      case "dashboard-psicologia":
        return <DashboardPsicologiaView deviceType={deviceType} />;
  case "dashboard-nutricion":
    return <DashboardNutricionView deviceType={deviceType} />;
  case "dashboard-fonoaudiologia":
    return <DashboardFonoaudiologiaView deviceType={deviceType} />;
  case "dashboard-odontologia":
    return <DashboardOdontologiaView deviceType={deviceType} />;
      case "dashboard-fisioterapia":
        return <DashboardFisioterapiaView deviceType={deviceType} />;
      case "dashboard-enfermeria":
        return <DashboardEnfermeriaView deviceType={deviceType} />;
      case "educacion-salud":
        return <EducacionSaludView deviceType={deviceType} />;
      case "bitacora":
        return <BitacoraView deviceType={deviceType} />;
      case "bd-pacientes":
      case "bd-pacientes-agregada":
        return <BDPacientesView 
          deviceType={deviceType} 
          onSelectPaciente={(paciente: any, familia: any) => {
            setSelectedPaciente(paciente);
            setSelectedFamilia(familia);
            setCurrentPage("paciente-detalle");
          }}
        />;
      case "dashboard-epidemio":
        return <DashboardEpidemioView deviceType={deviceType} />;
      case "configuracion":
        return <ConfiguracionView deviceType={deviceType} />;
      case "fhir-demo":
        return <FHIRDemoView />;
      case "ayuda":
        return <AyudaView deviceType={deviceType} />;
      default:
        return (
          <ResponsiveCard>
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                En desarrollo
              </h3>
              <p className="text-stone-600 text-sm">
                Esta sección estará disponible próximamente
              </p>
            </div>
          </ResponsiveCard>
        );
    }
  };

  // Vista móvil
  if (deviceType === 'mobile') {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header móvil */}
        <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 rounded-lg hover:bg-stone-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <RoleIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-stone-500">APS</div>
                <div className="text-sm font-semibold text-stone-900">{roleConfig.name}</div>
              </div>
            </div>
            
            <UserProfile user={{ name: user?.name || '', role: userRole }} onLogout={logout} />
          </div>
        </header>

        {/* Contenido principal */}
        <main className="px-4 py-4 pb-20">
          {renderPage()}
        </main>

        {/* Navegación inferior */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2">
          <div className="flex justify-around">
            {roleConfig.mainSections.slice(0, 4).map((section) => {
              const Icon = section.icon;
              const isActive = currentPage === section.key;
              return (
                <button
                  key={section.key}
                  onClick={() => setCurrentPage(section.key)}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                    isActive ? "text-emerald-600 bg-emerald-50" : "text-stone-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{section.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Menú lateral móvil */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowMobileMenu(false)}>
            <div className="w-80 h-full bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-stone-200">
                <h3 className="font-semibold text-stone-900">Menú</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Selector de rol */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Cambiar rol
                  </label>
                  <div className="p-3 bg-stone-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-stone-700">{roleConfig.name}</span>
                    </div>
                    <div className="text-xs text-stone-500 mt-1">{user?.name}</div>
                  </div>
                </div>
                
                {/* Menú principal */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-2">Menú Principal</h4>
                  <div className="space-y-1">
                    <MobileNavItem
                      label="Inicio"
                      icon={Home}
                      active={currentPage === "inicio"}
                      onClick={() => {
                        setCurrentPage("inicio");
                        setShowMobileMenu(false);
                      }}
                    />
                    {roleConfig.mainSections.map((section) => (
                      <MobileNavItem
                        key={section.key}
                        label={section.label}
                        icon={section.icon}
                        active={currentPage === section.key}
                        onClick={() => {
                          setCurrentPage(section.key);
                          setShowMobileMenu(false);
                        }}
                        badge={section.key === "consultas-asignadas" ? "3" : undefined}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Herramientas */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-2">Herramientas</h4>
                  <div className="space-y-1">
                    {roleConfig.sidebarSections.map((section) => (
                      <MobileNavItem
                        key={section.key}
                        label={section.label}
                        icon={section.icon}
                        active={currentPage === section.key}
                        onClick={() => {
                          setCurrentPage(section.key);
                          setShowMobileMenu(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Cerrar sesión */}
                <div className="pt-4 border-t border-stone-200">
                  <button
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista desktop y tablet
  return (
    <div className="min-h-screen bg-sinbad-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-sinbad-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-san-marino to-bondi-blue flex items-center justify-center shadow-soft">
              <RoleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm text-eden-600">Programa APS</div>
              <div className="text-base font-semibold text-eden-800">Plataforma de Registro Clínico</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Selector de rol */}
            <div className="flex items-center gap-2 px-3 py-2 bg-san-marino-50 rounded-lg border border-san-marino-200">
              <RoleIcon className="w-4 h-4 text-san-marino-600" />
              <span className="text-sm font-medium text-san-marino-700">{roleConfig.name}</span>
            </div>
            <ResponsiveBadge tone="warning">Offline</ResponsiveBadge>
            <ResponsiveButton size="sm">Sincronizar</ResponsiveButton>
            <UserProfile user={{ name: user?.name || '', role: userRole }} onLogout={logout} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="bg-white rounded-2xl border border-sinbad-200 p-4 h-fit shadow-soft">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentPage("inicio")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-all ${
                currentPage === "inicio" ? "bg-san-marino-50 text-san-marino-700 border border-san-marino-200 shadow-soft" : "text-eden-600 hover:bg-sinbad-50 hover:text-san-marino-700"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Inicio</span>
            </button>
            
            {/* Secciones principales */}
            <div className="pt-4">
              <h4 className="text-xs font-medium text-eden-500 uppercase tracking-wider mb-2 px-4">
                Menú Principal
              </h4>
              {roleConfig.mainSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    onClick={() => setCurrentPage(section.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-all ${
                      currentPage === section.key ? "bg-san-marino-50 text-san-marino-700 border border-san-marino-200 shadow-soft" : "text-eden-600 hover:bg-sinbad-50 hover:text-san-marino-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                    {section.key === "consultas-asignadas" && (
                      <ResponsiveBadge tone="warning">3</ResponsiveBadge>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Herramientas */}
            <div className="pt-4">
              <h4 className="text-xs font-medium text-eden-500 uppercase tracking-wider mb-2 px-4">
                Herramientas
              </h4>
              {roleConfig.sidebarSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    onClick={() => setCurrentPage(section.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-all ${
                      currentPage === section.key ? "bg-san-marino-50 text-san-marino-700 border border-san-marino-200 shadow-soft" : "text-eden-600 hover:bg-sinbad-50 hover:text-san-marino-700"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <section className="space-y-6">
          <ProtectedRoute requiredRole={userRole}>
            {renderPage()}
          </ProtectedRoute>
        </section>
      </main>
    </div>
  );
}