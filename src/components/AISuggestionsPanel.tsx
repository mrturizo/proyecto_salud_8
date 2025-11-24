import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AISuggestionsPanelProps {
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  className?: string;
}

/**
 * Panel que muestra recomendaciones basadas en predicción de IA
 */
export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  recommendations,
  riskLevel,
  className = ''
}) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const getIcon = () => {
    switch (riskLevel) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPanelColor = () => {
    switch (riskLevel) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getPanelColor()} ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {getIcon()}
        <h4 className="font-semibold text-stone-900">
          Recomendaciones basadas en análisis de IA
        </h4>
      </div>
      <ul className="space-y-2">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-stone-700">
            <span className="text-stone-400 mt-1">•</span>
            <span>{recommendation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AISuggestionsPanel;

