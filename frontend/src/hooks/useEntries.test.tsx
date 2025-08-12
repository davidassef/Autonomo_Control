import { renderHook, act, waitFor } from '@testing-library/react';
import { useEntries } from './useEntries';
import { entryService } from '../services/entries';
import { mockEntries, mockSummary, mockMonthlySummaries, resetAllMocks } from '../utils/test-utils';

// Mock do serviço de entradas
jest.mock('../services/entries');

const mockEntryService = entryService as jest.Mocked<typeof entryService>;

describe('useEntries Hook', () => {
  beforeEach(() => {
    resetAllMocks();
    
    // Configurar mocks padrão
    mockEntryService.getAll.mockResolvedValue(mockEntries);
    mockEntryService.getSummary.mockResolvedValue(mockSummary);
    mockEntryService.getMonthlySummary.mockResolvedValue(mockMonthlySummaries[0]);
    mockEntryService.create.mockResolvedValue(mockEntries[0]);
    mockEntryService.update.mockResolvedValue(mockEntries[0]);
    mockEntryService.delete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => useEntries());
    
    expect(result.current.entries).toEqual([]);
    expect(result.current.summary).toBeNull();
    expect(result.current.monthlySummaries).toEqual([]);
    expect(result.current.isLoading).toBe(true); // Inicia como true devido ao fetchEntries
    expect(result.current.isSummaryLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve buscar entradas na inicialização', async () => {
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(mockEntryService.getAll).toHaveBeenCalledWith({});
    });
    
    await waitFor(() => {
      expect(result.current.entries).toEqual(mockEntries);
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('deve buscar entradas com filtros', async () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      type: 'EXPENSE' as const,
      categoryId: '1'
    };
    
    renderHook(() => useEntries(options));
    
    await waitFor(() => {
      expect(mockEntryService.getAll).toHaveBeenCalledWith({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        type: 'EXPENSE',
        category_id: '1'
      });
    });
  });

  it('deve buscar resumo quando startDate e endDate são fornecidos', async () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const { result } = renderHook(() => useEntries(options));
    
    await waitFor(() => {
      expect(mockEntryService.getSummary).toHaveBeenCalledWith({
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      });
    });
    
    await waitFor(() => {
      expect(result.current.summary).toEqual(mockSummary);
    });
  });

  it('não deve buscar resumo quando startDate ou endDate não são fornecidos', async () => {
    renderHook(() => useEntries({ startDate: '2024-01-01' }));
    
    await waitFor(() => {
      expect(mockEntryService.getSummary).not.toHaveBeenCalled();
    });
  });

  it('deve tratar erro ao buscar entradas', async () => {
    const errorMessage = 'Erro ao buscar entradas';
    mockEntryService.getAll.mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('deve tratar erro genérico ao buscar entradas', async () => {
    mockEntryService.getAll.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useEntries());
    
    await waitFor(() => {
      expect(result.current.error).toBe('Falha ao buscar lançamentos.');
    });
    
    expect(result.current.isLoading).toBe(false);
  });

  it('deve adicionar nova entrada', async () => {
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const newEntry = {
      description: 'Nova entrada',
      amount: 200,
      type: 'INCOME' as const,
      date: '2024-01-15',
      category_id: '1'
    };
    
    await act(async () => {
      await result.current.addEntry(newEntry);
    });
    
    expect(mockEntryService.create).toHaveBeenCalledWith(newEntry);
    expect(result.current.entries).toEqual([mockEntries[0], ...mockEntries]);
  });

  it('deve atualizar entrada existente', async () => {
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const updateData = { description: 'Entrada atualizada' };
    
    await act(async () => {
      await result.current.updateEntry('1', updateData);
    });
    
    expect(mockEntryService.update).toHaveBeenCalledWith('1', updateData);
  });

  it('deve excluir entrada', async () => {
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.deleteEntry('1');
    });
    
    expect(mockEntryService.delete).toHaveBeenCalledWith('1');
    expect(result.current.entries).toEqual(mockEntries.filter(e => e.id !== '1'));
  });

  it('deve tratar erro ao adicionar entrada', async () => {
    const errorMessage = 'Erro ao adicionar entrada';
    mockEntryService.create.mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });
    
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const newEntry = {
      description: 'Nova entrada',
      amount: 200,
      type: 'INCOME' as const,
      date: '2024-01-15',
      category_id: '1'
    };
    
    await act(async () => {
      try {
        await result.current.addEntry(newEntry);
      } catch (error) {
        // Esperamos que lance erro
      }
    });
    
    expect(result.current.error).toBe(errorMessage);
  });

  it('deve tratar erro ao atualizar entrada', async () => {
    const errorMessage = 'Erro ao atualizar entrada';
    mockEntryService.update.mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });
    
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      try {
        await result.current.updateEntry('1', { description: 'Atualizada' });
      } catch (error) {
        // Esperamos que lance erro
      }
    });
    
    expect(result.current.error).toBe(errorMessage);
  });

  it('deve tratar erro ao excluir entrada', async () => {
    const errorMessage = 'Erro ao excluir entrada';
    mockEntryService.delete.mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });
    
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      try {
        await result.current.deleteEntry('1');
      } catch (error) {
        // Esperamos que lance erro
      }
    });
    
    expect(result.current.error).toBe(errorMessage);
  });

  it('deve buscar resumos dos últimos 6 meses', async () => {
    const { result } = renderHook(() => useEntries());
    
    await act(async () => {
      await result.current.fetchLastSixMonthsSummaries();
    });
    
    // Deve chamar getMonthlySummary 6 vezes (últimos 6 meses)
    expect(mockEntryService.getMonthlySummary).toHaveBeenCalledTimes(6);
    expect(result.current.monthlySummaries).toHaveLength(6);
  });

  it('deve atualizar resumos após adicionar entrada com datas', async () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const { result } = renderHook(() => useEntries(options));
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const newEntry = {
      description: 'Nova entrada',
      amount: 200,
      type: 'INCOME' as const,
      date: '2024-01-15',
      category_id: '1'
    };
    
    await act(async () => {
      await result.current.addEntry(newEntry);
    });
    
    // Deve chamar getSummary novamente após adicionar
    expect(mockEntryService.getSummary).toHaveBeenCalledTimes(2);
    // Deve chamar getMonthlySummary para atualizar resumos mensais
    expect(mockEntryService.getMonthlySummary).toHaveBeenCalled();
  });

  it('deve atualizar resumos após atualizar entrada com datas', async () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const { result } = renderHook(() => useEntries(options));
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.updateEntry('1', { description: 'Atualizada' });
    });
    
    // Deve chamar getSummary novamente após atualizar
    expect(mockEntryService.getSummary).toHaveBeenCalledTimes(2);
    // Deve chamar getMonthlySummary para atualizar resumos mensais
    expect(mockEntryService.getMonthlySummary).toHaveBeenCalled();
  });

  it('deve atualizar resumos após excluir entrada com datas', async () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const { result } = renderHook(() => useEntries(options));
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.deleteEntry('1');
    });
    
    // Deve chamar getSummary novamente após excluir
    expect(mockEntryService.getSummary).toHaveBeenCalledTimes(2);
    // Deve chamar getMonthlySummary para atualizar resumos mensais
    expect(mockEntryService.getMonthlySummary).toHaveBeenCalled();
  });

  it('deve incluir filtros adicionais na busca', async () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      platform: 'web',
      shift_tag: 'morning',
      city: 'São Paulo'
    };
    
    renderHook(() => useEntries(options));
    
    await waitFor(() => {
      expect(mockEntryService.getAll).toHaveBeenCalledWith({
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        platform: 'web',
        shift_tag: 'morning',
        city: 'São Paulo'
      });
    });
  });

  it('deve refazer busca ao chamar refreshEntries', async () => {
    const { result } = renderHook(() => useEntries());
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // Limpa as chamadas anteriores
    mockEntryService.getAll.mockClear();
    
    await act(async () => {
      await result.current.refreshEntries();
    });
    
    expect(mockEntryService.getAll).toHaveBeenCalledTimes(1);
  });

  it('deve memoizar opções para evitar re-execuções desnecessárias', () => {
    const options = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      type: 'EXPENSE' as const,
      categoryId: '1'
    };
    
    const { rerender } = renderHook(
      ({ opts }) => useEntries(opts),
      { initialProps: { opts: options } }
    );
    
    // Limpa as chamadas iniciais
    mockEntryService.getAll.mockClear();
    
    // Re-renderiza com as mesmas opções
    rerender({ opts: options });
    
    // Não deve fazer nova chamada se as opções não mudaram
    expect(mockEntryService.getAll).not.toHaveBeenCalled();
  });

  it('deve fazer nova busca quando opções mudam', async () => {
    const initialOptions = {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    };
    
    const { rerender } = renderHook(
      ({ opts }) => useEntries(opts),
      { initialProps: { opts: initialOptions } }
    );
    
    // Aguarda carregamento inicial
    await waitFor(() => {
      expect(mockEntryService.getAll).toHaveBeenCalledTimes(1);
    });
    
    // Muda as opções
    const newOptions = {
      startDate: '2024-02-01',
      endDate: '2024-02-28'
    };
    
    rerender({ opts: newOptions });
    
    await waitFor(() => {
      expect(mockEntryService.getAll).toHaveBeenCalledTimes(2);
    });
    
    expect(mockEntryService.getAll).toHaveBeenLastCalledWith({
      start_date: '2024-02-01',
      end_date: '2024-02-28'
    });
  });
});