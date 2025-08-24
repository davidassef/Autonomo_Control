import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "../types";
import { authService } from "../services/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    securityQuestions: Array<{ question_id: number; answer: string }>,
    optionalFields?: any,
  ) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
          console.error("Failed to get user profile:", err);
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log("🔐 AuthContext: Iniciando login...", { email });
    setIsLoading(true);
    setError(null);
    try {
      console.log("🔐 AuthContext: Chamando authService.login...");
      await authService.login(email, password);
      console.log("✅ AuthContext: Login bem-sucedido, buscando perfil...");

      // Após login bem-sucedido, buscar dados do usuário
      const userData = await authService.getProfile();
      console.log("✅ AuthContext: Dados do usuário obtidos:", userData);
      setUser(userData);
      console.log("✅ AuthContext: Login completo!");
    } catch (err: any) {
      console.error("❌ AuthContext: Erro no login:", err);
      console.error("❌ AuthContext: Response data:", err.response?.data);
      console.error("❌ AuthContext: Status:", err.response?.status);
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        "Failed to login. Please try again.";
      console.error("❌ AuthContext: Error message:", errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.googleLogin(token);
      // Após login bem-sucedido, buscar dados do usuário
      const userData = await authService.getProfile();
      setUser(userData);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to login with Google. Please try again.",
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      securityQuestions: Array<{ question_id: number; answer: string }>,
      optionalFields?: any,
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const userData = await authService.register(
          name,
          email,
          password,
          securityQuestions,
          optionalFields,
        );
        // O registro já faz login automaticamente no authService
        setUser(userData);
      } catch (err: any) {
        console.error("Registration error:", err);

        // Tratamento específico de erros
        let errorMessage = "Falha no registro. Tente novamente.";

        if (err.response?.status === 400) {
          errorMessage =
            err.response.data?.detail ||
            "Email já está em uso ou dados inválidos.";
        } else if (err.response?.status === 422) {
          // Erro de validação - pode ser um array de erros do Pydantic
          if (Array.isArray(err.response.data?.detail)) {
            const validationErrors = err.response.data.detail
              .map((error: any) => {
                const field = error.loc?.[error.loc.length - 1] || "campo";
                return `${field}: ${error.msg}`;
              })
              .join(", ");
            errorMessage = `Erro de validação: ${validationErrors}`;
          } else {
            errorMessage =
              err.response.data?.detail || "Dados de registro inválidos.";
          }
        } else if (err.response?.status >= 500) {
          errorMessage =
            "Erro interno do servidor. Tente novamente mais tarde.";
        } else if (!err.response) {
          errorMessage = "Erro de conexão. Verifique sua internet.";
        }

        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Evitar re-renders desnecessários com useMemo
  const contextValue = React.useMemo(
    () => ({
      user,
      isLoading,
      error,
      login,
      googleLogin,
      register,
      logout,
      clearError,
    }),
    [user, isLoading, error, login, googleLogin, register, logout, clearError],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
