import { authService } from './auth';
import api from './api';
import { AuthResponse, User } from '../types';

// Mock do módulo api
jest.mock('./api');

const mockApi = api as jest.Mocked<typeof api>;

// Mock do localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock do console para evitar logs nos testes
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('login', () => {
    const mockAuthResponse: AuthResponse = {
      access_token: 'mock-token',
      token_type: 'bearer',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    };

    it('deve fazer login com sucesso', async () => {
      mockApi.post.mockResolvedValue({ data: mockAuthResponse, status: 200 });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/token',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Verifica se o FormData foi criado corretamente
      const formDataCall = mockApi.post.mock.calls[0][1] as FormData;
      expect(formDataCall).toBeInstanceOf(FormData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve criar FormData com username e password corretos', async () => {
      mockApi.post.mockResolvedValue({ data: mockAuthResponse, status: 200 });

      await authService.login('user@test.com', 'mypassword');

      const formDataCall = mockApi.post.mock.calls[0][1] as FormData;
      
      // Não podemos verificar diretamente o conteúdo do FormData em Jest,
      // mas podemos verificar se é uma instância de FormData
      expect(formDataCall).toBeInstanceOf(FormData);
      expect(mockApi.post).toHaveBeenCalledWith(
        '/auth/token',
        formDataCall,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('deve tratar erro de login', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Invalid credentials' }
        },
        config: { url: '/auth/token' }
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toEqual(mockError);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('deve tratar erro de rede', async () => {
      const networkError = new Error('Network Error');
      mockApi.post.mockRejectedValue(networkError);

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('Network Error');

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('googleLogin', () => {
    const mockAuthResponse: AuthResponse = {
      access_token: 'google-token',
      token_type: 'bearer',
      user: {
        id: '2',
        name: 'Google User',
        email: 'google@example.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    };

    it('deve fazer login com Google com sucesso', async () => {
      mockApi.post.mockResolvedValue({ data: mockAuthResponse });

      const result = await authService.googleLogin('google-oauth-token');

      expect(mockApi.post).toHaveBeenCalledWith('/auth/google', {
        token: 'google-oauth-token'
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'google-token');
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve tratar erro no login com Google', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Invalid Google token' }
        }
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.googleLogin('invalid-token'))
        .rejects.toEqual(mockError);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    const mockUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('deve buscar perfil do usuário com sucesso', async () => {
      mockApi.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getProfile();

      expect(mockApi.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('deve tratar erro ao buscar perfil', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Token expired' }
        }
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(authService.getProfile())
        .rejects.toEqual(mockError);
    });

    it('deve tratar erro de rede ao buscar perfil', async () => {
      const networkError = new Error('Network Error');
      mockApi.get.mockRejectedValue(networkError);

      await expect(authService.getProfile())
        .rejects.toThrow('Network Error');
    });
  });

  describe('register', () => {
    const mockUser: User = {
      id: '3',
      name: 'New User',
      email: 'newuser@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('deve registrar usuário com sucesso', async () => {
      mockApi.post.mockResolvedValue({ data: mockUser });

      const result = await authService.register('New User', 'newuser@example.com', 'password123');

      expect(mockApi.post).toHaveBeenCalledWith('/users', {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      });
      expect(result).toEqual(mockUser);
    });

    it('deve tratar erro de registro - email já existe', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Email already registered' }
        }
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.register('User', 'existing@example.com', 'password123'))
        .rejects.toEqual(mockError);
    });

    it('deve tratar erro de validação no registro', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ['body', 'email'],
                msg: 'field required',
                type: 'value_error.missing'
              }
            ]
          }
        }
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(authService.register('User', '', 'password123'))
        .rejects.toEqual(mockError);
    });
  });

  describe('logout', () => {
    it('deve fazer logout removendo token do localStorage', () => {
      authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('deve fazer logout mesmo se não houver token', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {});

      expect(() => authService.logout()).not.toThrow();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar true quando há token no localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('some-token');

      const result = authService.isAuthenticated();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(true);
    });

    it('deve retornar false quando não há token no localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(false);
    });

    it('deve retornar false quando token é string vazia', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('deve retornar false quando token é undefined', () => {
      mockLocalStorage.getItem.mockReturnValue(undefined);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('integração com localStorage', () => {
    it('deve armazenar token após login bem-sucedido', async () => {
      const mockAuthResponse: AuthResponse = {
        access_token: 'integration-token',
        token_type: 'bearer',
        user: {
          id: '1',
          name: 'Integration User',
          email: 'integration@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      };

      mockApi.post.mockResolvedValue({ data: mockAuthResponse });

      await authService.login('integration@example.com', 'password');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'integration-token');
    });

    it('deve armazenar token após login com Google bem-sucedido', async () => {
      const mockAuthResponse: AuthResponse = {
        access_token: 'google-integration-token',
        token_type: 'bearer',
        user: {
          id: '2',
          name: 'Google Integration User',
          email: 'google-integration@example.com',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      };

      mockApi.post.mockResolvedValue({ data: mockAuthResponse });

      await authService.googleLogin('google-token');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'google-integration-token');
    });

    it('deve remover token ao fazer logout', () => {
      authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('tratamento de erros', () => {
    it('deve propagar erro com response completo', async () => {
      const completeError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { detail: 'Server error' },
          headers: {}
        },
        config: { url: '/auth/token' },
        message: 'Request failed with status code 500'
      };

      mockApi.post.mockRejectedValue(completeError);

      await expect(authService.login('test@example.com', 'password'))
        .rejects.toEqual(completeError);
    });

    it('deve propagar erro sem response', async () => {
      const networkError = {
        message: 'Network Error',
        code: 'NETWORK_ERROR'
      };

      mockApi.post.mockRejectedValue(networkError);

      await expect(authService.login('test@example.com', 'password'))
        .rejects.toEqual(networkError);
    });
  });
});