import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { categoryService } from '../services/categories';

export const useCategories = (type?: 'expense' | 'income') => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAll(type);
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch categories.');
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCategory = await categoryService.create(category);
      setCategories((prev) => [newCategory, ...prev]);
      return newCategory;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add category.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedCategory = await categoryService.update(id, category);
      setCategories((prev) =>
        prev.map((item) => (item.id === id ? updatedCategory : item))
      );
      return updatedCategory;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update category.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete category.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    categories,
    isLoading,
    error,
    refreshCategories: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
};
