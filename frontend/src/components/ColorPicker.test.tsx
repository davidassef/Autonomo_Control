import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColorPicker from "./ColorPicker";

describe("ColorPicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Renderização Inicial", () => {
    it("deve renderizar com valor padrão", () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      expect(screen.getByText("Selecione uma cor")).toBeInTheDocument();

      // Verifica se o círculo de cor tem a cor padrão
      const colorCircle = screen.getByTestId("test-element");
      expect(colorCircle).toHaveStyle("background-color: #CBD5E1");
    });

    it("deve renderizar com valor fornecido", () => {
      render(<ColorPicker value="#FF0000" onChange={mockOnChange} />);

      expect(screen.getByText("#FF0000")).toBeInTheDocument();

      // Verifica se o círculo de cor tem a cor fornecida
      const colorCircle = screen.getByTestId("test-element");
      expect(colorCircle).toHaveStyle("background-color: #FF0000");
    });

    it("deve renderizar botão clicável", () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("cursor-pointer");
    });

    it("não deve mostrar popover inicialmente", () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const popover = screen.getByRole("dialog");
      expect(popover).not.toBeInTheDocument();
    });
  });

  describe("Abertura e Fechamento do Popover", () => {
    it("deve abrir popover quando clicado", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const popover = screen.getByRole("dialog");
        expect(popover).toBeInTheDocument();
      });
    });

    it("deve fechar popover quando clicado novamente", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");

      // Abre o popover
      fireEvent.click(button!);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Fecha o popover
      fireEvent.click(button!);
      await waitFor(() => {
        expect(
          screen.getByRole("dialog"),
        ).not.toBeInTheDocument();
      });
    });

    it("deve fechar popover quando clicado fora", async () => {
      render(
        <div>
          <ColorPicker value="" onChange={mockOnChange} />
          <div data-testid="outside">Outside element</div>
        </div>,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Clica fora do popover
      const outsideElement = screen.getByTestId("outside");
      fireEvent.mouseDown(outsideElement);

      await waitFor(() => {
        expect(
          screen.getByRole("dialog"),
        ).not.toBeInTheDocument();
      });
    });

    it("não deve fechar popover quando clicado dentro", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Clica dentro do popover
      const popover = screen.getByRole("dialog");
      fireEvent.mouseDown(popover!);

      // Popover deve continuar aberto
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Cores Preset", () => {
    const PRESET_COLORS = [
      "#EF4444",
      "#F97316",
      "#F59E0B",
      "#EAB308",
      "#84CC16",
      "#22C55E",
      "#10B981",
      "#14B8A6",
      "#06B6D4",
      "#0EA5E9",
      "#3B82F6",
      "#6366F1",
      "#8B5CF6",
      "#A855F7",
      "#D946EF",
      "#EC4899",
      "#F43F5E",
      "#6B7280",
    ];

    it("deve renderizar todas as cores preset", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const colorButtons = document.querySelectorAll(
          ".w-8.h-8.rounded-full.cursor-pointer",
        );
        expect(colorButtons).toHaveLength(PRESET_COLORS.length);
      });
    });

    it("deve aplicar cor correta a cada botão preset", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const colorButtons = document.querySelectorAll(
          ".w-8.h-8.rounded-full.cursor-pointer",
        );

        colorButtons.forEach((colorButton, index) => {
          expect(colorButton).toHaveStyle(
            `background-color: ${PRESET_COLORS[index]}`,
          );
        });
      });
    });

    it("deve chamar onChange quando cor preset é selecionada", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const firstColorButton = document.querySelector(
          ".w-8.h-8.rounded-full.cursor-pointer",
        );
        fireEvent.click(firstColorButton!);
      });

      expect(mockOnChange).toHaveBeenCalledWith("#EF4444");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("deve fechar popover após selecionar cor preset", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const firstColorButton = document.querySelector(
          ".w-8.h-8.rounded-full.cursor-pointer",
        );
        fireEvent.click(firstColorButton!);
      });

      await waitFor(() => {
        expect(
          screen.getByRole("dialog"),
        ).not.toBeInTheDocument();
      });
    });

    it("deve destacar cor selecionada com ring", async () => {
      render(<ColorPicker value="#EF4444" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const selectedColorButton = document.querySelector(
          ".ring-2.ring-offset-2.ring-indigo-500",
        );
        expect(selectedColorButton).toBeInTheDocument();
        expect(selectedColorButton).toHaveStyle("background-color: #EF4444");
      });
    });

    it("deve aplicar hover effect nos botões de cor", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const colorButtons = document.querySelectorAll(
          ".w-8.h-8.rounded-full.cursor-pointer",
        );
        colorButtons.forEach((colorButton) => {
          expect(colorButton).toHaveClass(
            "hover:scale-110 transition-transform",
          );
        });
      });
    });
  });

  describe("Input Customizado", () => {
    it("deve renderizar input para cor customizada", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const customInput = screen.getByPlaceholderText("#RRGGBB");
        expect(customInput).toBeInTheDocument();
        expect(customInput).toHaveAttribute("type", "text");
      });
    });

    it("deve mostrar valor atual no input customizado", async () => {
      render(<ColorPicker value="#123456" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const customInput = screen.getByDisplayValue("#123456");
        expect(customInput).toBeInTheDocument();
      });
    });

    it("deve chamar onChange quando input customizado é alterado", async () => {
      const user = userEvent;
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(async () => {
        const customInput = screen.getByPlaceholderText("#RRGGBB");
        await user.clear(customInput);
        await user.type(customInput, "#ABCDEF");
      });

      expect(mockOnChange).toHaveBeenCalledWith("#ABCDEF");
    });

    it("deve renderizar label para input customizado", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        expect(
          screen.getByText("Código de cor personalizado"),
        ).toBeInTheDocument();
      });
    });

    it("deve ter separador visual entre cores preset e input customizado", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const separator = screen.getByTestId("test-element");
        expect(separator).toBeInTheDocument();
      });
    });
  });

  describe("Layout e Estilo", () => {
    it("deve ter grid de 6 colunas para cores preset", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const grid = screen.getByTestId("test-element");
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass("gap-2");
      });
    });

    it("deve ter z-index alto para popover", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const popover = screen.getByRole("dialog");
        expect(popover).toHaveClass("z-10");
      });
    });

    it("deve ter sombra e borda no popover", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const popover = screen.getByRole("dialog");
        expect(popover).toHaveClass("shadow-lg border border-gray-200");
      });
    });

    it("deve ter largura fixa no popover", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const popover = screen.getByRole("dialog");
        expect(popover).toHaveClass("w-64");
      });
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com valor undefined", () => {
      render(<ColorPicker value={undefined as any} onChange={mockOnChange} />);

      expect(screen.getByText("Selecione uma cor")).toBeInTheDocument();

      const colorCircle = screen.getByTestId("test-element");
      expect(colorCircle).toHaveStyle("background-color: #CBD5E1");
    });

    it("deve lidar com valor null", () => {
      render(<ColorPicker value={null as any} onChange={mockOnChange} />);

      expect(screen.getByText("Selecione uma cor")).toBeInTheDocument();
    });

    it("deve lidar com cor inválida", () => {
      render(<ColorPicker value="invalid-color" onChange={mockOnChange} />);

      expect(screen.getByText("invalid-color")).toBeInTheDocument();

      const colorCircle = screen.getByTestId("test-element");
      expect(colorCircle).toHaveStyle("background-color: invalid-color");
    });

    it("deve lidar com múltiplos cliques rápidos", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");

      // Múltiplos cliques rápidos
      fireEvent.click(button!);
      fireEvent.click(button!);
      fireEvent.click(button!);

      await waitFor(() => {
        // Deve estar fechado após número ímpar de cliques
        expect(
          screen.getByRole("dialog"),
        ).not.toBeInTheDocument();
      });
    });

    it("deve limpar event listener ao desmontar", () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener",
      );

      const { unmount } = render(
        <ColorPicker value="" onChange={mockOnChange} />,
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousedown",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter elementos focáveis", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const customInput = screen.getByPlaceholderText("#RRGGBB");
        expect(customInput).toBeInTheDocument();

        // Input deve ser focável
        customInput.focus();
        expect(document.activeElement).toBe(customInput);
      });
    });

    it("deve ter placeholder descritivo no input", async () => {
      render(<ColorPicker value="" onChange={mockOnChange} />);

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        const customInput = screen.getByPlaceholderText("#RRGGBB");
        expect(customInput).toHaveAttribute("placeholder", "#RRGGBB");
      });
    });
  });

  describe("Integração", () => {
    it("deve funcionar com diferentes formatos de cor", async () => {
      const { rerender } = render(
        <ColorPicker value="#FF0000" onChange={mockOnChange} />,
      );

      expect(screen.getByText("#FF0000")).toBeInTheDocument();

      rerender(<ColorPicker value="rgb(255, 0, 0)" onChange={mockOnChange} />);
      expect(screen.getByText("rgb(255, 0, 0)")).toBeInTheDocument();

      rerender(<ColorPicker value="red" onChange={mockOnChange} />);
      expect(screen.getByText("red")).toBeInTheDocument();
    });

    it("deve manter estado consistente entre re-renders", async () => {
      const { rerender } = render(
        <ColorPicker value="#FF0000" onChange={mockOnChange} />,
      );

      const button = screen.getByRole("button");
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Re-render com nova cor
      rerender(<ColorPicker value="#00FF00" onChange={mockOnChange} />);

      // Popover deve continuar aberto
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Nova cor deve estar destacada
      await waitFor(() => {
        const selectedColorButton = document.querySelector(
          ".ring-2.ring-offset-2.ring-indigo-500",
        );
        expect(selectedColorButton).toHaveStyle("background-color: #00FF00");
      });
    });
  });
});
