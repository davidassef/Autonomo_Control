import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "./input";

// Mock do cn utility
jest.mock("../../lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("Input Component", () => {
  describe("Renderização Básica", () => {
    it("deve renderizar o Input", () => {
      render(<Input data-testid="input" />);

      expect(screen.getByTestId("input")).toBeInTheDocument();
    });

    it("deve renderizar como input", () => {
      render(<Input data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input.tagName).toBe("INPUT");
    });

    it("deve ter type text por padrão", () => {
      render(<Input data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "text");
    });
  });

  describe("Classes CSS", () => {
    it("deve aplicar classes CSS padrão", () => {
      render(<Input data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveClass(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      );
    });

    it("deve aceitar className customizada", () => {
      render(<Input className="custom-input" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveClass("custom-input");
      expect(input).toHaveClass("flex h-10 w-full"); // classes padrão
    });

    it("deve combinar className customizada com classes padrão", () => {
      render(
        <Input className="border-red-500 bg-red-50" data-testid="input" />,
      );

      const input = screen.getByTestId("input");
      expect(input).toHaveClass("border-red-500 bg-red-50");
      expect(input).toHaveClass("flex rounded-md"); // classes padrão
    });
  });

  describe("Tipos de Input", () => {
    it("deve aceitar type text", () => {
      render(<Input type="text" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "text");
    });

    it("deve aceitar type password", () => {
      render(<Input type="password" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "password");
    });

    it("deve aceitar type email", () => {
      render(<Input type="email" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "email");
    });

    it("deve aceitar type number", () => {
      render(<Input type="number" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "number");
    });

    it("deve aceitar type tel", () => {
      render(<Input type="tel" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "tel");
    });

    it("deve aceitar type url", () => {
      render(<Input type="url" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "url");
    });

    it("deve aceitar type search", () => {
      render(<Input type="search" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "search");
    });

    it("deve aceitar type date", () => {
      render(<Input type="date" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "date");
    });

    it("deve aceitar type file", () => {
      render(<Input type="file" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "file");
    });
  });

  describe("Propriedades HTML", () => {
    it("deve aceitar placeholder", () => {
      render(<Input placeholder="Digite seu nome" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("placeholder", "Digite seu nome");
    });

    it("deve aceitar value", () => {
      render(<Input value="Valor inicial" data-testid="input" readOnly />);

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Valor inicial");
    });

    it("deve aceitar defaultValue", () => {
      render(<Input defaultValue="Valor padrão" data-testid="input" />);

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Valor padrão");
    });

    it("deve aceitar name", () => {
      render(<Input name="username" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("name", "username");
    });

    it("deve aceitar id", () => {
      render(<Input id="user-input" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("id", "user-input");
    });

    it("deve aceitar required", () => {
      render(<Input required data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toBeRequired();
    });

    it("deve aceitar disabled", () => {
      render(<Input disabled data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toBeDisabled();
    });

    it("deve aceitar readOnly", () => {
      render(<Input readOnly data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("readOnly");
    });

    it("deve aceitar maxLength", () => {
      render(<Input maxLength={10} data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("maxLength", "10");
    });

    it("deve aceitar minLength", () => {
      render(<Input minLength={3} data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("minLength", "3");
    });

    it("deve aceitar min e max para type number", () => {
      render(<Input type="number" min={0} max={100} data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "100");
    });

    it("deve aceitar step para type number", () => {
      render(<Input type="number" step={0.1} data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("step", "0.1");
    });

    it("deve aceitar pattern", () => {
      render(
        <Input pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" data-testid="input" />,
      );

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("pattern", "[0-9]{3}-[0-9]{3}-[0-9]{4}");
    });

    it("deve aceitar autoComplete", () => {
      render(<Input autoComplete="email" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("autoComplete", "email");
    });

    it("deve aceitar autoFocus", () => {
      render(<Input autoFocus data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("autoFocus");
    });
  });

  describe("Atributos ARIA", () => {
    it("deve aceitar aria-label", () => {
      render(<Input aria-label="Nome do usuário" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("aria-label", "Nome do usuário");
    });

    it("deve aceitar aria-describedby", () => {
      render(<Input aria-describedby="help-text" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("aria-describedby", "help-text");
    });

    it("deve aceitar aria-invalid", () => {
      render(<Input aria-invalid="true" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("deve aceitar aria-required", () => {
      render(<Input aria-required="true" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("aria-required", "true");
    });
  });

  describe("Event Handlers", () => {
    it("deve chamar onChange quando o valor muda", () => {
      const handleChange = jest.fn();

      render(<Input onChange={handleChange} data-testid="input" />);

      const input = screen.getByTestId("input");
      fireEvent.change(input, { target: { value: "novo valor" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: "novo valor" }),
        }),
      );
    });

    it("deve chamar onFocus quando focado", () => {
      const handleFocus = jest.fn();

      render(<Input onFocus={handleFocus} data-testid="input" />);

      const input = screen.getByTestId("input");
      fireEvent.focus(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onBlur quando perde o foco", () => {
      const handleBlur = jest.fn();

      render(<Input onBlur={handleBlur} data-testid="input" />);

      const input = screen.getByTestId("input");
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onKeyDown quando tecla é pressionada", () => {
      const handleKeyDown = jest.fn();

      render(<Input onKeyDown={handleKeyDown} data-testid="input" />);

      const input = screen.getByTestId("input");
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({
          key: "Enter",
          code: "Enter",
        }),
      );
    });

    it("deve chamar onKeyUp quando tecla é solta", () => {
      const handleKeyUp = jest.fn();

      render(<Input onKeyUp={handleKeyUp} data-testid="input" />);

      const input = screen.getByTestId("input");
      fireEvent.keyUp(input, { key: "a", code: "KeyA" });

      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onClick quando clicado", () => {
      const handleClick = jest.fn();

      render(<Input onClick={handleClick} data-testid="input" />);

      const input = screen.getByTestId("input");
      fireEvent.click(input);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar eventos quando desabilitado", () => {
      const handleChange = jest.fn();
      const handleClick = jest.fn();

      render(
        <Input
          disabled
          onChange={handleChange}
          onClick={handleClick}
          data-testid="input"
        />,
      );

      const input = screen.getByTestId("input");
      fireEvent.click(input);
      fireEvent.change(input, { target: { value: "test" } });

      expect(handleClick).not.toHaveBeenCalled();
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("ForwardRef", () => {
    it("deve encaminhar ref para o input", () => {
      const ref = React.createRef<HTMLInputElement>();

      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe("INPUT");
    });

    it("deve permitir acesso aos métodos do input via ref", () => {
      const ref = React.createRef<HTMLInputElement>();

      render(<Input ref={ref} />);

      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.select).toBeDefined();
    });

    it("deve permitir definir valor via ref", () => {
      const ref = React.createRef<HTMLInputElement>();

      render(<Input ref={ref} />);

      // Garantir que o ref foi definido
      expect(ref.current).not.toBeNull();
      
      ref.current!.value = "valor via ref";
      expect(ref.current!.value).toBe("valor via ref");
    });
  });

  describe("Estados do Input", () => {
    it("deve mostrar estado normal por padrão", () => {
      render(<Input data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toBeEnabled();
      expect(input).not.toHaveAttribute("readOnly");
    });

    it("deve mostrar estado desabilitado", () => {
      render(<Input disabled data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toBeDisabled();
      expect(input).toHaveClass(
        "disabled:cursor-not-allowed disabled:opacity-50",
      );
    });

    it("deve mostrar estado somente leitura", () => {
      render(<Input readOnly value="Somente leitura" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("readOnly");
      expect(input).toHaveDisplayValue("Somente leitura");
    });

    it("deve mostrar estado obrigatório", () => {
      render(<Input required data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toBeRequired();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com type undefined", () => {
      render(<Input type={undefined} data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("type", "text"); // padrão do HTML
    });

    it("deve lidar com className undefined", () => {
      render(<Input className={undefined} data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass("flex h-10"); // classes padrão
    });

    it("deve lidar com value vazio", () => {
      render(<Input value="" data-testid="input" readOnly />);

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("deve lidar com placeholder vazio", () => {
      render(<Input placeholder="" data-testid="input" />);

      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("placeholder", "");
    });

    it("deve lidar com múltiplas classes CSS", () => {
      render(
        <Input
          className="class1 class2 class3 border-red-500"
          data-testid="input"
        />,
      );

      const input = screen.getByTestId("input");
      expect(input).toHaveClass("class1 class2 class3 border-red-500");
    });
  });

  describe("Interação do Usuário", () => {
    it("deve permitir digitação", () => {
      render(<Input data-testid="input" />);

      const input = screen.getByTestId("input") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "texto digitado" } });
      expect(input.value).toBe("texto digitado");
    });

    it("deve permitir seleção de texto", () => {
      render(<Input defaultValue="texto selecionável" data-testid="input" />);

      const input = screen.getByTestId("input") as HTMLInputElement;

      fireEvent.focus(input);
      input.setSelectionRange(0, 5); // seleciona "texto"

      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(5);
    });

    it("deve permitir navegação com teclado", () => {
      render(<Input defaultValue="navegação" data-testid="input" />);

      const input = screen.getByTestId("input");

      fireEvent.keyDown(input, { key: "ArrowLeft" });
      fireEvent.keyDown(input, { key: "ArrowRight" });
      fireEvent.keyDown(input, { key: "Home" });
      fireEvent.keyDown(input, { key: "End" });

      // Testa se os eventos foram disparados sem erro
      expect(input).toBeInTheDocument();
    });
  });

  describe("Validação HTML5", () => {
    it("deve validar email", () => {
      render(<Input type="email" data-testid="input" />);

      const input = screen.getByTestId("input") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "email-inválido" } });
      expect(input.validity.valid).toBe(false);

      fireEvent.change(input, { target: { value: "email@valido.com" } });
      expect(input.validity.valid).toBe(true);
    });

    it("deve validar required", () => {
      render(<Input required data-testid="input" />);

      const input = screen.getByTestId("input") as HTMLInputElement;

      expect(input.validity.valid).toBe(false); // vazio e obrigatório

      fireEvent.change(input, { target: { value: "preenchido" } });
      expect(input.validity.valid).toBe(true);
    });

    it("deve validar maxLength", () => {
      render(<Input maxLength={5} data-testid="input" />);

      const input = screen.getByTestId("input") as HTMLInputElement;

      fireEvent.change(input, { target: { value: "12345" } });
      expect(input.validity.valid).toBe(true);

      fireEvent.change(input, { target: { value: "123456" } });
      expect(input.value).toBe("12345"); // truncado pelo navegador
    });
  });

  describe("Display Name", () => {
    it("deve ter displayName correto", () => {
      expect(Input.displayName).toBe("Input");
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<Input placeholder="Performance test" />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(50); // menos de 50ms
    });

    it("deve lidar com re-renders frequentes", () => {
      const { rerender } = render(<Input value="initial" readOnly />);

      for (let i = 0; i < 100; i++) {
        rerender(<Input value={`value-${i}`} readOnly />);
      }

      expect(screen.getByDisplayValue("value-99")).toBeInTheDocument();
    });
  });
});
