import { useState } from 'react';
import { Search, FileText, User, Activity, Heart, Pill, FileCheck, Loader2, Info, ChevronDown, ChevronUp, List } from 'lucide-react';
import {
  searchPatients,
  searchEncounters,
  searchConditions,
  searchObservations,
  searchCompositions,
  getPatient,
  getEncounter,
  getCondition,
  getObservation,
  getComposition
} from '../services/fhirService';

const ResponsiveCard = ({ children, className = "" }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border border-stone-200 p-4 md:p-6 ${className}`}>
    {children}
  </div>
);

const ResponsiveButton = ({ children, onClick, disabled = false, variant = "primary", className = "" }: any) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = variant === "primary"
    ? "bg-bondi-600 text-white hover:bg-bondi-700"
    : "bg-stone-100 text-stone-700 hover:bg-stone-200";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default function FHIRDemoView() {
  const [activeTab, setActiveTab] = useState<'patients' | 'encounters' | 'conditions' | 'observations' | 'compositions'>('patients');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('family');
  const [results, setResults] = useState<any[]>([]);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [totalResults, setTotalResults] = useState<number | null>(null);

  const handleSearch = async (paramsOverride?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResource(null);
    setTotalResults(null);

    try {
      let searchParams: Record<string, string> = paramsOverride || {};

      // Si no hay override y hay query, construir params normalmente
      if (!paramsOverride && searchQuery.trim()) {
        switch (activeTab) {
          case 'patients':
            if (searchField === 'family') {
              searchParams = { family: searchQuery };
            } else if (searchField === 'identifier') {
              searchParams = { identifier: searchQuery };
            } else if (searchField === 'gender') {
              searchParams = { gender: searchQuery };
            }
            break;

          case 'encounters':
            if (searchField === 'subject') {
              searchParams = { subject: `Patient/${searchQuery}` };
            } else if (searchField === 'date') {
              searchParams = { date: searchQuery };
            } else if (searchField === 'status') {
              searchParams = { status: searchQuery };
            }
            break;

          case 'conditions':
            if (searchField === 'subject') {
              searchParams = { subject: `Patient/${searchQuery}` };
            } else if (searchField === 'code') {
              searchParams = { code: searchQuery };
            }
            break;

          case 'observations':
            if (searchField === 'subject') {
              searchParams = { subject: `Patient/${searchQuery}` };
            } else if (searchField === 'code') {
              searchParams = { code: searchQuery };
            }
            break;

          case 'compositions':
            if (searchField === 'subject') {
              searchParams = { subject: `Patient/${searchQuery}` };
            }
            break;
        }
      }

      let bundleResult: any;
      switch (activeTab) {
        case 'patients':
          bundleResult = await searchPatients(searchParams);
          break;
        case 'encounters':
          bundleResult = await searchEncounters(searchParams);
          break;
        case 'conditions':
          bundleResult = await searchConditions(searchParams);
          break;
        case 'observations':
          bundleResult = await searchObservations(searchParams);
          break;
        case 'compositions':
          bundleResult = await searchCompositions(searchParams);
          break;
      }

      const entries = bundleResult.bundle?.entry || [];
      setResults(entries.map((e: any) => e.resource));
      setTotalResults(bundleResult.bundle?.total || entries.length);
    } catch (err: any) {
      setError(err.message || 'Error al buscar recursos FHIR');
      console.error('Error buscando:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleListAll = async () => {
    await handleSearch({});
  };

  const handleExampleClick = (exampleValue: string) => {
    setSearchQuery(exampleValue);
  };

  const handleViewDetails = async (resourceId: string) => {
    setLoading(true);
    setError(null);

    try {
      let result;
      switch (activeTab) {
        case 'patients':
          result = await getPatient(resourceId);
          break;
        case 'encounters':
          result = await getEncounter(resourceId);
          break;
        case 'conditions':
          result = await getCondition(resourceId);
          break;
        case 'observations':
          result = await getObservation(resourceId);
          break;
        case 'compositions':
          result = await getComposition(resourceId);
          break;
      }
      setSelectedResource(result.resource);
    } catch (err: any) {
      setError(err.message || 'Error al obtener detalles del recurso');
      console.error('Error obteniendo detalles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSearchFieldOptions = () => {
    switch (activeTab) {
      case 'patients':
        return [
          { value: 'family', label: 'Apellido' },
          { value: 'identifier', label: 'Documento' },
          { value: 'gender', label: 'Género' }
        ];
      case 'encounters':
        return [
          { value: 'subject', label: 'ID Paciente' },
          { value: 'date', label: 'Fecha' },
          { value: 'status', label: 'Estado' }
        ];
      case 'conditions':
        return [
          { value: 'subject', label: 'ID Paciente' },
          { value: 'code', label: 'Código CIE10' }
        ];
      case 'observations':
        return [
          { value: 'subject', label: 'ID Paciente' },
          { value: 'code', label: 'Código LOINC' }
        ];
      case 'compositions':
        return [
          { value: 'subject', label: 'ID Paciente' }
        ];
      default:
        return [];
    }
  };

  const getExamples = () => {
    switch (activeTab) {
      case 'patients':
        if (searchField === 'family') {
          return ['García', 'Rodríguez', 'López'];
        } else if (searchField === 'identifier') {
          return ['1234567890', '9876543210'];
        } else if (searchField === 'gender') {
          return ['male', 'female'];
        }
        return [];
      case 'encounters':
        if (searchField === 'subject') {
          return ['id-1234567890', 'Patient/id-9876543210'];
        } else if (searchField === 'date') {
          return ['2024-01-01', 'ge2024-01-01'];
        } else if (searchField === 'status') {
          return ['finished', 'in-progress'];
        }
        return [];
      case 'conditions':
        if (searchField === 'subject') {
          return ['id-1234567890', 'Patient/id-9876543210'];
        } else if (searchField === 'code') {
          return ['I10', 'E11', 'J44'];
        }
        return [];
      case 'observations':
        if (searchField === 'subject') {
          return ['id-1234567890', 'Patient/id-9876543210'];
        } else if (searchField === 'code') {
          return ['8480-6', '8867-4', '8310-5'];
        }
        return [];
      case 'compositions':
        if (searchField === 'subject') {
          return ['id-1234567890', 'Patient/id-9876543210'];
        }
        return [];
      default:
        return [];
    }
  };

  const formatResourceSummary = (resource: any) => {
    switch (activeTab) {
      case 'patients':
        const name = resource.name?.[0];
        return `${name?.family || ''} ${name?.given?.join(' ') || ''}`.trim() || 'Sin nombre';
      case 'encounters':
        return `${resource.type?.[0]?.text || 'Encounter'} - ${resource.status || 'unknown'}`;
      case 'conditions':
        return `${resource.code?.text || resource.code?.coding?.[0]?.display || 'Condition'}`;
      case 'observations':
        const value = resource.valueQuantity
          ? `${resource.valueQuantity.value} ${resource.valueQuantity.unit || ''}`
          : resource.valueString || 'N/A';
        return `${resource.code?.text || resource.code?.coding?.[0]?.display || 'Observation'}: ${value}`;
      case 'compositions':
        return `${resource.title || 'Composition'} - ${resource.type?.text || 'Documento'}`;
      default:
        return 'Recurso';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <ResponsiveCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900">Demostración de Interoperabilidad FHIR</h2>
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
          >
            <Info className="w-4 h-4" />
            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showInstructions && (
          <div className="mb-6 p-4 bg-bondi-50 border border-bondi-200 rounded-lg text-sm text-stone-700">
            <h3 className="font-semibold text-stone-900 mb-2">¿Cómo usar esta herramienta?</h3>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>Esta herramienta busca recursos FHIR en el servidor HAPI FHIR público (<code className="text-xs bg-white px-1 rounded">https://hapi.fhir.org/baseR4</code>)</li>
              <li>Primero debes sincronizar datos desde la aplicación (crear historias clínicas, recetas, etc.)</li>
              <li>Los recursos sincronizados aparecerán aquí y podrás buscarlos y visualizarlos</li>
              <li>Usa el botón "Listar Todos" para ver todos los recursos disponibles sin filtros</li>
              <li>Haz clic en los botones de ejemplo para pre-llenar el campo de búsqueda</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-bondi-200">
              <p className="font-semibold text-stone-900 mb-1">Tipos de recursos:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Patients:</strong> Pacientes sincronizados</li>
                <li><strong>Encounters:</strong> Consultas/atenciones médicas</li>
                <li><strong>Conditions:</strong> Diagnósticos (CIE10)</li>
                <li><strong>Observations:</strong> Signos vitales y exámenes</li>
                <li><strong>Compositions:</strong> Historias clínicas completas</li>
              </ul>
            </div>
          </div>
        )}

        <p className="text-sm text-stone-600 mb-6">
          Busca y visualiza recursos FHIR sincronizados desde el servidor HAPI FHIR público.
        </p>

        {/* Pestañas */}
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1 mb-4 overflow-x-auto">
          {[
            { key: 'patients' as const, label: 'Patients', icon: User },
            { key: 'encounters' as const, label: 'Encounters', icon: Activity },
            { key: 'conditions' as const, label: 'Conditions', icon: Heart },
            { key: 'observations' as const, label: 'Observations', icon: FileText },
            { key: 'compositions' as const, label: 'Compositions', icon: FileCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setResults([]);
                  setSelectedResource(null);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="flex gap-2 mb-4">
          <select
            value={searchField}
            onChange={(e) => {
              setSearchField(e.target.value);
              setSearchQuery('');
            }}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-bondi-500 focus:border-bondi-500"
          >
            {getSearchFieldOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Buscar por ${getSearchFieldOptions().find(o => o.value === searchField)?.label || 'campo'}...`}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-bondi-500 focus:border-bondi-500"
          />
          <ResponsiveButton onClick={() => handleSearch()} disabled={loading || !searchQuery.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </ResponsiveButton>
          <ResponsiveButton onClick={handleListAll} disabled={loading} variant="secondary" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Listar Todos
          </ResponsiveButton>
        </div>

        {/* Ejemplos interactivos */}
        {getExamples().length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-stone-500 mb-2">Ejemplos:</p>
            <div className="flex flex-wrap gap-2">
              {getExamples().map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
            {error}
          </div>
        )}
      </ResponsiveCard>

      {/* Resultados */}
      {results.length > 0 && (
        <ResponsiveCard>
          <h3 className="font-semibold text-stone-900 mb-4">
            Resultados ({results.length}
            {totalResults !== null && totalResults !== results.length && ` de ${totalResults}`})
          </h3>
          <div className="space-y-2">
            {results.map((resource, index) => (
              <div
                key={resource.id || index}
                className="p-3 border border-stone-200 rounded-lg hover:bg-stone-50 cursor-pointer"
                onClick={() => handleViewDetails(resource.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-stone-900 text-sm">
                      {formatResourceSummary(resource)}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      ID: {resource.id}
                    </p>
                  </div>
                  <FileText className="w-4 h-4 text-stone-400" />
                </div>
              </div>
            ))}
          </div>
        </ResponsiveCard>
      )}

      {/* Detalles del recurso seleccionado */}
      {selectedResource && (
        <ResponsiveCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-900">Detalles del Recurso</h3>
            <button
              onClick={() => setSelectedResource(null)}
              className="text-stone-500 hover:text-stone-700"
            >
              ✕
            </button>
          </div>
          <pre className="bg-stone-50 p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(selectedResource, null, 2)}
          </pre>
        </ResponsiveCard>
      )}

      {results.length === 0 && !loading && !error && (
        <ResponsiveCard>
          <div className="text-center py-8">
            <p className="text-stone-500 mb-2">
              {searchQuery 
                ? 'No se encontraron resultados con los criterios especificados.'
                : 'No hay resultados. Usa la búsqueda o el botón "Listar Todos" para ver recursos disponibles.'}
            </p>
            {searchQuery && (
              <div className="mt-4 text-sm text-stone-600">
                <p className="mb-2">Sugerencias:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>Asegúrate de haber sincronizado datos desde la aplicación</li>
                  <li>Verifica que el formato del valor de búsqueda sea correcto</li>
                  <li>Intenta usar el botón "Listar Todos" para ver qué recursos hay disponibles</li>
                  <li>Usa los ejemplos proporcionados como referencia</li>
                </ul>
              </div>
            )}
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}

