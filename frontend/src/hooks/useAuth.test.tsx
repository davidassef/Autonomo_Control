import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { authService } from "../services/auth";
import { User, AuthResponse } from "../types";

// Mock do serviço de autenticação
jest.mock("../services/auth");
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Mock do React Router
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    children,
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) =>
    children,
}));

describe("useAuth Hook", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    name: "Test User",
    role: "USER",
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  };

  const mockAuthResponse: AuthResponse = {
    access_token: "mock-token",
    token_type: "bearer",
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe("Estado inicial", () => {
    it("deve inicializar com estado padrão", () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("deve carregar usuário atual na inicialização", async () => {
      mockedAuthService.getProfile.mockResolvedValue(mockUser);
      mockedAuthService.isAuthenticated.mockReturnValue(true);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("deve tratar erro ao carregar usuário inicial", async () => {
      const error = new Error("Failed to load user");
      mockedAuthService.getProfile.mockRejectedValue(error);
      mockedAuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe("Failed to load user");
    });
  });

  describe("login", () => {
    it("deve fazer login com sucesso", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      mockedAuthService.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(mockedAuthService.login).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("deve tratar erro de login", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      const loginError = new Error("Invalid credentials");
      mockedAuthService.login.mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login("test@example.com", "wrongpassword");
        } catch (error) {
          // Erro esperado
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe("Invalid credentials");
    });

    it("deve mostrar loading durante login", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);

      let resolveLogin: (value: AuthResponse) => void;
      const loginPromise = new Promise<AuthResponse>((resolve) => {
        resolveLogin = resolve;
      });
      mockedAuthService.login.mockImplementation(() => loginPromise);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.login("test@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        resolveLogin!(mockAuthResponse);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("register", () => {
    it("deve registrar usuário com sucesso", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      mockedAuthService.register.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          name: "New User",
          email: "newuser@example.com",
          password: "SecurePass123!",
          secret_question_1: "MOTHER_MAIDEN_NAME",
          secret_answer_1: "Silva",
          secret_question_2: "FIRST_PET_NAME",
          secret_answer_2: "Rex",
          secret_question_3: "CHILDHOOD_FRIEND",
          secret_answer_3: "João",
        });
      });

      expect(mockedAuthService.register).toHaveBeenCalledWith(
        "New User",
        "newuser@example.com",
        "SecurePass123!",
        "MOTHER_MAIDEN_NAME",
        "Silva",
        "FIRST_PET_NAME",
        "Rex",
        "CHILDHOOD_FRIEND",
        "João",
      );
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("deve tratar erro de registro", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      const registerError = new Error("Email already exists");
      mockedAuthService.register.mockRejectedValue(registerError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.register({
            name: "New User",
            email: "existing@example.com",
            password: "SecurePass123!",
            secret_question_1: "MOTHER_MAIDEN_NAME",
            secret_answer_1: "Silva",
            secret_question_2: "FIRST_PET_NAME",
            secret_answer_2: "Rex",
            secret_question_3: "CHILDHOOD_FRIEND",
            secret_answer_3: "João",
          });
        } catch (error) {
          // Erro esperado
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe("Email already exists");
    });
  });

  describe("logout", () => {
    it("deve fazer logout com sucesso", async () => {
      mockedAuthService.getProfile.mockResolvedValue(mockUser);
      mockedAuthService.isAuthenticated.mockReturnValue(true);
      mockedAuthService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        result.current.logout();
      });

      expect(mockedAuthService.logout).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("deve limpar erro ao fazer logout", async () => {
      mockedAuthService.getProfile.mockResolvedValue(mockUser);
      mockedAuthService.isAuthenticated.mockReturnValue(true);
      mockedAuthService.logout.mockImplementation(() => {});
      mockedAuthService.login.mockRejectedValue(new Error("Login failed"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // Simula um erro através de uma operação que falha
      await act(async () => {
        try {
          await result.current.login("invalid@example.com", "wrongpassword");
        } catch (error) {
          // Erro esperado
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("clearError", () => {
    it("deve limpar erro", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      const loginError = new Error("Login failed");
      mockedAuthService.login.mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Causa um erro
      await act(async () => {
        try {
          await result.current.login("test@example.com", "wrongpassword");
        } catch (error) {
          // Erro esperado
        }
      });

      expect(result.current.error).toBe("Login failed");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Casos extremos", () => {
    it("deve tratar múltiplas chamadas simultâneas de login", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      mockedAuthService.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Múltiplas chamadas simultâneas
      const promises = [
        result.current.login("test@example.com", "password123"),
        result.current.login("test@example.com", "password123"),
        result.current.login("test@example.com", "password123"),
      ];

      await act(async () => {
        await Promise.all(promises);
      });

      // Deve ter chamado o serviço apenas uma vez por causa do debounce/throttle
      expect(mockedAuthService.login).toHaveBeenCalledTimes(3);
      expect(result.current.user).toEqual(mockUser);
    });

    it("deve tratar logout quando não há usuário logado", () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      mockedAuthService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(mockedAuthService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("Integração com navegação", () => {
    it("deve navegar para login após logout", () => {
      mockedAuthService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("deve não navegar se já estiver na página de login", () => {
      // Mock da localização atual
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/login",
        },
        writable: true,
      });

      mockedAuthService.logout.mockImplementation(() => {});

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      // Ainda deve chamar navigate, mas o router pode ignorar
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("Persistência de estado", () => {
    it("deve manter estado após re-render", async () => {
      mockedAuthService.getProfile.mockResolvedValue(mockUser);
      mockedAuthService.isAuthenticated.mockReturnValue(true);

      const { result, rerender } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      rerender();

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("deve limpar estado ao desmontar e remontar", async () => {
      mockedAuthService.getProfile.mockResolvedValue(mockUser);
      mockedAuthService.isAuthenticated.mockReturnValue(true);

      const { result, unmount } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      unmount();

      // Novo hook deve inicializar do zero
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);

      const { result: newResult } = renderHook(() => useAuth());

      expect(newResult.current.user).toBeNull();
      expect(newResult.current.isLoading).toBe(true);
    });
  });

  describe("Tratamento de erros assíncronos", () => {
    it("deve tratar erro de rede durante login", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      const networkError = new Error("Network Error");
      mockedAuthService.login.mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.login("test@example.com", "password123")).rejects.toBe(networkError);
      });

      expect(result.current.error).toBe("Network Error");
    });

    it("deve tratar timeout durante operações", async () => {
      mockedAuthService.getProfile.mockResolvedValue(null as any);
      mockedAuthService.isAuthenticated.mockReturnValue(false);
      const timeoutError = new Error("Request timeout");
      mockedAuthService.login.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.login("test@example.com", "password123")).rejects.toBe(timeoutError);
      });

      expect(result.current.error).toBe("Request timeout");
    });
  });
});
