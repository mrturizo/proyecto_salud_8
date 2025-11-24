import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { LoginCredentials } from '../types/auth';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Por favor complete todos los campos');
      return;
    }

    try {
      await onLogin(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Limpiar error al escribir
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bondi-50 via-sinbad-50 to-janna-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-san-marino to-bondi-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-eden-800 mb-2">
            Plataforma APS
          </h1>
          <p className="text-eden-600">
            Sistema de Registro Clínico
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-medium border border-sinbad-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuario */}
            <div>
              <label className="block text-sm font-medium text-eden-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-eden-400" />
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-sinbad-200 rounded-xl focus:ring-2 focus:ring-san-marino focus:border-san-marino transition-colors"
                  placeholder="Ingrese su usuario"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-medium text-eden-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-eden-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-sinbad-200 rounded-xl focus:ring-2 focus:ring-san-marino focus:border-san-marino transition-colors"
                  placeholder="Ingrese su contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-eden-400 hover:text-san-marino transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-eden-50 border border-eden-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-eden-600 flex-shrink-0" />
                <span className="text-sm text-eden-700">{error}</span>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bondi-blue text-white py-3 px-4 rounded-xl font-medium hover:bg-bondi-600 focus:ring-2 focus:ring-bondi-blue focus:ring-offset-2 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};