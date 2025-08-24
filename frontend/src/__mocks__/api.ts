// Mock do módulo API para testes
const mockApi: any = {
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
  create: jest.fn(() => mockApi),
};

export default mockApi;
