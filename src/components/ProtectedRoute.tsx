import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { AuthService } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback 
}) => {
  const user = AuthService.getCurrentUser();

  // Si no hay usuario autenticado
  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-stone-600">
            Debe iniciar sesión para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-stone-600 mb-4">
            No tiene permisos para acceder a esta sección.
          </p>
          <div className="text-sm text-stone-500">
            <p><strong>Usuario:</strong> {user.name}</p>
            <p><strong>Rol actual:</strong> {user.role}</p>
            {requiredRole && <p><strong>Rol requerido:</strong> {requiredRole}</p>}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};