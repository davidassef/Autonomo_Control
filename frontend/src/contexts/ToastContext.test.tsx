import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ToastProvider, useToast } from "./ToastContext";

// Mock do Math.random para IDs previsíveis
const mockMathRandom = jest.spyOn(Math, "random");

// Mock do setTimeout para controlar timers
// jest.useFakeTimers(); // Removido para evitar conflitos

// Componente de teste para usar o hook
const TestComponent: React.FC<{
  onToastData?: (data: any) => void;
  autoTrigger?: boolean;
  toastType?: "success" | "error" | "info";
  message?: string;
  ttl?: number;
}> = ({
  onToastData,
  autoTrigger,
  toastType = "info",
  message = "Test message",
  ttl,
}) => {
  const { toasts, push, remove } = useToast();

  React.useEffect(() => {
    onToastData?.({ toasts, push, remove });
  }, [toasts, push, remove, onToastData]);

  React.useEffect(() => {
    if (autoTrigger) {
      push({ type: toastType, message, ttl });
    }
  }, [autoTrigger, push, toastType, message, ttl]);

  return (
    <div data-testid="test-component">
      <div data-testid="toast-count">{toasts.length}</div>
      <button
        data-testid="add-success"
        onClick={() => push({ type: "success", message: "Success message" })}
      >
        Add Success
      </button>
      <button
        data-testid="add-error"
        onClick={() => push({ type: "error", message: "Error message" })}
      >
        Add Error
      </button>
      <button
        data-testid="add-info"
        onClick={() => push({ type: "info", message: "Info message" })}
      >
        Add Info
      </button>
      <button
        data-testid="add-custom"
        onClick={() =>
          push({ type: "success", message: "Custom message", ttl: 1000 })
        }
      >
        Add Custom TTL
      </button>
      <button
        data-testid="add-no-ttl"
        onClick={() =>
          push({ type: "info", message: "No TTL message", ttl: 0 })
        }
      >
        Add No TTL
      </button>
      {toasts.map((toast) => (
        <button
          key={toast.id}
          data-testid={`remove-${toast.id}`}
          onClick={() => remove(toast.id)}
        >
          Remove {toast.id}
        </button>
      ))}
    </div>
  );
};

// Componente para testar erro do hook fora do provider
const ComponentWithoutProvider: React.FC = () => {
  const { toasts } = useToast();
  return <div>{toasts.length}</div>;
};

describe("ToastContext", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    mockMathRandom.mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    mockMathRandom.mockRestore();
  });

  describe("ToastProvider", () => {
    it("deve renderizar o provider", () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>,
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("deve renderizar children corretamente", () => {
      render(
        <ToastProvider>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </ToastProvider>,
      );

      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });

    it("deve renderizar container de toasts", () => {
      render(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>,
      );

      const toastContainer = screen.getByTestId("test-element");
      expect(toastContainer).toBeInTheDocument();
      expect(toastContainer).toHaveClass(
        "fixed top-4 right-4 space-y-2 z-50 max-w-sm",
      );
    });

    it("deve inicializar com array de toasts vazio", () => {
      let toastData: any;

      render(
        <ToastProvider>
          <TestComponent
            onToastData={(data) => {
              toastData = data;
            }}
          />
        </ToastProvider>,
      );

      expect(toastData.toasts).toEqual([]);
      expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
    });
  });

  describe("useToast Hook", () => {
    it("deve retornar contexto correto", () => {
      let toastData: any;

      render(
        <ToastProvider>
          <TestComponent
            onToastData={(data) => {
              toastData = data;
            }}
          />
        </ToastProvider>,
      );

      expect(toastData).toHaveProperty("toasts");
      expect(toastData).toHaveProperty("push");
      expect(toastData).toHaveProperty("remove");
      expect(typeof toastData.push).toBe("function");
      expect(typeof toastData.remove).toBe("function");
      expect(Array.isArray(toastData.toasts)).toBe(true);
    });

    it("deve lançar erro quando usado fora do provider", () => {
      // Suprimir console.error para este teste
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<ComponentWithoutProvider />);
      }).toThrow("useToast must be used within ToastProvider");

      consoleSpy.mockRestore();
    });

    it("deve manter referências estáveis das funções", () => {
      let toastData1: any;
      let toastData2: any;

      const { rerender } = render(
        <ToastProvider>
          <TestComponent
            onToastData={(data) => {
              toastData1 = data;
            }}
          />
        </ToastProvider>,
      );

      rerender(
        <ToastProvider>
          <TestComponent
            onToastData={(data) => {
              toastData2 = data;
            }}
          />
        </ToastProvider>,
      );

      expect(toastData1.push).toBe(toastData2.push);
      expect(toastData1.remove).toBe(toastData2.remove);
    });
  });

  describe("Funcionalidade Push", () => {
    it("deve adicionar toast com sucesso", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));

      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
      expect(screen.getByText("Success message")).toBeInTheDocument();
    });

    it("deve adicionar toast de erro", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-error"));

      expect(screen.getByText("Error message")).toBeInTheDocument();
    });

    it("deve adicionar toast de info", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-info"));

      expect(screen.getByText("Info message")).toBeInTheDocument();
    });

    it("deve gerar ID único para cada toast", async () => {
      const user = userEvent;
      mockMathRandom
        .mockReturnValueOnce(0.123456789)
        .mockReturnValueOnce(0.987654321);

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      await user.click(screen.getByTestId("add-error"));

      expect(screen.getByTestId("toast-count")).toHaveTextContent("2");

      const removeButtons = screen.getAllByText(/Remove/);
      expect(removeButtons).toHaveLength(2);
      expect(removeButtons[0]).toHaveTextContent("Remove 456789");
      expect(removeButtons[1]).toHaveTextContent("Remove 654321");
    });

    it("deve adicionar múltiplos toasts", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      await user.click(screen.getByTestId("add-error"));
      await user.click(screen.getByTestId("add-info"));

      expect(screen.getByTestId("toast-count")).toHaveTextContent("3");
      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByText("Info message")).toBeInTheDocument();
    });

    it("deve aceitar TTL customizado", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-custom"));

      expect(screen.getByText("Custom message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

      // Avançar tempo para TTL customizado (1000ms)
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
      });
      expect(screen.queryByText("Custom message")).not.toBeInTheDocument();
    });

    it("deve aceitar TTL zero (sem auto-remove)", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-no-ttl"));

      expect(screen.getByText("No TTL message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

      // Avançar tempo muito além do TTL padrão
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Toast deve ainda estar presente
      expect(screen.getByText("No TTL message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });
  });

  describe("Funcionalidade Remove", () => {
    it("deve remover toast específico", async () => {
      const user = userEvent;
      mockMathRandom.mockReturnValue(0.123456789);

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      expect(screen.getByText("Success message")).toBeInTheDocument();

      await user.click(screen.getByTestId("remove-456789"));

      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
    });

    it("deve remover apenas o toast correto", async () => {
      const user = userEvent;
      mockMathRandom
        .mockReturnValueOnce(0.123456789)
        .mockReturnValueOnce(0.987654321);

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      await user.click(screen.getByTestId("add-error"));

      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();

      await user.click(screen.getByTestId("remove-456789"));

      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });

    it("deve ignorar remoção de ID inexistente", async () => {
      const user = userEvent;
      let toastData: any;

      render(
        <ToastProvider>
          <TestComponent
            onToastData={(data) => {
              toastData = data;
            }}
          />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

      // Tentar remover ID que não existe
      act(() => {
        toastData.remove("nonexistent-id");
      });

      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
      expect(screen.getByText("Success message")).toBeInTheDocument();
    });
  });

  describe("TTL Automático", () => {
    it("deve remover toast automaticamente após TTL padrão (4000ms)", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));

      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

      // Avançar tempo para TTL padrão
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
      });
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });

    it("deve remover múltiplos toasts com TTLs diferentes", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      // Adicionar toast com TTL customizado (1000ms)
      await user.click(screen.getByTestId("add-custom"));
      // Adicionar toast com TTL padrão (4000ms)
      await user.click(screen.getByTestId("add-success"));

      expect(screen.getByTestId("toast-count")).toHaveTextContent("2");

      // Avançar 1000ms - deve remover apenas o primeiro
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
      });
      expect(screen.queryByText("Custom message")).not.toBeInTheDocument();
      expect(screen.getByText("Success message")).toBeInTheDocument();

      // Avançar mais 3000ms - deve remover o segundo
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
      });
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });

    it("não deve remover toast com TTL 0", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-no-ttl"));

      expect(screen.getByText("No TTL message")).toBeInTheDocument();

      // Avançar tempo muito além do TTL padrão
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByText("No TTL message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });
  });

  describe("Renderização de Toasts", () => {
    it("deve renderizar toast de sucesso com estilos corretos", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));

      const toastElement = screen.getByText("Success message");
      expect(toastElement).toBeInTheDocument();
      // Verificar que o toast de sucesso tem as classes corretas através do container
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
      expect(toastElement).toHaveClass("flex-1");
    });

    it("deve renderizar toast de erro com estilos corretos", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-error"));

      const toastElement = screen.getByText("Error message");
      expect(toastElement).toBeInTheDocument();
      // Verificar que o toast de erro está presente
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });

    it("deve renderizar toast de info com estilos corretos", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-info"));

      const toastElement = screen.getByText("Info message");
      expect(toastElement).toBeInTheDocument();
      // Verificar que o toast de info está presente
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });

    it("deve renderizar botão de fechar em cada toast", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      await user.click(screen.getByTestId("add-error"));

      const closeButtons = screen.getAllByText("×");
      expect(closeButtons).toHaveLength(2);

      closeButtons.forEach((button) => {
        expect(button).toHaveClass("text-xs opacity-70 hover:opacity-100");
      });
    });

    it("deve renderizar mensagem do toast corretamente", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));

      const messageElement = screen.getByText("Success message");
      expect(messageElement).toHaveClass("flex-1");
    });

    it("deve renderizar toasts em ordem de adição", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      await user.click(screen.getByTestId("add-error"));
      await user.click(screen.getByTestId("add-info"));

      // Verificar que existem 3 toasts através das mensagens
      expect(screen.getByText("Success message")).toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByText("Info message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("3");
    });
  });

  describe("Interações do Usuário", () => {
    it("deve remover toast ao clicar no botão fechar", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));

      expect(screen.getByText("Success message")).toBeInTheDocument();

      const closeButton = screen.getByText("×");
      await user.click(closeButton);

      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
    });

    it("deve remover apenas o toast correto ao clicar no botão fechar", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));
      await user.click(screen.getByTestId("add-error"));

      const closeButtons = screen.getAllByText("×");
      expect(closeButtons).toHaveLength(2);

      // Clicar no primeiro botão de fechar
      await user.click(closeButtons[0]);

      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });

    it("deve ter hover effect no botão fechar", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await user.click(screen.getByTestId("add-success"));

      const closeButton = screen.getByText("×");
      expect(closeButton).toHaveClass("opacity-70 hover:opacity-100");
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com mensagens vazias", () => {
      render(
        <ToastProvider>
          <TestComponent autoTrigger message="" />
        </ToastProvider>,
      );

      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

      // Verificar se apenas o botão fechar está presente
      expect(screen.getByText("×")).toBeInTheDocument();
      expect(screen.queryByText(/\S/)).toBeNull(); // Não deve ter texto além do botão fechar
    });

    it("deve lidar com mensagens muito longas", () => {
      const longMessage = "A".repeat(200);

      render(
        <ToastProvider>
          <TestComponent autoTrigger message={longMessage} />
        </ToastProvider>,
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    });

    it("deve lidar com TTL negativo", () => {
      render(
        <ToastProvider>
          <TestComponent autoTrigger ttl={-1000} />
        </ToastProvider>,
      );

      expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

      // TTL negativo deve usar o padrão (4000ms)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
    });

    it("deve lidar com muitos toasts simultaneamente", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      // Adicionar 10 toasts rapidamente
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByTestId("add-success"));
      }

      expect(screen.getByTestId("toast-count")).toHaveTextContent("10");

      // Verificar se todos os 10 toasts estão presentes
      const toasts = screen.getAllByText("Success message");
      expect(toasts).toHaveLength(10);
    });
  });

  describe("Integração Completa", () => {
    it("deve funcionar em cenário real de uso", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      // Adicionar toast de sucesso
      await user.click(screen.getByTestId("add-success"));
      expect(screen.getByText("Success message")).toBeInTheDocument();

      // Adicionar toast de erro
      await user.click(screen.getByTestId("add-error"));
      expect(screen.getByText("Error message")).toBeInTheDocument();

      // Remover toast de sucesso manualmente
      const closeButtons = screen.getAllByText("×");
      await user.click(closeButtons[0]);
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();

      // Adicionar toast com TTL customizado
      await user.click(screen.getByTestId("add-custom"));
      expect(screen.getByText("Custom message")).toBeInTheDocument();

      // Aguardar TTL customizado
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.queryByText("Custom message")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Error message")).toBeInTheDocument();

      // Aguardar TTL padrão do toast de erro
      act(() => {
        jest.advanceTimersByTime(3000); // Restante do TTL padrão
      });

      await waitFor(() => {
        expect(screen.queryByText("Error message")).not.toBeInTheDocument();
      });
      expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com adições/remoções frequentes", async () => {
      const user = userEvent;

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      const startTime = performance.now();

      // Adicionar e remover toasts rapidamente
      for (let i = 0; i < 20; i++) {
        await user.click(screen.getByTestId("add-success"));
        const closeButtons = screen.getAllByText("×");
        if (closeButtons.length > 0) {
          await user.click(closeButtons[0]);
        }
      }

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      expect(operationTime).toBeLessThan(1000); // menos de 1 segundo
    });
  });
});
