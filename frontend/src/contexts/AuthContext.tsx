import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (err) {
          console.error('Failed to get user profile:', err);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext: Iniciando login...', { email });
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔐 AuthContext: Chamando authService.login...');
      await authService.login(email, password);
      console.log('✅ AuthContext: Login bem-sucedido, buscando perfil...');

      // Após login bem-sucedido, buscar dados do usuário
      const userData = await authService.getProfile();
      console.log('✅ AuthContext: Dados do usuário obtidos:', userData);
      setUser(userData);
      console.log('✅ AuthContext: Login completo!');
    } catch (err: any) {
      console.error('❌ AuthContext: Erro no login:', err);
      console.error('❌ AuthContext: Response data:', err.response?.data);
      console.error('❌ AuthContext: Status:', err.response?.status);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to login. Please try again.';
      console.error('❌ AuthContext: Error message:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };const googleLogin = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.googleLogin(token);
      // Após login bem-sucedido, buscar dados do usuário
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login with Google. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(name, email, password);
      // Após o registro, fazer login automaticamente
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };
  const clearError = () => {
    setError(null);
  };

  // Evitar re-renders desnecessários com useMemo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contextValue = React.useMemo(() => ({
    user,
    isLoading,
    error,
    login,
    googleLogin,
    register,
    logout,
    clearError,
  }), [user, isLoading, error]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
