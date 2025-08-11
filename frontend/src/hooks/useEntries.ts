import { useState, useEffect, useCallback, useMemo } from 'react';
import { Entry, EntrySummary, MonthlySummary } from '../types';
import { entryService } from '../services/entries';

interface UseEntriesOptions {
  startDate?: string;
  endDate?: string;
  type?: 'EXPENSE' | 'INCOME';
  categoryId?: string;
  platform?: string;
  shift_tag?: string;
  city?: string;
}

export const useEntries = (options: UseEntriesOptions = {}) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<EntrySummary | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Memoizar as opções para evitar re-execuções desnecessárias
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedOptions = useMemo(() => options, [
    options.startDate,
    options.endDate,
    options.type,
    options.categoryId
  ]);
  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (memoizedOptions.startDate) params.start_date = memoizedOptions.startDate;
      if (memoizedOptions.endDate) params.end_date = memoizedOptions.endDate;
  if (memoizedOptions.type) params.type = memoizedOptions.type;
      if (memoizedOptions.categoryId) params.category_id = memoizedOptions.categoryId;
  if (memoizedOptions.platform) params.platform = memoizedOptions.platform;
  if (memoizedOptions.shift_tag) params.shift_tag = memoizedOptions.shift_tag;
  if (memoizedOptions.city) params.city = memoizedOptions.city;

      const data = await entryService.getAll(params);
      setEntries(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao buscar lançamentos.');
      console.error('Erro ao buscar lançamentos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [memoizedOptions]);
  const fetchSummary = useCallback(async () => {
    if (!memoizedOptions.startDate || !memoizedOptions.endDate) return;

    setIsSummaryLoading(true);
    try {
      const params: Record<string, string> = {};
      if (memoizedOptions.startDate) params.start_date = memoizedOptions.startDate;
      if (memoizedOptions.endDate) params.end_date = memoizedOptions.endDate;

      const data = await entryService.getSummary(params);
      setSummary(data);
    } catch (err: any) {
      console.error('Erro ao buscar resumo:', err);    } finally {
      setIsSummaryLoading(false);
    }
  }, [memoizedOptions.startDate, memoizedOptions.endDate]);

  const fetchLastSixMonthsSummaries = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const now = new Date();
      const promises = [];

      // Buscar resumos dos últimos 6 meses
      for (let i = 0; i < 6; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1; // getMonth() é 0-indexed
        promises.push(entryService.getMonthlySummary(year, month));
      }      const results: MonthlySummary[] = await Promise.all(promises);
      setMonthlySummaries(results.reverse()); // Reverter para ordem cronológica
    } catch (err: any) {
      console.error('Erro ao buscar resumos mensais:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (options.startDate && options.endDate) {
      fetchSummary();
    }
  }, [fetchSummary, options.startDate, options.endDate]);

  const addEntry = async (entry: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newEntry = await entryService.create(entry);
      setEntries((prev) => [newEntry, ...prev]);
      // Atualizar resumos após adicionar um novo lançamento
      if (options.startDate && options.endDate) {
        fetchSummary();
      }
      fetchLastSixMonthsSummaries();
      return newEntry;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao adicionar lançamento.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEntry = async (id: string, entry: Partial<Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedEntry = await entryService.update(id, entry);
      setEntries((prev) =>
        prev.map((item) => (item.id === id ? updatedEntry : item))
      );
      // Atualizar resumos após editar um lançamento
      if (options.startDate && options.endDate) {
        fetchSummary();
      }
      fetchLastSixMonthsSummaries();
      return updatedEntry;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao atualizar lançamento.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await entryService.delete(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
      // Atualizar resumos após excluir um lançamento
      if (options.startDate && options.endDate) {
        fetchSummary();
      }
      fetchLastSixMonthsSummaries();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao excluir lançamento.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entries,
    summary,
    monthlySummaries,
    isLoading,
    isSummaryLoading,
    error,
    refreshEntries: fetchEntries,
    fetchLastSixMonthsSummaries,
    addEntry,
    updateEntry,
    deleteEntry,
  };
};
