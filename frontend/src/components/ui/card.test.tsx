import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Card Components", () => {
  describe("Card Component", () => {
    it("deve renderizar o Card com conteúdo", () => {
      render(
        <Card data-testid="card">
          <div>Conteúdo do card</div>
        </Card>,
      );

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByText("Conteúdo do card")).toBeInTheDocument();
    });

    it("deve renderizar como div", () => {
      render(<Card data-testid="card">Card</Card>);

      const card = screen.getByTestId("card");
      expect(card.tagName).toBe("DIV");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(<Card data-testid="card">Card</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
      );
    });

    it("deve aceitar className customizada", () => {
      render(
        <Card className="custom-card" data-testid="card">
          Card
        </Card>,
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("custom-card");
      expect(card).toHaveClass("rounded-lg border"); // classes padrão
    });

    it("deve encaminhar ref", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<Card ref={ref}>Card with Ref</Card>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("deve aceitar propriedades HTML", () => {
      render(
        <Card
          data-testid="card"
          id="custom-card"
          role="region"
          aria-label="Card personalizado"
        >
          Card
        </Card>,
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("id", "custom-card");
      expect(card).toHaveAttribute("role", "region");
      expect(card).toHaveAttribute("aria-label", "Card personalizado");
    });

    it("deve ter displayName correto", () => {
      expect(Card.displayName).toBe("Card");
    });
  });

  describe("CardHeader Component", () => {
    it("deve renderizar o CardHeader com conteúdo", () => {
      render(
        <CardHeader data-testid="card-header">
          <div>Header content</div>
        </CardHeader>,
      );

      expect(screen.getByTestId("card-header")).toBeInTheDocument();
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("deve renderizar como div", () => {
      render(<CardHeader data-testid="card-header">Header</CardHeader>);

      const header = screen.getByTestId("card-header");
      expect(header.tagName).toBe("DIV");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(<CardHeader data-testid="card-header">Header</CardHeader>);

      const header = screen.getByTestId("card-header");
      expect(header).toHaveClass("flex flex-col space-y-1.5 p-6");
    });

    it("deve aceitar className customizada", () => {
      render(
        <CardHeader className="custom-header" data-testid="card-header">
          Header
        </CardHeader>,
      );

      const header = screen.getByTestId("card-header");
      expect(header).toHaveClass("custom-header");
      expect(header).toHaveClass("flex flex-col"); // classes padrão
    });

    it("deve encaminhar ref", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<CardHeader ref={ref}>Header with Ref</CardHeader>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("deve ter displayName correto", () => {
      expect(CardHeader.displayName).toBe("CardHeader");
    });
  });

  describe("CardTitle Component", () => {
    it("deve renderizar o CardTitle com conteúdo", () => {
      render(<CardTitle data-testid="card-title">Título do Card</CardTitle>);

      expect(screen.getByTestId("card-title")).toBeInTheDocument();
      expect(screen.getByText("Título do Card")).toBeInTheDocument();
    });

    it("deve renderizar como h3", () => {
      render(<CardTitle data-testid="card-title">Title</CardTitle>);

      const title = screen.getByTestId("card-title");
      expect(title.tagName).toBe("H3");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(<CardTitle data-testid="card-title">Title</CardTitle>);

      const title = screen.getByTestId("card-title");
      expect(title).toHaveClass(
        "text-2xl font-semibold leading-none tracking-tight",
      );
    });

    it("deve aceitar className customizada", () => {
      render(
        <CardTitle className="custom-title" data-testid="card-title">
          Title
        </CardTitle>,
      );

      const title = screen.getByTestId("card-title");
      expect(title).toHaveClass("custom-title");
      expect(title).toHaveClass("text-2xl font-semibold"); // classes padrão
    });

    it("deve encaminhar ref", () => {
      const ref = React.createRef<HTMLParagraphElement>();

      render(<CardTitle ref={ref}>Title with Ref</CardTitle>);

      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
      expect(ref.current?.tagName).toBe("H3");
    });

    it("deve ter displayName correto", () => {
      expect(CardTitle.displayName).toBe("CardTitle");
    });
  });

  describe("CardDescription Component", () => {
    it("deve renderizar o CardDescription com conteúdo", () => {
      render(
        <CardDescription data-testid="card-description">
          Descrição do card
        </CardDescription>,
      );

      expect(screen.getByTestId("card-description")).toBeInTheDocument();
      expect(screen.getByText("Descrição do card")).toBeInTheDocument();
    });

    it("deve renderizar como p", () => {
      render(
        <CardDescription data-testid="card-description">
          Description
        </CardDescription>,
      );

      const description = screen.getByTestId("card-description");
      expect(description.tagName).toBe("P");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(
        <CardDescription data-testid="card-description">
          Description
        </CardDescription>,
      );

      const description = screen.getByTestId("card-description");
      expect(description).toHaveClass("text-sm text-muted-foreground");
    });

    it("deve aceitar className customizada", () => {
      render(
        <CardDescription className="custom-desc" data-testid="card-description">
          Description
        </CardDescription>,
      );

      const description = screen.getByTestId("card-description");
      expect(description).toHaveClass("custom-desc");
      expect(description).toHaveClass("text-sm text-muted-foreground"); // classes padrão
    });

    it("deve encaminhar ref", () => {
      const ref = React.createRef<HTMLParagraphElement>();

      render(<CardDescription ref={ref}>Description with Ref</CardDescription>);

      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
      expect(ref.current?.tagName).toBe("P");
    });

    it("deve ter displayName correto", () => {
      expect(CardDescription.displayName).toBe("CardDescription");
    });
  });

  describe("CardContent Component", () => {
    it("deve renderizar o CardContent com conteúdo", () => {
      render(
        <CardContent data-testid="card-content">
          <div>Conteúdo principal</div>
        </CardContent>,
      );

      expect(screen.getByTestId("card-content")).toBeInTheDocument();
      expect(screen.getByText("Conteúdo principal")).toBeInTheDocument();
    });

    it("deve renderizar como div", () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);

      const content = screen.getByTestId("card-content");
      expect(content.tagName).toBe("DIV");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);

      const content = screen.getByTestId("card-content");
      expect(content).toHaveClass("p-6 pt-0");
    });

    it("deve aceitar className customizada", () => {
      render(
        <CardContent className="custom-content" data-testid="card-content">
          Content
        </CardContent>,
      );

      const content = screen.getByTestId("card-content");
      expect(content).toHaveClass("custom-content");
      expect(content).toHaveClass("p-6 pt-0"); // classes padrão
    });

    it("deve encaminhar ref", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<CardContent ref={ref}>Content with Ref</CardContent>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("deve ter displayName correto", () => {
      expect(CardContent.displayName).toBe("CardContent");
    });
  });

  describe("CardFooter Component", () => {
    it("deve renderizar o CardFooter com conteúdo", () => {
      render(
        <CardFooter data-testid="card-footer">
          <button>Ação</button>
        </CardFooter>,
      );

      expect(screen.getByTestId("card-footer")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ação" })).toBeInTheDocument();
    });

    it("deve renderizar como div", () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);

      const footer = screen.getByTestId("card-footer");
      expect(footer.tagName).toBe("DIV");
    });

    it("deve aplicar classes CSS padrão", () => {
      render(<CardFooter data-testid="card-footer">Footer</CardFooter>);

      const footer = screen.getByTestId("card-footer");
      expect(footer).toHaveClass("flex items-center p-6 pt-0");
    });

    it("deve aceitar className customizada", () => {
      render(
        <CardFooter className="custom-footer" data-testid="card-footer">
          Footer
        </CardFooter>,
      );

      const footer = screen.getByTestId("card-footer");
      expect(footer).toHaveClass("custom-footer");
      expect(footer).toHaveClass("flex items-center"); // classes padrão
    });

    it("deve encaminhar ref", () => {
      const ref = React.createRef<HTMLDivElement>();

      render(<CardFooter ref={ref}>Footer with Ref</CardFooter>);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.tagName).toBe("DIV");
    });

    it("deve ter displayName correto", () => {
      expect(CardFooter.displayName).toBe("CardFooter");
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com className undefined em todos os componentes", () => {
      render(
        <Card className={undefined} data-testid="card">
          <CardHeader className={undefined} data-testid="header">
            <CardTitle className={undefined} data-testid="title">
              Title
            </CardTitle>
            <CardDescription className={undefined} data-testid="description">
              Description
            </CardDescription>
          </CardHeader>
          <CardContent className={undefined} data-testid="content">
            Content
          </CardContent>
          <CardFooter className={undefined} data-testid="footer">
            Footer
          </CardFooter>
        </Card>,
      );

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("title")).toBeInTheDocument();
      expect(screen.getByTestId("description")).toBeInTheDocument();
      expect(screen.getByTestId("content")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("deve renderizar componentes vazios", () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header"></CardHeader>
          <CardTitle data-testid="title"></CardTitle>
          <CardDescription data-testid="description"></CardDescription>
          <CardContent data-testid="content"></CardContent>
          <CardFooter data-testid="footer"></CardFooter>
        </Card>,
      );

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByTestId("header")).toBeEmptyDOMElement();
      expect(screen.getByTestId("title")).toBeEmptyDOMElement();
      expect(screen.getByTestId("description")).toBeEmptyDOMElement();
      expect(screen.getByTestId("content")).toBeEmptyDOMElement();
      expect(screen.getByTestId("footer")).toBeEmptyDOMElement();
    });

    it("deve aceitar múltiplas classes CSS", () => {
      render(
        <Card className="class1 class2 class3" data-testid="card">
          Card
        </Card>,
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("class1 class2 class3");
    });
  });

  describe("Integração dos Componentes", () => {
    it("deve renderizar um card completo", () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do card</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Este é o conteúdo principal do card.</p>
          </CardContent>
          <CardFooter>
            <button>Ação Principal</button>
            <button>Ação Secundária</button>
          </CardFooter>
        </Card>,
      );

      expect(screen.getByTestId("complete-card")).toBeInTheDocument();
      expect(screen.getByText("Título do Card")).toBeInTheDocument();
      expect(screen.getByText("Descrição do card")).toBeInTheDocument();
      expect(
        screen.getByText("Este é o conteúdo principal do card."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ação Principal" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Ação Secundária" }),
      ).toBeInTheDocument();
    });

    it("deve renderizar card apenas com título", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Apenas Título</CardTitle>
          </CardHeader>
        </Card>,
      );

      expect(screen.getByText("Apenas Título")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("deve renderizar card apenas com conteúdo", () => {
      render(
        <Card>
          <CardContent>
            <p>Apenas conteúdo</p>
          </CardContent>
        </Card>,
      );

      expect(screen.getByText("Apenas conteúdo")).toBeInTheDocument();
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("deve renderizar múltiplos cards", () => {
      render(
        <div>
          <Card data-testid="card-1">
            <CardTitle>Card 1</CardTitle>
          </Card>
          <Card data-testid="card-2">
            <CardTitle>Card 2</CardTitle>
          </Card>
          <Card data-testid="card-3">
            <CardTitle>Card 3</CardTitle>
          </Card>
        </div>,
      );

      expect(screen.getByTestId("card-1")).toBeInTheDocument();
      expect(screen.getByTestId("card-2")).toBeInTheDocument();
      expect(screen.getByTestId("card-3")).toBeInTheDocument();
      expect(screen.getByText("Card 1")).toBeInTheDocument();
      expect(screen.getByText("Card 2")).toBeInTheDocument();
      expect(screen.getByText("Card 3")).toBeInTheDocument();
    });
  });

  describe("Acessibilidade", () => {
    it("deve suportar atributos ARIA", () => {
      render(
        <Card
          role="region"
          aria-labelledby="card-title"
          aria-describedby="card-desc"
          data-testid="card"
        >
          <CardTitle id="card-title">Título Acessível</CardTitle>
          <CardDescription id="card-desc">Descrição acessível</CardDescription>
        </Card>,
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveAttribute("role", "region");
      expect(card).toHaveAttribute("aria-labelledby", "card-title");
      expect(card).toHaveAttribute("aria-describedby", "card-desc");
    });

    it("deve manter hierarquia semântica", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Título Principal</CardTitle>
            <CardDescription>Subtítulo</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Conteúdo</p>
          </CardContent>
        </Card>,
      );

      const title = screen.getByText("Título Principal");
      const description = screen.getByText("Subtítulo");
      const content = screen.getByText("Conteúdo");

      expect(title.tagName).toBe("H3");
      expect(description.tagName).toBe("P");
      expect(content.tagName).toBe("P");
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(
        <Card>
          <CardHeader>
            <CardTitle>Performance Test</CardTitle>
            <CardDescription>Testing render speed</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content for performance testing</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>,
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(
        <Card>
          <CardTitle>Initial Title</CardTitle>
        </Card>,
      );

      for (let i = 0; i < 100; i++) {
        rerender(
          <Card>
            <CardTitle>Title {i}</CardTitle>
          </Card>,
        );
      }

      expect(screen.getByText("Title 99")).toBeInTheDocument();
    });
  });
});
