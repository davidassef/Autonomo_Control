import React from "react";
import { render, screen, fireEvent, waitFor } from "../utils/test-utils";
import "@testing-library/jest-dom";
import CategoryForm from "./CategoryForm";
import { mockCategories } from "../utils/test-utils";

// Mock dos componentes ColorPicker e IconPicker
jest.mock("./ColorPicker", () => {
  return function MockColorPicker({ onColorSelect, selectedColor }: any) {
    return (
      <div data-testid="color-picker">
        <button
          onClick={() => onColorSelect("#FF0000")}
          data-testid="color-red"
        >
          Red
        </button>
        <span data-testid="selected-color">{selectedColor}</span>
      </div>
    );
  };
});

jest.mock("./IconPicker", () => {
  return function MockIconPicker({ onIconSelect, selectedIcon }: any) {
    return (
      <div data-testid="icon-picker">
        <button onClick={() => onIconSelect("🍔")} data-testid="icon-burger">
          🍔
        </button>
        <span data-testid="selected-icon">{selectedIcon}</span>
      </div>
    );
  };
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  category: null,
  defaultType: "expense" as const,
};

describe("CategoryForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não renderiza quando isOpen é false", () => {
    render(<CategoryForm {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Nova Categoria")).not.toBeInTheDocument();
  });

  it("renderiza o formulário quando isOpen é true", () => {
    render(<CategoryForm {...defaultProps} />);
    expect(screen.getByText("Nova Categoria")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Subcategorias")).toBeInTheDocument();
  });

  it('exibe "Editar Categoria" quando category é fornecida', () => {
    render(<CategoryForm {...defaultProps} category={mockCategories[0]} />);
    expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
  });

  it("preenche o formulário com dados da categoria quando fornecida", () => {
    const category = mockCategories[0];
    render(<CategoryForm {...defaultProps} category={category} />);

    expect(screen.getByDisplayValue(category.name)).toBeInTheDocument();

    const typeSelect = screen.getByLabelText("Tipo") as HTMLSelectElement;
    expect(typeSelect.value).toBe("expense"); // type convertido para lowercase
  });

  it("usa o tipo padrão quando não há categoria", () => {
    render(<CategoryForm {...defaultProps} defaultType="income" />);

    const typeSelect = screen.getByLabelText("Tipo");
    expect(typeSelect).toHaveValue("income");
  });

  it("valida nome obrigatório", async () => {
    render(<CategoryForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /salvar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("O nome da categoria é obrigatório"),
      ).toBeInTheDocument();
    });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it("submete formulário com dados válidos", async () => {
    render(<CategoryForm {...defaultProps} />);

    const nameInput = screen.getByLabelText("Nome");
    const typeSelect = screen.getByLabelText("Tipo");
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    fireEvent.change(nameInput, { target: { value: "Nova Categoria" } });
    fireEvent.change(typeSelect, { target: { value: "income" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith({
        name: "Nova Categoria",
        type: "income",
        subcategories: [],
        icon: "",
        color: "",
      });
    });
  });

  it("adiciona subcategoria quando botão é clicado", async () => {
    render(<CategoryForm {...defaultProps} />);

    const subcategoryInput = screen.getByPlaceholderText(
      "Adicionar subcategoria",
    );
    const addButton = screen.getByRole("button", { name: /adicionar/i });

    fireEvent.change(subcategoryInput, {
      target: { value: "Nova Subcategoria" },
    });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Nova Subcategoria")).toBeInTheDocument();
    });

    // Input deve ser limpo após adicionar
    expect(subcategoryInput).toHaveValue("");
  });

  it("adiciona subcategoria quando Enter é pressionado", async () => {
    render(<CategoryForm {...defaultProps} />);

    const subcategoryInput = screen.getByPlaceholderText(
      "Adicionar subcategoria",
    );

    fireEvent.change(subcategoryInput, {
      target: { value: "Subcategoria Enter" },
    });
    fireEvent.keyDown(subcategoryInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Subcategoria Enter")).toBeInTheDocument();
    });
  });

  it("não adiciona subcategoria vazia", () => {
    render(<CategoryForm {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /adicionar/i });
    fireEvent.click(addButton);

    // Não deve haver nenhuma subcategoria adicionada
    expect(screen.queryByText("×")).not.toBeInTheDocument();
  });

  it("não adiciona subcategoria duplicada", async () => {
    render(<CategoryForm {...defaultProps} />);

    const subcategoryInput = screen.getByPlaceholderText(
      "Adicionar subcategoria",
    );
    const addButton = screen.getByRole("button", { name: /adicionar/i });

    // Adiciona primeira subcategoria
    fireEvent.change(subcategoryInput, { target: { value: "Duplicada" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Duplicada")).toBeInTheDocument();
    });

    // Tenta adicionar a mesma subcategoria
    fireEvent.change(subcategoryInput, { target: { value: "Duplicada" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText("Esta subcategoria já existe"),
      ).toBeInTheDocument();
    });

    // Deve haver apenas uma instância da subcategoria
    const subcategoryElements = screen.getAllByText("Duplicada");
    expect(subcategoryElements).toHaveLength(1);
  });

  it("remove subcategoria quando × é clicado", async () => {
    render(<CategoryForm {...defaultProps} />);

    const subcategoryInput = screen.getByPlaceholderText(
      "Adicionar subcategoria",
    );
    const addButton = screen.getByRole("button", { name: /adicionar/i });

    // Adiciona subcategoria
    fireEvent.change(subcategoryInput, { target: { value: "Para Remover" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Para Remover")).toBeInTheDocument();
    });

    // Remove subcategoria
    const removeButton = screen.getByText("×");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText("Para Remover")).not.toBeInTheDocument();
    });
  });

  it("exibe subcategorias existentes quando categoria é fornecida", () => {
    const categoryWithSubs = {
      ...mockCategories[0],
      subcategories: ["Sub1", "Sub2"],
    };

    render(<CategoryForm {...defaultProps} category={categoryWithSubs} />);

    expect(screen.getByText("Sub1")).toBeInTheDocument();
    expect(screen.getByText("Sub2")).toBeInTheDocument();
  });

  it("chama onClose quando botão cancelar é clicado", () => {
    render(<CategoryForm {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("limpa erro quando nova subcategoria válida é adicionada", async () => {
    render(<CategoryForm {...defaultProps} />);

    const subcategoryInput = screen.getByPlaceholderText(
      "Adicionar subcategoria",
    );
    const addButton = screen.getByRole("button", { name: /adicionar/i });

    // Adiciona primeira subcategoria
    fireEvent.change(subcategoryInput, { target: { value: "Original" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Original")).toBeInTheDocument();
    });

    // Tenta adicionar duplicada (gera erro)
    fireEvent.change(subcategoryInput, { target: { value: "Original" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.getByText("Esta subcategoria já existe"),
      ).toBeInTheDocument();
    });

    // Adiciona subcategoria válida (deve limpar erro)
    fireEvent.change(subcategoryInput, { target: { value: "Nova" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Esta subcategoria já existe"),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Nova")).toBeInTheDocument();
  });

  it("reseta formulário quando categoria muda de editando para nova", () => {
    const { rerender } = render(
      <CategoryForm {...defaultProps} category={mockCategories[0]} />,
    );

    // Verifica se está preenchido com dados da categoria
    expect(
      screen.getByDisplayValue(mockCategories[0].name),
    ).toBeInTheDocument();

    // Muda para nova categoria
    rerender(<CategoryForm {...defaultProps} category={null} />);

    // Verifica se foi resetado
    const nameInput = screen.getByLabelText("Nome");
    expect(nameInput).toHaveValue("");
  });

  it("submete formulário com subcategorias", async () => {
    render(<CategoryForm {...defaultProps} />);

    const nameInput = screen.getByLabelText("Nome");
    const subcategoryInput = screen.getByPlaceholderText(
      "Adicionar subcategoria",
    );
    const addButton = screen.getByRole("button", { name: /adicionar/i });
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    // Preenche nome
    fireEvent.change(nameInput, { target: { value: "Categoria com Subs" } });

    // Adiciona subcategorias
    fireEvent.change(subcategoryInput, { target: { value: "Sub1" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Sub1")).toBeInTheDocument();
    });

    fireEvent.change(subcategoryInput, { target: { value: "Sub2" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Sub2")).toBeInTheDocument();
    });

    // Submete formulário
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith({
        name: "Categoria com Subs",
        type: "expense",
        subcategories: ["Sub1", "Sub2"],
        icon: "",
        color: "",
      });
    });
  });
});
