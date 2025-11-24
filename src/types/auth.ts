export interface User {
  id: string;
  username: string;
  role: string;
  name: string;
  email?: string;
  team?: string;
  document?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}