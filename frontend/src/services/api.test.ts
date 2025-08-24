import axios from "axios";
// import api from './api'; // Removido pois não está sendo usado

// Mock do axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock do window.location
// Mock location já definido no setupTests.ts
const mockLocation = (window as any).location;

// Mock do console
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

describe("API Service", () => {
  let mockAxiosInstance: any;
  let requestInterceptor: any;
  let responseInterceptor: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da instância do axios
    mockAxiosInstance = {
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Capturar os interceptors quando forem registrados
    mockAxiosInstance.interceptors.request.use.mockImplementation(
      (success: any, error: any) => {
        requestInterceptor = { success, error };
      },
    );

    mockAxiosInstance.interceptors.response.use.mockImplementation(
      (success: any, error: any) => {
        responseInterceptor = { success, error };
      },
    );
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("Configuração inicial", () => {
    it("deve criar instância do axios com configurações corretas", () => {
      // Re-importar para executar a configuração
      jest.resetModules();
      require("./api");

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "http://localhost:8000/api/v1",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("deve usar REACT_APP_API_URL quando disponível", () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      process.env.REACT_APP_API_URL = "https://api.example.com";

      jest.resetModules();
      require("./api");

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.example.com",
        headers: {
          "Content-Type": "application/json",
        },
      });

      process.env.REACT_APP_API_URL = originalEnv;
    });
  });

  describe("Request Interceptor", () => {
    beforeEach(() => {
      jest.resetModules();
      require("./api");
    });

    it("deve adicionar token de autorização quando disponível", () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      const config = {
        url: "/test",
        baseURL: "http://localhost:8000/api/v1",
        method: "GET",
        headers: {},
      };

      const result = requestInterceptor.success(config);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("token");
      expect(result.headers.Authorization).toBe("Bearer test-token");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🔧 API Request: Token adicionado ao header",
      );
    });

    it("deve funcionar sem token", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const config = {
        url: "/test",
        baseURL: "http://localhost:8000/api/v1",
        method: "GET",
        headers: {},
      };

      const result = requestInterceptor.success(config);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("token");
      expect(result.headers.Authorization).toBeUndefined();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🔧 API Request: Nenhum token encontrado",
      );
    });

    it("deve logar informações da requisição", () => {
      const config = {
        url: "/test",
        baseURL: "http://localhost:8000/api/v1",
        method: "GET",
        headers: {},
      };

      requestInterceptor.success(config);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🔧 API Request Interceptor:",
        {
          url: "/test",
          baseURL: "http://localhost:8000/api/v1",
          fullURL: "http://localhost:8000/api/v1/test",
          method: "GET",
          headers: config.headers,
        },
      );
    });

    it("deve tratar erros de requisição", () => {
      const error = new Error("Request error");

      const result = requestInterceptor.error(error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ API Request Interceptor Error:",
        error,
      );
      return expect(result).rejects.toBe(error);
    });
  });

  describe("Response Interceptor", () => {
    beforeEach(() => {
      jest.resetModules();
      require("./api");
    });

    it("deve logar resposta bem-sucedida", () => {
      const response = {
        status: 200,
        config: { url: "/test" },
        data: { message: "success" },
      };

      const result = responseInterceptor.success(response);

      expect(mockConsoleLog).toHaveBeenCalledWith("✅ API Response:", {
        status: 200,
        url: "/test",
        data: { message: "success" },
      });
      expect(result).toBe(response);
    });

    it("deve tratar erro 401 e redirecionar para login", () => {
      const error = {
        response: {
          status: 401,
          data: { detail: "Unauthorized" },
        },
        config: { url: "/test" },
        message: "Request failed with status code 401",
      };

      const result = responseInterceptor.error(error);

      expect(mockConsoleError).toHaveBeenCalledWith("❌ API Response Error:", {
        status: 401,
        url: "/test",
        data: { detail: "Unauthorized" },
        message: "Request failed with status code 401",
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "❌ API: Token expirado/inválido, redirecionando para login...",
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      expect(mockLocation.href).toBe("/login");
      return expect(result).rejects.toBe(error);
    });

    it("deve tratar outros erros sem redirecionar", () => {
      const error = {
        response: {
          status: 500,
          data: { detail: "Internal Server Error" },
        },
        config: { url: "/test" },
        message: "Request failed with status code 500",
      };

      const result = responseInterceptor.error(error);

      expect(mockConsoleError).toHaveBeenCalledWith("❌ API Response Error:", {
        status: 500,
        url: "/test",
        data: { detail: "Internal Server Error" },
        message: "Request failed with status code 500",
      });
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(mockLocation.href).toBe("");
      return expect(result).rejects.toBe(error);
    });

    it("deve tratar erro sem response", () => {
      const error = {
        config: { url: "/test" },
        message: "Network Error",
      };

      const result = responseInterceptor.error(error);

      expect(mockConsoleError).toHaveBeenCalledWith("❌ API Response Error:", {
        status: undefined,
        url: "/test",
        data: undefined,
        message: "Network Error",
      });
      return expect(result).rejects.toBe(error);
    });
  });
});
