import React from "react";
import { render, screen, fireEvent, waitFor } from "../utils/test-utils";
import "@testing-library/jest-dom";
import EntryForm from "./EntryForm";
import { mockCategories, mockEntries } from "../utils/test-utils";

// Mock props padrão
const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  entry: null,
  categories: mockCategories,
  isLoading: false,
};

describe("EntryForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("não renderiza quando isOpen é false", () => {
    render(<EntryForm {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Novo Lançamento")).not.toBeInTheDocument();
  });

  it("renderiza o formulário quando isOpen é true", () => {
    render(<EntryForm {...defaultProps} />);
    expect(screen.getByText("Novo Lançamento")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor (R$)")).toBeInTheDocument();
    expect(screen.getByLabelText("Data")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
  });

  it('exibe "Editar Lançamento" quando entry é fornecido', () => {
    render(<EntryForm {...defaultProps} entry={mockEntries[0]} />);
    expect(screen.getByText("Editar Lançamento")).toBeInTheDocument();
  });

  it("preenche o formulário com dados do entry quando fornecido", () => {
    const entry = mockEntries[0];
    render(<EntryForm {...defaultProps} entry={entry} />);

    expect(
      screen.getByDisplayValue(entry.amount.toString()),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(entry.description)).toBeInTheDocument();

    const typeSelect = screen.getByLabelText("Tipo") as HTMLSelectElement;
    expect(typeSelect.value).toBe(entry.type);
  });

  it("filtra categorias baseado no tipo selecionado", async () => {
    render(<EntryForm {...defaultProps} />);

    const typeSelect = screen.getByLabelText("Tipo");
    fireEvent.change(typeSelect, { target: { value: "INCOME" } });

    await waitFor(() => {
      const categorySelect = screen.getByLabelText("Categoria");
      expect(categorySelect).toBeInTheDocument();
    });

    await waitFor(() => {
      // Verifica se a categoria de INCOME está presente
      expect(screen.getByText("Categoria Income")).toBeInTheDocument();
    });
  });

  it("reseta categoria quando tipo é alterado", async () => {
    render(<EntryForm {...defaultProps} />);

    const typeSelect = screen.getByLabelText("Tipo");
    const categorySelect = screen.getByLabelText("Categoria");

    // Seleciona uma categoria
    fireEvent.change(categorySelect, { target: { value: "1" } });
    expect(categorySelect).toHaveValue("1");

    // Altera o tipo
    fireEvent.change(typeSelect, { target: { value: "INCOME" } });

    await waitFor(() => {
      expect(categorySelect).toHaveValue("");
    });
  });

  it("valida valor maior que zero", async () => {
    render(<EntryForm {...defaultProps} />);

    const amountInput = screen.getByLabelText("Valor (R$)");
    const descriptionInput = screen.getByLabelText("Descrição");
    const categorySelect = screen.getByLabelText("Categoria");
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    // Preenche outros campos obrigatórios para testar apenas a validação do valor
    fireEvent.change(descriptionInput, { target: { value: "Teste" } });
    fireEvent.change(categorySelect, { target: { value: "1" } });

    // Limpa o campo amount e define como 0
    fireEvent.change(amountInput, { target: { value: "" } });
    fireEvent.change(amountInput, { target: { value: "0" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("O valor deve ser maior que zero."),
      ).toBeInTheDocument();
    });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it("valida descrição obrigatória", async () => {
    render(<EntryForm {...defaultProps} />);

    const amountInput = screen.getByLabelText("Valor (R$)");
    const descriptionInput = screen.getByLabelText("Descrição");
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.change(descriptionInput, { target: { value: "" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("A descrição é obrigatória."),
      ).toBeInTheDocument();
    });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it("valida categoria obrigatória", async () => {
    render(<EntryForm {...defaultProps} />);

    const amountInput = screen.getByLabelText("Valor (R$)");
    const descriptionInput = screen.getByLabelText("Descrição");
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.change(descriptionInput, { target: { value: "Teste" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Selecione uma categoria.")).toBeInTheDocument();
    });

    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it("submete formulário com dados válidos", async () => {
    render(<EntryForm {...defaultProps} />);

    const amountInput = screen.getByLabelText("Valor (R$)");
    const descriptionInput = screen.getByLabelText("Descrição");
    const categorySelect = screen.getByLabelText("Categoria");
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    fireEvent.change(amountInput, { target: { value: "100.50" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Teste de lançamento" },
    });
    fireEvent.change(categorySelect, { target: { value: "1" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith({
        amount: 100.5,
        date: expect.any(String),
        type: "EXPENSE",
        description: "Teste de lançamento",
        category_id: 1,
      });
    });
  });

  it("chama onClose quando botão cancelar é clicado", () => {
    render(<EntryForm {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("limpa erro quando formulário é resubmetido", async () => {
    render(<EntryForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /salvar/i });

    // Primeiro submit com erro
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("O valor deve ser maior que zero."),
      ).toBeInTheDocument();
    });

    // Corrige o valor e submete novamente
    const amountInput = screen.getByLabelText("Valor (R$)");
    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.click(submitButton);

    // O erro anterior deve ter sido limpo
    expect(
      screen.queryByText("O valor deve ser maior que zero."),
    ).not.toBeInTheDocument();
  });

  it("converte valor string para número corretamente", async () => {
    render(<EntryForm {...defaultProps} />);

    const amountInput = screen.getByLabelText("Valor (R$)");
    const descriptionInput = screen.getByLabelText("Descrição");
    const categorySelect = screen.getByLabelText("Categoria");
    const submitButton = screen.getByRole("button", { name: /salvar/i });

    fireEvent.change(amountInput, { target: { value: "123.45" } });
    fireEvent.change(descriptionInput, { target: { value: "Teste" } });
    fireEvent.change(categorySelect, { target: { value: "1" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 123.45,
        }),
      );
    });
  });

  it("define data padrão como hoje", () => {
    render(<EntryForm {...defaultProps} />);

    const dateInput = screen.getByLabelText("Data");
    const today = new Date().toISOString().split("T")[0];

    expect(dateInput).toHaveValue(today);
  });

  it("reseta formulário quando entry muda de editando para novo", () => {
    const { rerender } = render(
      <EntryForm {...defaultProps} entry={mockEntries[0]} />,
    );

    // Verifica se está preenchido com dados do entry
    expect(
      screen.getByDisplayValue(mockEntries[0].description),
    ).toBeInTheDocument();

    // Muda para novo lançamento
    rerender(<EntryForm {...defaultProps} entry={null} />);

    // Verifica se foi resetado
    const descriptionInput = screen.getByLabelText("Descrição");
    expect(descriptionInput).toHaveValue("");
  });
});
