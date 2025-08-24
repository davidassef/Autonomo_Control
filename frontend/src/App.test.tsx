import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

// O Jest usará automaticamente o mock manual de __mocks__/react-router-dom.tsx

jest.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null,
  }),
}));

jest.mock("./contexts/ToastContext", () => ({
  ToastProvider: ({ children }: any) => <div>{children}</div>,
}));

describe("App", () => {
  test("renderiza sem erros", () => {
    render(<App />);
    // Verifica se o componente App renderiza sem erros
    expect(screen.getByTestId("test-element")).toBeInTheDocument();
  });
});
