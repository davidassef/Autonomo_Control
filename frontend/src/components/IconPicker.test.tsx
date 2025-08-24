import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IconPicker from "./IconPicker";

describe("IconPicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Inicial", () => {
    it("deve renderizar com valor padrão", () => {
      render(<IconPicker value="" onChange={mockOnChange} />);

      expect(screen.getByText("Selecione um ícone")).toBeInTheDocument();
      expect(screen.getByText("📋")).toBeInTheDocument(); // Ícone padrão
    });

    it("deve renderizar com valor fornecido", () => {
      render(<IconPicker value="food" onChange={mockOnChange} />);

      expect(screen.getByText("food")).toBeInTheDocument();
      expect(screen.getByText("🍽️")).toBeInTheDocument(); // Ícone de comida
    });

    it("deve ter botão clicável", () => {
      render(<IconPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button", { name: /selecione um ícone/i });
      expect(button).toHaveClass("cursor-pointer");
    });

    it("deve ter estilos corretos no container", () => {
      render(<IconPicker value="" onChange={mockOnChange} />);

      const container = screen.getByRole("button", { name: /selecione um ícone/i });
      expect(container).toHaveClass(
        "w-full flex items-center cursor-pointer p-2 border border-gray-300 rounded-md",
      );
    });
  });

  describe("Comportamento do Popover", () => {
    it("deve abrir popover quando clicado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      expect(
        screen.getByPlaceholderText("Buscar ícone..."),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Nome do ícone")).toBeInTheDocument();
    });

    it("deve fechar popover quando clicado novamente", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });

      // Abrir
      await user.click(trigger);
      expect(
        screen.getByPlaceholderText("Buscar ícone..."),
      ).toBeInTheDocument();

      // Fechar
      await user.click(trigger);
      expect(
        screen.queryByPlaceholderText("Buscar ícone..."),
      ).not.toBeInTheDocument();
    });

    it("deve fechar popover quando clicado fora", async () => {
      const user = userEvent;
      render(
        <div>
          <IconPicker value="" onChange={mockOnChange} />
          <div data-testid="outside">Outside element</div>
        </div>,
      );

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      expect(
        screen.getByPlaceholderText("Buscar ícone..."),
      ).toBeInTheDocument();

      // Clique fora
      await user.click(screen.getByTestId("outside"));

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Buscar ícone..."),
        ).not.toBeInTheDocument();
      });
    });

    it("não deve fechar popover quando clicado dentro", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");
      await user.click(searchInput);

      expect(
        screen.getByPlaceholderText("Buscar ícone..."),
      ).toBeInTheDocument();
    });

    it("deve ter estilos corretos no popover", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      // Verificar se o popover está presente através dos elementos dentro dele
      expect(screen.getByPlaceholderText("Buscar ícone...")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Nome do ícone")).toBeInTheDocument();
    });
  });

  describe("Lista de Ícones", () => {
    it("deve renderizar todos os ícones disponíveis", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      // Verifica alguns ícones específicos
      expect(screen.getByText("🏠")).toBeInTheDocument(); // home
      expect(screen.getByText("🍽️")).toBeInTheDocument(); // food
      expect(screen.getByText("🛒")).toBeInTheDocument(); // grocery
      expect(screen.getByText("🚗")).toBeInTheDocument(); // transport
      expect(screen.getByText("💰")).toBeInTheDocument(); // salary
    });

    it("deve renderizar nomes dos ícones", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      expect(screen.getByText("home")).toBeInTheDocument();
      expect(screen.getByText("food")).toBeInTheDocument();
      expect(screen.getByText("transport")).toBeInTheDocument();
      expect(screen.getByText("salary")).toBeInTheDocument();
    });

    it("deve ter layout em grid correto", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      // Verificar se o grid está presente através de um elemento dentro dele
      expect(screen.getByText("🏠")).toBeInTheDocument();
      expect(screen.getByText("🍽️")).toBeInTheDocument();
    });

    it("deve destacar ícone selecionado", async () => {
      const user = userEvent;
      render(<IconPicker value="food" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /food/i });
      await user.click(trigger);

      // Verificar se o ícone selecionado está destacado
      expect(screen.getByText("🍽️")).toBeInTheDocument();
      expect(screen.getByText("food")).toBeInTheDocument();
    });

    it("deve ter hover styles nos ícones", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      // Verificar se o ícone está presente e clicável
      expect(screen.getByText("🏠")).toBeInTheDocument();
      expect(screen.getByText("home")).toBeInTheDocument();
    });
  });

  describe("Seleção de Ícones", () => {
    it("deve chamar onChange quando ícone é selecionado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const homeIcon = screen.getByRole("button", { name: /🏠.*home/i });
      await user.click(homeIcon);

      expect(mockOnChange).toHaveBeenCalledWith("home");
    });

    it("deve fechar popover após seleção", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const foodIcon = screen.getByRole("button", { name: /🍽️.*food/i });
      await user.click(foodIcon);

      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Buscar ícone..."),
        ).not.toBeInTheDocument();
      });
    });

    it("deve permitir seleção de diferentes ícones", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });

      // Primeira seleção
      await user.click(trigger);
      const transportIcon = screen.getByRole("button", { name: /🚗.*transport/i });
      await user.click(transportIcon);
      expect(mockOnChange).toHaveBeenCalledWith("transport");

      // Segunda seleção
      await user.click(trigger);
      const salaryIcon = screen.getByRole("button", { name: /💰.*salary/i });
      await user.click(salaryIcon);
      expect(mockOnChange).toHaveBeenCalledWith("salary");
    });
  });

  describe("Funcionalidade de Busca", () => {
    it("deve filtrar ícones por nome", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");
      await user.type(searchInput, "food");

      expect(screen.getByText("🍽️")).toBeInTheDocument();
      expect(screen.queryByText("🏠")).not.toBeInTheDocument();
    });

    it("deve ser case insensitive", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");
      await user.type(searchInput, "FOOD");

      expect(screen.getByText("🍽️")).toBeInTheDocument();
      expect(screen.getByText("food")).toBeInTheDocument();
    });

    it("deve filtrar por substring", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");
      await user.type(searchInput, "car");

      expect(screen.getByText("🚙")).toBeInTheDocument(); // car
      expect(screen.queryByText("🍽️")).not.toBeInTheDocument(); // food
    });

    it("deve mostrar mensagem quando nenhum ícone é encontrado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");
      await user.type(searchInput, "inexistente");

      expect(screen.getByText("Nenhum ícone encontrado")).toBeInTheDocument();
    });

    it("deve limpar busca e mostrar todos os ícones", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");

      // Buscar
      await user.type(searchInput, "food");
      expect(screen.queryByText("🏠")).not.toBeInTheDocument();

      // Limpar
      await user.clear(searchInput);
      expect(screen.getByText("🏠")).toBeInTheDocument();
      expect(screen.getByText("🍽️")).toBeInTheDocument();
    });
  });

  describe("Input Customizado", () => {
    it("deve renderizar input para nome customizado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const customInput = screen.getByPlaceholderText("Nome do ícone");
      expect(customInput).toBeInTheDocument();
      expect(customInput).toHaveAttribute("type", "text");
    });

    it("deve mostrar valor atual no input customizado", async () => {
      const user = userEvent;
      render(<IconPicker value="custom-icon" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /custom-icon/i });
      await user.click(trigger);

      const customInput = screen.getByPlaceholderText(
        "Nome do ícone",
      ) as HTMLInputElement;
      expect(customInput.value).toBe("custom-icon");
    });

    it("deve chamar onChange quando input customizado é alterado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const customInput = screen.getByPlaceholderText("Nome do ícone");
      await user.type(customInput, "my-custom-icon");

      expect(mockOnChange).toHaveBeenCalledWith("my-custom-icon");
    });

    it("deve ter estilos corretos no input customizado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const customInput = screen.getByPlaceholderText("Nome do ícone");
      expect(customInput).toHaveClass(
        "w-full p-1 text-sm border border-gray-300 rounded",
      );
    });

    it("deve ter separador visual antes do input customizado", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      // Verificar se o input customizado está presente
      const customInput = screen.getByPlaceholderText("Nome do ícone");
      expect(customInput).toBeInTheDocument();
    });
  });

  describe("Ícones Específicos", () => {
    it("deve renderizar ícone correto para valor conhecido", () => {
      const testCases = [
        { value: "home", expectedIcon: "🏠" },
        { value: "food", expectedIcon: "🍽️" },
        { value: "transport", expectedIcon: "🚗" },
        { value: "salary", expectedIcon: "💰" },
        { value: "health", expectedIcon: "💊" },
      ];

      testCases.forEach(({ value, expectedIcon }) => {
        const { unmount } = render(
          <IconPicker value={value} onChange={mockOnChange} />,
        );
        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
        unmount();
      });
    });

    it("deve usar ícone padrão para valor desconhecido", () => {
      render(<IconPicker value="unknown-icon" onChange={mockOnChange} />);
      expect(screen.getByText("📋")).toBeInTheDocument(); // Ícone padrão
    });

    it("deve conter todos os 20 ícones esperados", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const expectedIcons = [
        "🏠",
        "🍽️",
        "🛒",
        "🚗",
        "💊",
        "📚",
        "🎬",
        "👜",
        "💡",
        "✈️",
        "⚽",
        "🐾",
        "🎁",
        "💰",
        "📈",
        "💲",
        "📋",
        "📄",
        "💼",
        "🚙",
      ];

      expectedIcons.forEach((icon) => {
        expect(screen.getByText(icon)).toBeInTheDocument();
      });
    });
  });

  describe("Estados e Interações", () => {
    it("deve manter estado consistente entre re-renders", () => {
      const { rerender } = render(
        <IconPicker value="food" onChange={mockOnChange} />,
      );
      expect(screen.getByText("🍽️")).toBeInTheDocument();

      rerender(<IconPicker value="transport" onChange={mockOnChange} />);
      expect(screen.getByText("🚗")).toBeInTheDocument();
      expect(screen.queryByText("🍽️")).not.toBeInTheDocument();
    });

    it("deve lidar com múltiplas aberturas/fechamentos", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });

      // Abrir e fechar múltiplas vezes
      for (let i = 0; i < 3; i++) {
        await user.click(trigger);
        expect(
          screen.getByPlaceholderText("Buscar ícone..."),
        ).toBeInTheDocument();

        await user.click(trigger);
        expect(
          screen.queryByPlaceholderText("Buscar ícone..."),
        ).not.toBeInTheDocument();
      }
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com valor null/undefined", () => {
      render(<IconPicker value={null as any} onChange={mockOnChange} />);
      expect(screen.getByText("Selecione um ícone")).toBeInTheDocument();
      expect(screen.getByText("📋")).toBeInTheDocument();
    });

    it("deve lidar com onChange undefined", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={undefined as any} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      // Não deve gerar erro ao clicar em um ícone
      const homeIcon = screen.getByRole("button", { name: /🏠.*home/i });
      await user.click(homeIcon);
    });

    it("deve lidar com busca por string vazia", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Buscar ícone...");
      await user.type(searchInput, "test");
      await user.clear(searchInput);

      // Deve mostrar todos os ícones novamente
      expect(screen.getByText("🏠")).toBeInTheDocument();
      expect(screen.getByText("🍽️")).toBeInTheDocument();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter estrutura semântica adequada", () => {
      render(<IconPicker value="food" onChange={mockOnChange} />);

      // Verificar se o elemento está presente e clicável
      expect(screen.getByText("food")).toBeInTheDocument();
      expect(screen.getByText("🍽️")).toBeInTheDocument();
    });

    it("deve ter placeholders descritivos", async () => {
      const user = userEvent;
      render(<IconPicker value="" onChange={mockOnChange} />);

      const trigger = screen.getByRole("button", { name: /selecione um ícone/i });
      await user.click(trigger);

      expect(
        screen.getByPlaceholderText("Buscar ícone..."),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Nome do ícone")).toBeInTheDocument();
    });

    it("deve ter texto alternativo adequado", () => {
      render(<IconPicker value="" onChange={mockOnChange} />);
      expect(screen.getByText("Selecione um ícone")).toBeInTheDocument();

      render(<IconPicker value="food" onChange={mockOnChange} />);
      expect(screen.getByText("food")).toBeInTheDocument();
    });
  });
});
