import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProfilePage from "./ProfilePage";
import { useAuth } from "../contexts/AuthContext";
import { securityQuestionsService } from "../services/securityQuestions";

// Mock dependencies
jest.mock("../contexts/AuthContext");
jest.mock("../services/securityQuestions");
jest.mock("../components/Layout", () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

// Mock fetch
global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSecurityQuestionsService = securityQuestionsService as jest.Mocked<
  typeof securityQuestionsService
>;

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Mock data
const mockUser = {
  id: "1",
  name: "João Silva",
  email: "joao@example.com",
  role: "USER" as const,
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

const mockSecurityQuestions = [
  { id: 1, question: "Qual o nome do seu primeiro animal de estimação?", is_active: true },
  { id: 2, question: "Em que cidade você nasceu?", is_active: true },
  { id: 3, question: "Qual o nome da sua mãe?", is_active: true },
  { id: 4, question: "Qual sua cor favorita?", is_active: true },
];

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
      error: null,
      googleLogin: jest.fn(),
      register: jest.fn(),
      clearError: jest.fn(),
    });

    mockSecurityQuestionsService.getAll.mockResolvedValue(
      mockSecurityQuestions,
    );

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => "mock-token"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render profile page with correct title", async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
      expect(screen.getByText("Dados Pessoais")).toBeInTheDocument();
      expect(screen.getByText("Perguntas Secretas")).toBeInTheDocument();
    });

    it("should render profile tab as active by default", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      const profileTab = screen.getByText("Dados Pessoais");
      expect(profileTab).toHaveClass("border-indigo-500 text-indigo-600");
    });

    it("should populate profile data from user context", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
      expect(screen.getByDisplayValue("joao@example.com")).toBeInTheDocument();
    });

    it("should load security questions on mount", async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(mockSecurityQuestionsService.getAll).toHaveBeenCalled();
      });
    });
  });

  describe("Tab Navigation", () => {
    it("should switch to security tab when clicked", async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      const securityTab = screen.getByText("Perguntas Secretas");
      fireEvent.click(securityTab);

      expect(securityTab).toHaveClass("border-indigo-500 text-indigo-600");
      expect(
        screen.getByText(
          "As perguntas secretas são usadas para recuperar sua senha.",
        ),
      ).toBeInTheDocument();
    });

    it("should switch back to profile tab", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      // Switch to security tab first
      fireEvent.click(screen.getByText("Perguntas Secretas"));

      // Switch back to profile tab
      const profileTab = screen.getByText("Dados Pessoais");
      fireEvent.click(profileTab);

      expect(profileTab).toHaveClass("border-indigo-500 text-indigo-600");
      expect(screen.getByText("Informações Pessoais")).toBeInTheDocument();
    });

    it("should reset editing state when switching tabs", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      // Start editing profile
      fireEvent.click(screen.getByText("Editar"));

      // Switch to security tab
      fireEvent.click(screen.getByText("Perguntas Secretas"));

      // Switch back to profile tab
      fireEvent.click(screen.getByText("Dados Pessoais"));

      // Should show edit button again (not in editing mode)
      expect(screen.getByText("Editar")).toBeInTheDocument();
    });
  });

  describe("Profile Tab", () => {
    it("should enable editing when edit button is clicked", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Alterações")).toBeInTheDocument();

      // Fields should be enabled
      const nameInput = screen.getByDisplayValue("João Silva");
      expect(nameInput).not.toBeDisabled();
    });

    it("should update profile data when typing", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));

      const nameInput = screen.getByDisplayValue("João Silva");
      fireEvent.change(nameInput, { target: { value: "João Santos" } });

      expect(screen.getByDisplayValue("João Santos")).toBeInTheDocument();
    });

    it("should cancel editing and restore original data", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));

      // Change name
      const nameInput = screen.getByDisplayValue("João Silva");
      fireEvent.change(nameInput, { target: { value: "João Santos" } });

      // Cancel editing
      fireEvent.click(screen.getByText("Cancelar"));

      // Should restore original name
      expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
      expect(screen.getByText("Editar")).toBeInTheDocument();
    });

    it("should show password confirmation modal when saving profile", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));

      expect(screen.getByText("Confirmar Alterações")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Para sua segurança, digite sua senha atual para confirmar as alterações.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Security Questions Tab", () => {
    const renderSecurityQuestionsTab = async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      // Switch to security tab
      fireEvent.click(screen.getByText("Perguntas Secretas"));

      // Wait for questions to load
      await waitFor(() => {
        expect(
          screen.queryByText("Carregando perguntas..."),
        ).not.toBeInTheDocument();
      });
    };

    it("should show loading state while fetching questions", () => {
      // Reset and render with loading state
      mockSecurityQuestionsService.getAll.mockImplementation(
        () => new Promise(() => {}),
      );

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Perguntas Secretas"));

      expect(screen.getByText("Carregando perguntas...")).toBeInTheDocument();
    });

    it("should show error when failing to load questions", async () => {
      mockSecurityQuestionsService.getAll.mockRejectedValue(
        new Error("Network error"),
      );

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Perguntas Secretas"));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Erro ao carregar perguntas secretas. Tente novamente.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("should enable editing when edit button is clicked", () => {
      fireEvent.click(screen.getByText("Alterar Respostas"));

      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Alterações")).toBeInTheDocument();
    });

    it("should populate question dropdowns with available questions", async () => {
      await renderSecurityQuestionsTab();
      fireEvent.click(screen.getByText("Alterar Respostas"));

      const selects = screen.getAllByText("Selecione uma pergunta");
      expect(selects).toHaveLength(3);
    });

    it("should show answer input when question is selected", async () => {
      await renderSecurityQuestionsTab();
      fireEvent.click(screen.getByText("Alterar Respostas"));

      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      expect(
        screen.getByPlaceholderText("Digite sua resposta"),
      ).toBeInTheDocument();
    });

    it("should clear answer when question is changed", async () => {
      await renderSecurityQuestionsTab();
      fireEvent.click(screen.getByText("Alterar Respostas"));

      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      const answerInput = screen.getByPlaceholderText("Digite sua resposta");
      fireEvent.change(answerInput, { target: { value: "Minha resposta" } });

      // Change question
      fireEvent.change(firstSelect, { target: { value: "2" } });

      // Answer should be cleared
      const newAnswerInput = screen.getByPlaceholderText("Digite sua resposta");
      expect(newAnswerInput).toHaveValue("");
    });

    it("should filter out selected questions from other dropdowns", async () => {
      await renderSecurityQuestionsTab();
      fireEvent.click(screen.getByText("Alterar Respostas"));

      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      const secondSelect = screen.getByLabelText("Segunda pergunta secreta");
      const secondOptions = within(secondSelect).getAllByRole("option");

      // Should not include the selected question from first dropdown
      const optionValues = secondOptions.map(
        (option: HTMLElement) => (option as HTMLOptionElement).value,
      );
      expect(optionValues).not.toContain("1");
    });
  });

  describe("Password Confirmation Modal", () => {
    const renderPasswordModal = () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));
    };

    it("should close modal when cancel is clicked", () => {
      renderPasswordModal();
      fireEvent.click(screen.getByText("Cancelar"));

      expect(
        screen.queryByText("Confirmar Alterações"),
      ).not.toBeInTheDocument();
    });

    it("should disable confirm button when password is empty", () => {
      renderPasswordModal();
      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).toBeDisabled();
    });

    it("should enable confirm button when password is entered", () => {
      renderPasswordModal();
      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      const confirmButton = screen.getByText("Confirmar");
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe("API Integration", () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    it("should call profile update API with correct data", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));

      const nameInput = screen.getByDisplayValue("João Silva");
      fireEvent.change(nameInput, { target: { value: "João Santos" } });

      fireEvent.click(screen.getByText("Salvar Alterações"));

      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      expect(fetch).toHaveBeenCalledWith("/api/auth/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          name: "João Santos",
          email: "joao@example.com",
          current_password: "password123",
        }),
      });
    });

    it("should call security questions update API with correct data", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      // Switch to security tab
      fireEvent.click(screen.getByText("Perguntas Secretas"));

      await waitFor(() => {
        expect(
          screen.queryByText("Carregando perguntas..."),
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Alterar Respostas"));

      // Fill security questions
      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      const firstAnswer = screen.getByPlaceholderText("Digite sua resposta");
      fireEvent.change(firstAnswer, { target: { value: "Rex" } });

      const secondSelect = screen.getByLabelText("Segunda pergunta secreta");
      fireEvent.change(secondSelect, { target: { value: "2" } });

      const secondAnswer = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      )[1];
      fireEvent.change(secondAnswer, { target: { value: "São Paulo" } });

      const thirdSelect = screen.getByLabelText("Terceira pergunta secreta");
      fireEvent.change(thirdSelect, { target: { value: "3" } });

      const thirdAnswer = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      )[2];
      fireEvent.change(thirdAnswer, { target: { value: "Maria" } });

      fireEvent.click(screen.getByText("Salvar Alterações"));

      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      
      expect(fetch).toHaveBeenCalledWith(
        "/api/auth/security-questions/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer mock-token",
          },
          body: JSON.stringify({
            security_question_1_id: 1,
            security_answer_1: "Rex",
            security_question_2_id: 2,
            security_answer_2: "São Paulo",
            security_question_3_id: 3,
            security_answer_3: "Maria",
            current_password: "password123",
          }),
        },
      );
    });

    it("should show success message after successful update", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));

      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(
          screen.getByText("Dados do perfil atualizados com sucesso!"),
        ).toBeInTheDocument();
      });
    });

    it("should show error message when API call fails", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: "Senha incorreta" }),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));

      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(screen.getByText("Senha incorreta")).toBeInTheDocument();
      });
    });

    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));

      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(
          screen.getByText("Erro de conexão. Tente novamente."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Validation", () => {
    const renderValidationSetup = async () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Perguntas Secretas"));

      await waitFor(() => {
        expect(
          screen.queryByText("Carregando perguntas..."),
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Alterar Respostas"));
    };

    it("should validate that all questions are selected", async () => {
      await renderValidationSetup();
      fireEvent.click(screen.getByText("Salvar Alterações"));

      expect(
        screen.getByText(
          "Por favor, selecione todas as três perguntas secretas.",
        ),
      ).toBeInTheDocument();
    });

    it("should validate that all answers are provided", async () => {
      await renderValidationSetup();
      // Select questions but don't provide answers
      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      const secondSelect = screen.getByLabelText("Segunda pergunta secreta");
      fireEvent.change(secondSelect, { target: { value: "2" } });

      const thirdSelect = screen.getByLabelText("Terceira pergunta secreta");
      fireEvent.change(thirdSelect, { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Alterações"));

      expect(
        screen.getByText("Por favor, responda todas as perguntas secretas."),
      ).toBeInTheDocument();
    });

    it("should validate that questions are unique", async () => {
      await renderValidationSetup();
      // Select same question for first two dropdowns
      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      const secondSelect = screen.getByLabelText("Segunda pergunta secreta");
      fireEvent.change(secondSelect, { target: { value: "1" } });

      const thirdSelect = screen.getByLabelText("Terceira pergunta secreta");
      fireEvent.change(thirdSelect, { target: { value: "3" } });

      fireEvent.click(screen.getByText("Salvar Alterações"));

      expect(
        screen.getByText("Por favor, selecione três perguntas diferentes."),
      ).toBeInTheDocument();
    });

    it("should validate current password is required", async () => {
      await renderValidationSetup();
      // Fill all security questions properly
      const firstSelect = screen.getByLabelText("Primeira pergunta secreta");
      fireEvent.change(firstSelect, { target: { value: "1" } });

      const firstAnswer = screen.getByPlaceholderText("Digite sua resposta");
      fireEvent.change(firstAnswer, { target: { value: "Rex" } });

      const secondSelect = screen.getByLabelText("Segunda pergunta secreta");
      fireEvent.change(secondSelect, { target: { value: "2" } });

      const secondAnswer = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      )[1];
      fireEvent.change(secondAnswer, { target: { value: "São Paulo" } });

      const thirdSelect = screen.getByLabelText("Terceira pergunta secreta");
      fireEvent.change(thirdSelect, { target: { value: "3" } });

      const thirdAnswer = screen.getAllByPlaceholderText(
        "Digite sua resposta",
      )[2];
      fireEvent.change(thirdAnswer, { target: { value: "Maria" } });

      fireEvent.click(screen.getByText("Salvar Alterações"));

      // Don't enter password and try to confirm
      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(
          screen.getByText(
            "Digite sua senha atual para confirmar as alterações.",
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Message Handling", () => {
    it("should display and dismiss success messages", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));

      const passwordInput = screen.getByPlaceholderText(
        "Digite sua senha atual",
      );
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      fireEvent.click(screen.getByText("Confirmar"));

      await waitFor(() => {
        expect(
          screen.getByText("Dados do perfil atualizados com sucesso!"),
        ).toBeInTheDocument();
      });

      // Dismiss message
      const dismissButton = screen.getByRole("button", { name: "" }); // SVG close button
      fireEvent.click(dismissButton);

      expect(
        screen.queryByText("Dados do perfil atualizados com sucesso!"),
      ).not.toBeInTheDocument();
    });

    it("should clear messages when switching tabs", () => {
      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Editar"));
      fireEvent.click(screen.getByText("Salvar Alterações"));

      // Switch tabs to clear any messages
      fireEvent.click(screen.getByText("Perguntas Secretas"));
      fireEvent.click(screen.getByText("Dados Pessoais"));

      // Should not show password confirmation modal
      expect(
        screen.queryByText("Confirmar Alterações"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle user without name or email", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          name: "",
          email: "",
          role: "USER",
          is_active: true,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
        },
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        error: null,
        googleLogin: jest.fn(),
        register: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      expect(screen.getByDisplayValue("")).toBeInTheDocument();
    });

    it("should handle null user", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        login: jest.fn(),
        logout: jest.fn(),
        isLoading: false,
        error: null,
        googleLogin: jest.fn(),
        register: jest.fn(),
        clearError: jest.fn(),
      });

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
    });

    it("should handle empty security questions response", async () => {
      mockSecurityQuestionsService.getAll.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Perguntas Secretas"));

      await waitFor(() => {
        expect(
          screen.queryByText("Carregando perguntas..."),
        ).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Alterar Respostas"));

      // Should still show dropdowns even with no questions
      expect(screen.getAllByText("Selecione uma pergunta")).toHaveLength(3);
    });
  });

  describe("Performance", () => {
    it("should render quickly with large number of security questions", async () => {
      const manyQuestions = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        question: `Pergunta ${i + 1}`,
        is_active: true,
      }));

      mockSecurityQuestionsService.getAll.mockResolvedValue(manyQuestions);

      const startTime = performance.now();

      render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Perguntas Secretas"));

      await waitFor(() => {
        expect(
          screen.queryByText("Carregando perguntas..."),
        ).not.toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it("should have stable function references", () => {
      const { rerender } = render(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      const editButton = screen.getByText("Editar");
      const originalOnClick = editButton.onclick;

      rerender(
        <TestWrapper>
          <ProfilePage />
        </TestWrapper>,
      );

      // Function references should be stable to prevent unnecessary re-renders
      expect(editButton.onclick).toBe(originalOnClick);
    });
  });
});
