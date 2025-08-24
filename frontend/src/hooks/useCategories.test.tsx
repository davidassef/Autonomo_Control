import { renderHook, act, waitFor } from "@testing-library/react";
import { useCategories } from "./useCategories";
import { categoryService } from "../services/categories";
import { mockCategories, resetAllMocks } from "../utils/test-utils";

// Mock do serviço de categorias
jest.mock("../services/categories");

const mockCategoryService = categoryService as any;

describe("useCategories Hook", () => {
  beforeEach(() => {
    resetAllMocks();

    // Configurar mocks padrão
    mockCategoryService.getAll.mockResolvedValue(mockCategories);
    mockCategoryService.create.mockResolvedValue(mockCategories[0]);
    mockCategoryService.update.mockResolvedValue(mockCategories[0]);
    mockCategoryService.delete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve inicializar com valores padrão", () => {
    const { result } = renderHook(() => useCategories());

    expect(result.current.categories).toEqual([]);
    expect(result.current.isLoading).toBe(true); // Inicia como true devido ao fetchCategories
    expect(result.current.error).toBeNull();
  });

  it("deve buscar categorias na inicialização", async () => {
    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(mockCategoryService.getAll).toHaveBeenCalledWith(undefined);
    });

    await waitFor(() => {
      expect(result.current.categories).toEqual(mockCategories);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("deve buscar categorias com filtro de tipo", async () => {
    const { result } = renderHook(() => useCategories("expense"));

    await waitFor(() => {
      expect(mockCategoryService.getAll).toHaveBeenCalledWith("expense");
    });

    await waitFor(() => {
      expect(result.current.categories).toEqual(mockCategories);
    });
  });

  it("deve buscar categorias de receita", async () => {
    renderHook(() => useCategories("income"));

    await waitFor(() => {
      expect(mockCategoryService.getAll).toHaveBeenCalledWith("income");
    });
  });

  it("deve tratar erro ao buscar categorias", async () => {
    const errorMessage = "Erro ao buscar categorias";
    mockCategoryService.getAll.mockRejectedValue({
      response: { data: { detail: errorMessage } },
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("deve tratar erro genérico ao buscar categorias", async () => {
    mockCategoryService.getAll.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to fetch categories.");
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("deve adicionar nova categoria", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newCategory = {
      name: "Nova Categoria",
      type: "EXPENSE" as const,
      subcategories: [],
    };

    await act(async () => {
      await result.current.addCategory(newCategory);
    });

    expect(mockCategoryService.create).toHaveBeenCalledWith(newCategory);
    expect(result.current.categories).toEqual([
      mockCategories[0],
      ...mockCategories,
    ]);
  });

  it("deve atualizar categoria existente", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateData = { name: "Categoria Atualizada" };

    await act(async () => {
      await result.current.updateCategory("1", updateData);
    });

    expect(mockCategoryService.update).toHaveBeenCalledWith("1", updateData);
  });

  it("deve excluir categoria", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteCategory("1");
    });

    expect(mockCategoryService.delete).toHaveBeenCalledWith("1");
    expect(result.current.categories).toEqual(
      mockCategories.filter((c) => c.id !== "1"),
    );
  });

  it("deve tratar erro ao adicionar categoria", async () => {
    const errorMessage = "Erro ao adicionar categoria";
    mockCategoryService.create.mockRejectedValue({
      response: { data: { detail: errorMessage } },
    });

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newCategory = {
      name: "Nova Categoria",
      type: "EXPENSE" as const,
      subcategories: [],
    };

    await act(async () => {
      try {
        await result.current.addCategory(newCategory);
      } catch (error) {
        // Esperamos que lance erro
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it("deve tratar erro genérico ao adicionar categoria", async () => {
    mockCategoryService.create.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newCategory = {
      name: "Nova Categoria",
      type: "EXPENSE" as const,
      subcategories: [],
    };

    await act(async () => {
      try {
        await result.current.addCategory(newCategory);
      } catch (error) {
        // Esperamos que lance erro
      }
    });

    expect(result.current.error).toBe("Failed to add category.");
  });

  it("deve tratar erro ao atualizar categoria", async () => {
    const errorMessage = "Erro ao atualizar categoria";
    mockCategoryService.update.mockRejectedValue({
      response: { data: { detail: errorMessage } },
    });

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.updateCategory("1", { name: "Atualizada" });
      } catch (error) {
        // Esperamos que lance erro
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it("deve tratar erro genérico ao atualizar categoria", async () => {
    mockCategoryService.update.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.updateCategory("1", { name: "Atualizada" });
      } catch (error) {
        // Esperamos que lance erro
      }
    });

    expect(result.current.error).toBe("Failed to update category.");
  });

  it("deve tratar erro ao excluir categoria", async () => {
    const errorMessage = "Erro ao excluir categoria";
    mockCategoryService.delete.mockRejectedValue({
      response: { data: { detail: errorMessage } },
    });

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.deleteCategory("1");
      } catch (error) {
        // Esperamos que lance erro
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it("deve tratar erro genérico ao excluir categoria", async () => {
    mockCategoryService.delete.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.deleteCategory("1");
      } catch (error) {
        // Esperamos que lance erro
      }
    });

    expect(result.current.error).toBe("Failed to delete category.");
  });

  it("deve refazer busca ao chamar refreshCategories", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Limpa as chamadas anteriores
    mockCategoryService.getAll.mockClear();

    await act(async () => {
      await result.current.refreshCategories();
    });

    expect(mockCategoryService.getAll).toHaveBeenCalledTimes(1);
  });

  it("deve fazer nova busca quando tipo muda", async () => {
    const { rerender } = renderHook(({ type }) => useCategories(type), {
      initialProps: { type: "expense" as "expense" | "income" },
    });

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(mockCategoryService.getAll).toHaveBeenCalledWith("expense");
    });

    // Muda o tipo
    rerender({ type: "income" as "expense" | "income" });

    await waitFor(() => {
      expect(mockCategoryService.getAll).toHaveBeenCalledWith("income");
    });

    expect(mockCategoryService.getAll).toHaveBeenCalledTimes(2);
  });

  it("não deve fazer nova busca se tipo não muda", async () => {
    const { rerender } = renderHook(({ type }) => useCategories(type), {
      initialProps: { type: "expense" as "expense" | "income" },
    });

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(mockCategoryService.getAll).toHaveBeenCalledTimes(1);
    });

    // Re-renderiza com o mesmo tipo
    rerender({ type: "expense" as "expense" | "income" });

    // Não deve fazer nova chamada
    expect(mockCategoryService.getAll).toHaveBeenCalledTimes(1);
  });

  it("deve definir isLoading como true durante operações", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simula operação lenta
    mockCategoryService.create.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockCategories[0]), 100),
        ),
    );

    const newCategory = {
      name: "Nova Categoria",
      type: "EXPENSE" as const,
      subcategories: [],
    };

    // Inicia operação
    act(() => {
      result.current.addCategory(newCategory);
    });

    // Deve estar carregando
    expect(result.current.isLoading).toBe(true);

    // Aguarda conclusão
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("deve limpar erro ao iniciar nova operação", async () => {
    // Primeiro, causa um erro
    mockCategoryService.getAll.mockRejectedValueOnce({
      response: { data: { detail: "Erro inicial" } },
    });

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.error).toBe("Erro inicial");
    });

    // Agora faz uma operação bem-sucedida
    mockCategoryService.create.mockResolvedValue(mockCategories[0]);

    const newCategory = {
      name: "Nova Categoria",
      type: "EXPENSE" as const,
      subcategories: [],
    };

    await act(async () => {
      await result.current.addCategory(newCategory);
    });

    // Erro deve ter sido limpo
    expect(result.current.error).toBeNull();
  });

  it("deve retornar categoria criada ao adicionar", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newCategory = {
      name: "Nova Categoria",
      type: "EXPENSE" as const,
      subcategories: [],
    };

    let returnedCategory;
    await act(async () => {
      returnedCategory = await result.current.addCategory(newCategory);
    });

    expect(returnedCategory).toEqual(mockCategories[0]);
  });

  it("deve retornar categoria atualizada ao atualizar", async () => {
    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updateData = { name: "Categoria Atualizada" };

    let returnedCategory;
    await act(async () => {
      returnedCategory = await result.current.updateCategory("1", updateData);
    });

    expect(returnedCategory).toEqual(mockCategories[0]);
  });

  it("deve atualizar estado corretamente após atualizar categoria", async () => {
    const updatedCategory = {
      ...mockCategories[0],
      name: "Categoria Atualizada",
    };

    mockCategoryService.update.mockResolvedValue(updatedCategory);

    const { result } = renderHook(() => useCategories());

    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateCategory("1", {
        name: "Categoria Atualizada",
      });
    });

    // Verifica se a categoria foi atualizada no estado
    const categoryInState = result.current.categories.find((c) => c.id === "1");
    expect(categoryInState?.name).toBe("Categoria Atualizada");
  });
});
