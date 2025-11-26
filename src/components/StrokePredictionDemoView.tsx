import React, { useState, useMemo } from 'react';
import { predictStrokeRisk, StrokePredictionRequest, StrokePredictionResponse } from '../services/aiService';
import { Activity, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ResponsiveCard = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-stone-200 p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

const ResponsiveField = ({ label, children, required = false }: any) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-stone-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

const ResponsiveInput = (props: any) => (
  <input
    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eden-500 focus:border-transparent"
    {...props}
  />
);

const ResponsiveBadge = ({ children, tone = "stone" }: { children: React.ReactNode; tone?: string }) => {
  const toneClasses: any = {
    stone: "bg-stone-100 text-stone-700",
    health: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-rose-100 text-rose-700",
    admin: "bg-blue-100 text-blue-700"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone] || toneClasses.stone}`}>
      {children}
    </span>
  );
};

function StrokePredictionDemoView() {
  // Datos demográficos
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [estadoCivil, setEstadoCivil] = useState<string>('');

  // Signos vitales
  const [tensionSistolica, setTensionSistolica] = useState<string>('');
  const [tensionDiastolica, setTensionDiastolica] = useState<string>('');
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState<string>('');
  const [peso, setPeso] = useState<string>('');
  const [talla, setTalla] = useState<string>('');
  const [glucometria, setGlucometria] = useState<string>('');

  // Antecedentes
  const [antecedentesPersonales, setAntecedentesPersonales] = useState<string>('');
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState<string>('');

  // Caracterización
  const [territorio, setTerritorio] = useState<string>('');
  const [ocupacion, setOcupacion] = useState<string>('');
  const [smokingStatus, setSmokingStatus] = useState<string>('never smoked');

  // Estado de predicción
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StrokePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calcular IMC automáticamente
  const imc = useMemo(() => {
    if (!peso || !talla) return '';
    const pesoNum = parseFloat(peso);
    const tallaNum = parseFloat(talla);
    if (isNaN(pesoNum) || isNaN(tallaNum) || pesoNum <= 0 || tallaNum <= 0) return '';
    
    // Talla puede estar en metros (1.70) o cm (170)
    let tallaEnMetros = tallaNum;
    if (tallaNum > 3) {
      tallaEnMetros = tallaNum / 100;
    }
    
    const imcCalculado = pesoNum / (tallaEnMetros * tallaEnMetros);
    return imcCalculado.toFixed(2);
  }, [peso, talla]);

  const handlePredict = async () => {
    // Validar edad requerida
    if (!age || parseFloat(age) <= 0) {
      setError('La edad es requerida y debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const patientData: StrokePredictionRequest = {
        age: parseFloat(age),
        gender: gender || undefined,
        estadoCivil: estadoCivil || undefined,
        tensionSistolica: tensionSistolica ? parseFloat(tensionSistolica) : undefined,
        tensionDiastolica: tensionDiastolica ? parseFloat(tensionDiastolica) : undefined,
        frecuenciaCardiaca: frecuenciaCardiaca ? parseFloat(frecuenciaCardiaca) : undefined,
        peso: peso ? parseFloat(peso) : undefined,
        talla: talla ? parseFloat(talla) : undefined,
        imc: imc ? parseFloat(imc) : undefined,
        glucometria: glucometria ? parseFloat(glucometria) : undefined,
        antecedentesPersonales: antecedentesPersonales || undefined,
        antecedentesFamiliares: antecedentesFamiliares || undefined,
        territorio: territorio || undefined,
        ocupacion: ocupacion || undefined,
        smokingStatus: smokingStatus || undefined
      };

      const prediction = await predictStrokeRisk(patientData);
      setResult(prediction);
      
      if (!prediction.success) {
        setError(prediction.error || 'Error al realizar la predicción');
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido al realizar la predicción');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeTone = (riskLevel?: string) => {
    if (riskLevel === 'high') return 'critical';
    if (riskLevel === 'medium') return 'warning';
    return 'health';
  };

  const getRiskLabel = (riskLevel?: string) => {
    if (riskLevel === 'high') return 'Alto';
    if (riskLevel === 'medium') return 'Medio';
    return 'Bajo';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-eden-600" />
          <h2 className="text-xl font-semibold text-stone-900">Predicción de Riesgo de ACV (Demo)</h2>
        </div>
        <p className="text-sm text-stone-600 mb-6">
          Complete el formulario con los datos del paciente para obtener una predicción de riesgo de accidente cerebrovascular.
        </p>
      </ResponsiveCard>

      {/* Datos Demográficos */}
      <ResponsiveCard>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Datos Demográficos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResponsiveField label="Edad" required>
            <ResponsiveInput
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Años"
              min="0"
              max="150"
            />
          </ResponsiveField>
          <ResponsiveField label="Género">
            <select
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eden-500 focus:border-transparent"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </ResponsiveField>
          <ResponsiveField label="Estado Civil">
            <select
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eden-500 focus:border-transparent"
              value={estadoCivil}
              onChange={(e) => setEstadoCivil(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              <option value="Soltero">Soltero</option>
              <option value="Casado">Casado</option>
              <option value="Divorciado">Divorciado</option>
              <option value="Viudo">Viudo</option>
            </select>
          </ResponsiveField>
        </div>
      </ResponsiveCard>

      {/* Signos Vitales */}
      <ResponsiveCard>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Signos Vitales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ResponsiveField label="Tensión Sistólica (mmHg)">
            <ResponsiveInput
              type="number"
              value={tensionSistolica}
              onChange={(e) => setTensionSistolica(e.target.value)}
              placeholder="Ej: 120"
            />
          </ResponsiveField>
          <ResponsiveField label="Tensión Diastólica (mmHg)">
            <ResponsiveInput
              type="number"
              value={tensionDiastolica}
              onChange={(e) => setTensionDiastolica(e.target.value)}
              placeholder="Ej: 80"
            />
          </ResponsiveField>
          <ResponsiveField label="Frecuencia Cardíaca (bpm)">
            <ResponsiveInput
              type="number"
              value={frecuenciaCardiaca}
              onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
              placeholder="Ej: 72"
            />
          </ResponsiveField>
          <ResponsiveField label="Glucometría (mg/dL)">
            <ResponsiveInput
              type="number"
              value={glucometria}
              onChange={(e) => setGlucometria(e.target.value)}
              placeholder="Ej: 100"
            />
          </ResponsiveField>
          <ResponsiveField label="Peso (kg)">
            <ResponsiveInput
              type="number"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ej: 70"
              step="0.1"
            />
          </ResponsiveField>
          <ResponsiveField label="Talla (cm o m)">
            <ResponsiveInput
              type="number"
              value={talla}
              onChange={(e) => setTalla(e.target.value)}
              placeholder="Ej: 170 o 1.70"
              step="0.01"
            />
          </ResponsiveField>
          <ResponsiveField label="IMC (calculado)">
            <ResponsiveInput
              type="text"
              value={imc || ''}
              disabled
              className="bg-stone-100"
              placeholder="Se calcula automáticamente"
            />
          </ResponsiveField>
        </div>
      </ResponsiveCard>

      {/* Antecedentes */}
      <ResponsiveCard>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Antecedentes</h3>
        <div className="space-y-4">
          <ResponsiveField label="Antecedentes Personales">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eden-500 focus:border-transparent"
              rows={4}
              value={antecedentesPersonales}
              onChange={(e) => setAntecedentesPersonales(e.target.value)}
              placeholder="Ej: Hipertensión, diabetes, enfermedad cardiaca..."
            />
          </ResponsiveField>
          <ResponsiveField label="Antecedentes Familiares">
            <textarea
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eden-500 focus:border-transparent"
              rows={4}
              value={antecedentesFamiliares}
              onChange={(e) => setAntecedentesFamiliares(e.target.value)}
              placeholder="Ej: Historia familiar de ACV, enfermedad cardiaca..."
            />
          </ResponsiveField>
        </div>
      </ResponsiveCard>

      {/* Caracterización */}
      <ResponsiveCard>
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Caracterización</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResponsiveField label="Territorio">
            <ResponsiveInput
              type="text"
              value={territorio}
              onChange={(e) => setTerritorio(e.target.value)}
              placeholder="Ej: Urbano, Rural, Comuna 5..."
            />
          </ResponsiveField>
          <ResponsiveField label="Ocupación">
            <ResponsiveInput
              type="text"
              value={ocupacion}
              onChange={(e) => setOcupacion(e.target.value)}
              placeholder="Ej: Empleado, Independiente, Estudiante..."
            />
          </ResponsiveField>
          <ResponsiveField label="Estado de Tabaquismo">
            <select
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eden-500 focus:border-transparent"
              value={smokingStatus}
              onChange={(e) => setSmokingStatus(e.target.value)}
            >
              <option value="never smoked">Nunca fumó</option>
              <option value="formerly smoked">Ex-fumador</option>
              <option value="smokes">Fuma actualmente</option>
            </select>
          </ResponsiveField>
        </div>
      </ResponsiveCard>

      {/* Botón de predicción */}
      <ResponsiveCard>
        <button
          onClick={handlePredict}
          disabled={loading || !age}
          className="w-full md:w-auto px-6 py-3 bg-eden-600 text-white rounded-lg font-medium hover:bg-eden-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Calculando predicción...</span>
            </>
          ) : (
            <>
              <Activity className="w-5 h-5" />
              <span>Predecir Riesgo ACV</span>
            </>
          )}
        </button>
      </ResponsiveCard>

      {/* Error */}
      {error && (
        <ResponsiveCard className="border-rose-200 bg-rose-50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-rose-900 mb-1">Error</h4>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
        </ResponsiveCard>
      )}

      {/* Resultados */}
      {result && result.success && (
        <ResponsiveCard className="border-emerald-200 bg-emerald-50">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-900">Resultado de la Predicción</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-emerald-700 mb-2">Nivel de Riesgo</p>
                <ResponsiveBadge tone={getRiskBadgeTone(result.risk_level)}>
                  {getRiskLabel(result.risk_level)}
                </ResponsiveBadge>
              </div>
              <div>
                <p className="text-sm text-emerald-700 mb-2">Probabilidad</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {(result.probability ? result.probability * 100 : 0).toFixed(1)}%
                </p>
              </div>
            </div>

            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium text-emerald-900 mb-2">Recomendaciones</p>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}

export default StrokePredictionDemoView;

