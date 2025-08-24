import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingSpinner, LoadingState } from "./LoadingState";

describe("LoadingSpinner", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar com props padrão", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass(
        "h-8 w-8 rounded-full border-b-2 border-indigo-600",
      );
    });

    it("deve aplicar className customizada", () => {
      render(<LoadingSpinner className="custom-class" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("custom-class");
    });

    it("deve ter estrutura HTML correta", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner?.tagName).toBe("DIV");
      expect(spinner).toHaveClass("rounded-full border-b-2 border-indigo-600");
    });
  });

  describe("Tamanhos", () => {
    it("deve renderizar tamanho small", () => {
      render(<LoadingSpinner size="sm" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-4 w-4");
      expect(spinner).not.toHaveClass("h-8 w-8 h-12 w-12");
    });

    it("deve renderizar tamanho medium (padrão)", () => {
      render(<LoadingSpinner size="md" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-8 w-8");
      expect(spinner).not.toHaveClass("h-4 w-4 h-12 w-12");
    });

    it("deve renderizar tamanho large", () => {
      render(<LoadingSpinner size="lg" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-12 w-12");
      expect(spinner).not.toHaveClass("h-4 w-4 h-8 w-8");
    });

    it("deve usar tamanho medium como padrão quando não especificado", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-8 w-8");
    });
  });

  describe("Estilos e Animação", () => {
    it("deve ter classe de animação spin", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("animate-spin");
    });

    it("deve ter bordas e cores corretas", () => {
      render(<LoadingSpinner />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("border-b-2 border-indigo-600 rounded-full");
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(<LoadingSpinner className="my-4 mx-auto" size="lg" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass(
        "animate-spin rounded-full border-b-2 border-indigo-600 h-12 w-12 my-4 mx-auto",
      );
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com className vazia", () => {
      render(<LoadingSpinner className="" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("h-8 w-8");
    });

    it("deve lidar com className undefined", () => {
      render(<LoadingSpinner className={undefined} />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("h-8 w-8");
    });

    it("deve lidar com size undefined", () => {
      render(<LoadingSpinner size={undefined} />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-8 w-8"); // Deve usar padrão md
    });
  });
});

describe("LoadingState", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar com props padrão", () => {
      const { container } = render(<LoadingState />);

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("deve renderizar mensagem customizada", () => {
      render(<LoadingState message="Processando dados..." />);

      expect(screen.getByText("Processando dados...")).toBeInTheDocument();
      expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    });

    it("deve renderizar sem mensagem quando message é vazia", () => {
      const { container } = render(<LoadingState message="" />);

      expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("deve renderizar sem mensagem quando message é null", () => {
      render(<LoadingState message={null as any} />);

      expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("deve ter estrutura HTML correta", () => {
      const { container } = render(<LoadingState />);


      const innerContainer = container.querySelector('.flex.flex-col.items-center.space-y-2');
      expect(innerContainer).toBeInTheDocument();
      expect(innerContainer).toHaveClass("flex flex-col items-center space-y-2");
    });
  });

  describe("Modo FullScreen", () => {
    it("deve renderizar em modo normal por padrão", () => {
      const { container } = render(<LoadingState />);

      const outerContainer = container.querySelector('.flex.justify-center.items-center.p-4');
      expect(outerContainer).toHaveClass("flex justify-center items-center p-4");
      expect(outerContainer).not.toHaveClass("fixed inset-0 bg-gray-100 z-50");
    });

    it("deve renderizar em modo fullscreen quando especificado", () => {
      const { container } = render(<LoadingState fullScreen={true} />);

      const outerContainer = container.querySelector('.fixed.inset-0.flex.justify-center.items-center.bg-gray-100.z-50');
      expect(outerContainer).toHaveClass(
        "fixed inset-0 flex justify-center items-center bg-gray-100 z-50",
      );
      expect(outerContainer).not.toHaveClass("p-4");
    });

    it("deve aplicar z-index alto em modo fullscreen", () => {
      const { container } = render(<LoadingState fullScreen={true} />);

      const outerContainer = container.querySelector('.z-50');
      expect(outerContainer).toHaveClass("z-50");
    });

    it("deve cobrir toda a tela em modo fullscreen", () => {
      const { container } = render(<LoadingState fullScreen={true} />);

      const outerContainer = container.querySelector('.fixed.inset-0');
      expect(outerContainer).toHaveClass("fixed inset-0");
    });
  });

  describe("Tamanhos do Spinner", () => {
    it("deve usar tamanho medium por padrão", () => {
      const { container } = render(<LoadingState />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-8 w-8");
    });

    it("deve passar tamanho small para o spinner", () => {
      render(<LoadingState size="sm" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-4 w-4");
    });

    it("deve passar tamanho large para o spinner", () => {
      render(<LoadingState size="lg" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-12 w-12");
    });
  });

  describe("Layout e Estilos", () => {
    it("deve ter layout flexbox vertical", () => {
      const { container } = render(<LoadingState />);


      const innerContainer = container.querySelector('.flex.flex-col.items-center.space-y-2');
      expect(innerContainer).toHaveClass(
        "flex flex-col items-center space-y-2",
      );
    });

    it("deve centralizar conteúdo", () => {
      const { container } = render(<LoadingState />);

      const outerContainer = container.querySelector('.flex.justify-center.items-center');
      expect(outerContainer).toHaveClass("flex justify-center items-center");
    });

    it("deve ter espaçamento entre spinner e mensagem", () => {
      const { container } = render(<LoadingState />);


      const innerContainer = container.querySelector('.flex.flex-col.items-center.space-y-2');
      expect(innerContainer).toHaveClass("space-y-2");
    });

    it("deve aplicar padding em modo normal", () => {
      const { container } = render(<LoadingState />);

      const outerContainer = container.querySelector('.p-4');
      expect(outerContainer).toHaveClass("p-4");
    });

    it("deve aplicar background em modo fullscreen", () => {
      const { container } = render(<LoadingState fullScreen={true} />);

      const outerContainer = container.querySelector('.bg-gray-100');
      expect(outerContainer).toHaveClass("bg-gray-100");
    });
  });

  describe("Mensagem de Loading", () => {
    it("deve aplicar estilos corretos na mensagem", () => {
      const { container } = render(<LoadingState />);

      const message = screen.getByText("Carregando...");
      expect(message.tagName).toBe("SPAN");
      expect(message).toHaveClass("text-gray-600 text-sm");
    });

    it("deve renderizar mensagens longas", () => {
      const longMessage =
        "Esta é uma mensagem muito longa para testar se o componente consegue lidar com textos extensos sem quebrar o layout";
      render(<LoadingState message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
      expect(screen.getByText(longMessage)).toHaveClass(
        "text-gray-600 text-sm",
      );
    });

    it("deve renderizar mensagens com caracteres especiais", () => {
      const specialMessage = "Carregando... 50% ✓ Processando dados! @#$%";
      render(<LoadingState message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it("deve renderizar mensagens com quebras de linha", () => {
      const multilineMessage = "Primeira linha\nSegunda linha";
      render(<LoadingState message={multilineMessage} />);

      expect(screen.getByText(multilineMessage)).toBeInTheDocument();
    });
  });

  describe("Combinações de Props", () => {
    it("deve combinar fullscreen com tamanho large", () => {
      const { container } = render(<LoadingState fullScreen={true} size="lg" />);

      const outerContainer = container.querySelector('.fixed.inset-0.z-50');
      expect(outerContainer).toHaveClass("fixed inset-0 z-50");

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-12 w-12");
    });

    it("deve combinar mensagem customizada com tamanho small", () => {
      render(<LoadingState message="Aguarde..." size="sm" />);

      expect(screen.getByText("Aguarde...")).toBeInTheDocument();
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-4 w-4");
    });

    it("deve combinar todas as props", () => {
      const { container } = render(
        <LoadingState fullScreen={true} message="Processando..." size="lg" />,
      );

      const outerContainer = container.querySelector('.fixed.inset-0.bg-gray-100.z-50');
      expect(outerContainer).toHaveClass("fixed inset-0 bg-gray-100 z-50");

      expect(screen.getByText("Processando...")).toBeInTheDocument();

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-12 w-12");
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com props undefined", () => {
      render(
        <LoadingState
          fullScreen={undefined}
          message={undefined}
          size={undefined}
        />,
      );

      expect(screen.getByText("Carregando...")).toBeInTheDocument();
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-8 w-8");
    });

    it("deve lidar com fullScreen false explícito", () => {
      const { container } = render(<LoadingState fullScreen={false} />);

      const outerContainer = container.querySelector('.p-4');
      expect(outerContainer).toHaveClass("p-4");
      expect(outerContainer).not.toHaveClass("fixed inset-0");
    });

    it("deve renderizar apenas spinner quando message é string vazia", () => {
      const { container } = render(<LoadingState message="" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();

      const messageSpan = container.querySelector("span");
      expect(messageSpan).not.toBeInTheDocument();
    });

    it("deve manter layout mesmo sem mensagem", () => {
      const { container } = render(<LoadingState message="" />);

      const innerContainer = container.querySelector(
        ".flex.flex-col.items-center.space-y-2",
      );
      expect(innerContainer).toBeInTheDocument();
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter estrutura semântica adequada", () => {
      const { container } = render(<LoadingState />);

      const message = screen.getByText("Carregando...");
      expect(message.tagName).toBe("SPAN");
    });

    it("deve ser legível com contraste adequado", () => {
      const { container } = render(<LoadingState />);

      const message = screen.getByText("Carregando...");
      expect(message).toHaveClass("text-gray-600"); // Cor com bom contraste
    });

    it("deve manter foco visível em modo fullscreen", () => {
      const { container } = render(<LoadingState fullScreen={true} />);

      const outerContainer = container.querySelector('.z-50');
      expect(outerContainer).toHaveClass("z-50"); // Alto z-index para visibilidade
    });
  });

  describe("Integração com LoadingSpinner", () => {
    it("deve renderizar LoadingSpinner internamente", () => {
      const { container } = render(<LoadingState />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("rounded-full border-b-2 border-indigo-600");
    });

    it("deve passar props de tamanho para LoadingSpinner", () => {
      render(<LoadingState size="sm" />);

      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass("h-4 w-4");
    });

    it("deve manter consistência visual entre componentes", () => {
      const { rerender } = render(<LoadingSpinner size="lg" />);

      rerender(<LoadingState size="lg" />);
      const integratedSpinner = screen.getByTestId("loading-spinner");

      // Deve ter as mesmas classes básicas
      expect(integratedSpinner).toHaveClass(
        "h-12 w-12 animate-spin rounded-full",
      );
    });
  });
});
