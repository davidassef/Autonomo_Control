import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Badge, badgeVariants, BadgeProps } from "./badge";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Badge Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Badge com conteúdo", () => {
      render(<Badge>Novo</Badge>);

      expect(screen.getByText("Novo")).toBeInTheDocument();
    });

    it("deve renderizar Badge vazio", () => {
      render(<Badge data-testid="badge"></Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toBeEmptyDOMElement();
    });

    it("deve renderizar como div", () => {
      render(<Badge data-testid="badge">Conteúdo</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge.tagName).toBe("DIV");
    });
  });

  describe("Variantes do Badge", () => {
    it("deve aplicar a variante default por padrão", () => {
      render(<Badge data-testid="badge">Default</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass(
        "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      );
    });

    it("deve aplicar a variante secondary", () => {
      render(
        <Badge variant="secondary" data-testid="badge">
          Secondary
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass(
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      );
    });

    it("deve aplicar a variante destructive", () => {
      render(
        <Badge variant="destructive" data-testid="badge">
          Destructive
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass(
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      );
    });

    it("deve aplicar a variante outline", () => {
      render(
        <Badge variant="outline" data-testid="badge">
          Outline
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("text-foreground");
    });

    it("deve aplicar classes base em todas as variantes", () => {
      const variants: BadgeProps["variant"][] = [
        "default",
        "secondary",
        "destructive",
        "outline",
      ];

      variants.forEach((variant, index) => {
        render(
          <Badge variant={variant} data-testid={`badge-${index}`}>
            {variant}
          </Badge>,
        );

        const badge = screen.getByTestId(`badge-${index}`);
        expect(badge).toHaveClass(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        );
      });
    });
  });

  describe("Classes CSS Customizadas", () => {
    it("deve aceitar className customizada", () => {
      render(
        <Badge className="custom-badge" data-testid="badge">
          Custom
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("custom-badge");
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(
        <Badge className="custom-class" data-testid="badge">
          Combined
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("custom-class inline-flex items-center");
    });

    it("deve sobrescrever classes quando necessário", () => {
      render(
        <Badge className="bg-red-500" data-testid="badge">
          Override
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("bg-red-500");
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar propriedades HTML padrão", () => {
      render(
        <Badge
          data-testid="badge"
          id="custom-badge"
          title="Badge tooltip"
          aria-label="Status badge"
        >
          HTML Props
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("id", "custom-badge");
      expect(badge).toHaveAttribute("title", "Badge tooltip");
      expect(badge).toHaveAttribute("aria-label", "Status badge");
    });

    it("deve aceitar event handlers", () => {
      const handleClick = jest.fn();
      const handleMouseEnter = jest.fn();

      render(
        <Badge
          data-testid="badge"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
        >
          Clickable
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      badge.click();
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Simular mouse enter
      badge.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it("deve aceitar data attributes", () => {
      render(
        <Badge data-testid="badge" data-status="active" data-priority="high">
          Data Attrs
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-status", "active");
      expect(badge).toHaveAttribute("data-priority", "high");
    });
  });

  describe("Conteúdo do Badge", () => {
    it("deve renderizar texto simples", () => {
      render(<Badge>Texto simples</Badge>);

      expect(screen.getByText("Texto simples")).toBeInTheDocument();
    });

    it("deve renderizar números", () => {
      render(<Badge>42</Badge>);

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("deve renderizar elementos React", () => {
      render(
        <Badge>
          <span>Elemento</span> <strong>React</strong>
        </Badge>,
      );

      expect(screen.getByText("Elemento")).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("deve renderizar ícones com texto", () => {
      render(
        <Badge>
          <svg data-testid="icon" width="12" height="12">
            <circle cx="6" cy="6" r="6" />
          </svg>
          Com ícone
        </Badge>,
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Com ícone")).toBeInTheDocument();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com variant undefined", () => {
      render(
        <Badge variant={undefined} data-testid="badge">
          Undefined Variant
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-primary text-primary-foreground");
    });

    it("deve lidar com className undefined", () => {
      render(
        <Badge className={undefined} data-testid="badge">
          Undefined Class
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
    });

    it("deve lidar com className vazia", () => {
      render(
        <Badge className="" data-testid="badge">
          Empty Class
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
    });

    it("deve lidar com múltiplas classes", () => {
      render(
        <Badge className="class1 class2 class3" data-testid="badge">
          Multiple Classes
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("class1 class2 class3");
    });
  });

  describe("Acessibilidade", () => {
    it("deve ser focável quando interativo", () => {
      render(
        <Badge tabIndex={0} data-testid="badge">
          Focusable
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      badge.focus();
      expect(badge).toHaveFocus();
    });

    it("deve ter classes de foco adequadas", () => {
      render(<Badge data-testid="badge">Focus Test</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass(
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      );
    });

    it("deve suportar aria-label", () => {
      render(
        <Badge aria-label="Status: Ativo" data-testid="badge">
          Ativo
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("aria-label", "Status: Ativo");
    });

    it("deve suportar role personalizado", () => {
      render(
        <Badge role="status" data-testid="badge">
          Status
        </Badge>,
      );

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("role", "status");
    });
  });

  describe("Estilos e Layout", () => {
    it("deve ter display inline-flex", () => {
      render(<Badge data-testid="badge">Inline Flex</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("inline-flex");
    });

    it("deve ter items centralizados", () => {
      render(<Badge data-testid="badge">Centered</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("items-center");
    });

    it("deve ter bordas arredondadas", () => {
      render(<Badge data-testid="badge">Rounded</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("rounded-full");
    });

    it("deve ter padding adequado", () => {
      render(<Badge data-testid="badge">Padding</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("px-2.5 py-0.5");
    });

    it("deve ter tamanho de fonte pequeno", () => {
      render(<Badge data-testid="badge">Small Text</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("text-xs");
    });

    it("deve ter fonte semi-bold", () => {
      render(<Badge data-testid="badge">Semi Bold</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("font-semibold");
    });

    it("deve ter transições de cor", () => {
      render(<Badge data-testid="badge">Transitions</Badge>);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("transition-colors");
    });
  });

  describe("Múltiplos Badges", () => {
    it("deve renderizar múltiplos badges com variantes diferentes", () => {
      render(
        <div>
          <Badge data-testid="badge-1">Default</Badge>
          <Badge variant="secondary" data-testid="badge-2">
            Secondary
          </Badge>
          <Badge variant="destructive" data-testid="badge-3">
            Destructive
          </Badge>
          <Badge variant="outline" data-testid="badge-4">
            Outline
          </Badge>
        </div>,
      );

      expect(screen.getByTestId("badge-1")).toBeInTheDocument();
      expect(screen.getByTestId("badge-2")).toBeInTheDocument();
      expect(screen.getByTestId("badge-3")).toBeInTheDocument();
      expect(screen.getByTestId("badge-4")).toBeInTheDocument();
    });

    it("deve manter estilos independentes entre badges", () => {
      render(
        <div>
          <Badge variant="default" data-testid="badge-1">
            Default
          </Badge>
          <Badge variant="destructive" data-testid="badge-2">
            Destructive
          </Badge>
        </div>,
      );

      const badge1 = screen.getByTestId("badge-1");
      const badge2 = screen.getByTestId("badge-2");

      expect(badge1).toHaveClass("bg-primary");
      expect(badge2).toHaveClass("bg-destructive");
      expect(badge1).not.toHaveClass("bg-destructive");
      expect(badge2).not.toHaveClass("bg-primary");
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<Badge>Performance Test</Badge>);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(<Badge>Initial</Badge>);

      for (let i = 0; i < 100; i++) {
        rerender(<Badge>Render {i}</Badge>);
      }

      expect(screen.getByText("Render 99")).toBeInTheDocument();
    });
  });

  describe("Export do badgeVariants", () => {
    it("deve exportar badgeVariants", () => {
      expect(badgeVariants).toBeDefined();
      expect(typeof badgeVariants).toBe("function");
    });

    it("deve gerar classes corretas para variant default", () => {
      const classes = badgeVariants({ variant: "default" });
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
    });

    it("deve gerar classes corretas para variant secondary", () => {
      const classes = badgeVariants({ variant: "secondary" });
      expect(classes).toContain("bg-secondary");
      expect(classes).toContain("text-secondary-foreground");
    });

    it("deve gerar classes corretas para variant destructive", () => {
      const classes = badgeVariants({ variant: "destructive" });
      expect(classes).toContain("bg-destructive");
      expect(classes).toContain("text-destructive-foreground");
    });

    it("deve gerar classes corretas para variant outline", () => {
      const classes = badgeVariants({ variant: "outline" });
      expect(classes).toContain("text-foreground");
    });
  });
});
