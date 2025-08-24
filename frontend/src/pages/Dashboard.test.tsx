// Teste básico do componente Dashboard
// Mocks já configurados no setupTests.ts

import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./DashboardPage";

// Mock do contexto de autenticação
const mockAuthContext = {
  user: {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    role: "USER",
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: jest.fn(),
  googleLogin: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
};

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

describe("DashboardPage", () => {
  it("deve renderizar o componente DashboardPage", () => {
    render(<DashboardPage />);
    expect(screen.getByRole("main") || document.body).toBeInTheDocument();
  });

  it("deve ter elementos básicos do dashboard", () => {
    render(<DashboardPage />);
    // Verifica se existe algum texto relacionado ao dashboard
    expect(screen.getByText(/dashboard/i) || screen.getByText(/painel/i)).toBeTruthy();
  });
});
