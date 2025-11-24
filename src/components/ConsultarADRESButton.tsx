import React, { useState } from 'react';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { DatosADRES } from '../types/adres';

interface ConsultarADRESButtonProps {
  numeroDocumento: string;
  tipoDocumento?: string;
  onDatosEncontrados: (datos: DatosADRES | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente botón para consultar datos de paciente desde ADRES
 * Muestra estados de carga, éxito y error
 */
export const ConsultarADRESButton: React.FC<ConsultarADRESButtonProps> = ({
  numeroDocumento,
  tipoDocumento = 'CC',
  onDatosEncontrados,
  disabled = false,
  className = ''
}) => {
  const [consultando, setConsultando] = useState(false);
  const [estado, setEstado] = useState<'idle' | 'success' | 'error' | 'not_found'>('idle');

  const handleConsultar = async () => {
    if (!numeroDocumento || numeroDocumento.trim().length < 5) {
      alert('Por favor ingresa un número de documento válido (mínimo 5 caracteres)');
      return;
    }

    try {
      setConsultando(true);
      setEstado('idle');

      const respuesta = await AuthService.consultarADRES(numeroDocumento.trim(), tipoDocumento);

      if (respuesta.success && respuesta.datos) {
        setEstado('success');
        onDatosEncontrados(respuesta.datos);
        // Resetear estado después de 2 segundos
        setTimeout(() => setEstado('idle'), 2000);
      } else {
        // Verificar si es un error de configuración
        if ((respuesta as any).requiere_configuracion) {
          // Fallback: ofrecer modo manual (scraper) si no hay API key
          const usarManual = window.confirm(
            'La integración con ADRES no está configurada.\n\n' +
            '¿Deseas usar el modo manual (scraper)?\n' +
            'Se abrirá un navegador en el servidor y te pedirá el captcha en la consola del backend.\n\n' +
            'Presiona Aceptar para iniciar.'
          );
          if (usarManual) {
            try {
              await AuthService.iniciarScraperADRES(numeroDocumento.trim(), tipoDocumento);
              alert('Scraper iniciado. Ve a la consola del backend, escribe el captcha cuando lo pida y vuelve aquí. Intentaré obtener el resultado automáticamente.');
              
              // Polling del resultado por hasta 4 minutos
              const timeoutMs = 240000;
              const delayMs = 2000;
              const start = Date.now();
              let obtenido = false;

              while (Date.now() - start < timeoutMs) {
                await new Promise(r => setTimeout(r, delayMs));
                const r: any = await AuthService.obtenerResultadoScraperADRES();
                // Soportar ambas formas: { success:true, result:{...} } o directamente { status:'success', ... }
                const result: any = (r && (r as any).result) ? (r as any).result : r;
                if (result && (result.status === 'success' || (result.nombre || result.eps || result.regimen))) {
                  // Normalizar fecha (DD/MM/YYYY -> YYYY-MM-DD) y filtrar valores ocultos (**/**/**)
                  const normalizarFecha = (s?: string | null) => {
                    if (!s) return null;
                    if (s.includes('*')) return null;
                    const v = String(s).trim();
                    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
                    const m1 = v.match(ddmmyyyy);
                    if (m1) return `${m1[3]}-${m1[2]}-${m1[1]}`;
                    if (yyyymmdd.test(v)) return v;
                    return null;
                  };

                  if (result.status === 'success') {
                    const datos = {
                      nombres: result.nombre || '',
                      apellidos: result.apellidos || '',
                      tipo_documento: result.tipo_documento || tipoDocumento,
                      numero_documento: result.documento || numeroDocumento,
                      eps: result.eps || null,
                      regimen: result.regimen || null,
                      estado_afiliacion: result.estado || null,
                      tipo_afiliado: result.tipo_afiliado || null,
                      fecha_nacimiento: normalizarFecha(result.fecha_nacimiento) 
                    } as DatosADRES;
                    setEstado('success');
                    onDatosEncontrados(datos);
                    obtenido = true;
                    break;
                  }
                  if (result.status === 'error') {
                    setEstado('error');
                    alert(result.message || 'Error al consultar ADRES mediante scraper');
                    obtenido = true;
                    break;
                  }
                  if (result.status === 'not_found') {
                    setEstado('not_found');
                    onDatosEncontrados(null);
                    alert('No se encontró información del paciente (scraper)');
                    obtenido = true;
                    break;
                  }
                }
              }

              if (!obtenido) {
                setEstado('error');
                alert('No se obtuvo resultado del scraper a tiempo. Intenta nuevamente.');
              }
            } catch (e: any) {
              setEstado('error');
              alert(`No se pudo iniciar el scraper: ${e?.message || 'Error desconocido'}`);
            }
          } else {
            setEstado('error');
            alert(
              'La integración con ADRES no está configurada.\n\n' +
              'Para activar la consulta automática de datos:\n' +
              '1. Obtén una API key de Apitude (https://apitude.co)\n' +
              '2. Agrega APITUDE_API_KEY=tu_api_key en backend/.env\n' +
              '3. Reinicia el servidor backend\n\n' +
              'Mientras tanto, puedes ingresar los datos manualmente.'
            );
          }
        } else {
          setEstado('not_found');
          onDatosEncontrados(null);
          alert(respuesta.message || 'No se encontró información del paciente en ADRES. Puede ingresar los datos manualmente.');
        }
        setTimeout(() => setEstado('idle'), 3000);
      }
    } catch (error: any) {
      console.error('Error consultando ADRES:', error);
      setEstado('error');
      
      // Verificar si es un error de configuración
      if (error.message && error.message.includes('503')) {
        alert(
          'La integración con ADRES no está configurada.\n\n' +
          'Para activar la consulta automática:\n' +
          '1. Obtén una API key de Apitude\n' +
          '2. Agrega APITUDE_API_KEY en backend/.env\n' +
          '3. Reinicia el servidor\n\n' +
          'Puedes ingresar los datos manualmente mientras tanto.'
        );
      } else {
        alert(`Error consultando ADRES: ${error.message || 'Error desconocido'}`);
      }
      setTimeout(() => setEstado('idle'), 3000);
    } finally {
      setConsultando(false);
    }
  };

  const isDisabled = disabled || consultando || !numeroDocumento || numeroDocumento.trim().length < 5;

  const getButtonContent = () => {
    if (consultando) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Consultando...</span>
        </>
      );
    }

    if (estado === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Encontrado</span>
        </>
      );
    }

    if (estado === 'error' || estado === 'not_found') {
      return (
        <>
          <XCircle className="w-4 h-4" />
          <span>No encontrado</span>
        </>
      );
    }

    return (
      <>
        <Search className="w-4 h-4" />
        <span>Consultar ADRES</span>
      </>
    );
  };

  const getButtonStyle = () => {
    if (estado === 'success') {
      return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300';
    }
    if (estado === 'error' || estado === 'not_found') {
      return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300';
    }
    return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-300';
  };

  return (
    <button
      type="button"
      onClick={handleConsultar}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        rounded-lg text-sm font-medium
        transition-colors border
        ${getButtonStyle()}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isDisabled ? 'Ingresa un número de documento válido' : 'Consultar datos del paciente desde ADRES'}
    >
      {getButtonContent()}
    </button>
  );
};

export default ConsultarADRESButton;

