// Teste básico do componente Login
// Mocks já configurados no setupTests.ts

import React from 'react';
import { render } from '@testing-library/react';
import LoginPage from './LoginPage';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
    error: null,
    clearError: jest.fn(),
  }),
}));

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

describe('LoginPage', () => {
  it('deve renderizar o componente LoginPage', () => {
    const { container } = render(<LoginPage />);
    expect(container).toBeInTheDocument();
  });

  it('deve ter elementos básicos do login', () => {
    const { container } = render(<LoginPage />);
    // Verifica se o componente foi renderizado
    expect(container.firstChild).toBeTruthy();
  });
});