import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Alert, AlertTitle, AlertDescription } from "./alert";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Alert Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Alert com conteúdo", () => {
      render(
        <Alert>
          <AlertTitle>Título do Alerta</AlertTitle>
          <AlertDescription>Descrição do alerta</AlertDescription>
        </Alert>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Título do Alerta")).toBeInTheDocument();
      expect(screen.getByText("Descrição do alerta")).toBeInTheDocument();
    });

    it("deve renderizar apenas o Alert sem título e descrição", () => {
      render(<Alert>Conteúdo simples</Alert>);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Conteúdo simples")).toBeInTheDocument();
    });

    it("deve renderizar apenas com AlertTitle", () => {
      render(
        <Alert>
          <AlertTitle>Apenas título</AlertTitle>
        </Alert>,
      );

      expect(screen.getByText("Apenas título")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("deve renderizar apenas com AlertDescription", () => {
      render(
        <Alert>
          <AlertDescription>Apenas descrição</AlertDescription>
        </Alert>,
      );

      expect(screen.getByText("Apenas descrição")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Variantes do Alert", () => {
    it("deve aplicar a variante default por padrão", () => {
      render(<Alert data-testid="alert">Conteúdo</Alert>);

      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("bg-background text-foreground");
    });

    it("deve aplicar a variante destructive", () => {
      render(
        <Alert variant="destructive" data-testid="alert">
          Erro crítico
        </Alert>,
      );

      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("border-destructive/50 text-destructive");
    });

    it("deve aplicar classes base em todas as variantes", () => {
      render(<Alert data-testid="alert">Conteúdo</Alert>);

      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("relative w-full rounded-lg border p-4");
    });
  });

  describe("Classes CSS Customizadas", () => {
    it("deve aceitar className customizada no Alert", () => {
      render(
        <Alert className="custom-alert" data-testid="alert">
          Conteúdo
        </Alert>,
      );

      const alert = screen.getByTestId("alert");
      expect(alert).toHaveClass("custom-alert");
    });

    it("deve aceitar className customizada no AlertTitle", () => {
      render(
        <Alert>
          <AlertTitle className="custom-title" data-testid="title">
            Título
          </AlertTitle>
        </Alert>,
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveClass("custom-title");
    });

    it("deve aceitar className customizada no AlertDescription", () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc" data-testid="desc">
            Descrição
          </AlertDescription>
        </Alert>,
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("custom-desc");
    });
  });

  describe("Estrutura HTML e Semântica", () => {
    it('deve renderizar Alert como div com role="alert"', () => {
      render(<Alert data-testid="alert">Conteúdo</Alert>);

      const alert = screen.getByTestId("alert");
      expect(alert.tagName).toBe("DIV");
      expect(alert).toHaveAttribute("role", "alert");
    });

    it("deve renderizar AlertTitle como h5", () => {
      render(
        <Alert>
          <AlertTitle data-testid="title">Título</AlertTitle>
        </Alert>,
      );

      const title = screen.getByTestId("title");
      expect(title.tagName).toBe("H5");
    });

    it("deve renderizar AlertDescription como div", () => {
      render(
        <Alert>
          <AlertDescription data-testid="desc">Descrição</AlertDescription>
        </Alert>,
      );

      const desc = screen.getByTestId("desc");
      expect(desc.tagName).toBe("DIV");
    });
  });

  describe("Classes CSS Padrão", () => {
    it("deve aplicar classes padrão no AlertTitle", () => {
      render(
        <Alert>
          <AlertTitle data-testid="title">Título</AlertTitle>
        </Alert>,
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveClass("mb-1 font-medium leading-none tracking-tight");
    });

    it("deve aplicar classes padrão no AlertDescription", () => {
      render(
        <Alert>
          <AlertDescription data-testid="desc">Descrição</AlertDescription>
        </Alert>,
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-sm [&_p]:leading-relaxed");
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para o Alert", () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Alert ref={ref}>Conteúdo</Alert>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveAttribute("role", "alert");
    });

    it("deve encaminhar ref para o AlertTitle", () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Alert>
          <AlertTitle ref={ref}>Título</AlertTitle>
        </Alert>,
      );

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });

    it("deve encaminhar ref para o AlertDescription", () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Alert>
          <AlertDescription ref={ref}>Descrição</AlertDescription>
        </Alert>,
      );

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar propriedades HTML no Alert", () => {
      render(
        <Alert
          data-testid="alert"
          id="custom-alert"
          aria-label="Alerta personalizado"
        >
          Conteúdo
        </Alert>,
      );

      const alert = screen.getByTestId("alert");
      expect(alert).toHaveAttribute("id", "custom-alert");
      expect(alert).toHaveAttribute("aria-label", "Alerta personalizado");
    });

    it("deve aceitar propriedades HTML no AlertTitle", () => {
      render(
        <Alert>
          <AlertTitle data-testid="title" id="custom-title" aria-level={2}>
            Título
          </AlertTitle>
        </Alert>,
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveAttribute("id", "custom-title");
      expect(title).toHaveAttribute("aria-level", "2");
    });

    it("deve aceitar propriedades HTML no AlertDescription", () => {
      render(
        <Alert>
          <AlertDescription
            data-testid="desc"
            id="custom-desc"
            aria-describedby="helper"
          >
            Descrição
          </AlertDescription>
        </Alert>,
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveAttribute("id", "custom-desc");
      expect(desc).toHaveAttribute("aria-describedby", "helper");
    });
  });

  describe("Casos de Borda", () => {
    it("deve renderizar com conteúdo vazio", () => {
      render(<Alert data-testid="alert"></Alert>);

      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it("deve renderizar AlertTitle com conteúdo vazio", () => {
      render(
        <Alert>
          <AlertTitle data-testid="title"></AlertTitle>
        </Alert>,
      );

      const title = screen.getByTestId("title");
      expect(title).toBeInTheDocument();
      expect(title).toBeEmptyDOMElement();
    });

    it("deve renderizar AlertDescription com conteúdo vazio", () => {
      render(
        <Alert>
          <AlertDescription data-testid="desc"></AlertDescription>
        </Alert>,
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toBeInTheDocument();
      expect(desc).toBeEmptyDOMElement();
    });

    it("deve lidar com className undefined", () => {
      render(
        <Alert className={undefined} data-testid="alert">
          Conteúdo
        </Alert>,
      );

      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
    });

    it("deve lidar com variant undefined", () => {
      render(
        <Alert variant={undefined} data-testid="alert">
          Conteúdo
        </Alert>,
      );

      const alert = screen.getByTestId("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("bg-background text-foreground");
    });
  });

  describe("Acessibilidade", () => {
    it('deve ter role="alert" para leitores de tela', () => {
      render(<Alert>Mensagem importante</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("deve ser anunciado por leitores de tela", () => {
      render(<Alert>Erro: Falha na operação</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Erro: Falha na operação");
    });

    it("deve manter hierarquia semântica com AlertTitle como h5", () => {
      render(
        <Alert>
          <AlertTitle>Título do Alerta</AlertTitle>
          <AlertDescription>Descrição detalhada</AlertDescription>
        </Alert>,
      );

      const title = screen.getByRole("heading", { level: 5 });
      expect(title).toHaveTextContent("Título do Alerta");
    });
  });

  describe("Integração de Componentes", () => {
    it("deve renderizar Alert completo com título e descrição", () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Erro Crítico</AlertTitle>
          <AlertDescription>
            Ocorreu um erro inesperado. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>,
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 5 })).toHaveTextContent(
        "Erro Crítico",
      );
      expect(
        screen.getByText(/Ocorreu um erro inesperado/),
      ).toBeInTheDocument();
    });

    it("deve renderizar múltiplos Alerts", () => {
      render(
        <div>
          <Alert data-testid="alert-1">
            <AlertTitle>Primeiro Alerta</AlertTitle>
          </Alert>
          <Alert data-testid="alert-2" variant="destructive">
            <AlertTitle>Segundo Alerta</AlertTitle>
          </Alert>
        </div>,
      );

      expect(screen.getByTestId("alert-1")).toBeInTheDocument();
      expect(screen.getByTestId("alert-2")).toBeInTheDocument();
      expect(screen.getAllByRole("alert")).toHaveLength(2);
    });
  });

  describe("Display Names", () => {
    it("deve ter displayName correto para Alert", () => {
      expect(Alert.displayName).toBe("Alert");
    });

    it("deve ter displayName correto para AlertTitle", () => {
      expect(AlertTitle.displayName).toBe("AlertTitle");
    });

    it("deve ter displayName correto para AlertDescription", () => {
      expect(AlertDescription.displayName).toBe("AlertDescription");
    });
  });
});
