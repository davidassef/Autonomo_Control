import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoriesPage from './CategoriesPage';
import { mockCategories, resetAllMocks } from '../utils/test-utils';
import * as useCategoriesHook from '../hooks/useCategories';

// Mock do AuthContext
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@test.com' },
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    error: null
  })
}));

// Mock dos hooks
jest.mock('../hooks/useCategories');

// Mock dos componentes
jest.mock('../components/CategoryList', () => {
  return function MockCategoryList({ categories, isLoading, activeType, onEdit, onDelete }: any) {
    if (isLoading) return <div data-testid="category-list-loading">Carregando categorias...</div>;
    
    return (
      <div data-testid="category-list">
        <div data-testid="categories-count">{categories?.length || 0} categorias</div>
        <div data-testid="active-type">{activeType}</div>
        {categories?.map((category: any) => (
          <div key={category.id} data-testid={`category-${category.id}`}>
            <span>{category.name} - {category.type}</span>
            <button onClick={() => onEdit(category)} data-testid={`edit-${category.id}`}>Editar</button>
            <button onClick={() => onDelete(category.id)} data-testid={`delete-${category.id}`}>Excluir</button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../components/CategoryForm', () => {
  return function MockCategoryForm({ isOpen, onClose, onSave, category, defaultType }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="category-form-modal">
        <h2>{category ? 'Editar Categoria' : 'Nova Categoria'}</h2>
        <div data-testid="default-type">{defaultType}</div>
        <button onClick={onClose} data-testid="close-modal">Fechar</button>
        <button 
          onClick={() => onSave({ 
            name: 'Categoria Teste', 
            type: defaultType,
            subcategories: []
          })} 
          data-testid="save-category"
        >
          Salvar
        </button>
      </div>
    );
  };
});

const mockUseCategories = useCategoriesHook.useCategories as jest.MockedFunction<typeof useCategoriesHook.useCategories>;

const renderCategoriesPage = () => {
  return render(<CategoriesPage />);
};

describe('CategoriesPage', () => {
  const mockRefreshCategories = jest.fn();
  const mockAddCategory = jest.fn();
  const mockUpdateCategory = jest.fn();
  const mockDeleteCategory = jest.fn();

  beforeEach(() => {
    resetAllMocks();
    
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      refreshCategories: mockRefreshCategories,
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory
    });

    // Mock do window.confirm
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o título da página', () => {
    renderCategoriesPage();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
  });

  it('deve renderizar o botão "Nova Categoria"', () => {
    renderCategoriesPage();
    expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
  });

  it('deve renderizar os botões de alternância de tipo', () => {
    renderCategoriesPage();
    expect(screen.getByText('Despesas')).toBeInTheDocument();
    expect(screen.getByText('Receitas')).toBeInTheDocument();
  });

  it('deve ter "Despesas" selecionado por padrão', () => {
    renderCategoriesPage();
    const despesasButton = screen.getByText('Despesas');
    expect(despesasButton).toHaveClass('bg-red-100', 'text-red-700', 'font-medium');
  });

  it('deve alternar para "Receitas" ao clicar no botão', () => {
    renderCategoriesPage();
    
    const receitasButton = screen.getByText('Receitas');
    fireEvent.click(receitasButton);
    
    expect(receitasButton).toHaveClass('bg-green-100', 'text-green-700', 'font-medium');
    expect(screen.getByText('Despesas')).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('deve renderizar o campo de busca', () => {
    renderCategoriesPage();
    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    expect(searchInput).toBeInTheDocument();
  });

  it('deve filtrar categorias por termo de busca', () => {
    renderCategoriesPage();
    
    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    fireEvent.change(searchInput, { target: { value: 'alimentação' } });
    
    expect(searchInput).toHaveValue('alimentação');
  });

  it('deve exibir botão de limpar busca quando há termo de busca', () => {
    renderCategoriesPage();
    
    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    fireEvent.change(searchInput, { target: { value: 'teste' } });
    
    const clearButton = screen.getByRole('button', { name: /limpar busca/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('deve limpar busca ao clicar no botão de limpar', () => {
    renderCategoriesPage();
    
    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    fireEvent.change(searchInput, { target: { value: 'teste' } });
    
    const clearButton = screen.getByRole('button', { name: /limpar busca/i });
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('deve limpar busca ao trocar de tipo', () => {
    renderCategoriesPage();
    
    const searchInput = screen.getByPlaceholderText('Buscar categorias...');
    fireEvent.change(searchInput, { target: { value: 'teste' } });
    
    const receitasButton = screen.getByText('Receitas');
    fireEvent.click(receitasButton);
    
    expect(searchInput).toHaveValue('');
  });

  it('deve renderizar a lista de categorias', () => {
    renderCategoriesPage();
    expect(screen.getByTestId('category-list')).toBeInTheDocument();
  });

  it('deve filtrar categorias por tipo ativo', () => {
    renderCategoriesPage();
    
    // Por padrão deve mostrar apenas categorias de despesa
    expect(screen.getByTestId('active-type')).toHaveTextContent('expense');
    
    // Muda para receitas
    const receitasButton = screen.getByText('Receitas');
    fireEvent.click(receitasButton);
    
    expect(screen.getByTestId('active-type')).toHaveTextContent('income');
  });

  it('deve abrir modal ao clicar em "Nova Categoria"', () => {
    renderCategoriesPage();
    
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
    expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
  });

  it('deve passar o tipo padrão correto para o modal', () => {
    renderCategoriesPage();
    
    // Testa com despesas (padrão)
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    expect(screen.getByTestId('default-type')).toHaveTextContent('expense');
    
    // Fecha modal
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    // Muda para receitas e testa novamente
    const receitasButton = screen.getByText('Receitas');
    fireEvent.click(receitasButton);
    
    fireEvent.click(newCategoryButton);
    expect(screen.getByTestId('default-type')).toHaveTextContent('income');
  });

  it('deve fechar modal ao clicar em fechar', () => {
    renderCategoriesPage();
    
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    const closeButton = screen.getByTestId('close-modal');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('category-form-modal')).not.toBeInTheDocument();
  });

  it('deve abrir modal de edição ao clicar em editar categoria', () => {
    renderCategoriesPage();
    
    const editButton = screen.getByTestId('edit-1');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
    expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
  });

  it('deve chamar addCategory ao salvar nova categoria', async () => {
    renderCategoriesPage();
    
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    const saveButton = screen.getByTestId('save-category');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalledWith({
        name: 'Categoria Teste',
        type: 'EXPENSE', // Convertido para maiúsculo
        subcategories: []
      });
    });
    
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it('deve chamar updateCategory ao salvar categoria editada', async () => {
    renderCategoriesPage();
    
    const editButton = screen.getByTestId('edit-1');
    fireEvent.click(editButton);
    
    const saveButton = screen.getByTestId('save-category');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalledWith('1', {
        name: 'Categoria Teste',
        type: 'EXPENSE',
        subcategories: []
      });
    });
    
    expect(mockRefreshCategories).toHaveBeenCalled();
  });

  it('deve chamar deleteCategory ao confirmar exclusão', async () => {
    renderCategoriesPage();
    
    const deleteButton = screen.getByTestId('delete-1');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta categoria?');
    });
    
    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('1');
    });
  });

  it('não deve chamar deleteCategory se usuário cancelar confirmação', async () => {
    global.confirm = jest.fn(() => false);
    
    renderCategoriesPage();
    
    const deleteButton = screen.getByTestId('delete-1');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
    });
    
    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });

  it('deve exibir loading quando isLoading é true', () => {
    mockUseCategories.mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
      refreshCategories: mockRefreshCategories,
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory
    });
    
    renderCategoriesPage();
    expect(screen.getByTestId('category-list-loading')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando houver erro', () => {
    mockUseCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      error: 'Erro ao carregar categorias',
      refreshCategories: mockRefreshCategories,
      addCategory: mockAddCategory,
      updateCategory: mockUpdateCategory,
      deleteCategory: mockDeleteCategory
    });
    
    renderCategoriesPage();
    
    expect(screen.getByText('Erro:')).toBeInTheDocument();
    expect(screen.getByText('Erro ao carregar categorias')).toBeInTheDocument();
  });

  it('deve tratar erros ao salvar categoria', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockAddCategory.mockRejectedValue(new Error('Erro ao salvar'));
    
    renderCategoriesPage();
    
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    const saveButton = screen.getByTestId('save-category');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error saving category:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('deve tratar erros ao excluir categoria', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockDeleteCategory.mockRejectedValue(new Error('Erro ao excluir'));
    
    renderCategoriesPage();
    
    const deleteButton = screen.getByTestId('delete-1');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting category:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('deve fechar modal após salvar com sucesso', async () => {
    renderCategoriesPage();
    
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
    
    const saveButton = screen.getByTestId('save-category');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('category-form-modal')).not.toBeInTheDocument();
    });
  });

  it('deve converter tipo para maiúsculo ao salvar', async () => {
    renderCategoriesPage();
    
    // Muda para receitas
    const receitasButton = screen.getByText('Receitas');
    fireEvent.click(receitasButton);
    
    const newCategoryButton = screen.getByText('Nova Categoria');
    fireEvent.click(newCategoryButton);
    
    const saveButton = screen.getByTestId('save-category');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockAddCategory).toHaveBeenCalledWith(expect.objectContaining({
        type: 'INCOME' // Convertido de 'income' para 'INCOME'
      }));
    });
  });
});