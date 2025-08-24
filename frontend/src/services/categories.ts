import api from './api';
import { Category } from '../types';

export const categoryService = {
  async getAll(type?: 'expense' | 'income'): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories', {
      params: type ? { type } : undefined,
    });
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Category> {
    const response = await api.post<Category>('/categories', category);
    return response.data;
  },

  async update(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>>): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, category);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
