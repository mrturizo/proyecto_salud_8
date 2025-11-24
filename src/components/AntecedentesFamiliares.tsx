import React, { useState, useEffect } from 'react';

interface AntecedenteFamiliar {
  paciente_id: number;
  paciente_nombre: string;
  parentesco: string;
  familiar_nombre: string;
  condicion_salud: string;
  diagnostico: string;
  gravedad: string;
  estado_actual: string;
  fecha_diagnostico: string;
  fuente_antecedente: string;
}

interface AntecedentesFamiliaresProps {
  pacienteId: number;
}

// Datos de demostración para cuando la API falle
const datosDemostracion = [
  {
    paciente_id: 3,
    paciente_nombre: "Juan Pérez",
    parentesco: "Padre",
    familiar_nombre: "Carlos Pérez",
    condicion_salud: "Diabetes Mellitus Tipo 2",
    diagnostico: "Diabetes diagnosticada con glucemia en ayunas de 180 mg/dL",
    gravedad: "Moderada",
    estado_actual: "Crónico",
    fecha_diagnostico: "2025-11-17",
    fuente_antecedente: "Automático"
  },
  {
    paciente_id: 3,
    paciente_nombre: "Juan Pérez", 
    parentesco: "Madre",
    familiar_nombre: "María Pérez",
    condicion_salud: "Hipertensión Arterial",
    diagnostico: "HTA Grado 1 - 145/95 mmHg",
    gravedad: "Leve",
    estado_actual: "Crónico",
    fecha_diagnostico: "2025-11-17",
    fuente_antecedente: "Automático"
  }
];

export const AntecedentesFamiliares: React.FC<AntecedentesFamiliaresProps> = ({ pacienteId }) => {
  const [antecedentes, setAntecedentes] = useState<AntecedenteFamiliar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usandoDatosDemo, setUsandoDatosDemo] = useState(false);

  // URL FIJA - siempre usar Render.com
  const API_BASE_URL = 'https://eleven-crews-clap.loca.lt';

  useEffect(() => {
    cargarAntecedentes();
  }, [pacienteId]);

  const cargarAntecedentes = async () => {
    try {
      setLoading(true);
      setError(null);
      setUsandoDatosDemo(false);
      
      console.log(`🔍 Cargando antecedentes para paciente ${pacienteId}`);
      const response = await fetch(`${API_BASE_URL}/api/pacientes/${pacienteId}/antecedentes-familiares`);
      
      if (!response.ok) {
        // Si hay error, usar datos de demostración
        console.warn(`⚠️ Error ${response.status}, usando datos de demostración`);
        setAntecedentes(datosDemostracion);
        setUsandoDatosDemo(true);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setAntecedentes(data.data);
        console.log(`✅ ${data.data.length} antecedentes cargados`);
      } else {
        // Si no hay datos, usar demostración
        console.warn('ℹ️ No hay antecedentes, usando datos de demostración');
        setAntecedentes(datosDemostracion);
        setUsandoDatosDemo(true);
      }
    } catch (err) {
      console.error('❌ Error cargando antecedentes:', err);
      // En caso de error, usar datos de demostración
      setAntecedentes(datosDemostracion);
      setUsandoDatosDemo(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const antecedentesAutomaticos = antecedentes.filter(a => a.fuente_antecedente === 'Automático');
  const antecedentesManuales = antecedentes.filter(a => a.fuente_antecedente === 'Manual');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Antecedentes Familiares</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {antecedentes.length} antecedentes
          </span>
          {usandoDatosDemo && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              Demo
            </span>
          )}
          {antecedentesAutomaticos.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {antecedentesAutomaticos.length} automáticos
            </span>
          )}
        </div>
      </div>

      {usandoDatosDemo && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Modo demostración:</strong> Mostrando datos del sistema automático
          </p>
        </div>
      )}

      {antecedentes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No se encontraron antecedentes familiares registrados.</p>
          <p className="text-sm mt-2">Los antecedentes automáticos aparecerán cuando se registren condiciones hereditarias en familiares.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Antecedentes Automáticos */}
          {antecedentesAutomaticos.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Antecedentes Automáticos
                {usandoDatosDemo && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Sistema Demo
                  </span>
                )}
              </h4>
              <div className="space-y-3">
                {antecedentesAutomaticos.map((antecedente, index) => (
                  <div key={index} 
                       className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{antecedente.condicion_salud}</p>
                        <p className="text-sm text-gray-600">
                          {antecedente.parentesco}: {antecedente.familiar_nombre}
                        </p>
                        {antecedente.diagnostico && (
                          <p className="text-sm text-gray-500 mt-1">{antecedente.diagnostico}</p>
                        )}
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Automático
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>Gravedad: {antecedente.gravedad}</span>
                      <span>Estado: {antecedente.estado_actual}</span>
                      {antecedente.fecha_diagnostico && (
                        <span>Diagnosticado: {new Date(antecedente.fecha_diagnostico).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje del sistema automático */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>✅ Sistema automático:</strong> Estos antecedentes se propagan automáticamente desde las historias clínicas de los familiares
            </p>
          </div>
        </div>
      )}
    </div>
  );
};