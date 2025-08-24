// Mock global do fetch para testes
export const createMockResponse = (
  data: any,
  status = 200,
  statusText = "OK",
) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    clone: function () {
      return this;
    },
  } as Response);
};

export const createMockError = (message: string, status = 400) => {
  const error = new Error(message) as any;
  error.response = {
    status,
    statusText: status === 400 ? "Bad Request" : "Error",
    data: { detail: message },
  };
  return Promise.reject(error);
};

// Mock padrão do fetch
export const mockFetch = jest.fn();

// Configurações de mock comuns
export const mockFetchSuccess = (data: any, status = 200) => {
  mockFetch.mockResolvedValueOnce(createMockResponse(data, status));
};

export const mockFetchError = (message: string, status = 400) => {
  mockFetch.mockRejectedValueOnce(createMockError(message, status));
};

// Reset do mock
export const resetFetchMock = () => {
  mockFetch.mockReset();
};

// Aplicar mock globalmente
global.fetch = mockFetch;
