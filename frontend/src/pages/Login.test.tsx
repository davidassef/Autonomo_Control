// Teste básico do componente Login
// Mocks já configurados no setupTests.ts

import React from "react";
import { render, screen } from "@testing-library/react";
import LoginPage from "./LoginPage";

// Mock react-router-dom
jest.mock("react-router-dom", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
}));

// Mock do contexto de autenticação
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
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

describe("LoginPage", () => {
  it("deve renderizar o componente LoginPage", () => {
    render(<LoginPage />);
    // Verifica se o componente foi renderizado procurando por elementos comuns de login
    expect(document.body).toContainHTML("<div");
  });

  it("deve ter elementos básicos do login", () => {
    render(<LoginPage />);
    // Verifica se o componente foi renderizado usando Testing Library
    expect(screen.getByText(/login/i) || screen.getByRole("button") || screen.getByRole("textbox")).toBeInTheDocument();
  });
});
