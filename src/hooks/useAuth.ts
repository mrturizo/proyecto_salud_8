import { useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials } from '../types/auth';
import { AuthService } from '../services/authService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Verificar sesión existente al cargar
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setAuthState({
      user,
      isAuthenticated: !!user,
      isLoading: false
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await AuthService.login(credentials);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }, []);

  return {
    ...authState,
    login,
    logout
  };
};