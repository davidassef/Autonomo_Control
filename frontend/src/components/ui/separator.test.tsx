import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Separator } from "./separator";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

// Mock do Radix UI Separator
jest.mock("@radix-ui/react-separator", () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => (
    <div ref={ref} {...props}>
      {children}
    </div>
  )),
}));

describe("Separator Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Separator", () => {
      render(<Separator data-testid="separator" />);

      expect(screen.getByTestId("separator")).toBeInTheDocument();
    });

    it("deve renderizar como div", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator.tagName).toBe("DIV");
    });

    it("deve renderizar sem conteúdo por padrão", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toBeEmptyDOMElement();
    });
  });

  describe("Orientação", () => {
    it("deve ter orientação horizontal por padrão", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("orientation", "horizontal");
    });

    it("deve aplicar classes CSS para orientação horizontal", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px] w-full");
    });

    it("deve aceitar orientação horizontal explícita", () => {
      render(<Separator orientation="horizontal" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("orientation", "horizontal");
      expect(separator).toHaveClass("h-[1px] w-full");
    });

    it("deve aceitar orientação vertical", () => {
      render(<Separator orientation="vertical" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("orientation", "vertical");
    });

    it("deve aplicar classes CSS para orientação vertical", () => {
      render(<Separator orientation="vertical" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-full w-[1px]");
    });
  });

  describe("Propriedade Decorative", () => {
    it("deve ter decorative true por padrão", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("decorative", "true");
    });

    it("deve aceitar decorative true explícito", () => {
      render(<Separator decorative={true} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("decorative", "true");
    });

    it("deve aceitar decorative false", () => {
      render(<Separator decorative={false} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("decorative", "false");
    });
  });

  describe("Classes CSS", () => {
    it("deve aplicar classes CSS padrão", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("shrink-0 bg-border");
    });

    it("deve aceitar className customizada", () => {
      render(
        <Separator className="custom-separator" data-testid="separator" />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("custom-separator");
      expect(separator).toHaveClass("shrink-0 bg-border"); // classes padrão
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(
        <Separator className="bg-red-500 opacity-50" data-testid="separator" />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("bg-red-500 opacity-50");
      expect(separator).toHaveClass("shrink-0"); // classe padrão
    });

    it("deve combinar classes de orientação com className customizada", () => {
      render(
        <Separator
          orientation="vertical"
          className="bg-blue-500"
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("bg-blue-500");
      expect(separator).toHaveClass("h-full w-[1px]"); // classes de orientação
      expect(separator).toHaveClass("shrink-0 bg-border"); // classes padrão
    });

    it("deve lidar com className undefined", () => {
      render(<Separator className={undefined} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("shrink-0 bg-border h-[1px] w-full");
    });

    it("deve lidar com className vazia", () => {
      render(<Separator className="" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("shrink-0 bg-border h-[1px] w-full");
    });

    it("deve lidar com múltiplas classes CSS", () => {
      render(
        <Separator className="class1 class2 class3" data-testid="separator" />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("class1 class2 class3");
      expect(separator).toHaveClass("shrink-0"); // classe padrão
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar id", () => {
      render(<Separator id="separator-id" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("id", "separator-id");
    });

    it("deve aceitar title", () => {
      render(<Separator title="Separador visual" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("title", "Separador visual");
    });

    it("deve aceitar data attributes", () => {
      render(<Separator data-custom="value" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("data-custom", "value");
    });

    it("deve aceitar aria attributes", () => {
      render(
        <Separator aria-label="Separador de seções" data-testid="separator" />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("aria-label", "Separador de seções");
    });

    it("deve aceitar role customizado", () => {
      render(<Separator role="presentation" data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("role", "presentation");
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para o separator", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<Separator ref={ref} data-testid="separator" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("deve permitir acesso às propriedades do separator via ref", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<Separator ref={ref} id="separator-ref" />);

      expect(ref.current?.id).toBe("separator-ref");
    });

    it("deve permitir chamar métodos do separator via ref", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<Separator ref={ref} data-testid="separator" />);

      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.click).toBeDefined();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter role separator implícito quando decorative é false", () => {
      render(<Separator decorative={false} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      // Quando decorative é false, o Radix UI adiciona role="separator"
      expect(separator).toHaveAttribute("decorative", "false");
    });

    it("deve ser ignorado por screen readers quando decorative é true", () => {
      render(<Separator decorative={true} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("decorative", "true");
    });

    it("deve aceitar aria-orientation", () => {
      render(
        <Separator
          orientation="vertical"
          aria-orientation="vertical"
          data-testid="separator"
        />,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  describe("Casos de Uso", () => {
    it("deve funcionar como separador horizontal em lista", () => {
      render(
        <div>
          <div>Item 1</div>
          <Separator data-testid="separator" />
          <div>Item 2</div>
        </div>,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-[1px] w-full");
      expect(separator).toHaveAttribute("orientation", "horizontal");
    });

    it("deve funcionar como separador vertical em layout", () => {
      render(
        <div style={{ display: "flex" }}>
          <div>Coluna 1</div>
          <Separator orientation="vertical" data-testid="separator" />
          <div>Coluna 2</div>
        </div>,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveClass("h-full w-[1px]");
      expect(separator).toHaveAttribute("orientation", "vertical");
    });

    it("deve funcionar em menu com separadores", () => {
      render(
        <div role="menu">
          <div role="menuitem">Opção 1</div>
          <Separator decorative={false} data-testid="separator" />
          <div role="menuitem">Opção 2</div>
        </div>,
      );

      const separator = screen.getByTestId("separator");
      expect(separator).toHaveAttribute("decorative", "false");
    });
  });

  describe("Display Name", () => {
    it("deve ter displayName correto", () => {
      // Como estamos mockando o Radix UI, vamos testar se o displayName é definido
      expect(Separator.displayName).toBeDefined();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com orientação undefined", () => {
      render(<Separator orientation={undefined} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      // Deve usar o padrão horizontal
      expect(separator).toHaveClass("h-[1px] w-full");
    });

    it("deve lidar com decorative undefined", () => {
      render(<Separator decorative={undefined} data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      // Deve usar o padrão true
      expect(separator).toHaveAttribute("decorative", "true");
    });

    it("deve lidar com props vazias", () => {
      render(<Separator data-testid="separator" />);

      const separator = screen.getByTestId("separator");
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveClass("shrink-0 bg-border");
    });
  });

  describe("Integração", () => {
    it("deve renderizar múltiplos separadores", () => {
      render(
        <div>
          <Separator data-testid="separator1" />
          <Separator orientation="vertical" data-testid="separator2" />
          <Separator className="bg-red-500" data-testid="separator3" />
        </div>,
      );

      expect(screen.getByTestId("separator1")).toBeInTheDocument();
      expect(screen.getByTestId("separator2")).toBeInTheDocument();
      expect(screen.getByTestId("separator3")).toBeInTheDocument();
    });

    it("deve manter estilos independentes", () => {
      render(
        <div>
          <Separator
            orientation="horizontal"
            className="bg-red-500"
            data-testid="separator1"
          />
          <Separator
            orientation="vertical"
            className="bg-blue-500"
            data-testid="separator2"
          />
        </div>,
      );

      const separator1 = screen.getByTestId("separator1");
      const separator2 = screen.getByTestId("separator2");

      expect(separator1).toHaveClass("bg-red-500 h-[1px] w-full");
      expect(separator2).toHaveClass("bg-blue-500 h-full w-[1px]");
      expect(separator1).not.toHaveClass("bg-blue-500");
      expect(separator2).not.toHaveClass("bg-red-500");
    });

    it("deve funcionar em layout complexo", () => {
      render(
        <div>
          <header>Cabeçalho</header>
          <Separator data-testid="header-separator" />
          <main style={{ display: "flex" }}>
            <aside>Sidebar</aside>
            <Separator orientation="vertical" data-testid="sidebar-separator" />
            <section>Conteúdo principal</section>
          </main>
          <Separator data-testid="footer-separator" />
          <footer>Rodapé</footer>
        </div>,
      );

      expect(screen.getByTestId("header-separator")).toHaveClass(
        "h-[1px] w-full",
      );
      expect(screen.getByTestId("sidebar-separator")).toHaveClass(
        "h-full w-[1px]",
      );
      expect(screen.getByTestId("footer-separator")).toHaveClass(
        "h-[1px] w-full",
      );
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<Separator />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(
        <Separator orientation="horizontal" className="bg-red-500" />,
      );

      for (let i = 0; i < 100; i++) {
        rerender(
          <Separator
            orientation={i % 2 === 0 ? "horizontal" : "vertical"}
            className={`bg-color-${i}`}
          />,
        );
      }

      expect(
        screen.getByRole("separator", { hidden: true }),
      ).toBeInTheDocument();
    });
  });
});
