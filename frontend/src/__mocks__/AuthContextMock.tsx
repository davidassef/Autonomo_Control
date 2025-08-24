import React, { createContext, useContext, ReactNode } from "react";

// Tipos para o mock do AuthContext
interface MockUser {
  id: number;
  email: string;
  full_name: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface MockAuthContextType {
  user: MockUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: jest.MockedFunction<
    (email: string, password: string) => Promise<void>
  >;
  logout: jest.MockedFunction<() => void>;
  register: jest.MockedFunction<(userData: any) => Promise<void>>;
  updateUser: jest.MockedFunction<
    (userData: Partial<MockUser>) => Promise<void>
  >;
}

// Mock do usuário padrão
const mockUser: MockUser = {
  id: 1,
  email: "test@example.com",
  full_name: "Test User",
  username: "testuser",
  role: "USER",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
};

// Mock das funções do AuthContext
const mockLogin = jest.fn().mockResolvedValue(undefined);
const mockLogout = jest.fn();
const mockRegister = jest.fn().mockResolvedValue(undefined);
const mockUpdateUser = jest.fn().mockResolvedValue(undefined);

// Estado padrão do mock
let mockAuthState = {
  user: null as MockUser | null,
  token: null as string | null,
  isAuthenticated: false,
  isLoading: false,
};

// Context mock
const MockAuthContext = createContext<MockAuthContextType>({
  user: mockAuthState.user,
  token: mockAuthState.token,
  isAuthenticated: mockAuthState.isAuthenticated,
  isLoading: mockAuthState.isLoading,
  login: mockLogin,
  logout: mockLogout,
  register: mockRegister,
  updateUser: mockUpdateUser,
});

// Provider mock
export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <MockAuthContext.Provider
      value={{
        user: mockAuthState.user,
        token: mockAuthState.token,
        isAuthenticated: mockAuthState.isAuthenticated,
        isLoading: mockAuthState.isLoading,
        login: mockLogin,
        logout: mockLogout,
        register: mockRegister,
        updateUser: mockUpdateUser,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

// Hook mock
export const useMockAuth = () => useContext(MockAuthContext);

// Helpers para controlar o estado do mock nos testes
export const setMockAuthState = (newState: Partial<typeof mockAuthState>) => {
  mockAuthState = { ...mockAuthState, ...newState };
};

export const setMockUser = (user: MockUser | null) => {
  mockAuthState.user = user;
  mockAuthState.isAuthenticated = !!user;
  mockAuthState.token = user ? "mock-token" : null;
};

export const setMockLoading = (loading: boolean) => {
  mockAuthState.isLoading = loading;
};

export const resetMockAuth = () => {
  mockAuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  };
  mockLogin.mockClear();
  mockLogout.mockClear();
  mockRegister.mockClear();
  mockUpdateUser.mockClear();
};

// Configurações pré-definidas para testes comuns
export const mockAuthenticatedUser = () => {
  setMockUser(mockUser);
};

export const mockUnauthenticatedUser = () => {
  setMockUser(null);
};

export const mockLoadingState = () => {
  setMockLoading(true);
};

// Exportar mocks das funções para uso em testes
export { mockLogin, mockLogout, mockRegister, mockUpdateUser, mockUser };
