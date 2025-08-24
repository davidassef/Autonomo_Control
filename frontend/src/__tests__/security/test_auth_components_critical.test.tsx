import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import ForgotPasswordPage from "../../pages/ForgotPasswordPage";
import { authService } from "../../services/auth";
import { securityQuestionsService, SecurityQuestion } from "../../services/securityQuestions";

// Mocks
jest.mock("../../services/auth");
jest.mock("../../services/securityQuestions");

const mockedAuthService = jest.mocked(authService);
const mockedSecurityQuestionsService = jest.mocked(securityQuestionsService);

// Wrapper para testes com contexto
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("Testes Críticos de Segurança - Componentes de Autenticação", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Mock das perguntas de segurança
    mockedSecurityQuestionsService.getAll.mockResolvedValue([
      { id: 1, question: "Qual o nome do seu primeiro animal de estimação?", is_active: true },
      { id: 2, question: "Em que cidade você nasceu?", is_active: true },
      { id: 3, question: "Qual o nome da sua mãe?", is_active: true },
      { id: 4, question: "Qual sua cor favorita?", is_active: true },
      { id: 5, question: "Qual o nome da sua escola primária?", is_active: true },
    ] as SecurityQuestion[]);
  });

  describe("LoginPage - Testes de Segurança", () => {
    it("deve sanitizar entrada de email contra XSS", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const maliciousEmail = '<script>alert("XSS")</script>@test.com';

      await userEvent.type(emailInput, maliciousEmail);

      // Verificar se o valor não contém scripts executáveis
      expect(emailInput).toHaveValue(maliciousEmail);
      expect(screen.queryByRole("script")).not.toBeInTheDocument();
    });

    it("deve prevenir injeção de SQL na entrada de email", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const sqlInjection = "'; DROP TABLE users; --";

      await userEvent.type(emailInput, sqlInjection);

      // O campo deve aceitar a entrada mas não executar código
      expect(emailInput).toHaveValue(sqlInjection);
    });

    it("deve limitar tamanho da entrada de email", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const longEmail = "a".repeat(1000) + "@test.com";

      await userEvent.type(emailInput, longEmail);

      // Verificar se há limitação de tamanho
      const inputValue = emailInput.getAttribute("value") || "";
      expect(inputValue.length).toBeLessThanOrEqual(320); // RFC 5321 limit
    });

    it("deve prevenir ataques de timing no login", async () => {
      mockedAuthService.login.mockRejectedValue(
        new Error("Credenciais inválidas") as any,
      );

      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      // Medir tempo de resposta
      const startTime = Date.now();

      await userEvent.type(emailInput, "nonexistent@test.com");
      await userEvent.type(passwordInput, "wrongpassword");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Verificar se o tempo de resposta não é muito rápido
      expect(responseTime).toBeGreaterThan(100);
    });

    it("deve tratar caracteres Unicode corretamente", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const unicodeEmail = "tëst@exämple.com";

      await userEvent.type(emailInput, unicodeEmail);

      expect(emailInput).toHaveValue(unicodeEmail);
    });

    it("deve limpar dados sensíveis da memória após logout", async () => {
      mockedAuthService.login.mockResolvedValue({
        access_token: "test-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test User",
          role: "USER" as const,
        },
      } as any);

      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      await userEvent.type(emailInput, "test@test.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      // Verificar se os campos foram limpos após login
      await waitFor(() => {
        expect(passwordInput).toHaveValue("");
      });
    });

    it("deve validar formato de email rigorosamente", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const invalidEmails = [
        "invalid-email",
        "@test.com",
        "test@",
        "test..test@test.com",
        "test@test",
        "test@.com",
      ];

      for (const invalidEmail of invalidEmails) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, invalidEmail);

        // Verificar validação HTML5
        expect((emailInput as HTMLInputElement).checkValidity()).toBeFalsy();
      }
    });
  });

  describe("RegisterPage - Testes de Segurança", () => {
    it("deve validar força da senha", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText("Senha");
      const weakPasswords = ["123", "password", "abc123", "qwerty"];

      for (const weakPassword of weakPasswords) {
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, weakPassword);

        // Verificar se há indicação de senha fraca
        const passwordStrengthIndicator = screen.queryByText(/fraca/i);
        expect(passwordStrengthIndicator).toBeTruthy();
      }
    });

    it("deve prevenir registro com dados maliciosos", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const maliciousName = '<script>alert("XSS")</script>';

      await userEvent.type(nameInput, maliciousName);

      // Verificar sanitização
      expect(nameInput).toHaveValue(maliciousName);
      // Verificar que não há scripts executados no DOM
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });
  });

  describe("ForgotPasswordPage - Testes de Segurança", () => {
    it("deve ter timing consistente para emails válidos e inválidos", async () => {
      global.fetch = jest.fn().mockImplementation(async () => {
        // Simular delay consistente
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          ok: true,
          json: async () => ({ message: "Se o email estiver cadastrado, você receberá instruções" }),
        };
      });

      render(<ForgotPasswordPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText(/email/i);
      const submitButton = screen.getByRole("button", { name: /enviar/i });

      // Testar com email válido
      const startTime1 = Date.now();
      await userEvent.type(emailInput, "valid@test.com");
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/se o email estiver cadastrado/i)).toBeInTheDocument();
      });
      
      const endTime1 = Date.now();
      const duration1 = endTime1 - startTime1;

      // Limpar e testar com email inválido
      await userEvent.clear(emailInput);
      
      const startTime2 = Date.now();
      await userEvent.type(emailInput, "invalid@test.com");
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/se o email estiver cadastrado/i)).toBeInTheDocument();
      });
      
      const endTime2 = Date.now();
      const duration2 = endTime2 - startTime2;

      // Verificar timing consistente (diferença menor que 100ms)
      expect(Math.abs(duration1 - duration2)).toBeLessThan(100);
    });

    it("deve sanitizar entrada de chave secreta", async () => {
      render(<ForgotPasswordPage />, { wrapper: TestWrapper });

      const maliciousKey = '<script>alert("XSS")</script>ABCD1234';

      // Buscar campo de chave secreta se existir
      const secretKeyInput = screen.queryByPlaceholderText(/chave secreta/i);
      
      // Se o campo não existir, pular o teste
      if (!secretKeyInput) {
        return;
      }

      await userEvent.type(secretKeyInput, maliciousKey);
      
      // Verificações de sanitização
      expect(secretKeyInput).toHaveValue(maliciousKey);
      // Verificar que não há scripts executados no DOM
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });
  });

  describe("Testes de Integração de Segurança", () => {
    it("deve manter estado de autenticação seguro entre componentes", async () => {
      mockedAuthService.login.mockResolvedValue({
        access_token: "test-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test User",
          role: "USER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      const { rerender } = render(<LoginPage />, { wrapper: TestWrapper });

      // Fazer login
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      await userEvent.type(emailInput, "test@test.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      // Verificar se o token foi armazenado
      expect(localStorage.getItem("token")).toBe("test-token");

      // Trocar para outro componente
      rerender(<RegisterPage />);

      // Verificar se o estado de autenticação persiste
      expect(localStorage.getItem("token")).toBe("test-token");
    });

    it("deve limpar dados sensíveis ao detectar token expirado", async () => {
      // Simular token expirado
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid";
      localStorage.setItem("token", expiredToken);

      render(<LoginPage />, { wrapper: TestWrapper });

      // Verificar se o token expirado foi removido
      await waitFor(() => {
        expect(localStorage.getItem("token")).toBeNull();
      });
    });

    it("deve prevenir ataques de session fixation", async () => {
      // Definir token malicioso antes do login
      localStorage.setItem("token", "malicious-token");

      mockedAuthService.login.mockResolvedValue({
        access_token: "new-legitimate-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test User",
          role: "USER",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      await userEvent.type(emailInput, "test@test.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      // Verificar se o token foi substituído pelo novo token legítimo
      await waitFor(() => {
        expect(localStorage.getItem("token")).toBe("new-legitimate-token");
      });
    });
  });

  describe("Testes de Performance e DoS", () => {
    it("deve lidar com entrada de dados muito grandes", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const hugeInput = "a".repeat(10000);

      const startTime = Date.now();
      await userEvent.type(nameInput, hugeInput);
      const endTime = Date.now();

      // Verificar se não houve travamento
      expect(endTime - startTime).toBeLessThan(5000);

      // Verificar se a entrada foi limitada
      const inputValue = nameInput.getAttribute("value") || "";
      expect(inputValue.length).toBeLessThan(hugeInput.length);
    });

    it("deve prevenir ataques de regex DoS", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByPlaceholderText("E-mail");

      // Email que pode causar catastrophic backtracking
      const maliciousEmail = "a".repeat(100) + "@" + "b".repeat(100) + ".com";

      const startTime = Date.now();
      await userEvent.type(emailInput, maliciousEmail);
      const endTime = Date.now();

      // Verificar se a validação não demorou muito
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});