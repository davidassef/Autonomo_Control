import api from './api';
import { Entry, EntrySummary, MonthlySummary } from '../types';

export const entryService = {
  async getAll(params?: {
    start_date?: string;
    end_date?: string;
    type?: 'expense' | 'income';
    category_id?: string;
  }): Promise<Entry[]> {
    const response = await api.get<Entry[]>('/entries', { params });
    return response.data;
  },

  async getById(id: string): Promise<Entry> {
    const response = await api.get<Entry>(`/entries/${id}`);
    return response.data;
  },

  async create(entry: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>): Promise<Entry> {
    const response = await api.post<Entry>('/entries', entry);
    return response.data;
  },

  async update(id: string, entry: Partial<Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>>): Promise<Entry> {
    const response = await api.put<Entry>(`/entries/${id}`, entry);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/entries/${id}`);
  },

  async getSummary(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<EntrySummary> {
    const response = await api.get<EntrySummary>('/entries/summary', { params });
    return response.data;
  },
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const response = await api.get<MonthlySummary>(`/entries/summary/monthly/${year}/${month}`);
    return response.data;
  },
};
