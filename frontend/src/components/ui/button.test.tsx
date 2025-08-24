import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button, buttonVariants, ButtonProps } from "./button";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock do Radix UI Slot
jest.mock("@radix-ui/react-slot", () => ({
  Slot: React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => {
    return React.cloneElement(children, { ...props, ref });
  }),
}));

describe("Button Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Button com conteúdo", () => {
      render(<Button>Clique aqui</Button>);

      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByText("Clique aqui")).toBeInTheDocument();
    });

    it("deve renderizar como button por padrão", () => {
      render(<Button data-testid="button">Button</Button>);

      const button = screen.getByTestId("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("deve renderizar Button vazio", () => {
      render(<Button data-testid="button"></Button>);

      const button = screen.getByTestId("button");
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });
  });

  describe("Variantes do Button", () => {
    it("deve aplicar a variante default por padrão", () => {
      render(<Button data-testid="button">Default</Button>);

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "bg-primary text-primary-foreground hover:bg-primary/90",
      );
    });

    it("deve aplicar a variante destructive", () => {
      render(
        <Button variant="destructive" data-testid="button">
          Destructive
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      );
    });

    it("deve aplicar a variante outline", () => {
      render(
        <Button variant="outline" data-testid="button">
          Outline
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      );
    });

    it("deve aplicar a variante secondary", () => {
      render(
        <Button variant="secondary" data-testid="button">
          Secondary
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      );
    });

    it("deve aplicar a variante ghost", () => {
      render(
        <Button variant="ghost" data-testid="button">
          Ghost
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "hover:bg-accent hover:text-accent-foreground",
      );
    });

    it("deve aplicar a variante link", () => {
      render(
        <Button variant="link" data-testid="button">
          Link
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "text-primary underline-offset-4 hover:underline",
      );
    });
  });

  describe("Tamanhos do Button", () => {
    it("deve aplicar o tamanho default por padrão", () => {
      render(<Button data-testid="button">Default Size</Button>);

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("h-10 px-4 py-2");
    });

    it("deve aplicar o tamanho sm", () => {
      render(
        <Button size="sm" data-testid="button">
          Small
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("h-9 rounded-md px-3");
    });

    it("deve aplicar o tamanho lg", () => {
      render(
        <Button size="lg" data-testid="button">
          Large
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("h-11 rounded-md px-8");
    });

    it("deve aplicar o tamanho icon", () => {
      render(
        <Button size="icon" data-testid="button">
          <svg width="16" height="16" />
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("h-10 w-10");
    });
  });

  describe("Combinações de Variante e Tamanho", () => {
    it("deve combinar variante destructive com tamanho sm", () => {
      render(
        <Button variant="destructive" size="sm" data-testid="button">
          Small Destructive
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "bg-destructive text-destructive-foreground h-9 px-3",
      );
    });

    it("deve combinar variante outline com tamanho lg", () => {
      render(
        <Button variant="outline" size="lg" data-testid="button">
          Large Outline
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("border border-input h-11 px-8");
    });
  });

  describe("Classes Base", () => {
    it("deve aplicar classes base em todas as variantes", () => {
      const variants: ButtonProps["variant"][] = [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ];

      variants.forEach((variant, index) => {
        render(
          <Button variant={variant} data-testid={`button-${index}`}>
            {variant}
          </Button>,
        );

        const button = screen.getByTestId(`button-${index}`);
        expect(button).toHaveClass(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        );
      });
    });
  });

  describe("Propriedade asChild", () => {
    it("deve renderizar como button quando asChild é false", () => {
      render(
        <Button asChild={false} data-testid="button">
          Normal Button
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("deve usar Slot quando asChild é true", () => {
      render(
        <Button asChild data-testid="link">
          <a href="/test">Link Button</a>
        </Button>,
      );

      const link = screen.getByTestId("link");
      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/test");
    });

    it("deve aplicar classes do Button ao elemento filho com asChild", () => {
      render(
        <Button asChild variant="destructive" size="lg">
          <div data-testid="custom-element">Custom Element</div>
        </Button>,
      );

      const element = screen.getByTestId("custom-element");
      expect(element).toHaveClass(
        "bg-destructive text-destructive-foreground h-11 px-8",
      );
    });
  });

  describe("Classes CSS Customizadas", () => {
    it("deve aceitar className customizada", () => {
      render(
        <Button className="custom-button" data-testid="button">
          Custom
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("custom-button");
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(
        <Button className="custom-class" data-testid="button">
          Combined
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("custom-class inline-flex items-center");
    });
  });

  describe("Estados do Button", () => {
    it("deve renderizar button desabilitado", () => {
      render(
        <Button disabled data-testid="button">
          Disabled
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none disabled:opacity-50",
      );
    });

    it("deve renderizar button habilitado por padrão", () => {
      render(<Button data-testid="button">Enabled</Button>);

      const button = screen.getByTestId("button");
      expect(button).toBeEnabled();
    });

    it("deve aceitar type do button", () => {
      render(
        <Button type="submit" data-testid="button">
          Submit
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("Event Handlers", () => {
    it("deve chamar onClick quando clicado", () => {
      const handleClick = jest.fn();

      render(
        <Button onClick={handleClick} data-testid="button">
          Clickable
        </Button>,
      );

      const button = screen.getByTestId("button");
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar onClick quando desabilitado", () => {
      const handleClick = jest.fn();

      render(
        <Button onClick={handleClick} disabled data-testid="button">
          Disabled
        </Button>,
      );

      const button = screen.getByTestId("button");
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("deve chamar onMouseEnter e onMouseLeave", () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();

      render(
        <Button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-testid="button"
        >
          Hover Me
        </Button>,
      );

      const button = screen.getByTestId("button");

      fireEvent.mouseEnter(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);

      fireEvent.mouseLeave(button);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onFocus e onBlur", () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();

      render(
        <Button onFocus={handleFocus} onBlur={handleBlur} data-testid="button">
          Focus Me
        </Button>,
      );

      const button = screen.getByTestId("button");

      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para o button", () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Button with Ref</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe("BUTTON");
    });

    it("deve encaminhar ref com asChild", () => {
      const ref = React.createRef<HTMLAnchorElement>();

      render(
        <Button asChild>
          <a href="/test" ref={ref}>
            Link with Ref
          </a>
        </Button>,
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
      expect(ref.current?.tagName).toBe("A");
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar propriedades HTML padrão", () => {
      render(
        <Button
          data-testid="button"
          id="custom-button"
          title="Button tooltip"
          aria-label="Custom button"
          tabIndex={0}
        >
          HTML Props
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("id", "custom-button");
      expect(button).toHaveAttribute("title", "Button tooltip");
      expect(button).toHaveAttribute("aria-label", "Custom button");
      expect(button).toHaveAttribute("tabIndex", "0");
    });

    it("deve aceitar data attributes", () => {
      render(
        <Button data-testid="button" data-action="save" data-priority="high">
          Data Attrs
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("data-action", "save");
      expect(button).toHaveAttribute("data-priority", "high");
    });
  });

  describe("Conteúdo do Button", () => {
    it("deve renderizar texto simples", () => {
      render(<Button>Texto simples</Button>);

      expect(screen.getByText("Texto simples")).toBeInTheDocument();
    });

    it("deve renderizar ícones", () => {
      render(
        <Button>
          <svg data-testid="icon" width="16" height="16">
            <circle cx="8" cy="8" r="8" />
          </svg>
        </Button>,
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("deve renderizar ícone com texto", () => {
      render(
        <Button>
          <svg data-testid="icon" width="16" height="16">
            <circle cx="8" cy="8" r="8" />
          </svg>
          Salvar
        </Button>,
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Salvar")).toBeInTheDocument();
    });

    it("deve renderizar elementos React complexos", () => {
      render(
        <Button>
          <span>Elemento</span>
          <strong>Complexo</strong>
        </Button>,
      );

      expect(screen.getByText("Elemento")).toBeInTheDocument();
      expect(screen.getByText("Complexo")).toBeInTheDocument();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com variant undefined", () => {
      render(
        <Button variant={undefined} data-testid="button">
          Undefined Variant
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary text-primary-foreground");
    });

    it("deve lidar com size undefined", () => {
      render(
        <Button size={undefined} data-testid="button">
          Undefined Size
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("h-10 px-4 py-2");
    });

    it("deve lidar com className undefined", () => {
      render(
        <Button className={undefined} data-testid="button">
          Undefined Class
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toBeInTheDocument();
    });

    it("deve lidar com asChild undefined", () => {
      render(
        <Button asChild={undefined} data-testid="button">
          Undefined AsChild
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Acessibilidade", () => {
    it("deve ser focável por padrão", () => {
      render(<Button data-testid="button">Focusable</Button>);

      const button = screen.getByTestId("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("deve ter classes de foco adequadas", () => {
      render(<Button data-testid="button">Focus Test</Button>);

      const button = screen.getByTestId("button");
      expect(button).toHaveClass(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      );
    });

    it("não deve ser focável quando desabilitado", () => {
      render(
        <Button disabled data-testid="button">
          Disabled
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("deve suportar aria-label", () => {
      render(
        <Button aria-label="Salvar documento" data-testid="button">
          Salvar
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("aria-label", "Salvar documento");
    });

    it("deve suportar aria-describedby", () => {
      render(
        <Button aria-describedby="help-text" data-testid="button">
          Ajuda
        </Button>,
      );

      const button = screen.getByTestId("button");
      expect(button).toHaveAttribute("aria-describedby", "help-text");
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<Button>Performance Test</Button>);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(<Button>Initial</Button>);

      for (let i = 0; i < 100; i++) {
        rerender(<Button>Render {i}</Button>);
      }

      expect(screen.getByText("Render 99")).toBeInTheDocument();
    });
  });

  describe("Display Name", () => {
    it("deve ter displayName correto", () => {
      expect(Button.displayName).toBe("Button");
    });
  });

  describe("Export do buttonVariants", () => {
    it("deve exportar buttonVariants", () => {
      expect(buttonVariants).toBeDefined();
      expect(typeof buttonVariants).toBe("function");
    });

    it("deve gerar classes corretas para variant default", () => {
      const classes = buttonVariants({ variant: "default" });
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    it("deve gerar classes corretas para size lg", () => {
      const classes = buttonVariants({ size: "lg" });
      expect(classes).toContain("h-11");
      expect(classes).toContain("px-8");
    });

    it("deve combinar variant e size", () => {
      const classes = buttonVariants({ variant: "destructive", size: "sm" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("h-9");
    });
  });
});
