// Teste básico do componente Dashboard
// Mocks já configurados no setupTests.ts

import React from 'react';
import { render } from '@testing-library/react';
import DashboardPage from './DashboardPage';

// Mock do contexto de autenticação
const mockAuthContext = {
  user: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('DashboardPage', () => {
  it('deve renderizar o componente DashboardPage', () => {
    const { container } = render(<DashboardPage />);
    expect(container).toBeInTheDocument();
  });

  it('deve ter elementos básicos do dashboard', () => {
    const { getByText } = render(<DashboardPage />);
    // Verifica se existe algum texto relacionado ao dashboard
    expect(getByText(/dashboard/i) || getByText(/painel/i)).toBeTruthy();
  });
});