import { categoryService } from './categories';
import api from './api';
import { Category } from '../types';

// Mock do módulo api
jest.mock('./api');

const mockApi = api as jest.Mocked<typeof api>;

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategory: Category = {
    id: '1',
    name: 'Food',
    type: 'EXPENSE',
    subcategories: ['Restaurant', 'Groceries'],
    user_id: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockIncomeCategory: Category = {
    id: '2',
    name: 'Salary',
    type: 'INCOME',
    subcategories: ['Base Salary', 'Bonus'],
    user_id: 'user1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockCategories: Category[] = [mockCategory, mockIncomeCategory];
  const mockExpenseCategories: Category[] = [mockCategory];
  const mockIncomeCategories: Category[] = [mockIncomeCategory];

  describe('getAll', () => {
    it('deve buscar todas as categorias sem filtro', async () => {
      mockApi.get.mockResolvedValue({ data: mockCategories });

      const result = await categoryService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/categories', {
        params: undefined
      });
      expect(result).toEqual(mockCategories);
    });

    it('deve buscar categorias de despesa', async () => {
      mockApi.get.mockResolvedValue({ data: mockExpenseCategories });

      const result = await categoryService.getAll('expense');

      expect(mockApi.get).toHaveBeenCalledWith('/categories', {
        params: { type: 'expense' }
      });
      expect(result).toEqual(mockExpenseCategories);
    });

    it('deve buscar categorias de receita', async () => {
      mockApi.get.mockResolvedValue({ data: mockIncomeCategories });

      const result = await categoryService.getAll('income');

      expect(mockApi.get).toHaveBeenCalledWith('/categories', {
        params: { type: 'income' }
      });
      expect(result).toEqual(mockIncomeCategories);
    });

    it('deve tratar erro ao buscar categorias', async () => {
      const mockError = {
        response: {
          status: 500,
          data: { detail: 'Server error' }
        }
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(categoryService.getAll()).rejects.toEqual(mockError);
    });

    it('deve tratar erro de autenticação', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Not authenticated' }
        }
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(categoryService.getAll('expense')).rejects.toEqual(mockError);
    });
  });

  describe('getById', () => {
    it('deve buscar categoria por ID', async () => {
      mockApi.get.mockResolvedValue({ data: mockCategory });

      const result = await categoryService.getById('1'); // eslint-disable-line testing-library/no-await-sync-query

      expect(mockApi.get).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual(mockCategory);
    });

    it('deve tratar erro quando categoria não encontrada', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: 'Category not found' }
        }
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(categoryService.getById('999')).rejects.toEqual(mockError);
    });

    it('deve tratar erro de permissão', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { detail: 'Not authorized to access this category' }
        }
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(categoryService.getById('1')).rejects.toEqual(mockError);
    });
  });

  describe('create', () => {
    const newCategoryData = {
      name: 'Transportation',
      type: 'EXPENSE' as const,
      subcategories: ['Bus', 'Taxi', 'Uber']
    };

    it('deve criar nova categoria', async () => {
      const createdCategory = {
        ...newCategoryData,
        id: '3',
        user_id: 'user1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockApi.post.mockResolvedValue({ data: createdCategory });

      const result = await categoryService.create(newCategoryData);

      expect(mockApi.post).toHaveBeenCalledWith('/categories', newCategoryData);
      expect(result).toEqual(createdCategory);
    });

    it('deve criar categoria de receita', async () => {
      const incomeCategoryData = {
        name: 'Freelance',
        type: 'INCOME' as const,
        subcategories: ['Web Development', 'Consulting']
      };

      const createdCategory = {
        ...incomeCategoryData,
        id: '4',
        user_id: 'user1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockApi.post.mockResolvedValue({ data: createdCategory });

      const result = await categoryService.create(incomeCategoryData);

      expect(mockApi.post).toHaveBeenCalledWith('/categories', incomeCategoryData);
      expect(result).toEqual(createdCategory);
    });

    it('deve criar categoria sem subcategorias', async () => {
      const simpleCategoryData = {
        name: 'Miscellaneous',
        type: 'EXPENSE' as const,
        subcategories: []
      };

      const createdCategory = {
        ...simpleCategoryData,
        id: '5',
        user_id: 'user1',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      };

      mockApi.post.mockResolvedValue({ data: createdCategory });

      const result = await categoryService.create(simpleCategoryData);

      expect(mockApi.post).toHaveBeenCalledWith('/categories', simpleCategoryData);
      expect(result).toEqual(createdCategory);
    });

    it('deve tratar erro de validação ao criar categoria', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ['body', 'name'],
                msg: 'field required',
                type: 'value_error.missing'
              }
            ]
          }
        }
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(categoryService.create({
        name: '',
        type: 'EXPENSE',
        subcategories: []
      })).rejects.toEqual(mockError);
    });

    it('deve tratar erro de categoria duplicada', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Category with this name already exists' }
        }
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(categoryService.create({
        name: 'Food', // Nome já existente
        type: 'EXPENSE',
        subcategories: []
      })).rejects.toEqual(mockError);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Food & Dining',
      subcategories: ['Restaurant', 'Groceries', 'Fast Food']
    };

    it('deve atualizar categoria existente', async () => {
      const updatedCategory = {
        ...mockCategory,
        ...updateData,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockApi.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('1', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/categories/1', updateData);
      expect(result).toEqual(updatedCategory);
    });

    it('deve atualizar apenas o nome da categoria', async () => {
      const partialUpdate = { name: 'Updated Food' };
      const updatedCategory = {
        ...mockCategory,
        ...partialUpdate,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockApi.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('1', partialUpdate);

      expect(mockApi.put).toHaveBeenCalledWith('/categories/1', partialUpdate);
      expect(result).toEqual(updatedCategory);
    });

    it('deve atualizar apenas as subcategorias', async () => {
      const partialUpdate = { subcategories: ['New Sub1', 'New Sub2'] };
      const updatedCategory = {
        ...mockCategory,
        ...partialUpdate,
        updated_at: '2024-01-15T12:00:00Z'
      };

      mockApi.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('1', partialUpdate);

      expect(mockApi.put).toHaveBeenCalledWith('/categories/1', partialUpdate);
      expect(result).toEqual(updatedCategory);
    });

    it('deve tratar erro quando categoria não encontrada para atualização', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: 'Category not found' }
        }
      };

      mockApi.put.mockRejectedValue(mockError);

      await expect(categoryService.update('999', updateData))
        .rejects.toEqual(mockError);
    });

    it('deve tratar erro de validação na atualização', async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ['body', 'name'],
                msg: 'ensure this value has at least 1 characters',
                type: 'value_error.any_str.min_length'
              }
            ]
          }
        }
      };

      mockApi.put.mockRejectedValue(mockError);

      await expect(categoryService.update('1', { name: '' }))
        .rejects.toEqual(mockError);
    });

    it('deve tratar erro de nome duplicado na atualização', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Category with this name already exists' }
        }
      };

      mockApi.put.mockRejectedValue(mockError);

      await expect(categoryService.update('1', { name: 'Salary' }))
        .rejects.toEqual(mockError);
    });
  });

  describe('delete', () => {
    it('deve excluir categoria existente', async () => {
      mockApi.delete.mockResolvedValue({});

      await categoryService.delete('1');

      expect(mockApi.delete).toHaveBeenCalledWith('/categories/1');
    });

    it('deve tratar erro quando categoria não encontrada para exclusão', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: 'Category not found' }
        }
      };

      mockApi.delete.mockRejectedValue(mockError);

      await expect(categoryService.delete('999')).rejects.toEqual(mockError);
    });

    it('deve tratar erro de categoria em uso', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Cannot delete category that is being used by entries' }
        }
      };

      mockApi.delete.mockRejectedValue(mockError);

      await expect(categoryService.delete('1')).rejects.toEqual(mockError);
    });

    it('deve tratar erro de permissão na exclusão', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { detail: 'Not authorized to delete this category' }
        }
      };

      mockApi.delete.mockRejectedValue(mockError);

      await expect(categoryService.delete('1')).rejects.toEqual(mockError);
    });
  });

  describe('integração entre métodos', () => {
    it('deve criar e buscar categoria', async () => {
      const newCategoryData = {
        name: 'Health',
        type: 'EXPENSE' as const,
        subcategories: ['Doctor', 'Pharmacy', 'Insurance']
      };

      const createdCategory = {
        ...newCategoryData,
        id: '6',
        user_id: 'user1',
        created_at: '2024-01-15T14:00:00Z',
        updated_at: '2024-01-15T14:00:00Z'
      };

      // Mock para criação
      mockApi.post.mockResolvedValue({ data: createdCategory });
      
      // Mock para busca por ID
      mockApi.get.mockResolvedValue({ data: createdCategory });

      // Criar categoria
      const created = await categoryService.create(newCategoryData);
      expect(created).toEqual(createdCategory);

      // Buscar categoria criada
      const fetched = await categoryService.getById('6'); // eslint-disable-line testing-library/no-await-sync-query
      expect(fetched).toEqual(createdCategory);

      expect(mockApi.post).toHaveBeenCalledWith('/categories', newCategoryData);
      expect(mockApi.get).toHaveBeenCalledWith('/categories/6');
    });

    it('deve atualizar e buscar categoria', async () => {
      const updateData = {
        name: 'Health & Wellness',
        subcategories: ['Doctor', 'Pharmacy', 'Insurance', 'Gym']
      };

      const updatedCategory = {
        ...mockCategory,
        ...updateData,
        updated_at: '2024-01-15T15:00:00Z'
      };

      // Mock para atualização
      mockApi.put.mockResolvedValue({ data: updatedCategory });
      
      // Mock para busca por ID
      mockApi.get.mockResolvedValue({ data: updatedCategory });

      // Atualizar categoria
      const updated = await categoryService.update('1', updateData);
      expect(updated).toEqual(updatedCategory);

      // Buscar categoria atualizada
      const fetched = await categoryService.getById('1'); // eslint-disable-line testing-library/no-await-sync-query
      expect(fetched).toEqual(updatedCategory);

      expect(mockApi.put).toHaveBeenCalledWith('/categories/1', updateData);
      expect(mockApi.get).toHaveBeenCalledWith('/categories/1');
    });

    it('deve buscar todas as categorias após criar nova', async () => {
      const newCategoryData = {
        name: 'Entertainment',
        type: 'EXPENSE' as const,
        subcategories: ['Movies', 'Games']
      };

      const createdCategory = {
        ...newCategoryData,
        id: '7',
        user_id: 'user1',
        created_at: '2024-01-15T16:00:00Z',
        updated_at: '2024-01-15T16:00:00Z'
      };

      const updatedCategoriesList = [...mockCategories, createdCategory];

      // Mock para criação
      mockApi.post.mockResolvedValue({ data: createdCategory });
      
      // Mock para buscar todas
      mockApi.get.mockResolvedValue({ data: updatedCategoriesList });

      // Criar categoria
      await categoryService.create(newCategoryData);

      // Buscar todas as categorias
      const allCategories = await categoryService.getAll();
      expect(allCategories).toEqual(updatedCategoriesList);

      expect(mockApi.post).toHaveBeenCalledWith('/categories', newCategoryData);
      expect(mockApi.get).toHaveBeenCalledWith('/categories', { params: undefined });
    });
  });

  describe('tratamento de tipos', () => {
    it('deve filtrar corretamente por tipo expense', async () => {
      mockApi.get.mockResolvedValue({ data: mockExpenseCategories });

      const result = await categoryService.getAll('expense');

      expect(mockApi.get).toHaveBeenCalledWith('/categories', {
        params: { type: 'expense' }
      });
      expect(result).toEqual(mockExpenseCategories);
    });

    it('deve filtrar corretamente por tipo income', async () => {
      mockApi.get.mockResolvedValue({ data: mockIncomeCategories });

      const result = await categoryService.getAll('income');

      expect(mockApi.get).toHaveBeenCalledWith('/categories', {
        params: { type: 'income' }
      });
      expect(result).toEqual(mockIncomeCategories);
    });
  });

  describe('tratamento de subcategorias', () => {
    it('deve criar categoria com múltiplas subcategorias', async () => {
      const categoryWithManySubcategories = {
        name: 'Shopping',
        type: 'EXPENSE' as const,
        subcategories: ['Clothes', 'Electronics', 'Books', 'Gifts', 'Home Decor']
      };

      const createdCategory = {
        ...categoryWithManySubcategories,
        id: '8',
        user_id: 'user1',
        created_at: '2024-01-15T17:00:00Z',
        updated_at: '2024-01-15T17:00:00Z'
      };

      mockApi.post.mockResolvedValue({ data: createdCategory });

      const result = await categoryService.create(categoryWithManySubcategories);

      expect(result.subcategories).toHaveLength(5);
      expect(result.subcategories).toEqual(categoryWithManySubcategories.subcategories);
    });

    it('deve atualizar subcategorias removendo algumas', async () => {
      const updateData = {
        subcategories: ['Restaurant'] // Remove 'Groceries'
      };

      const updatedCategory = {
        ...mockCategory,
        ...updateData,
        updated_at: '2024-01-15T18:00:00Z'
      };

      mockApi.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('1', updateData);

      expect(result.subcategories).toHaveLength(1);
      expect(result.subcategories).toEqual(['Restaurant']);
    });

    it('deve atualizar subcategorias adicionando novas', async () => {
      const updateData = {
        subcategories: ['Restaurant', 'Groceries', 'Fast Food', 'Coffee Shop']
      };

      const updatedCategory = {
        ...mockCategory,
        ...updateData,
        updated_at: '2024-01-15T19:00:00Z'
      };

      mockApi.put.mockResolvedValue({ data: updatedCategory });

      const result = await categoryService.update('1', updateData);

      expect(result.subcategories).toHaveLength(4);
      expect(result.subcategories).toContain('Coffee Shop');
    });
  });

  describe('tratamento de erros de rede', () => {
    it('deve propagar erro de timeout', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      };

      mockApi.get.mockRejectedValue(timeoutError);

      await expect(categoryService.getAll()).rejects.toEqual(timeoutError);
    });

    it('deve propagar erro de conexão', async () => {
      const connectionError = {
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:8000'
      };

      mockApi.post.mockRejectedValue(connectionError);

      await expect(categoryService.create({
        name: 'Test Category',
        type: 'EXPENSE',
        subcategories: []
      })).rejects.toEqual(connectionError);
    });

    it('deve propagar erro de servidor interno', async () => {
      const serverError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { detail: 'Database connection failed' }
        }
      };

      mockApi.get.mockRejectedValue(serverError);

      await expect(categoryService.getById('1')).rejects.toEqual(serverError);
    });
  });
});