import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../contexts/AuthContext";
import RegisterPage from "../../pages/RegisterPage";
import { authService } from "../../services/auth";
import * as cepService from "../../services/cep";

// Mocks
jest.mock("../../services/auth");
jest.mock("../../services/cep");
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

const mockAuthService = jest.mocked(authService);
const mockCepService = jest.mocked(cepService, true);

// Componente wrapper para testes
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("Registration Flow Integration Tests", () => {
  const user = userEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock padrão para CEP service
    (mockCepService.fetchAddressByCEP as any).mockResolvedValue({
      cep: "01310-100",
      street: "Rua Augusta",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
    });

    // Mock padrão para auth service
    mockAuthService.register.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "João Silva",
      role: "USER" as const,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Fluxo Completo de Registro", () => {
    it("deve completar registro com dados mínimos obrigatórios", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Preencher campos obrigatórios
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/e-mail/i), "joao@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "MinhaSenh@123");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "MinhaSenh@123",
      );

      // Selecionar perguntas de segurança
      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "2");

      await user.type(
        screen.getByLabelText(/resposta.*primeira/i),
        "Resposta 1",
      );
      await user.type(
        screen.getByLabelText(/resposta.*segunda/i),
        "Resposta 2",
      );

      // Submeter formulário
      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verificar chamada da API
      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith(
          "João Silva",
          "joao@example.com",
          "MinhaSenh@123",
          [
            { question_id: 1, answer: "Resposta 1" },
            { question_id: 2, answer: "Resposta 2" },
          ],
          undefined
        );
      });
    });

    it("deve completar registro com todos os campos opcionais", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Preencher campos obrigatórios
      await user.type(screen.getByLabelText(/nome completo/i), "Maria Santos");
      await user.type(screen.getByLabelText(/e-mail/i), "maria@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "MinhaSenh@123");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "MinhaSenh@123",
      );

      // Preencher campos opcionais
      const cpfInput = screen.getByLabelText(/cpf/i);
      await user.type(cpfInput, "12345678901");

      const phoneInput = screen.getByLabelText(/telefone/i);
      await user.type(phoneInput, "11987654321");

      const birthDateInput = screen.getByLabelText(/data.*nascimento/i);
      await user.type(birthDateInput, "1990-05-15");

      const cepInput = screen.getByLabelText(/cep/i);
      await user.type(cepInput, "01310100");

      // Aguardar autocompletar do endereço
      await waitFor(() => {
        expect(mockCepService.fetchAddressByCEP).toHaveBeenCalledWith("01310100");
      });

      // Verificar se campos de endereço foram preenchidos
      await waitFor(() => {
        expect(screen.getByDisplayValue("Rua Augusta")).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue("Consolação")).toBeInTheDocument();
      expect(screen.getByDisplayValue("São Paulo")).toBeInTheDocument();
      expect(screen.getByDisplayValue("SP")).toBeInTheDocument();

      // Preencher número e complemento
      await user.type(screen.getByLabelText(/número/i), "123");
      await user.type(screen.getByLabelText(/complemento/i), "Apto 45");

      // Selecionar perguntas de segurança
      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "3");

      await user.type(
        screen.getByLabelText(/resposta.*primeira/i),
        "Resposta 1",
      );
      await user.type(
        screen.getByLabelText(/resposta.*segunda/i),
        "Resposta 3",
      );

      // Submeter formulário
      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verificar chamada da API com todos os campos
      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith(
          "Maria Santos",
          "maria@example.com",
          "MinhaSenh@123",
          [
            { question_id: 1, answer: "Resposta 1" },
            { question_id: 3, answer: "Resposta 3" },
          ],
          {
             cpf: "123.456.789-01",
             phone: "(11) 98765-4321",
             birth_date: "1990-05-15",
             cep: "01310-100",
             street: "Rua Augusta",
             number: "123",
             complement: "Apto 45",
             neighborhood: "Consolação",
             city: "São Paulo",
             state: "SP",
           }
         );
      });
    });

    it("deve lidar com falha na busca de CEP", async () => {
      // Mock falha no CEP
      (mockCepService.fetchAddressByCEP as any).mockResolvedValue(null);

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cepInput = screen.getByLabelText(/cep/i);
      await user.type(cepInput, "99999999");

      // Aguardar tentativa de busca
      await waitFor(() => {
        expect(mockCepService.fetchAddressByCEP).toHaveBeenCalledWith("99999999");
      });

      // Verificar que mensagem de erro é exibida
      await waitFor(() => {
        expect(screen.getByText(/cep não encontrado/i)).toBeInTheDocument();
      });

      // Verificar que campos de endereço permanecem editáveis
      const streetInput = screen.getByLabelText(/rua/i);
      expect(streetInput).not.toBeDisabled();

      // Usuário pode preencher manualmente
      await user.type(streetInput, "Rua Manual");
      expect(screen.getByDisplayValue("Rua Manual")).toBeInTheDocument();
    });

    it("deve validar CPF em tempo real", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cpfInput = screen.getByLabelText(/cpf/i);

      // Digitar CPF inválido
      await user.type(cpfInput, "12345678900");

      // Verificar formatação automática
      expect(cpfInput).toHaveValue("123.456.789-00");

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
      });

      // Limpar e digitar CPF válido
      await user.clear(cpfInput);
      await user.type(cpfInput, "11144477735");

      // Verificar formatação e ausência de erro
      expect(cpfInput).toHaveValue("111.444.777-35");
      await waitFor(() => {
        expect(screen.queryByText(/cpf inválido/i)).not.toBeInTheDocument();
      });
    });

    it("deve validar telefone em tempo real", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const phoneInput = screen.getByLabelText(/telefone/i);

      // Digitar telefone
      await user.type(phoneInput, "11987654321");

      // Verificar formatação automática
      expect(phoneInput).toHaveValue("(11) 98765-4321");

      // Digitar telefone inválido
      await user.clear(phoneInput);
      await user.type(phoneInput, "123");

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/telefone deve ter/i)).toBeInTheDocument();
      });
    });

    it("deve validar idade mínima na data de nascimento", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const birthDateInput = screen.getByLabelText(/data.*nascimento/i);

      // Data que resulta em menos de 16 anos
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() - 10);
      const futureDateString = futureDate.toISOString().split("T")[0];

      await user.type(birthDateInput, futureDateString);

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(screen.getByText(/idade mínima.*16 anos/i)).toBeInTheDocument();
      });

      // Data válida (mais de 16 anos)
      await user.clear(birthDateInput);
      await user.type(birthDateInput, "1990-05-15");

      // Verificar ausência de erro
      await waitFor(() => {
        expect(
          screen.queryByText(/idade mínima.*16 anos/i),
        ).not.toBeInTheDocument();
      });
    });

    it("deve impedir seleção de perguntas de segurança iguais", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      // Selecionar mesma pergunta em ambos
      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "1");

      // Verificar mensagem de erro
      await waitFor(() => {
        expect(
          screen.getByText(/perguntas devem ser diferentes/i),
        ).toBeInTheDocument();
      });

      // Corrigir selecionando pergunta diferente
      await user.selectOptions(question2Select, "2");

      // Verificar ausência de erro
      await waitFor(() => {
        expect(
          screen.queryByText(/perguntas devem ser diferentes/i),
        ).not.toBeInTheDocument();
      });
    });

    it("deve exibir erros de validação do servidor", async () => {
      // Mock erro do servidor
      mockAuthService.register.mockRejectedValue({
        response: {
          data: {
            detail: [
              {
                field: "email",
                message: "E-mail já cadastrado",
              },
              {
                field: "cpf",
                message: "CPF já cadastrado",
              },
            ],
          },
        },
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/e-mail/i), "joao@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "MinhaSenh@123");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "MinhaSenh@123",
      );

      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "2");

      await user.type(
        screen.getByLabelText(/resposta.*primeira/i),
        "Resposta 1",
      );
      await user.type(
        screen.getByLabelText(/resposta.*segunda/i),
        "Resposta 2",
      );

      // Submeter formulário
      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verificar exibição de erros do servidor
      await waitFor(() => {
        expect(screen.getByText(/e-mail já cadastrado/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/cpf já cadastrado/i)).toBeInTheDocument();
    });

    it("deve exibir estado de carregamento durante submissão", async () => {
      // Mock com delay para simular carregamento
      mockAuthService.register.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Preencher campos mínimos
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/e-mail/i), "joao@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "MinhaSenh@123");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "MinhaSenh@123",
      );

      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "2");

      await user.type(
        screen.getByLabelText(/resposta.*primeira/i),
        "Resposta 1",
      );
      await user.type(
        screen.getByLabelText(/resposta.*segunda/i),
        "Resposta 2",
      );

      // Submeter formulário
      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verificar estado de carregamento
      expect(screen.getByText(/cadastrando/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Aguardar conclusão
      await waitFor(
        () => {
          expect(screen.queryByText(/cadastrando/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("deve permitir edição manual de endereço após autocompletar", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cepInput = screen.getByLabelText(/cep/i);
      await user.type(cepInput, "01310100");

      // Aguardar autocompletar
      await waitFor(() => {
        expect(screen.getByDisplayValue("Rua Augusta")).toBeInTheDocument();
      });

      // Editar campos manualmente
      const streetInput = screen.getByLabelText(/rua/i);
      await user.clear(streetInput);
      await user.type(streetInput, "Rua Editada");

      const neighborhoodInput = screen.getByLabelText(/bairro/i);
      await user.clear(neighborhoodInput);
      await user.type(neighborhoodInput, "Bairro Editado");

      // Verificar que valores editados permanecem
      expect(screen.getByDisplayValue("Rua Editada")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Bairro Editado")).toBeInTheDocument();
    });
  });

  describe("Cenários de Erro e Recuperação", () => {
    it("deve lidar com erro de rede durante registro", async () => {
      mockAuthService.register.mockRejectedValue(
        new Error("Network Error"),
      );

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Preencher e submeter formulário
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/e-mail/i), "joao@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "MinhaSenh@123");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "MinhaSenh@123",
      );

      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "2");

      await user.type(
        screen.getByLabelText(/resposta.*primeira/i),
        "Resposta 1",
      );
      await user.type(
        screen.getByLabelText(/resposta.*segunda/i),
        "Resposta 2",
      );

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verificar mensagem de erro genérica
      await waitFor(() => {
        expect(screen.getByText(/erro.*cadastro/i)).toBeInTheDocument();
      });

      // Verificar que formulário permanece editável
      expect(submitButton).not.toBeDisabled();
    });

    it("deve permitir nova tentativa após erro", async () => {
      let callCount = 0;
      mockAuthService.register.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Server Error"));
        }
        return Promise.resolve({
          id: "1",
          email: "test@example.com",
          name: "João Silva",
          role: "USER" as const,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Preencher formulário
      await user.type(screen.getByLabelText(/nome completo/i), "João Silva");
      await user.type(screen.getByLabelText(/e-mail/i), "joao@example.com");
      await user.type(screen.getByLabelText(/^senha$/i), "MinhaSenh@123");
      await user.type(
        screen.getByLabelText(/confirmar senha/i),
        "MinhaSenh@123",
      );

      const question1Select = screen.getByLabelText(/primeira pergunta/i);
      const question2Select = screen.getByLabelText(/segunda pergunta/i);

      await user.selectOptions(question1Select, "1");
      await user.selectOptions(question2Select, "2");

      await user.type(
        screen.getByLabelText(/resposta.*primeira/i),
        "Resposta 1",
      );
      await user.type(
        screen.getByLabelText(/resposta.*segunda/i),
        "Resposta 2",
      );

      const submitButton = screen.getByRole("button", { name: /cadastrar/i });

      // Primeira tentativa (falha)
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/erro.*cadastro/i)).toBeInTheDocument();
      });

      // Segunda tentativa (sucesso)
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Acessibilidade e UX", () => {
    it("deve focar no primeiro campo com erro após validação", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Tentar submeter formulário vazio
      const submitButton = screen.getByRole("button", { name: /cadastrar/i });
      await user.click(submitButton);

      // Verificar que primeiro campo obrigatório recebe foco
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/nome completo/i);
        expect(nameInput).toHaveFocus();
      });
    });

    it("deve anunciar erros para leitores de tela", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const cpfInput = screen.getByLabelText(/cpf/i);
      await user.type(cpfInput, "12345678900"); // CPF inválido

      // Verificar que erro tem aria-describedby
      await waitFor(() => {
        const errorMessage = screen.getByText(/cpf inválido/i);
        expect(errorMessage).toHaveAttribute("role", "alert");
      });
      expect(cpfInput).toHaveAttribute("aria-describedby");
    });

    it("deve permitir navegação por teclado", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/nome completo/i);
      nameInput.focus();

      // Navegar pelos campos com Tab
      await user.keyboard("{Tab}");
      expect(screen.getByLabelText(/e-mail/i)).toHaveFocus();

      await user.keyboard("{Tab}");
      expect(screen.getByLabelText(/^senha$/i)).toHaveFocus();

      await user.keyboard("{Tab}");
      expect(screen.getByLabelText(/confirmar senha/i)).toHaveFocus();
    });
  });
});
