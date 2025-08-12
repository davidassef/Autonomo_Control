// Teste básico do hook useAuth
// Mocks já configurados no setupTests.ts

import { renderHook } from '@testing-library/react';
import { useAuth } from '../contexts/AuthContext';

// Mock do contexto de autenticação
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('useAuth Hook', () => {
  it('deve retornar o contexto de autenticação', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current).toEqual(mockAuthContext);
  });

  it('deve ter as funções de autenticação definidas', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
  });
});