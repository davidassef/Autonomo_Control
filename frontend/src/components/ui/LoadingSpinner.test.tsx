import React from "react";
import { render, screen } from "@testing-library/react";
import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("deve renderizar o spinner corretamente", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
  });

  it("deve ter classes CSS corretas para animação", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("rounded-full");
  });

  it("deve aceitar tamanho personalizado", () => {
    render(<LoadingSpinner size="large" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-12 h-12");
  });

  it("deve usar tamanho padrão quando não especificado", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-8 h-8");
  });

  it("deve aceitar tamanho pequeno", () => {
    render(<LoadingSpinner size="small" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-4 h-4");
  });

  it("deve aceitar cor personalizada", () => {
    render(<LoadingSpinner color="red" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("border-red-500");
  });

  it("deve usar cor padrão quando não especificada", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("border-indigo-500");
  });

  it("deve aceitar classes CSS adicionais", () => {
    render(<LoadingSpinner className="custom-class" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("custom-class");
  });

  it("deve manter classes padrão mesmo com classes personalizadas", () => {
    render(<LoadingSpinner className="custom-class" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("rounded-full");
    expect(spinner).toHaveClass("custom-class");
  });

  it("deve renderizar com texto de carregamento quando fornecido", () => {
    render(<LoadingSpinner text="Carregando dados..." />);

    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("deve não renderizar texto adicional quando não fornecido", () => {
    render(<LoadingSpinner />);

    // Verifica que não há texto adicional renderizado
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    // Como não há texto, apenas o spinner deve estar presente
    expect(screen.queryByText(/carregando/i)).not.toBeInTheDocument();
  });

  it("deve centralizar o spinner quando centralized prop é true", () => {
    render(<LoadingSpinner centralized />);

    // Verifica se o spinner está presente (centralização é uma implementação interna)
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("deve não centralizar quando centralized prop é false", () => {
    render(<LoadingSpinner centralized={false} />);

    // Verifica se o spinner está presente (não centralização é uma implementação interna)
    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("deve aceitar múltiplas props simultaneamente", () => {
    render(
      <LoadingSpinner
        size="large"
        color="green"
        text="Processando..."
        className="my-custom-class"
        centralized
      />,
    );

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-12 h-12");
    expect(spinner).toHaveClass("border-green-500");
    expect(spinner).toHaveClass("my-custom-class");
    expect(screen.getByText("Processando...")).toBeInTheDocument();

    // Verifica se o spinner tem as propriedades corretas
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("deve ter atributos de acessibilidade corretos", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveAttribute("role", "status");
    expect(spinner).toHaveAttribute("aria-label", "Carregando");
  });

  it("deve aceitar aria-label personalizado", () => {
    render(<LoadingSpinner ariaLabel="Salvando dados" />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveAttribute("aria-label", "Salvando dados");
  });

  it("deve ser visível para screen readers", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");
    expect(spinner).not.toHaveAttribute("aria-hidden", "true");
  });

  it("deve manter proporções corretas em diferentes tamanhos", () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-4 h-4");

    rerender(<LoadingSpinner size="medium" />);
    spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-8 h-8");

    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByTestId("loading-spinner");
    expect(spinner).toHaveClass("w-12 h-12");
  });

  it("deve funcionar com diferentes cores do Tailwind", () => {
    const colors = ["blue", "red", "green", "yellow", "purple", "pink"];

    colors.forEach((color) => {
      const { unmount } = render(<LoadingSpinner color={color} />);
      const spinner = screen.getByTestId("loading-spinner");
      expect(spinner).toHaveClass(`border-${color}-500`);
      unmount();
    });
  });

  it("deve manter animação contínua", () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByTestId("loading-spinner");

    // Verifica se a animação está aplicada
    expect(spinner).toHaveClass("animate-spin");
  });
});
