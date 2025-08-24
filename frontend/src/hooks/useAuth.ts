import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth";
import { User } from "../types";

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

/**
 * Hook personalizado para gerenciar autenticação
 * @returns Objeto com estado e funções de autenticação
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = user !== null;

  // Carrega usuário inicial
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getProfile();
          setUser(currentUser);
        }
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
        setError("Erro ao carregar dados do usuário");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.login(email, password);
        setUser(response.user);

        // Redireciona baseado no tipo de usuário
        if (response.user.role === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } catch (err: any) {
        setError(err.message || "Erro ao fazer login");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const register = useCallback(
    async (userData: any) => {
      try {
        setIsLoading(true);
        setError(null);

        const { name, email, password, securityQuestions, optionalFields } =
          userData;
        const response = await authService.register(
          name,
          email,
          password,
          securityQuestions,
          optionalFields,
        );
        setUser(response);

        navigate("/dashboard");
      } catch (err: any) {
        setError(err.message || "Erro ao registrar usuário");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
    navigate("/login");
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};
