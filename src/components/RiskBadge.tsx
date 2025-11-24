import React from 'react';

interface RiskBadgeProps {
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  className?: string;
}

/**
 * Componente para mostrar badge de riesgo de stroke
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  riskLevel, 
  probability, 
  className = '' 
}) => {
  const getRiskConfig = () => {
    switch (riskLevel) {
      case 'high':
        return {
          label: 'Riesgo Alto',
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: '⚠️'
        };
      case 'medium':
        return {
          label: 'Riesgo Moderado',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: '⚠️'
        };
      case 'low':
        return {
          label: 'Riesgo Bajo',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: '✅'
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: '❓'
        };
    }
  };

  const config = getRiskConfig();
  const percentage = (probability * 100).toFixed(1);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color} ${className}`}>
      <span className="text-sm font-medium">{config.icon} {config.label}</span>
      <span className="text-xs opacity-75">({percentage}%)</span>
    </div>
  );
};

export default RiskBadge;

