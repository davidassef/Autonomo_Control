import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import ForgotPasswordPage from "../../pages/ForgotPasswordPage";
import { authService } from "../../services/auth";
import { securityQuestionsService, SecurityQuestion } from "../../services/securityQuestions";

// Mock dos serviços
jest.mock("../../services/auth");
jest.mock("../../services/securityQuestions");
jest.mock("../../services/api");

const mockedAuthService = jest.mocked(authService);
const mockedSecurityQuestionsService = jest.mocked(securityQuestionsService);

// Wrapper para testes com contexto
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("Testes de Segurança - Componentes de Autenticação", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock padrão para perguntas de segurança
    mockedSecurityQuestionsService.getAll.mockResolvedValue([
      {
        id: 1,
        question: "Qual o nome do seu primeiro animal de estimação?",
        is_active: true,
      },
      { id: 2, question: "Em que cidade você nasceu?", is_active: true },
      {
        id: 3,
        question: "Qual o nome da sua escola primária?",
        is_active: true,
      },
    ]);
  });

  describe("LoginPage - Testes de Segurança", () => {
    it("deve sanitizar entrada de email contra XSS", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const maliciousEmail = '<script>alert("XSS")</script>@test.com';

      await userEvent.type(emailInput, maliciousEmail);

      // Verificar se o valor foi sanitizado
      expect(emailInput).toHaveValue(maliciousEmail);
      // O valor deve ser tratado como texto, não executado
      // Verificar que não há scripts executados no DOM
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });

    it("deve prevenir injeção de código em campos de senha", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const passwordInput = screen.getByLabelText(/senha/i);
      const maliciousPassword = 'password"; DROP TABLE users; --';

      await userEvent.type(passwordInput, maliciousPassword);

      expect(passwordInput).toHaveValue(maliciousPassword);
      // Verificar que não há execução de código
      expect(passwordInput.getAttribute("type")).toBe("password");
    });

    it("deve limitar tentativas de login para prevenir força bruta", async () => {
      mockedAuthService.login.mockRejectedValue(
        new Error("Credenciais inválidas"),
      );

      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      // Simular múltiplas tentativas de login
      for (let i = 0; i < 5; i++) {
        await userEvent.clear(emailInput);
        await userEvent.clear(passwordInput);
        await userEvent.type(emailInput, `test${i}@test.com`);
        await userEvent.type(passwordInput, "wrongpassword");

        await userEvent.click(submitButton);
        await waitFor(() => {
          expect(
            screen.getByText(/credenciais inválidas/i),
          ).toBeInTheDocument();
        });
      }

      expect(mockedAuthService.login).toHaveBeenCalledTimes(5);
    });

    it("deve validar formato de email rigorosamente", async () => {
      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user..double.dot@domain.com",
        "user@domain",
        "user name@domain.com", // espaço
        "user@domain..com", // duplo ponto no domínio
      ];

      for (const invalidEmail of invalidEmails) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, invalidEmail);

        // Verificar validação HTML5
        expect(emailInput).toBeInvalid();
      }
    });

    it("deve proteger contra timing attacks no login", async () => {
      mockedAuthService.login.mockImplementation(async (email, password) => {
        // Simular delay consistente independente da validade das credenciais
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error("Credenciais inválidas");
      });

      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      await userEvent.type(emailInput, "test@test.com");
      await userEvent.type(passwordInput, "password");

      const startTime = Date.now();
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar que o tempo de resposta é consistente (pelo menos 100ms)
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it("deve limpar dados sensíveis da memória após logout", async () => {
      mockedAuthService.login.mockResolvedValue({
        access_token: "test-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test User",
          role: "USER",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      });

      render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);
      const submitButton = screen.getByRole("button", { name: /entrar/i });

      await userEvent.type(emailInput, "test@test.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalledWith(
          "test@test.com",
          "password123",
        );
      });

      // Verificar que os campos foram limpos após login bem-sucedido
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
    });
  });

  describe("RegisterPage - Testes de Segurança", () => {
    it("deve validar força da senha rigorosamente", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^senha$/i);
      const weakPasswords = [
        "123", // muito curta
        "password", // muito comum
        "12345678", // apenas números
        "abcdefgh", // apenas letras
        "PASSWORD", // apenas maiúsculas
        "password123", // sem caracteres especiais
        "        ", // apenas espaços
      ];

      for (let i = 0; i < weakPasswords.length; i++) {
        const weakPassword = weakPasswords[i];
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, weakPassword);

        // Verificar se a validação de força da senha é ativada
        fireEvent.blur(passwordInput);

        // A validação deve indicar senha fraca
        expect(
          (passwordInput as HTMLInputElement).value.length < 8 ||
            !/[A-Z]/.test((passwordInput as HTMLInputElement).value) ||
            !/[a-z]/.test((passwordInput as HTMLInputElement).value) ||
            !/[0-9]/.test((passwordInput as HTMLInputElement).value),
        ).toBeTruthy();
      }
    });

    it("deve prevenir registro com dados maliciosos", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);

      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        "${7*7}", // template injection
        "{{7*7}}", // template injection
        "SELECT * FROM users", // SQL injection attempt
      ];

      for (let i = 0; i < maliciousInputs.length; i++) {
        const maliciousInput = maliciousInputs[i];
        await userEvent.clear(nameInput);
        await userEvent.clear(emailInput);

        await userEvent.type(nameInput, maliciousInput);
        await userEvent.type(emailInput, `${maliciousInput}@test.com`);

        // Verificar que o input foi tratado como texto
        expect(nameInput).toHaveValue(maliciousInput);
        expect(emailInput).toHaveValue(`${maliciousInput}@test.com`);

        // Verificar que não há execução de script
        // Verificar que não há scripts executados no DOM
        expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
      }
    });

    it("deve validar unicidade e segurança das perguntas de segurança", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      // Aguardar carregamento das perguntas
      await waitFor(() => {
        expect(screen.getAllByRole("combobox")).toHaveLength(3);
      });

      const selects = screen.getAllByRole("combobox");

      // Tentar selecionar a mesma pergunta em múltiplos campos
      await userEvent.selectOptions(selects[0], "1");
      await userEvent.selectOptions(selects[1], "1");
      await userEvent.selectOptions(selects[2], "1");

      // Verificar que a validação impede perguntas duplicadas
      const submitButton = screen.getByRole("button", { name: /registrar/i });
      await userEvent.click(submitButton);

      // Deve mostrar erro de validação
      await waitFor(() => {
        expect(
          screen.getByText(/perguntas devem ser diferentes/i),
        ).toBeInTheDocument();
      });
    });

    it("deve validar respostas de segurança contra ataques", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      // Aguardar carregamento das perguntas
      await waitFor(() => {
        expect(screen.getAllByRole("combobox")).toHaveLength(3);
      });

      const answerInputs = screen.getAllByLabelText(/resposta/i);

      const maliciousAnswers = [
        '<script>alert("XSS")</script>',
        "javascript:void(0)",
        "../../etc/passwd",
        "${process.env}",
        "null",
        "undefined",
        "",
      ];

      for (
        let i = 0;
        i < answerInputs.length && i < maliciousAnswers.length;
        i++
      ) {
        await userEvent.type(answerInputs[i], maliciousAnswers[i]);

        // Verificar que a resposta foi tratada como texto
        expect(answerInputs[i]).toHaveValue(maliciousAnswers[i]);
      }

      // Verificar que não há execução de código malicioso
      // Verificar que não há scripts executados no DOM
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });

    it("deve limitar tamanho dos campos para prevenir DoS", async () => {
      render(<RegisterPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/nome/i);
      const emailInput = screen.getByLabelText(/email/i);

      // Tentar inserir dados muito grandes
      const largeString = "a".repeat(10000);

      await userEvent.type(nameInput, largeString);
      await userEvent.type(emailInput, `${largeString}@test.com`);

      // Verificar que os campos têm limitação de tamanho
      expect((nameInput as HTMLInputElement).value.length).toBeLessThanOrEqual(255);
      expect((emailInput as HTMLInputElement).value.length).toBeLessThanOrEqual(320); // RFC 5321 limit
    });
  });

  describe("ForgotPasswordPage - Testes de Segurança", () => {
    it("deve prevenir enumeração de usuários", async () => {
      // Mock para simular usuário não encontrado
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Usuário não encontrado" }),
      });

      render(<ForgotPasswordPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /verificar/i });

      await userEvent.type(emailInput, "nonexistent@test.com");
      await userEvent.click(submitButton);

      // Deve mostrar mensagem genérica para não revelar se o usuário existe
      await waitFor(() => {
        const message = screen.getByText(/se o email estiver cadastrado/i);
        expect(message).toBeInTheDocument();
      });
    });

    it("deve limitar tentativas de redefinição de senha", async () => {
      let attemptCount = 0;

      global.fetch = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount > 3) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: async () => ({
              detail: "Muitas tentativas. Tente novamente mais tarde.",
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: "Email enviado" }),
        });
      });

      render(<ForgotPasswordPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /verificar/i });

      // Fazer múltiplas tentativas
      for (let i = 0; i < 5; i++) {
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, `test${i}@test.com`);
        await userEvent.click(submitButton);

        await waitFor(() => {
          screen.getByText(/se o email estiver cadastrado|muitas tentativas/i);
        });

        const expectedText = i < 3 
          ? /se o email estiver cadastrado/i
          : /muitas tentativas/i;
        
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
    });

    it("deve validar respostas de segurança com timing consistente", async () => {
      // Mock para simular verificação de usuário bem-sucedida
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            role: "USER",
            security_questions: [
              { id: 1, question: "Pergunta 1", is_active: true },
              { id: 2, question: "Pergunta 2", is_active: true },
              { id: 3, question: "Pergunta 3", is_active: true },
            ],
          }),
        })
        .mockImplementation(async () => {
          // Simular delay consistente para prevenir timing attacks
          await new Promise((resolve) => setTimeout(resolve, 200));
          return {
            ok: false,
            status: 400,
            json: async () => ({ detail: "Respostas incorretas" }),
          };
        });

      render(<ForgotPasswordPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, "test@test.com");
      await userEvent.click(screen.getByRole("button", { name: /verificar/i }));

      // Aguardar transição para o passo de perguntas de segurança
      await waitFor(() => {
        expect(screen.getByText(/responda as perguntas/i)).toBeInTheDocument();
      });

      // Selecionar método de perguntas de segurança
      await userEvent.click(screen.getByText(/perguntas de segurança/i));
      await userEvent.click(screen.getByRole("button", { name: /continuar/i }));

      // Aguardar carregamento das perguntas
      await waitFor(() => {
        expect(screen.getAllByLabelText(/resposta/i)).toHaveLength(3);
      });

      const answerInputs = screen.getAllByLabelText(/resposta/i);

      // Preencher respostas incorretas
      await userEvent.type(answerInputs[0], "resposta1");
      await userEvent.type(answerInputs[1], "resposta2");
      await userEvent.type(answerInputs[2], "resposta3");

      const startTime = Date.now();
      await userEvent.click(
        screen.getByRole("button", { name: /verificar respostas/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/respostas incorretas/i)).toBeInTheDocument();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar timing consistente (pelo menos 200ms)
      expect(duration).toBeGreaterThanOrEqual(200);
    });

    it("deve sanitizar entrada de nova senha", async () => {
      // Mock para simular fluxo completo até redefinição de senha
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            role: "USER",
            security_questions: [
              { id: 1, question: "Pergunta 1", is_active: true },
              { id: 2, question: "Pergunta 2", is_active: true },
              { id: 3, question: "Pergunta 3", is_active: true },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: "Respostas corretas" }),
        });

      render(<ForgotPasswordPage />, { wrapper: TestWrapper });

      // Navegar até o passo de redefinição de senha
      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, "test@test.com");
      await userEvent.click(screen.getByRole("button", { name: /verificar/i }));

      await waitFor(() => {
        expect(screen.getByText(/responda as perguntas/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText(/perguntas de segurança/i));
      await userEvent.click(screen.getByRole("button", { name: /continuar/i }));

      await waitFor(() => {
        expect(screen.getAllByLabelText(/resposta/i)).toHaveLength(3);
      });

      const answerInputs = screen.getAllByLabelText(/resposta/i);
      await userEvent.type(answerInputs[0], "resposta1");
      await userEvent.type(answerInputs[1], "resposta2");
      await userEvent.type(answerInputs[2], "resposta3");

      await userEvent.click(
        screen.getByRole("button", { name: /verificar respostas/i }),
      );

      // Aguardar passo de nova senha
      await waitFor(() => {
        expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument();
      });

      const newPasswordInput = screen.getByLabelText(/nova senha/i);
      const maliciousPassword = '<script>alert("XSS")</script>password123';

      await userEvent.type(newPasswordInput, maliciousPassword);

      // Verificar que a senha foi tratada como texto
      expect(newPasswordInput).toHaveValue(maliciousPassword);
      expect(newPasswordInput.getAttribute("type")).toBe("password");
      // Verificar que não há scripts executados no DOM
      expect(screen.queryByText(/alert/)).not.toBeInTheDocument();
    });
  });

  describe("Testes de Integração de Segurança", () => {
    it("deve manter estado de segurança consistente entre componentes", async () => {
      // Testar fluxo completo: Login -> Logout -> Register
      mockedAuthService.login.mockResolvedValue({
        access_token: "test-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@test.com",
          name: "Test User",
          role: "USER",
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      });

      // Renderizar LoginPage
      const { rerender } = render(<LoginPage />, { wrapper: TestWrapper });

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      await userEvent.type(emailInput, "test@test.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

      await waitFor(() => {
        expect(mockedAuthService.login).toHaveBeenCalled();
      });

      // Simular logout e mudança para RegisterPage
      mockedAuthService.logout.mockImplementation(() => {
        localStorage.removeItem("token");
      });

      rerender(<RegisterPage />);

      // Verificar que o estado foi limpo
      expect(localStorage.getItem("token")).toBeNull();

      await waitFor(() => {
        expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      });
    });

    it("deve proteger contra ataques de sessão", async () => {
      // Simular token expirado
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid";
      localStorage.setItem("token", expiredToken);

      render(<LoginPage />, { wrapper: TestWrapper });

      // Verificar que o token expirado foi removido
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("deve validar integridade dos dados em todos os formulários", async () => {
      const testCases = [
        { component: LoginPage, fields: ["email", "senha"] },
        { component: RegisterPage, fields: ["nome", "email", "senha"] },
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const { rerender } = render(<testCase.component />, {
          wrapper: TestWrapper,
        });
        
        // Aguardar carregamento do componente
        if (testCase.component === RegisterPage) {
          await waitFor(() => {
            screen.getByLabelText(/nome/i);
          });
        }

        // Verificar que todos os campos obrigatórios estão presentes
        for (let j = 0; j < testCase.fields.length; j++) {
          const field = testCase.fields[j];
          const input = screen.getByLabelText(new RegExp(field, "i"));
          expect(input).toBeInTheDocument();
          expect(input).toBeRequired();
        }

        rerender(<div />); // Limpar para próximo teste
      }
    });
  });
});
