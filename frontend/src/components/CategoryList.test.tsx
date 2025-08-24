import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryList from "./CategoryList";
import { Category } from "../types";

describe("CategoryList", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const createMockCategory = (overrides: Partial<Category> = {}): Category => ({
    id: "1",
    name: "Alimentação",
    type: "expense",
    color: "#FF6B6B",
    icon: "food",
    is_default: false,
    subcategories: ["Restaurante", "Supermercado"],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Estado de Loading", () => {
    it("deve renderizar skeleton quando isLoading é true", () => {
      render(
        <CategoryList
          categories={[]}
          isLoading={true}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      // Verifica se há elementos de loading (skeleton)
      const skeletonElements = document.querySelectorAll(".animate-pulse");
      expect(skeletonElements.length).toBeGreaterThan(0);

      // Verifica se há 5 itens de skeleton
      const skeletonItems = document.querySelectorAll(".animate-pulse .flex");
      expect(skeletonItems).toHaveLength(5);
    });

    it("não deve renderizar skeleton quando isLoading é false", () => {
      render(
        <CategoryList
          categories={[]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const skeletonElements = document.querySelectorAll(".animate-pulse");
      expect(skeletonElements).toHaveLength(0);
    });
  });

  describe("Lista Vazia", () => {
    it("deve mostrar mensagem quando não há categorias de despesa", () => {
      render(
        <CategoryList
          categories={[]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(
        screen.getByText(/Nenhuma categoria de despesa encontrada/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Adicione uma nova categoria usando o botão acima/),
      ).toBeInTheDocument();
    });

    it("deve mostrar mensagem quando não há categorias de receita", () => {
      render(
        <CategoryList
          categories={[]}
          isLoading={false}
          activeType="income"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(
        screen.getByText(/Nenhuma categoria de receita encontrada/),
      ).toBeInTheDocument();
    });
  });

  describe("Renderização de Categorias", () => {
    it("deve renderizar lista de categorias corretamente", () => {
      const categories = [
        createMockCategory({ id: "1", name: "Alimentação" }),
        createMockCategory({
          id: "2",
          name: "Transporte",
          icon: "transport",
          color: "#4ECDC4",
        }),
      ];

      render(
        <CategoryList
          categories={categories}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Alimentação")).toBeInTheDocument();
      expect(screen.getByText("Transporte")).toBeInTheDocument();
    });

    it("deve renderizar cabeçalho da tabela em telas maiores", () => {
      const categories = [createMockCategory()];

      render(
        <CategoryList
          categories={categories}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Nome")).toBeInTheDocument();
      expect(screen.getByText("Subcategorias")).toBeInTheDocument();
      expect(screen.getByText("Ações")).toBeInTheDocument();
    });

    it("deve renderizar ícone correto para categoria", () => {
      const category = createMockCategory({ icon: "food" });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      // Verifica se o emoji de comida está presente
      expect(screen.getByText("🍽️")).toBeInTheDocument();
    });

    it("deve usar ícone padrão quando icon não está definido", () => {
      const category = createMockCategory({ icon: undefined });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      // Verifica se o emoji padrão está presente
      expect(screen.getByText("📋")).toBeInTheDocument();
    });

    it("deve usar ícone padrão para ícone desconhecido", () => {
      const category = createMockCategory({ icon: "unknown_icon" });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      // Verifica se o emoji padrão está presente
      expect(screen.getByText("📋")).toBeInTheDocument();
    });

    it("deve aplicar cor de fundo correta ao ícone", () => {
      const category = createMockCategory({ color: "#FF6B6B" });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const iconContainer = screen.getByTestId("test-element");
      expect(iconContainer).toHaveStyle("background-color: #FF6B6B");
    });

    it("deve usar cor padrão quando color não está definida", () => {
      const category = createMockCategory({ color: undefined });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const iconContainer = screen.getByTestId("test-element");
      expect(iconContainer).toHaveStyle("background-color: #CBD5E1");
    });
  });

  describe("Categorias Padrão", () => {
    it('deve mostrar badge "Padrão" para categorias padrão', () => {
      const category = createMockCategory({ is_default: true });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Padrão")).toBeInTheDocument();
    });

    it('não deve mostrar badge "Padrão" para categorias não padrão', () => {
      const category = createMockCategory({ is_default: false });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.queryByText("Padrão")).not.toBeInTheDocument();
    });
  });

  describe("Subcategorias", () => {
    it("deve renderizar subcategorias quando existem", () => {
      const category = createMockCategory({
        subcategories: ["Restaurante", "Supermercado", "Lanchonete"],
      });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Restaurante")).toBeInTheDocument();
      expect(screen.getByText("Supermercado")).toBeInTheDocument();
      expect(screen.getByText("Lanchonete")).toBeInTheDocument();
    });

    it('deve mostrar "Sem subcategorias" quando não há subcategorias', () => {
      const category = createMockCategory({ subcategories: [] });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Sem subcategorias")).toBeInTheDocument();
    });

    it('deve mostrar "Sem subcategorias" quando subcategorias é undefined', () => {
      const category = createMockCategory({ subcategories: undefined });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Sem subcategorias")).toBeInTheDocument();
    });
  });

  describe("Botões de Ação", () => {
    it("deve renderizar botões Editar e Excluir para categorias não padrão", () => {
      const category = createMockCategory({ is_default: false });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const editButton = screen.getByText("Editar");
      const deleteButton = screen.getByText("Excluir");

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
      expect(editButton).not.toBeDisabled();
      expect(deleteButton).not.toBeDisabled();
    });

    it("deve desabilitar botões para categorias padrão", () => {
      const category = createMockCategory({ is_default: true });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const editButton = screen.getByText("Editar");
      const deleteButton = screen.getByText("Excluir");

      expect(editButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
      expect(editButton).toHaveClass("cursor-not-allowed");
      expect(deleteButton).toHaveClass("cursor-not-allowed");
    });

    it("deve chamar onEdit quando botão Editar é clicado", () => {
      const category = createMockCategory({ is_default: false });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const editButton = screen.getByText("Editar");
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(category);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("deve chamar onDelete quando botão Excluir é clicado", () => {
      const category = createMockCategory({ is_default: false });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const deleteButton = screen.getByText("Excluir");
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(category.id);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("não deve chamar callbacks quando botões estão desabilitados", () => {
      const category = createMockCategory({ is_default: true });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const editButton = screen.getByText("Editar");
      const deleteButton = screen.getByText("Excluir");

      fireEvent.click(editButton);
      fireEvent.click(deleteButton);

      expect(mockOnEdit).not.toHaveBeenCalled();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe("Múltiplas Categorias", () => {
    it("deve renderizar múltiplas categorias corretamente", () => {
      const categories = [
        createMockCategory({ id: "1", name: "Alimentação", is_default: false }),
        createMockCategory({ id: "2", name: "Transporte", is_default: true }),
        createMockCategory({ id: "3", name: "Saúde", is_default: false }),
      ];

      render(
        <CategoryList
          categories={categories}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Alimentação")).toBeInTheDocument();
      expect(screen.getByText("Transporte")).toBeInTheDocument();
      expect(screen.getByText("Saúde")).toBeInTheDocument();

      // Verifica se há 6 botões (2 para cada categoria não padrão + 2 desabilitados para padrão)
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(6);
    });

    it("deve manter estado independente para cada categoria", () => {
      const categories = [
        createMockCategory({ id: "1", name: "Categoria 1", is_default: false }),
        createMockCategory({ id: "2", name: "Categoria 2", is_default: true }),
      ];

      render(
        <CategoryList
          categories={categories}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const editButtons = screen.getAllByText("Editar");
      const deleteButtons = screen.getAllByText("Excluir");

      // Primeira categoria (não padrão) - botões habilitados
      expect(editButtons[0]).not.toBeDisabled();
      expect(deleteButtons[0]).not.toBeDisabled();

      // Segunda categoria (padrão) - botões desabilitados
      expect(editButtons[1]).toBeDisabled();
      expect(deleteButtons[1]).toBeDisabled();
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com categoria sem nome", () => {
      const category = createMockCategory({ name: "" });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      // Deve renderizar mesmo com nome vazio
      expect(screen.getByText("Editar")).toBeInTheDocument();
    });

    it("deve lidar com subcategorias vazias", () => {
      const category = createMockCategory({
        subcategories: ["", "Válida", ""],
      });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      expect(screen.getByText("Válida")).toBeInTheDocument();
    });

    it("deve lidar com cor inválida", () => {
      const category = createMockCategory({ color: "invalid-color" });

      render(
        <CategoryList
          categories={[category]}
          isLoading={false}
          activeType="expense"
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />,
      );

      const iconContainer = screen.getByTestId("test-element");
      expect(iconContainer).toHaveStyle("background-color: invalid-color");
    });
  });

  describe("Ícones Disponíveis", () => {
    const iconTests = [
      { icon: "home", emoji: "🏠" },
      { icon: "food", emoji: "🍽️" },
      { icon: "grocery", emoji: "🛒" },
      { icon: "transport", emoji: "🚗" },
      { icon: "health", emoji: "💊" },
      { icon: "education", emoji: "📚" },
      { icon: "entertainment", emoji: "🎬" },
      { icon: "shopping", emoji: "👜" },
      { icon: "utilities", emoji: "💡" },
      { icon: "travel", emoji: "✈️" },
      { icon: "sports", emoji: "⚽" },
      { icon: "pets", emoji: "🐾" },
      { icon: "gifts", emoji: "🎁" },
      { icon: "salary", emoji: "💰" },
      { icon: "investment", emoji: "📈" },
      { icon: "savings", emoji: "💲" },
      { icon: "other", emoji: "📋" },
      { icon: "bills", emoji: "📄" },
      { icon: "tax", emoji: "💼" },
      { icon: "car", emoji: "🚙" },
    ];

    iconTests.forEach(({ icon, emoji }) => {
      it(`deve renderizar emoji correto para ícone ${icon}`, () => {
        const category = createMockCategory({ icon });

        render(
          <CategoryList
            categories={[category]}
            isLoading={false}
            activeType="expense"
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
          />,
        );

        expect(screen.getByText(emoji)).toBeInTheDocument();
      });
    });
  });
});
