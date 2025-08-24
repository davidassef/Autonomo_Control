import React from "react";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../../pages/RegisterPage";
import { AuthProvider } from "../../contexts/AuthContext";
import * as authService from "../../services/auth";
import * as cepService from "../../services/cep";

// Mock dos serviços
jest.mock("../../services/auth");
jest.mock("../../services/cep");

const mockAuthService = authService as any;
const mockCepService = cepService as any;

// Mock do react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Componente wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("RegisterForm - Formulário Expandido", () => {
  const user = userEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService.register.mockResolvedValue({
      access_token: "fake-token",
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      },
    });

    mockCepService.fetchAddressByCEP.mockResolvedValue({
      cep: "01310-100",
      street: "Rua Augusta",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Renderização dos Campos", () => {
    it("deve renderizar todos os campos obrigatórios", () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Campos obrigatórios
      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();

      // Perguntas de segurança
      expect(screen.getAllByText(/pergunta de segurança/i)).toHaveLength(3);
      expect(screen.getAllByLabelText(/resposta/i)).toHaveLength(3);
    });

    it("deve renderizar todos os campos opcionais", () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Campos opcionais
      expect(screen.getByLabelText(/cpf/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data de nascimento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cep/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rua/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/número/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/complemento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bairro/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
    });

    it("deve renderizar o botão de cadastro", () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      expect(
        screen.getByRole("button", { name: /cadastrar/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Validação de CPF", () => {
    it("deve formatar CPF automaticamente durante a digitação", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cpfInput = screen.getByLabelText(/cpf/i);

      await user.type(cpfInput, "12345678901");

      expect(cpfInput).toHaveValue("123.456.789-01");
    });

    it("deve mostrar erro para CPF inválido", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cpfInput = screen.getByLabelText(/cpf/i);

      await user.type(cpfInput, "12345678900"); // CPF inválido
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
      });
    });

    it("deve aceitar CPF válido", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cpfInput = screen.getByLabelText(/cpf/i);

      await user.type(cpfInput, "12345678901"); // CPF válido
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/cpf inválido/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Validação de Telefone", () => {
    it("deve formatar telefone automaticamente", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const phoneInput = screen.getByLabelText(/telefone/i);

      await user.type(phoneInput, "11987654321");

      expect(phoneInput).toHaveValue("(11) 98765-4321");
    });

    it("deve mostrar erro para telefone inválido", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const phoneInput = screen.getByLabelText(/telefone/i);

      await user.type(phoneInput, "123"); // Telefone muito curto
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/telefone inválido/i)).toBeInTheDocument();
      });
    });
  });

  describe("Integração com ViaCEP", () => {
    it("deve buscar endereço automaticamente ao digitar CEP válido", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cepInput = screen.getByLabelText(/cep/i);

      await user.type(cepInput, "01310100");
      await user.tab();

      await waitFor(() => {
        expect(mockCepService.fetchAddressByCEP).toHaveBeenCalledWith("01310100");
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue("Rua Augusta")).toBeInTheDocument();
      });
      
      expect(screen.getByDisplayValue("Consolação")).toBeInTheDocument();
      expect(screen.getByDisplayValue("São Paulo")).toBeInTheDocument();
      expect(screen.getByDisplayValue("SP")).toBeInTheDocument();
    });

    it("deve mostrar loading durante busca do CEP", async () => {
      // Mock com delay para simular loading
      mockCepService.fetchAddressByCEP.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  cep: "01310-100",
                  street: "Rua Augusta",
                  neighborhood: "Consolação",
                  city: "São Paulo",
                  state: "SP",
                }),
              100,
            ),
          ),
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cepInput = screen.getByLabelText(/cep/i);

      await user.type(cepInput, "01310100");
      await user.tab();

      // Verifica se o loading aparece
      expect(screen.getByText(/buscando/i)).toBeInTheDocument();

      // Aguarda o loading desaparecer
      await waitFor(() => {
        expect(screen.queryByText(/buscando/i)).not.toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando CEP não for encontrado", async () => {
      mockCepService.fetchAddressByCEP.mockResolvedValue(null);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cepInput = screen.getByLabelText(/cep/i);

      await user.type(cepInput, "99999999");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/cep não encontrado/i)).toBeInTheDocument();
      });
    });

    it("deve permitir edição manual dos campos de endereço", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const streetInput = screen.getByLabelText(/rua/i);
      const numberInput = screen.getByLabelText(/número/i);

      await user.type(streetInput, "Rua Manual");
      await user.type(numberInput, "456");

      expect(streetInput).toHaveValue("Rua Manual");
      expect(numberInput).toHaveValue("456");
    });
  });

  describe("Validação de Data de Nascimento", () => {
    it("deve mostrar erro para idade menor que 16 anos", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const birthDateInput = screen.getByLabelText(/data de nascimento/i);

      // Data de 10 anos atrás
      const recentDate = new Date();
      recentDate.setFullYear(recentDate.getFullYear() - 10);
      const dateString = recentDate.toISOString().split("T")[0];

      await user.type(birthDateInput, dateString);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/16 anos/i)).toBeInTheDocument();
      });
    });

    it("deve aceitar idade válida (maior que 16 anos)", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const birthDateInput = screen.getByLabelText(/data de nascimento/i);

      await user.type(birthDateInput, "1990-01-01");
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/16 anos/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Validação de Senha", () => {
    it("deve mostrar erro quando senhas não coincidem", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

      await user.type(passwordInput, "Password123!");
      await user.type(confirmPasswordInput, "DifferentPassword123!");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
      });
    });

    it("deve aceitar senhas que coincidem", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const passwordInput = screen.getByLabelText(/^senha$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);

      await user.type(passwordInput, "Password123!");
      await user.type(confirmPasswordInput, "Password123!");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText(/senhas não coincidem/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Perguntas de Segurança", () => {
    it("deve permitir selecionar diferentes perguntas", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const selects = screen.getAllByRole("combobox");

      // Seleciona diferentes perguntas
      await user.selectOptions(selects[0], "1");
      await user.selectOptions(selects[1], "2");
      await user.selectOptions(selects[2], "3");

      expect(selects[0]).toHaveValue("1");
      expect(selects[1]).toHaveValue("2");
      expect(selects[2]).toHaveValue("3");
    });

    it("deve mostrar erro ao selecionar perguntas duplicadas", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const selects = screen.getAllByRole("combobox");

      // Seleciona a mesma pergunta
      await user.selectOptions(selects[0], "1");
      await user.selectOptions(selects[1], "1");

      await waitFor(() => {
        expect(
          screen.getByText(/perguntas devem ser diferentes/i),
        ).toBeInTheDocument();
      });
    });

    it("deve permitir preencher respostas das perguntas", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const answerInputs = screen.getAllByLabelText(/resposta/i);

      await user.type(answerInputs[0], "Resposta 1");
      await user.type(answerInputs[1], "Resposta 2");
      await user.type(answerInputs[2], "Resposta 3");

      expect(answerInputs[0]).toHaveValue("Resposta 1");
      expect(answerInputs[1]).toHaveValue("Resposta 2");
      expect(answerInputs[2]).toHaveValue("Resposta 3");
    });
  });

  describe("Submissão do Formulário", () => {
    const fillRequiredFields = async () => {
      await user.type(screen.getByLabelText(/nome completo/i), "Test User");
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "Password123!");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "Password123!",
      );

      // Perguntas de segurança
      const selects = screen.getAllByRole("combobox");
      const answerInputs = screen.getAllByLabelText(/resposta/i);

      await user.selectOptions(selects[0], "1");
      await user.selectOptions(selects[1], "2");
      await user.selectOptions(selects[2], "3");

      await user.type(answerInputs[0], "Resposta 1");
      await user.type(answerInputs[1], "Resposta 2");
      await user.type(answerInputs[2], "Resposta 3");
    };

    it("deve submeter formulário com dados mínimos", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
          security_questions: [
            { question_id: "1", answer: "Resposta 1" },
            { question_id: "2", answer: "Resposta 2" },
            { question_id: "3", answer: "Resposta 3" },
          ],
        });
      });
    });

    it("deve submeter formulário com todos os campos preenchidos", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await fillRequiredFields();

      // Preenche campos opcionais
      await user.type(screen.getByLabelText(/cpf/i), "12345678901");
      await user.type(
        screen.getByLabelText(/data de nascimento/i),
        "1990-01-01",
      );
      await user.type(screen.getByLabelText(/telefone/i), "11987654321");
      await user.type(screen.getByLabelText(/cep/i), "01310100");
      await user.type(screen.getByLabelText(/rua/i), "Rua Augusta");
      await user.type(screen.getByLabelText(/número/i), "123");
      await user.type(screen.getByLabelText(/complemento/i), "Apto 45");
      await user.type(screen.getByLabelText(/bairro/i), "Consolação");
      await user.type(screen.getByLabelText(/cidade/i), "São Paulo");
      await user.selectOptions(screen.getByLabelText(/estado/i), "SP");

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          name: "Test User",
          email: "test@example.com",
          password: "Password123!",
          cpf: "123.456.789-01",
          birth_date: "1990-01-01",
          phone: "(11) 98765-4321",
          cep: "01310-100",
          street: "Rua Augusta",
          number: "123",
          complement: "Apto 45",
          neighborhood: "Consolação",
          city: "São Paulo",
          state: "SP",
          security_questions: [
            { question_id: "1", answer: "Resposta 1" },
            { question_id: "2", answer: "Resposta 2" },
            { question_id: "3", answer: "Resposta 3" },
          ],
        });
      });
    });

    it("deve mostrar loading durante submissão", async () => {
      // Mock com delay
      mockAuthService.register.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  access_token: "fake-token",
                  user: {
                    id: "1",
                    email: "test@example.com",
                    name: "Test User",
                    role: "user",
                  },
                }),
              100,
            ),
          ),
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verifica se o loading aparece
      expect(screen.getByText(/cadastrando/i)).toBeInTheDocument();

      // Aguarda o loading desaparecer
      await waitFor(() => {
        expect(screen.queryByText(/cadastrando/i)).not.toBeInTheDocument();
      });
    });

    it("deve mostrar erro de validação do servidor", async () => {
      mockAuthService.register.mockRejectedValue({
        response: {
          data: {
            detail: "Email já está em uso",
          },
        },
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email já está em uso/i)).toBeInTheDocument();
      });
    });

    it("deve redirecionar após cadastro bem-sucedido", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      await fillRequiredFields();

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter labels associados aos inputs", () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const inputs = screen.getAllByRole("textbox");
      inputs.forEach((input) => {
        expect(input).toHaveAccessibleName();
      });
    });

    it("deve permitir navegação por teclado", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);

      // Testa navegação por Tab
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(emailInput).toHaveFocus();
    });
  });
});
