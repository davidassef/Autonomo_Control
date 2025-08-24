import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../contexts/ToastContext";
import RegisterPage from "./RegisterPage";
import { securityQuestionsService } from "../services/securityQuestions";
import * as authHook from "../contexts/AuthContext";

// Mock dos serviços
jest.mock("../services/securityQuestions");
jest.mock("../contexts/AuthContext", () => ({
  ...jest.requireActual("../contexts/AuthContext"),
  useAuth: jest.fn(),
}));

// Mock do react-router-dom
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

// Componente wrapper para testes
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

// Mock das perguntas de segurança
const mockSecurityQuestions = [
  { id: 1, question: "Qual é o nome de solteira da sua mãe?", is_active: true },
  {
    id: 2,
    question: "Qual foi o nome do seu primeiro animal de estimação?",
    is_active: true,
  },
  {
    id: 3,
    question: "Qual é o nome do seu melhor amigo de infância?",
    is_active: true,
  },
  { id: 4, question: "Em que cidade você nasceu?", is_active: true },
  { id: 5, question: "Qual é o nome do seu professor favorito?", is_active: true },
];

// Mock do contexto de autenticação
const mockAuthContext = {
  register: jest.fn(),
  error: null,
  clearError: jest.fn(),
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authHook.useAuth as jest.Mock).mockReturnValue(mockAuthContext);
    (securityQuestionsService.getAll as jest.Mock).mockResolvedValue(
      mockSecurityQuestions,
    );

    // Garantir que o mock seja aplicado imediatamente
    jest
      .mocked(securityQuestionsService.getAll)
      .mockResolvedValue(mockSecurityQuestions);
  });

  describe("Renderização inicial", () => {
    it("deve renderizar todos os elementos do formulário", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Verifica título
      expect(screen.getByText("Autônomo Control")).toBeInTheDocument();
      expect(screen.getByText("Criar uma nova conta")).toBeInTheDocument();

      // Verifica campos do formulário
      expect(screen.getByPlaceholderText("Nome completo")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("E-mail")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Senha")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Confirmar senha"),
      ).toBeInTheDocument();

      // Verifica botão de cadastro
      expect(
        screen.getByRole("button", { name: "Cadastrar" }),
      ).toBeInTheDocument();

      // Verifica link para login
      expect(
        screen.getByText("Já tem uma conta? Faça login"),
      ).toBeInTheDocument();

      // Aguarda carregamento das perguntas
      await waitFor(() => {
        expect(screen.getByText("Perguntas de Segurança")).toBeInTheDocument();
      });
    });

    it("deve carregar perguntas de segurança na inicialização", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Verifica estado de carregamento
      expect(screen.getByText("Carregando perguntas...")).toBeInTheDocument();

      // Aguarda carregamento
      await waitFor(() => {
        expect(securityQuestionsService.getAll).toHaveBeenCalledTimes(1);
      });

      // Verifica se as perguntas foram carregadas
      await waitFor(() => {
        expect(
          screen.getByText("Primeira pergunta secreta"),
        ).toBeInTheDocument();
      });
      
      expect(
        screen.getByText("Segunda pergunta secreta"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Terceira pergunta secreta"),
      ).toBeInTheDocument();
    });

    it("deve exibir erro ao falhar no carregamento das perguntas", async () => {
      const errorMessage = "Erro de rede";
      (securityQuestionsService.getAll as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "Erro ao carregar perguntas secretas. Tente novamente.",
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Validação de campos", () => {
    const renderRegisterPage = async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Aguarda carregamento das perguntas
      await waitFor(() => {
        expect(
          screen.getByText("Primeira pergunta secreta"),
        ).toBeInTheDocument();
      });
    };

    it("deve validar campos obrigatórios", async () => {
      await renderRegisterPage();

      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
      });

      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
      expect(screen.getByText("Senha é obrigatória")).toBeInTheDocument();

      expect(mockAuthContext.register).not.toHaveBeenCalled();
    });

    it("deve validar tamanho mínimo da senha", async () => {
      await renderRegisterPage();

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");
      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "123" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "123" } });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("A senha deve ter pelo menos 8 caracteres"),
        ).toBeInTheDocument();
      });

      expect(mockAuthContext.register).not.toHaveBeenCalled();
    });

    it("deve validar confirmação de senha", async () => {
      await renderRegisterPage();

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");
      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "DifferentPass123!" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
      });

      expect(mockAuthContext.register).not.toHaveBeenCalled();
    });

    it("deve validar seleção de perguntas de segurança", async () => {
      await renderRegisterPage();

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");
      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Selecione todas as três perguntas secretas"),
        ).toBeInTheDocument();
      });

      expect(mockAuthContext.register).not.toHaveBeenCalled();
    });

    it("deve validar respostas das perguntas de segurança", async () => {
      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");

      // Seleciona perguntas
      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");
      const question3Select = screen.getByLabelText(
        "Terceira pergunta secreta",
      );

      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });
      fireEvent.change(question2Select, {
        target: { value: "FIRST_PET_NAME" },
      });
      fireEvent.change(question3Select, {
        target: { value: "CHILDHOOD_FRIEND" },
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Responda todas as três perguntas secretas"),
        ).toBeInTheDocument();
      });

      expect(mockAuthContext.register).not.toHaveBeenCalled();
    });

    it("deve validar perguntas diferentes", async () => {
      // Limpa o DOM antes de renderizar novamente
      cleanup();

      // Renderiza o componente
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Primeira pergunta secreta"),
        ).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");

      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");
      const question3Select = screen.getByLabelText(
        "Terceira pergunta secreta",
      );

      // Preenche dados básicos
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      // Seleciona perguntas diferentes primeiro para que os campos apareçam
      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });
      fireEvent.change(question2Select, {
        target: { value: "FIRST_PET_NAME" },
      });
      fireEvent.change(question3Select, {
        target: { value: "CHILDHOOD_FRIEND" },
      });

      // Aguarda que os campos de resposta apareçam
      await waitFor(() => {
        const answerInputs = screen.getAllByPlaceholderText(
          "Digite sua resposta",
        );
        expect(answerInputs).toHaveLength(3);
      });

      // Preenche respostas
      const answerInputs = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      );
      fireEvent.change(answerInputs[0], { target: { value: "Silva" } });
      fireEvent.change(answerInputs[1], { target: { value: "Rex" } });
      fireEvent.change(answerInputs[2], { target: { value: "João" } });

      // Agora força a duplicação alterando diretamente o valor do select
      // para simular a situação de perguntas duplicadas
      Object.defineProperty(question2Select, "value", {
        writable: true,
        value: "MOTHER_MAIDEN_NAME",
      });

      // Dispara evento de mudança para simular a seleção duplicada
      fireEvent.change(question2Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });

      // Submete o formulário usando uma busca mais robusta
      const buttons = screen.getAllByRole("button");
      const submitButton = buttons.find(
        (button) => button.textContent === "Cadastrar",
      );
      expect(submitButton).toBeDefined();

      fireEvent.click(submitButton!);

      await waitFor(() => {
        expect(
          screen.getByText("Selecione três perguntas diferentes"),
        ).toBeInTheDocument();
      });

      expect(mockAuthContext.register).not.toHaveBeenCalled();
    });
  });

  describe("Interações do usuário", () => {
    const renderRegisterPageForInteraction = async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Primeira pergunta secreta"),
        ).toBeInTheDocument();
      });
    };

    it("deve limpar resposta ao trocar pergunta de segurança", async () => {
      await renderRegisterPageForInteraction();
      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );

      // Seleciona primeira pergunta
      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });

      const answer1Input = screen.getByPlaceholderText("Digite sua resposta");
      fireEvent.change(answer1Input, { target: { value: "Silva" } });

      await waitFor(() => {
        expect(answer1Input).toHaveValue("Silva");
      });

      // Troca para outra pergunta
      fireEvent.change(question1Select, {
        target: { value: "FIRST_PET_NAME" },
      });

      await waitFor(() => {
        const answer1Input = screen.getByPlaceholderText("Digite sua resposta");
        expect(answer1Input).toHaveValue("");
      });
    });

    it("deve filtrar perguntas já selecionadas em outros dropdowns", async () => {
      await renderRegisterPageForInteraction();
      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");

      // Seleciona primeira pergunta
      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });

      // Verifica se a pergunta selecionada não aparece no segundo dropdown
      const availableOptions = within(question2Select).getAllByRole("option");
      const optionValues = availableOptions.map(
        (option) => (option as HTMLOptionElement).value,
      );

      expect(optionValues).not.toContain("MOTHER_MAIDEN_NAME");
    });

    it("deve exibir campos de resposta apenas após selecionar pergunta", async () => {
      await renderRegisterPageForInteraction();
      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );

      // Inicialmente não deve haver campo de resposta
      expect(
        screen.queryByLabelText("security-answer-1"),
      ).not.toBeInTheDocument();

      // Seleciona pergunta
      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });

      // Agora deve aparecer o campo de resposta
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Digite sua resposta"),
        ).toBeInTheDocument();
      });
    });

    it("deve limpar erro ao interagir com campos", async () => {
      // Simula erro no contexto
      (authHook.useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        error: "Erro de teste",
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Erro de teste")).toBeInTheDocument();
      });

      // Clica no botão de fechar erro
      const closeButton = screen.getByTitle("Fechar");
      fireEvent.click(closeButton);

      expect(mockAuthContext.clearError).toHaveBeenCalled();
    });
  });

  describe("Submissão do formulário", () => {
    const renderRegisterPageForSubmission = async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Primeira pergunta secreta"),
        ).toBeInTheDocument();
      });
    };

    it("deve submeter formulário com dados válidos", async () => {
      await renderRegisterPageForSubmission();

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");

      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");
      const question3Select = screen.getByLabelText(
        "Terceira pergunta secreta",
      );

      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      // Preenche dados básicos
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      // Seleciona perguntas
      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });
      fireEvent.change(question2Select, {
        target: { value: "FIRST_PET_NAME" },
      });
      fireEvent.change(question3Select, {
        target: { value: "CHILDHOOD_FRIEND" },
      });

      // Aguarda que os campos de resposta apareçam após selecionar as perguntas
      await waitFor(() => {
        const answerInputs = screen.getAllByPlaceholderText(
          "Digite sua resposta",
        );
        expect(answerInputs).toHaveLength(3);
      });

      // Preenche respostas
      const answerInputs = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      );
      fireEvent.change(answerInputs[0], { target: { value: "Silva" } });
      fireEvent.change(answerInputs[1], { target: { value: "Rex" } });
      fireEvent.change(answerInputs[2], { target: { value: "João" } });

      // Submete formulário
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthContext.register).toHaveBeenCalledWith(
          "Test User",
          "test@example.com",
          "SecurePass123!",
          "MOTHER_MAIDEN_NAME",
          "Silva",
          "FIRST_PET_NAME",
          "Rex",
          "CHILDHOOD_FRIEND",
          "João",
        );
      });
    });

    it("deve navegar para home após registro bem-sucedido", async () => {
      await renderRegisterPageForSubmission();

      mockAuthContext.register.mockResolvedValue(undefined);

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");

      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");
      const question3Select = screen.getByLabelText(
        "Terceira pergunta secreta",
      );

      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      // Preenche formulário
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });
      fireEvent.change(question2Select, {
        target: { value: "FIRST_PET_NAME" },
      });
      fireEvent.change(question3Select, {
        target: { value: "CHILDHOOD_FRIEND" },
      });

      // Aguarda que os campos de resposta apareçam após selecionar as perguntas
      await waitFor(() => {
        const answerInputs = screen.getAllByPlaceholderText(
          "Digite sua resposta",
        );
        expect(answerInputs).toHaveLength(3);
      });

      // Preenche respostas
      const answerInputs = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      );
      fireEvent.change(answerInputs[0], { target: { value: "Silva" } });
      fireEvent.change(answerInputs[1], { target: { value: "Rex" } });
      fireEvent.change(answerInputs[2], { target: { value: "João" } });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("deve exibir estado de carregamento durante submissão", async () => {
      await renderRegisterPageForSubmission();

      // Mock para simular delay
      mockAuthContext.register.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");

      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");
      const question3Select = screen.getByLabelText(
        "Terceira pergunta secreta",
      );

      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      // Preenche formulário
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });
      fireEvent.change(question2Select, {
        target: { value: "FIRST_PET_NAME" },
      });
      fireEvent.change(question3Select, {
        target: { value: "CHILDHOOD_FRIEND" },
      });

      // Aguarda que os campos de resposta apareçam após selecionar as perguntas
      await waitFor(() => {
        const answerInputs = screen.getAllByPlaceholderText(
          "Digite sua resposta",
        );
        expect(answerInputs).toHaveLength(3);
      });

      // Preenche respostas
      const answerInputs = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      );
      fireEvent.change(answerInputs[0], { target: { value: "Silva" } });
      fireEvent.change(answerInputs[1], { target: { value: "Rex" } });
      fireEvent.change(answerInputs[2], { target: { value: "João" } });

      fireEvent.click(submitButton);

      // Verifica estado de carregamento
      expect(
        screen.getByRole("button", { name: "Cadastrando..." }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cadastrando..." }),
      ).toBeDisabled();
    });

    it("deve tratar erro durante submissão", async () => {
      await renderRegisterPageForSubmission();

      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockAuthContext.register.mockRejectedValue(new Error("Erro de registro"));

      const nameInput = screen.getByPlaceholderText("Nome completo");
      const emailInput = screen.getByPlaceholderText("E-mail");
      const passwordInput = screen.getByPlaceholderText("Senha");
      const confirmPasswordInput =
        screen.getByPlaceholderText("Confirmar senha");

      const question1Select = screen.getByLabelText(
        "Primeira pergunta secreta",
      );
      const question2Select = screen.getByLabelText("Segunda pergunta secreta");
      const question3Select = screen.getByLabelText(
        "Terceira pergunta secreta",
      );

      const submitButton = screen.getByRole("button", { name: "Cadastrar" });

      // Preenche formulário
      fireEvent.change(nameInput, { target: { value: "Test User" } });
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "SecurePass123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "SecurePass123!" },
      });

      fireEvent.change(question1Select, {
        target: { value: "MOTHER_MAIDEN_NAME" },
      });
      fireEvent.change(question2Select, {
        target: { value: "FIRST_PET_NAME" },
      });
      fireEvent.change(question3Select, {
        target: { value: "CHILDHOOD_FRIEND" },
      });

      // Aguarda que os campos de resposta apareçam após selecionar as perguntas
      await waitFor(() => {
        const answerInputs = screen.getAllByPlaceholderText(
          "Digite sua resposta",
        );
        expect(answerInputs).toHaveLength(3);
      });

      // Preenche respostas
      const answerInputs = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      );
      fireEvent.change(answerInputs[0], { target: { value: "Silva" } });
      fireEvent.change(answerInputs[1], { target: { value: "Rex" } });
      fireEvent.change(answerInputs[2], { target: { value: "João" } });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Registration failed:",
          expect.any(Error),
        );
      });

      // Botão deve voltar ao estado normal
      expect(
        screen.getByRole("button", { name: "Cadastrar" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cadastrar" }),
      ).not.toBeDisabled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Exibição de erros", () => {
    it("deve exibir erro do contexto de autenticação", async () => {
      const errorMessage = "Email já está em uso";
      (authHook.useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        error: errorMessage,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("deve permitir fechar erro clicando no X", async () => {
      const errorMessage = "Email já está em uso";
      (authHook.useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        error: errorMessage,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const closeButton = screen.getByTitle("Fechar");
      fireEvent.click(closeButton);

      expect(mockAuthContext.clearError).toHaveBeenCalled();
    });
  });

  describe("Navegação", () => {
    it("deve navegar para página de login ao clicar no link", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const loginLink = screen.getByText("Já tem uma conta? Faça login");
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Acessibilidade", () => {
    const renderRegisterPageForAccessibility = async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Primeira pergunta secreta"),
        ).toBeInTheDocument();
      });
    };

    it("deve ter labels apropriados para todos os campos", async () => {
      await renderRegisterPageForAccessibility();

      // Campos com labels visuais
      expect(
        screen.getByLabelText("Primeira pergunta secreta"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Segunda pergunta secreta"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Terceira pergunta secreta"),
      ).toBeInTheDocument();

      // Campos com labels sr-only
      expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
      expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
      expect(screen.getByLabelText("Senha")).toBeInTheDocument();
      expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
    });

    it("deve ter atributos required nos campos obrigatórios", async () => {
      await renderRegisterPageForAccessibility();

      expect(screen.getByPlaceholderText("Nome completo")).toBeRequired();
      expect(screen.getByPlaceholderText("E-mail")).toBeRequired();
      expect(screen.getByPlaceholderText("Senha")).toBeRequired();
      expect(screen.getByPlaceholderText("Confirmar senha")).toBeRequired();
    });

    it("deve ter role alert para mensagens de erro", async () => {
      const errorMessage = "Erro de teste";
      (authHook.useAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        error: errorMessage,
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
