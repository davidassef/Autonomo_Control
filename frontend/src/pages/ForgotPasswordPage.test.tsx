import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import ForgotPasswordPage from "./ForgotPasswordPage";

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
  Routes: ({ children }: { children: React.ReactNode }) => children,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    children,
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) =>
    children,
}));

// Wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Mock data
const mockSecurityQuestions = [
  { id: 1, text: "Qual é o nome do seu primeiro animal de estimação?" },
  { id: 2, text: "Em que cidade você nasceu?" },
  { id: 3, text: "Qual é o nome da sua mãe?" },
];

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Initial rendering tests
  it("should render initial username step", () => {
    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    expect(screen.getByText("Recuperar Senha")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Digite seu username"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verificar Username" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Voltar ao Login")).toBeInTheDocument();
  });

  it("should display error message when provided", () => {
    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Simulate error by submitting empty form
    const submitButton = screen.getByRole("button", {
      name: "Verificar Username",
    });
    fireEvent.click(submitButton);

    // The form should prevent submission due to required field
    expect(screen.getByPlaceholderText("Digite seu username")).toBeInvalid();
  });

  // Username verification tests
  it("should handle successful username verification for USER role", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }) as any,
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    const submitButton = screen.getByRole("button", {
      name: "Verificar Username",
    });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Escolha como deseja redefinir sua senha:"),
      ).toBeInTheDocument();
    });
    
    expect(screen.getByText("Redefinir via Email")).toBeInTheDocument();
    expect(
      screen.getByText("Redefinir via Perguntas Secretas"),
    ).toBeInTheDocument();

    expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/verify-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser" }),
    });
  });

  it("should handle successful username verification for MASTER role", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "MASTER", email: "master@test.com" }) as any,
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    const submitButton = screen.getByRole("button", {
      name: "Verificar Username",
    });

    fireEvent.change(usernameInput, { target: { value: "masteruser" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Escolha como deseja redefinir sua senha:"),
      ).toBeInTheDocument();
    });
    
    expect(
      screen.getByText("🔑 Redefinir via Chave Secreta"),
    ).toBeInTheDocument();
  });

  it("should handle username verification error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Username não encontrado" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    const submitButton = screen.getByRole("button", {
      name: "Verificar Username",
    });

    fireEvent.change(usernameInput, { target: { value: "invaliduser" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Username não encontrado")).toBeInTheDocument();
    });
  });

  it("should handle network error during username verification", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    const submitButton = screen.getByRole("button", {
      name: "Verificar Username",
    });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Erro de conexão. Tente novamente."),
      ).toBeInTheDocument();
    });
  });

  // Choose step navigation tests
  it("should navigate to email step when email option is selected", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // First verify username
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Email")).toBeInTheDocument();
    });

    // Click email option
    fireEvent.click(screen.getByText("Redefinir via Email"));

    expect(
      screen.getByText(
        "Digite seu email para receber instruções de recuperação de senha.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu email")).toBeInTheDocument();
  });

  it("should navigate to security questions step when security option is selected", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // First verify username
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(
        screen.getByText("Redefinir via Perguntas Secretas"),
      ).toBeInTheDocument();
    });

    // Click security questions option
    fireEvent.click(screen.getByText("Redefinir via Perguntas Secretas"));

    expect(
      screen.getByText(
        "Digite seu email e responda às perguntas secretas para redefinir sua senha.",
      ),
    ).toBeInTheDocument();
  });

  it("should navigate to secret key step when secret key option is selected for MASTER", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "MASTER", email: "master@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // First verify username
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "masteruser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(
        screen.getByText("🔑 Redefinir via Chave Secreta"),
      ).toBeInTheDocument();
    });

    // Click secret key option
    fireEvent.click(screen.getByText("🔑 Redefinir via Chave Secreta"));

    expect(
      screen.getByText(
        "🔑 Recuperação Master: Digite seu username e chave secreta para redefinir sua senha.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Username do Master"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Chave Secreta (16 caracteres)"),
    ).toBeInTheDocument();
  });

  // Email reset tests
  it("should handle successful email reset request", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "USER", email: "user@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Email enviado com sucesso" }),
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to email step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Email")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Email"));

    // Fill email and submit
    const emailInput = screen.getByPlaceholderText("Seu email");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar Email de Recuperação" }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@test.com" }),
      });
    });
  });

  it("should handle token-based password reset", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "USER", email: "user@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Senha redefinida com sucesso" }),
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to email step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Email")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Email"));

    // Fill token and password fields
    const tokenInput = screen.getByPlaceholderText("Token do email");
    const newPasswordInput = screen.getByPlaceholderText("Nova senha");
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirmar nova senha",
    );

    fireEvent.change(tokenInput, { target: { value: "ABC123" } });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: "ABC123",
          new_password: "newpassword123",
        }),
      });
    });
  });

  // Security questions tests
  it("should load security questions when email is entered", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "USER", email: "user@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecurityQuestions,
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to security questions step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Perguntas Secretas")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Perguntas Secretas"));

    // Enter email to trigger questions loading
    const emailInput = screen.getByPlaceholderText("Seu email");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(
        screen.getByText("Qual é o nome do seu primeiro animal de estimação?"),
      ).toBeInTheDocument();
    });
    
    expect(
      screen.getByText("Em que cidade você nasceu?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Qual é o nome da sua mãe?")).toBeInTheDocument();
  });

  it("should handle security questions reset", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "USER", email: "user@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSecurityQuestions,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Senha redefinida com sucesso" }),
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to security questions step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Perguntas Secretas")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Perguntas Secretas"));

    // Fill form
    const emailInput = screen.getByPlaceholderText("Seu email");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(
        screen.getByText("Qual é o nome do seu primeiro animal de estimação?"),
      ).toBeInTheDocument();
    });

    // Fill answers and passwords
    const answer1Input = screen.getByDisplayValue("");
    const newPasswordInput = screen.getByPlaceholderText(
      "Digite sua nova senha",
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirme sua nova senha",
    );

    fireEvent.change(answer1Input, { target: { value: "Rex" } });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/reset-password-security",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  // Secret key reset tests
  it("should handle secret key reset for MASTER", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "MASTER", email: "master@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Senha redefinida com sucesso" }),
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to secret key step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "masteruser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("🔑 Redefinir via Chave Secreta")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("🔑 Redefinir via Chave Secreta"));

    // Fill form
    const masterUsernameInput =
      screen.getByPlaceholderText("Username do Master");
    const secretKeyInput = screen.getByPlaceholderText(
      "Chave Secreta (16 caracteres)",
    );
    const newPasswordInput = screen.getByPlaceholderText(
      "Digite sua nova senha",
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirme sua nova senha",
    );

    fireEvent.change(masterUsernameInput, { target: { value: "masteruser" } });
    fireEvent.change(secretKeyInput, { target: { value: "ABCD1234EFGH5678" } });
    fireEvent.change(newPasswordInput, {
      target: { value: "newmasterpass123" },
    });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newmasterpass123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "🔑 Redefinir Senha Master" }),
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/secret-keys/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "masteruser",
            secret_key: "ABCD1234EFGH5678",
            new_password: "newmasterpass123",
          }),
        },
      );
    });
  });

  it("should convert secret key input to uppercase", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "MASTER", email: "master@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to secret key step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "masteruser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("🔑 Redefinir via Chave Secreta")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("🔑 Redefinir via Chave Secreta"));

    const secretKeyInput = screen.getByPlaceholderText(
      "Chave Secreta (16 caracteres)",
    );
    fireEvent.change(secretKeyInput, { target: { value: "abcd1234efgh5678" } });

    expect(secretKeyInput).toHaveValue("ABCD1234EFGH5678");
  });

  // Navigation tests
  it("should allow navigation back to previous steps", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to choose step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(
        screen.getByText("Escolha como deseja redefinir sua senha:"),
      ).toBeInTheDocument();
    });

    // Go to email step
    fireEvent.click(screen.getByText("Redefinir via Email"));
    expect(
      screen.getByText(
        "Digite seu email para receber instruções de recuperação de senha.",
      ),
    ).toBeInTheDocument();

    // Go back to choose step
    fireEvent.click(screen.getByText("Voltar às Opções"));
    expect(
      screen.getByText("Escolha como deseja redefinir sua senha:"),
    ).toBeInTheDocument();

    // Go back to username step
    fireEvent.click(screen.getByText("Voltar"));
    expect(
      screen.getByPlaceholderText("Digite seu username"),
    ).toBeInTheDocument();
  });

  // Loading states tests
  it("should show loading state during username verification", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValueOnce(promise as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    const submitButton = screen.getByRole("button", {
      name: "Verificar Username",
    });

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Verificando...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }),
    });

    await waitFor(() => {
      expect(
        screen.getByText("Escolha como deseja redefinir sua senha:"),
      ).toBeInTheDocument();
    });
  });

  it("should show loading state for security questions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }),
    } as any);

    let resolveQuestionsPromise: (value: any) => void;
    const questionsPromise = new Promise((resolve) => {
      resolveQuestionsPromise = resolve;
    });

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to security questions step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Perguntas Secretas")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Perguntas Secretas"));

    // Mock the questions fetch
    mockFetch.mockReturnValueOnce(questionsPromise as any);

    const emailInput = screen.getByPlaceholderText("Seu email");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.blur(emailInput);

    expect(
      screen.getByText("Carregando suas perguntas secretas..."),
    ).toBeInTheDocument();

    // Resolve the questions promise
    resolveQuestionsPromise!({
      ok: true,
      json: async () => mockSecurityQuestions,
    });

    await waitFor(() => {
      expect(
        screen.getByText("Qual é o nome do seu primeiro animal de estimação?"),
      ).toBeInTheDocument();
    });
  });

  // Error handling tests
  it("should handle password mismatch validation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "USER", email: "user@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to email step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Email")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Email"));

    // Fill mismatched passwords
    const tokenInput = screen.getByPlaceholderText("Token do email");
    const newPasswordInput = screen.getByPlaceholderText("Nova senha");
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirmar nova senha",
    );

    fireEvent.change(tokenInput, { target: { value: "ABC123" } });
    fireEvent.change(newPasswordInput, { target: { value: "password1" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password2" } });

    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "USER", email: "user@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Token inválido" }),
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to email step and submit token reset
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Email")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Email"));

    const tokenInput = screen.getByPlaceholderText("Token do email");
    const newPasswordInput = screen.getByPlaceholderText("Nova senha");
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirmar nova senha",
    );

    fireEvent.change(tokenInput, { target: { value: "INVALID" } });
    fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "newpassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Redefinir Senha" }));

    await waitFor(() => {
      expect(screen.getByText("Token inválido")).toBeInTheDocument();
    });
  });

  // Edge cases
  it("should handle empty security questions response", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: "USER", email: "user@test.com" }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to security questions step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("Redefinir via Perguntas Secretas")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Redefinir via Perguntas Secretas"));

    const emailInput = screen.getByPlaceholderText("Seu email");
    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Qual é o nome do seu primeiro animal de estimação?",
        ),
      ).not.toBeInTheDocument();
    });
  });

  it("should disable submit buttons when required fields are empty", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ role: "MASTER", email: "master@test.com" }),
    } as any);

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    // Navigate to secret key step
    const usernameInput = screen.getByPlaceholderText("Digite seu username");
    fireEvent.change(usernameInput, { target: { value: "masteruser" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar Username" }));

    await waitFor(() => {
      expect(screen.getByText("🔑 Redefinir via Chave Secreta")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("🔑 Redefinir via Chave Secreta"));

    const submitButton = screen.getByRole("button", {
      name: "🔑 Redefinir Senha Master",
    });
    expect(submitButton).toBeDisabled();

    // Fill all required fields
    const masterUsernameInput =
      screen.getByPlaceholderText("Username do Master");
    const secretKeyInput = screen.getByPlaceholderText(
      "Chave Secreta (16 caracteres)",
    );
    const newPasswordInput = screen.getByPlaceholderText(
      "Digite sua nova senha",
    );
    const confirmPasswordInput = screen.getByPlaceholderText(
      "Confirme sua nova senha",
    );

    fireEvent.change(masterUsernameInput, { target: { value: "masteruser" } });
    fireEvent.change(secretKeyInput, { target: { value: "ABCD1234EFGH5678" } });
    fireEvent.change(newPasswordInput, { target: { value: "newpass123" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "newpass123" } });

    expect(submitButton).not.toBeDisabled();
  });

  // Performance tests
  it("should render quickly with minimal re-renders", () => {
    const startTime = performance.now();

    render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
  });

  it("should maintain stable function references", () => {
    const { rerender } = render(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const initialButton = screen.getByRole("button", {
      name: "Verificar Username",
    });

    rerender(
      <TestWrapper>
        <ForgotPasswordPage />
      </TestWrapper>,
    );

    const rerenderedButton = screen.getByRole("button", {
      name: "Verificar Username",
    });
    expect(initialButton).toBe(rerenderedButton);
  });
});
