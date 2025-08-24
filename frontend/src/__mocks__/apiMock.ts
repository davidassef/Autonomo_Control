import { AxiosResponse, AxiosRequestConfig } from "axios";

// Mock data para respostas da API
const mockApiResponses = {
  "/auth/token": {
    access_token: "mock-token-123",
    token_type: "bearer",
    user: {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      full_name: "Test User",
    },
  },
  "/auth/register": {
    success: true,
    message: "Usuário registrado com sucesso",
    user: {
      id: 2,
      username: "newuser",
      email: "new@example.com",
      full_name: "New User",
    },
  },
  "/system-config/": {
    success: true,
    data: {
      app_name: "Autonomo Control",
      max_users: "100",
      theme: "light",
    },
    message: "Configurações obtidas com sucesso",
  },
  "/system-config/public": {
    success: true,
    data: {
      app_name: "Autonomo Control",
      theme: "light",
    },
    message: "Configurações públicas obtidas",
  },
};

// Mock do axios
const mockAxios: any = {
  create: jest.fn(() => mockAxios),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn(),
  defaults: {
    baseURL: "http://localhost:8000/api/v1",
    headers: {
      "Content-Type": "application/json",
    },
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

// Configurar respostas padrão
const setupMockResponses = () => {
  mockAxios.get.mockImplementation((url: string) => {
    const response = mockApiResponses[url as keyof typeof mockApiResponses];
    return Promise.resolve({
      data: response,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);
  });

  mockAxios.post.mockImplementation((url: string, data?: any) => {
    const response = mockApiResponses[url as keyof typeof mockApiResponses];
    return Promise.resolve({
      data: response,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);
  });

  mockAxios.put.mockImplementation((url: string, data?: any) => {
    return Promise.resolve({
      data: {
        success: true,
        message: "Atualizado com sucesso",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);
  });
};

// Configurar o mock do axios.create
mockAxios.create.mockImplementation((config?: AxiosRequestConfig) => {
  const instance = { ...mockAxios };
  if (config) {
    instance.defaults = { ...instance.defaults, ...config };
  }
  return instance;
});

// Inicializar respostas mock
setupMockResponses();

// Helpers para controlar o mock
export const mockApiSuccess = (url: string, data: any) => {
  mockApiResponses[url as keyof typeof mockApiResponses] = data;
};

export const mockApiError = (url: string, error: any) => {
  mockAxios.get.mockImplementation((requestUrl: string) => {
    if (requestUrl === url) {
      return Promise.reject(error);
    }
    return Promise.resolve({
      data: mockApiResponses[requestUrl as keyof typeof mockApiResponses],
    });
  });
};

export const resetApiMocks = () => {
  mockAxios.get.mockClear();
  mockAxios.post.mockClear();
  mockAxios.put.mockClear();
  mockAxios.delete.mockClear();
  mockAxios.patch.mockClear();
  mockAxios.create.mockClear();
  setupMockResponses();
};

export default mockAxios;
export { mockAxios };
