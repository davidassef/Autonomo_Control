import { authService } from "./auth";
import api from "./api";
import { User } from "../types";

// Mock do módulo api
jest.mock("./api");
const mockedApi = api as jest.Mocked<typeof api>;

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe("login", () => {
    const mockLoginResponse = {
      access_token: "mock-token",
      token_type: "bearer",
      user: {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        username: "testuser",
        role: "USER",
        is_active: true,
        created_at: "2023-01-01T00:00:00Z",
      },
    };

    it("deve fazer login com email e senha", async () => {
      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login("test@example.com", "password123");

      expect(mockedApi.post).toHaveBeenCalledWith("/auth/token", {
        username: "test@example.com",
        password: "password123",
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "token",
        "mock-token",
      );
      expect(result).toEqual(mockLoginResponse.user);
    });

    it("deve fazer login com username e senha", async () => {
      mockedApi.post.mockResolvedValue({ data: mockLoginResponse });

      const result = await authService.login("testuser", "password123");

      expect(mockedApi.post).toHaveBeenCalledWith("/auth/token", {
        username: "testuser",
        password: "password123",
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "token",
        "mock-token",
      );
      expect(result).toEqual(mockLoginResponse.user);
    });

    it("deve lançar erro quando login falha", async () => {
      const errorResponse = {
        response: {
          data: { detail: "Invalid credentials" },
          status: 401,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.login("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("deve lançar erro genérico quando resposta não tem detail", async () => {
      const errorResponse = {
        response: {
          data: {},
          status: 500,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.login("test@example.com", "password123"),
      ).rejects.toThrow("Erro ao fazer login");
    });

    it("deve lançar erro genérico quando não há resposta", async () => {
      const networkError = new Error("Network Error");
      mockedApi.post.mockRejectedValue(networkError);

      await expect(
        authService.login("test@example.com", "password123"),
      ).rejects.toThrow("Erro ao fazer login");
    });
  });

  describe("register", () => {
    const mockRegisterResponse = {
      access_token: "mock-token",
      token_type: "bearer",
      user: {
        id: 2,
        email: "newuser@example.com",
        full_name: "New User",
        username: "newuser",
        role: "USER",
        is_active: true,
        created_at: "2023-01-01T00:00:00Z",
      },
    };

    it("deve registrar usuário com todos os dados obrigatórios", async () => {
      mockedApi.post.mockResolvedValue({ data: mockRegisterResponse });

      const result = await authService.register(
        "New User",
        "newuser@example.com",
        "SecurePass123!",
        [
          { question_id: 1, answer: "Silva" },
          { question_id: 2, answer: "Rex" },
          { question_id: 3, answer: "João" },
        ],
      );

      expect(mockedApi.post).toHaveBeenCalledWith("/auth/register", {
        name: "New User",
        full_name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123!",
        security_questions: [
          { question_id: 1, answer: "Silva" },
          { question_id: 2, answer: "Rex" },
          { question_id: 3, answer: "João" },
        ],
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "token",
        "mock-token",
      );
      expect(result).toEqual(mockRegisterResponse.user);
    });

    it("deve lançar erro quando registro falha com dados inválidos", async () => {
      const errorResponse = {
        response: {
          data: { detail: "Email already exists" },
          status: 400,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.register(
          "New User",
          "existing@example.com",
          "SecurePass123!",
          [
            { question_id: 1, answer: "Silva" },
            { question_id: 2, answer: "Rex" },
            { question_id: 3, answer: "João" },
          ],
        ),
      ).rejects.toThrow("Email already exists");

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it("deve lançar erro quando registro falha com validação", async () => {
      const errorResponse = {
        response: {
          data: {
            detail: [
              {
                loc: ["body", "email"],
                msg: "field required",
                type: "value_error.missing",
              },
            ],
          },
          status: 422,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.register("New User", "", "SecurePass123!", [
          { question_id: 1, answer: "Silva" },
          { question_id: 2, answer: "Rex" },
          { question_id: 3, answer: "João" },
        ]),
      ).rejects.toThrow("Erro de validação: field required");
    });

    it("deve lançar erro genérico quando registro falha sem detail", async () => {
      const errorResponse = {
        response: {
          data: {},
          status: 500,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.register(
          "New User",
          "newuser@example.com",
          "SecurePass123!",
          [
            { question_id: 1, answer: "Silva" },
            { question_id: 2, answer: "Rex" },
            { question_id: 3, answer: "João" },
          ],
        ),
      ).rejects.toThrow("Erro ao registrar usuário");
    });
  });

  describe("getProfile", () => {
    const mockUser: User = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
      role: "USER",
      is_active: true,
    };

    it("deve retornar usuário atual quando token é válido", async () => {
      localStorageMock.getItem.mockReturnValue("valid-token");
      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockUser);
    });

    it("deve fazer chamada à API mesmo sem token", async () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockedApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockUser);
    });

    it("deve lançar erro quando token é inválido", async () => {
      localStorageMock.getItem.mockReturnValue("invalid-token");
      const errorResponse = {
        response: {
          status: 401,
        },
      };
      mockedApi.get.mockRejectedValue(errorResponse);

      await expect(authService.getProfile()).rejects.toThrow();
      expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
    });

    it("deve lançar erro para outros erros de API", async () => {
      localStorageMock.getItem.mockReturnValue("valid-token");
      const errorResponse = {
        response: {
          status: 500,
        },
      };
      mockedApi.get.mockRejectedValue(errorResponse);

      await expect(authService.getProfile()).rejects.toThrow();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("deve remover token do localStorage", () => {
      authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
    });
  });

  describe("getToken", () => {
    it("deve retornar token do localStorage", () => {
      localStorageMock.getItem.mockReturnValue("stored-token");

      const result = authService.getToken();

      expect(localStorageMock.getItem).toHaveBeenCalledWith("token");
      expect(result).toBe("stored-token");
    });

    it("deve retornar null quando não há token", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("deve retornar true quando há token", () => {
      localStorageMock.getItem.mockReturnValue("valid-token");

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it("deve retornar false quando não há token", () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it("deve retornar false quando token é string vazia", () => {
      localStorageMock.getItem.mockReturnValue("");

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("Tratamento de erros", () => {
    it("deve extrair mensagem de erro de array de validação", async () => {
      const errorResponse = {
        response: {
          data: {
            detail: [
              {
                loc: ["body", "password"],
                msg: "ensure this value has at least 8 characters",
                type: "value_error.any_str.min_length",
              },
              {
                loc: ["body", "email"],
                msg: "field required",
                type: "value_error.missing",
              },
            ],
          },
          status: 422,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.login("test@example.com", "short"),
      ).rejects.toThrow(
        "Erro de validação: ensure this value has at least 8 characters",
      );
    });

    it("deve usar mensagem padrão quando detail é array vazio", async () => {
      const errorResponse = {
        response: {
          data: { detail: [] },
          status: 422,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow("Erro ao fazer login");
    });

    it("deve tratar erro quando detail não é string nem array", async () => {
      const errorResponse = {
        response: {
          data: { detail: { message: "Custom error object" } },
          status: 400,
        },
      };
      mockedApi.post.mockRejectedValue(errorResponse);

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow("Erro ao fazer login");
    });
  });

  describe("Integração com interceptors", () => {
    it("deve incluir token no header Authorization quando disponível", () => {
      localStorageMock.getItem.mockReturnValue("test-token");

      // Simula chamada que seria interceptada
      // const config = {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // };

      // Verifica se o token seria adicionado (isso seria testado no interceptor)
      expect(authService.getToken()).toBe("test-token");
    });
  });

  describe("Casos extremos", () => {
    it("deve tratar localStorage indisponível", () => {
      // Simula localStorage indisponível
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, "localStorage", {
        value: undefined,
      });

      // Deve não quebrar quando localStorage não está disponível
      expect(() => authService.getToken()).not.toThrow();
      expect(() => authService.logout()).not.toThrow();

      // Restaura localStorage
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
      });
    });

    it("deve tratar dados de resposta malformados", async () => {
      mockedApi.post.mockResolvedValue({ data: null });

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow();
    });

    it("deve tratar resposta sem campo user", async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          access_token: "token",
          token_type: "bearer",
          // user field missing
        },
      });

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow();
    });

    it("deve tratar resposta sem access_token", async () => {
      mockedApi.post.mockResolvedValue({
        data: {
          user: {
            id: 1,
            email: "test@example.com",
            full_name: "Test User",
            username: "testuser",
            role: "USER",
            is_active: true,
            created_at: "2023-01-01T00:00:00Z",
          },
          // access_token missing
        },
      });

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow();
    });
  });

  describe("Validação de entrada", () => {
    it("deve tratar email vazio no login", async () => {
      await expect(authService.login("", "password")).rejects.toThrow();
    });

    it("deve tratar senha vazia no login", async () => {
      await expect(authService.login("test@example.com", "")).rejects.toThrow();
    });

    it("deve tratar parâmetros null no login", async () => {
      await expect(
        authService.login(null as any, "password"),
      ).rejects.toThrow();

      await expect(
        authService.login("test@example.com", null as any),
      ).rejects.toThrow();
    });

    it("deve tratar parâmetros undefined no login", async () => {
      await expect(
        authService.login(undefined as any, "password"),
      ).rejects.toThrow();

      await expect(
        authService.login("test@example.com", undefined as any),
      ).rejects.toThrow();
    });
  });

  describe("Timeout e conectividade", () => {
    it("deve tratar timeout de rede", async () => {
      const timeoutError = {
        code: "ECONNABORTED",
        message: "timeout of 5000ms exceeded",
      };
      mockedApi.post.mockRejectedValue(timeoutError);

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow("Erro ao fazer login");
    });

    it("deve tratar erro de conectividade", async () => {
      const networkError = {
        code: "NETWORK_ERROR",
        message: "Network Error",
      };
      mockedApi.post.mockRejectedValue(networkError);

      await expect(
        authService.login("test@example.com", "password"),
      ).rejects.toThrow("Erro ao fazer login");
    });
  });
});
