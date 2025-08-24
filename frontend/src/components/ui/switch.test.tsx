import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Switch } from "./switch";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock do Radix UI Switch
const mockThumb = React.forwardRef<HTMLSpanElement, any>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={className} {...props} />
  ),
);
mockThumb.displayName = "SwitchThumb";

const mockRoot = React.forwardRef<HTMLButtonElement, any>(
  (
    { className, children, checked, onCheckedChange, disabled, ...props },
    ref,
  ) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleClick = () => {
      if (!disabled) {
        const newChecked = !isChecked;
        setIsChecked(newChecked);
        onCheckedChange?.(newChecked);
      }
    };

    return (
      <button
        ref={ref}
        className={className}
        onClick={handleClick}
        disabled={disabled}
        data-state={isChecked ? "checked" : "unchecked"}
        role="switch"
        aria-checked={isChecked}
        {...props}
      >
        {children}
      </button>
    );
  },
);
mockRoot.displayName = "Switch";

jest.mock("@radix-ui/react-switch", () => ({
  Root: mockRoot,
  Thumb: mockThumb,
}));

describe("Switch Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Switch", () => {
      render(<Switch data-testid="switch" />);

      expect(screen.getByTestId("switch")).toBeInTheDocument();
    });

    it("deve renderizar como button com role switch", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement.tagName).toBe("BUTTON");
      expect(switchElement).toHaveAttribute("role", "switch");
    });

    it("deve renderizar o thumb interno", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      // Verifica se o switch tem a estrutura correta (contém um span interno)
      expect(switchElement).toContainHTML('<span');
    });

    it("deve ter estado unchecked por padrão", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("data-state", "unchecked");
      expect(switchElement).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("Estados", () => {
    it("deve aceitar estado checked inicial", () => {
      render(<Switch checked={true} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("data-state", "checked");
      expect(switchElement).toHaveAttribute("aria-checked", "true");
    });

    it("deve aceitar estado unchecked inicial", () => {
      render(<Switch checked={false} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("data-state", "unchecked");
      expect(switchElement).toHaveAttribute("aria-checked", "false");
    });

    it("deve alternar estado ao clicar", async () => {
      const user = userEvent;
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");

      // Estado inicial unchecked
      expect(switchElement).toHaveAttribute("data-state", "unchecked");

      // Clicar para checked
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute("data-state", "checked");

      // Clicar novamente para unchecked
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute("data-state", "unchecked");
    });

    it("deve chamar onCheckedChange quando o estado muda", async () => {
      const user = userEvent;
      const onCheckedChange = jest.fn();

      render(<Switch onCheckedChange={onCheckedChange} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");

      await user.click(switchElement);
      expect(onCheckedChange).toHaveBeenCalledWith(true);

      await user.click(switchElement);
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it("deve ser controlado quando checked é fornecido", () => {
      const { rerender } = render(
        <Switch checked={false} data-testid="switch" />,
      );

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("data-state", "unchecked");

      rerender(<Switch checked={true} data-testid="switch" />);
      expect(switchElement).toHaveAttribute("data-state", "checked");
    });
  });

  describe("Estado Disabled", () => {
    it("deve aceitar propriedade disabled", () => {
      render(<Switch disabled data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toBeDisabled();
    });

    it("não deve alternar estado quando disabled", async () => {
      const user = userEvent;
      const onCheckedChange = jest.fn();

      render(
        <Switch
          disabled
          onCheckedChange={onCheckedChange}
          data-testid="switch"
        />,
      );

      const switchElement = screen.getByTestId("switch");

      await user.click(switchElement);
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(switchElement).toHaveAttribute("data-state", "unchecked");
    });

    it("deve aplicar estilos de disabled", () => {
      render(<Switch disabled data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass(
        "disabled:cursor-not-allowed disabled:opacity-50",
      );
    });
  });

  describe("Classes CSS", () => {
    it("deve aplicar classes CSS padrão", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
      );
    });

    it("deve aplicar classes de foco", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      );
    });

    it("deve aplicar classes de estado", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass(
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      );
    });

    it("deve aplicar classes do thumb", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      // Verifica se o switch contém as classes do thumb na estrutura HTML
      expect(switchElement).toContainHTML('pointer-events-none');
      expect(switchElement).toContainHTML('rounded-full');
      expect(switchElement).toContainHTML('bg-background');
    });

    it("deve aceitar className customizada", () => {
      render(<Switch className="custom-switch" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass("custom-switch");
      expect(switchElement).toHaveClass("peer inline-flex"); // classes padrão
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(
        <Switch className="bg-red-500 border-red-300" data-testid="switch" />,
      );

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass("bg-red-500 border-red-300");
      expect(switchElement).toHaveClass("peer inline-flex"); // classes padrão
    });

    it("deve lidar com className undefined", () => {
      render(<Switch className={undefined} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass("peer inline-flex h-6 w-11");
    });

    it("deve lidar com className vazia", () => {
      render(<Switch className="" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass("peer inline-flex h-6 w-11");
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar id", () => {
      render(<Switch id="switch-id" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("id", "switch-id");
    });

    it("deve aceitar name", () => {
      render(<Switch name="switch-name" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("name", "switch-name");
    });

    it("deve aceitar value", () => {
      render(<Switch value="switch-value" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("value", "switch-value");
    });

    it("deve aceitar data attributes", () => {
      render(<Switch data-custom="value" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("data-custom", "value");
    });

    it("deve aceitar aria attributes", () => {
      render(
        <Switch
          aria-label="Toggle setting"
          aria-describedby="switch-description"
          data-testid="switch"
        />,
      );

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("aria-label", "Toggle setting");
      expect(switchElement).toHaveAttribute(
        "aria-describedby",
        "switch-description",
      );
    });
  });

  describe("Eventos", () => {
    it("deve chamar onClick quando clicado", async () => {
      const user = userEvent;
      const onClick = jest.fn();

      render(<Switch onClick={onClick} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      await user.click(switchElement);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onFocus quando focado", async () => {
      const user = userEvent;
      const onFocus = jest.fn();

      render(<Switch onFocus={onFocus} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      await user.click(switchElement); // Foca o elemento

      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onBlur quando perde o foco", async () => {
      const user = userEvent;
      const onBlur = jest.fn();

      render(
        <div>
          <Switch onBlur={onBlur} data-testid="switch" />
          <button>Other button</button>
        </div>,
      );

      const switchElement = screen.getByTestId("switch");
      const otherButton = screen.getByText("Other button");

      await user.click(switchElement); // Foca o switch
      await user.click(otherButton); // Remove o foco

      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("deve responder a teclas de espaço e enter", async () => {
      const user = userEvent;
      const onCheckedChange = jest.fn();

      render(<Switch onCheckedChange={onCheckedChange} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      switchElement.focus();

      // Tecla espaço
      await user.keyboard(" ");
      expect(onCheckedChange).toHaveBeenCalledWith(true);

      // Tecla enter
      await user.keyboard("{Enter}");
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it("não deve chamar eventos quando disabled", async () => {
      const user = userEvent;
      const onClick = jest.fn();
      const onCheckedChange = jest.fn();

      render(
        <Switch
          disabled
          onClick={onClick}
          onCheckedChange={onCheckedChange}
          data-testid="switch"
        />,
      );

      const switchElement = screen.getByTestId("switch");
      await user.click(switchElement);

      expect(onClick).not.toHaveBeenCalled();
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para o switch", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Switch ref={ref} data-testid="switch" />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe("BUTTON");
    });

    it("deve permitir acesso às propriedades do switch via ref", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Switch ref={ref} id="switch-ref" />);

      expect(ref.current?.id).toBe("switch-ref");
    });

    it("deve permitir chamar métodos do switch via ref", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Switch ref={ref} data-testid="switch" />);

      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.click).toBeDefined();
    });

    it("deve permitir focar o switch via ref", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Switch ref={ref} data-testid="switch" />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter role switch", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("role", "switch");
    });

    it("deve ter aria-checked correto", () => {
      const { rerender } = render(
        <Switch checked={false} data-testid="switch" />,
      );

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("aria-checked", "false");

      rerender(<Switch checked={true} data-testid="switch" />);
      expect(switchElement).toHaveAttribute("aria-checked", "true");
    });

    it("deve ser focável", async () => {
      const user = userEvent;
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      await user.click(switchElement);

      expect(switchElement).toHaveFocus();
    });

    it("deve ter estilos de foco visível", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveClass("focus-visible:ring-2");
    });

    it("deve aceitar aria-label", () => {
      render(<Switch aria-label="Enable notifications" data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute(
        "aria-label",
        "Enable notifications",
      );
    });

    it("deve aceitar aria-describedby", () => {
      render(
        <Switch aria-describedby="switch-description" data-testid="switch" />,
      );

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute(
        "aria-describedby",
        "switch-description",
      );
    });

    it("não deve ser focável quando disabled", () => {
      render(<Switch disabled data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toBeDisabled();
    });
  });

  describe("Display Name", () => {
    it("deve ter displayName correto", () => {
      expect(Switch.displayName).toBe("Switch");
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com checked undefined", () => {
      render(<Switch checked={undefined} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("data-state", "unchecked");
    });

    it("deve lidar com onCheckedChange undefined", async () => {
      const user = userEvent;
      render(<Switch onCheckedChange={undefined} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");

      // Não deve gerar erro ao clicar
      await user.click(switchElement);
      expect(switchElement).toHaveAttribute("data-state", "checked");
    });

    it("deve lidar com disabled undefined", () => {
      render(<Switch disabled={undefined} data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).not.toBeDisabled();
    });

    it("deve lidar com props vazias", () => {
      render(<Switch data-testid="switch" />);

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toHaveAttribute("role", "switch");
    });
  });

  describe("Casos de Uso", () => {
    it("deve funcionar como toggle de configuração", async () => {
      const user = userEvent;
      const onToggle = jest.fn();

      render(
        <div>
          <label htmlFor="notifications">Enable notifications</label>
          <Switch
            id="notifications"
            onCheckedChange={onToggle}
            data-testid="switch"
          />
        </div>,
      );

      const switchElement = screen.getByTestId("switch");
      await user.click(switchElement);

      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it("deve funcionar em formulário", () => {
      render(
        <form>
          <Switch name="agree" value="yes" data-testid="switch" />
        </form>,
      );

      const switchElement = screen.getByTestId("switch");
      expect(switchElement).toHaveAttribute("name", "agree");
      expect(switchElement).toHaveAttribute("value", "yes");
    });

    it("deve funcionar com estado controlado", () => {
      const ControlledSwitch = () => {
        const [checked, setChecked] = React.useState(false);

        return (
          <div>
            <Switch
              checked={checked}
              onCheckedChange={setChecked}
              data-testid="switch"
            />
            <span data-testid="status">{checked ? "On" : "Off"}</span>
          </div>
        );
      };

      render(<ControlledSwitch />);

      expect(screen.getByTestId("status")).toHaveTextContent("Off");

      fireEvent.click(screen.getByTestId("switch"));
      expect(screen.getByTestId("status")).toHaveTextContent("On");
    });
  });

  describe("Integração", () => {
    it("deve renderizar múltiplos switches", () => {
      render(
        <div>
          <Switch data-testid="switch1" />
          <Switch checked={true} data-testid="switch2" />
          <Switch disabled data-testid="switch3" />
        </div>,
      );

      expect(screen.getByTestId("switch1")).toBeInTheDocument();
      expect(screen.getByTestId("switch2")).toBeInTheDocument();
      expect(screen.getByTestId("switch3")).toBeInTheDocument();
    });

    it("deve manter estados independentes", async () => {
      const user = userEvent;

      render(
        <div>
          <Switch data-testid="switch1" />
          <Switch data-testid="switch2" />
        </div>,
      );

      const switch1 = screen.getByTestId("switch1");
      const switch2 = screen.getByTestId("switch2");

      await user.click(switch1);

      expect(switch1).toHaveAttribute("data-state", "checked");
      expect(switch2).toHaveAttribute("data-state", "unchecked");
    });

    it("deve funcionar em lista de configurações", () => {
      const settings = [
        { id: "notifications", label: "Notifications", checked: true },
        { id: "darkMode", label: "Dark Mode", checked: false },
        { id: "autoSave", label: "Auto Save", checked: true },
      ];

      render(
        <div>
          {settings.map((setting) => (
            <div key={setting.id}>
              <label htmlFor={setting.id}>{setting.label}</label>
              <Switch
                id={setting.id}
                checked={setting.checked}
                data-testid={`switch-${setting.id}`}
              />
            </div>
          ))}
        </div>,
      );

      expect(screen.getByTestId("switch-notifications")).toHaveAttribute(
        "data-state",
        "checked",
      );
      expect(screen.getByTestId("switch-darkMode")).toHaveAttribute(
        "data-state",
        "unchecked",
      );
      expect(screen.getByTestId("switch-autoSave")).toHaveAttribute(
        "data-state",
        "checked",
      );
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<Switch />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(
        <Switch checked={false} className="bg-red-500" />,
      );

      for (let i = 0; i < 100; i++) {
        rerender(<Switch checked={i % 2 === 0} className={`bg-color-${i}`} />);
      }

      expect(screen.getByRole("switch")).toBeInTheDocument();
    });
  });
});
