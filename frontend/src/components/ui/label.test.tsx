import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Label } from "./label";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock do Radix UI Label
jest.mock("@radix-ui/react-label", () => ({
  Root: React.forwardRef<HTMLLabelElement, any>(
    ({ children, ...props }, ref) => (
      <label ref={ref} {...props}>
        {children}
      </label>
    ),
  ),
}));

describe("Label Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Label", () => {
      render(<Label data-testid="label">Texto do label</Label>);

      expect(screen.getByTestId("label")).toBeInTheDocument();
    });

    it("deve renderizar como label", () => {
      render(<Label data-testid="label">Texto do label</Label>);

      const label = screen.getByTestId("label");
      expect(label.tagName).toBe("LABEL");
    });

    it("deve renderizar com conteúdo", () => {
      render(<Label>Nome do usuário</Label>);

      expect(screen.getByText("Nome do usuário")).toBeInTheDocument();
    });

    it("deve renderizar sem conteúdo", () => {
      render(<Label data-testid="empty-label" />);

      const label = screen.getByTestId("empty-label");
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });
  });

  describe("Classes CSS", () => {
    it("deve aplicar classes CSS padrão", () => {
      render(<Label data-testid="label">Texto</Label>);

      const label = screen.getByTestId("label");
      expect(label).toHaveClass(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      );
    });

    it("deve aceitar className customizada", () => {
      render(
        <Label className="custom-label" data-testid="label">
          Texto
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass("custom-label");
      expect(label).toHaveClass("text-sm font-medium"); // classes padrão
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(
        <Label className="text-red-500 font-bold" data-testid="label">
          Texto
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass("text-red-500 font-bold");
      expect(label).toHaveClass("leading-none"); // classe padrão
    });

    it("deve lidar com className undefined", () => {
      render(
        <Label className={undefined} data-testid="label">
          Texto
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass("text-sm font-medium leading-none");
    });

    it("deve lidar com className vazia", () => {
      render(
        <Label className="" data-testid="label">
          Texto
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass("text-sm font-medium leading-none");
    });

    it("deve lidar com múltiplas classes CSS", () => {
      render(
        <Label className="class1 class2 class3" data-testid="label">
          Texto
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass("class1 class2 class3");
      expect(label).toHaveClass("text-sm"); // classe padrão
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar htmlFor", () => {
      render(
        <Label htmlFor="input-id" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("for", "input-id");
    });

    it("deve aceitar id", () => {
      render(
        <Label id="label-id" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("id", "label-id");
    });

    it("deve aceitar title", () => {
      render(
        <Label title="Tooltip do label" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("title", "Tooltip do label");
    });

    it("deve aceitar data attributes", () => {
      render(
        <Label data-custom="value" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("data-custom", "value");
    });

    it("deve aceitar aria attributes", () => {
      render(
        <Label aria-label="Label acessível" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("aria-label", "Label acessível");
    });
  });

  describe("Event Handlers", () => {
    it("deve chamar onClick quando clicado", () => {
      const handleClick = jest.fn();

      render(
        <Label onClick={handleClick} data-testid="label">
          Clique aqui
        </Label>,
      );

      const label = screen.getByTestId("label");
      fireEvent.click(label);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onMouseEnter quando mouse entra", () => {
      const handleMouseEnter = jest.fn();

      render(
        <Label onMouseEnter={handleMouseEnter} data-testid="label">
          Hover aqui
        </Label>,
      );

      const label = screen.getByTestId("label");
      fireEvent.mouseEnter(label);

      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onMouseLeave quando mouse sai", () => {
      const handleMouseLeave = jest.fn();

      render(
        <Label onMouseLeave={handleMouseLeave} data-testid="label">
          Hover aqui
        </Label>,
      );

      const label = screen.getByTestId("label");
      fireEvent.mouseEnter(label);
      fireEvent.mouseLeave(label);

      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onKeyDown quando tecla é pressionada", () => {
      const handleKeyDown = jest.fn();

      render(
        <Label onKeyDown={handleKeyDown} data-testid="label" tabIndex={0}>
          Pressione tecla
        </Label>,
      );

      const label = screen.getByTestId("label");
      fireEvent.keyDown(label, { key: "Enter", code: "Enter" });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "Enter",
          code: "Enter",
        }),
      );
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para o label", () => {
      const ref = React.createRef<HTMLLabelElement>();

      render(
        <Label ref={ref} data-testid="label">
          Texto
        </Label>,
      );

      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
      expect(ref.current?.tagName).toBe("LABEL");
    });

    it("deve permitir acesso às propriedades do label via ref", () => {
      const ref = React.createRef<HTMLLabelElement>();

      render(
        <Label ref={ref} htmlFor="input-id">
          Nome
        </Label>,
      );

      expect(ref.current?.htmlFor).toBe("input-id");
    });

    it("deve permitir chamar métodos do label via ref", () => {
      const ref = React.createRef<HTMLLabelElement>();

      render(
        <Label ref={ref} data-testid="label">
          Texto
        </Label>,
      );

      expect(ref.current?.click).toBeDefined();
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe("Conteúdo do Label", () => {
    it("deve renderizar texto simples", () => {
      render(<Label>Texto simples</Label>);

      expect(screen.getByText("Texto simples")).toBeInTheDocument();
    });

    it("deve renderizar elementos React", () => {
      render(
        <Label>
          <span>Elemento</span> <strong>React</strong>
        </Label>,
      );

      expect(screen.getByText("Elemento")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("deve renderizar ícones com texto", () => {
      const Icon = () => <span data-testid="icon">🏷️</span>;

      render(
        <Label>
          <Icon /> Nome do campo
        </Label>,
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Nome do campo")).toBeInTheDocument();
    });

    it("deve renderizar números", () => {
      render(<Label>{123}</Label>);

      expect(screen.getByText("123")).toBeInTheDocument();
    });

    it("deve renderizar conteúdo condicional", () => {
      const showOptional = true;

      render(<Label>Nome {showOptional && <span>(opcional)</span>}</Label>);

      expect(screen.getByText("Nome")).toBeInTheDocument();
      expect(screen.getByText("(opcional)")).toBeInTheDocument();
    });
  });

  describe("Associação com Inputs", () => {
    it("deve associar com input via htmlFor", () => {
      render(
        <div>
          <Label htmlFor="username" data-testid="label">
            Nome de usuário
          </Label>
          <input id="username" data-testid="input" />
        </div>,
      );

      const label = screen.getByTestId("label");
      const input = screen.getByTestId("input");

      expect(label).toHaveAttribute("for", "username");
      expect(input).toHaveAttribute("id", "username");
    });

    it("deve focar input quando label é clicado", () => {
      render(
        <div>
          <Label htmlFor="email" data-testid="label">
            Email
          </Label>
          <input id="email" data-testid="input" />
        </div>,
      );

      const label = screen.getByTestId("label");
      const input = screen.getByTestId("input");

      fireEvent.click(label);

      expect(input).toHaveFocus();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter role implícito de label", () => {
      render(<Label data-testid="label">Nome</Label>);

      const label = screen.getByTestId("label");
      // Labels têm role implícito, não precisam de role explícito
      expect(label.tagName).toBe("LABEL");
    });

    it("deve aceitar aria-label", () => {
      render(
        <Label aria-label="Label acessível" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("aria-label", "Label acessível");
    });

    it("deve aceitar aria-describedby", () => {
      render(
        <Label aria-describedby="help-text" data-testid="label">
          Nome
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("aria-describedby", "help-text");
    });

    it("deve aceitar aria-required", () => {
      render(
        <Label aria-required="true" data-testid="label">
          Nome *
        </Label>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("aria-required", "true");
    });
  });

  describe("Estados do Label", () => {
    it("deve aplicar estilos para peer disabled", () => {
      render(
        <div>
          <Label data-testid="label">Nome</Label>
          <input disabled className="peer" />
        </div>,
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass(
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      );
    });
  });

  describe("Display Name", () => {
    it("deve ter displayName correto", () => {
      // Como estamos mockando o Radix UI, vamos testar se o displayName é definido
      expect(Label.displayName).toBeDefined();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com children undefined", () => {
      render(<Label data-testid="label">{undefined}</Label>);

      const label = screen.getByTestId("label");
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });

    it("deve lidar com children null", () => {
      render(<Label data-testid="label">{null}</Label>);

      const label = screen.getByTestId("label");
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });

    it("deve lidar com string vazia", () => {
      render(<Label data-testid="label"></Label>);

      const label = screen.getByTestId("label");
      expect(label).toBeInTheDocument();
      expect(label).toBeEmptyDOMElement();
    });

    it("deve lidar com espaços em branco", () => {
      render(<Label data-testid="label"> </Label>);

      const label = screen.getByTestId("label");
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe("   ");
    });
  });

  describe("Integração", () => {
    it("deve renderizar múltiplos labels", () => {
      render(
        <div>
          <Label data-testid="label1">Label 1</Label>
          <Label data-testid="label2">Label 2</Label>
          <Label data-testid="label3">Label 3</Label>
        </div>,
      );

      expect(screen.getByTestId("label1")).toBeInTheDocument();
      expect(screen.getByTestId("label2")).toBeInTheDocument();
      expect(screen.getByTestId("label3")).toBeInTheDocument();
    });

    it("deve manter estilos independentes", () => {
      render(
        <div>
          <Label className="text-red-500" data-testid="label1">
            Label Vermelho
          </Label>
          <Label className="text-blue-500" data-testid="label2">
            Label Azul
          </Label>
        </div>,
      );

      const label1 = screen.getByTestId("label1");
      const label2 = screen.getByTestId("label2");

      expect(label1).toHaveClass("text-red-500");
      expect(label2).toHaveClass("text-blue-500");
      expect(label1).not.toHaveClass("text-blue-500");
      expect(label2).not.toHaveClass("text-red-500");
    });

    it("deve funcionar em formulário completo", () => {
      render(
        <form>
          <div>
            <Label htmlFor="name">Nome</Label>
            <input id="name" type="text" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <input id="email" type="email" />
          </div>
        </form>,
      );

      expect(screen.getByText("Nome")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<Label>Performance test</Label>);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(<Label>Initial text</Label>);

      for (let i = 0; i < 100; i++) {
        rerender(<Label>Text {i}</Label>);
      }

      expect(screen.getByText("Text 99")).toBeInTheDocument();
    });
  });
});
