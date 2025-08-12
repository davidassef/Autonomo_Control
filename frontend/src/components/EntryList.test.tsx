import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import '@testing-library/jest-dom';
import EntryList from './EntryList';
import { mockEntries } from '../utils/test-utils';

const defaultProps = {
  entries: mockEntries,
  isLoading: false,
  onEdit: jest.fn(),
  onDelete: jest.fn()
};

describe('EntryList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe loading skeleton quando isLoading é true', () => {
    render(<EntryList {...defaultProps} isLoading={true} />);
    
    // Verifica se há elementos de loading (skeleton)
    const skeletonElements = screen.getAllByRole('generic');
    expect(skeletonElements.length).toBeGreaterThan(0);
    
    // Verifica se não há dados reais sendo exibidos
    expect(screen.queryByText(mockEntries[0].description)).not.toBeInTheDocument();
  });

  it('exibe mensagem quando não há entradas', () => {
    render(<EntryList {...defaultProps} entries={[]} />);
    
    expect(screen.getByText(/nenhum lançamento encontrado/i)).toBeInTheDocument();
    expect(screen.getByText(/tente ajustar os filtros/i)).toBeInTheDocument();
  });

  it('renderiza lista de entradas corretamente', () => {
    render(<EntryList {...defaultProps} />);
    
    // Verifica cabeçalhos da tabela
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Categoria')).toBeInTheDocument();
    expect(screen.getByText('Plataforma')).toBeInTheDocument();
    expect(screen.getByText('Bruto')).toBeInTheDocument();
    expect(screen.getByText('Líquido')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
    
    // Verifica se as entradas são exibidas
    mockEntries.forEach(entry => {
      expect(screen.getByText(entry.description)).toBeInTheDocument();
    });
  });

  it('formata datas corretamente', () => {
    render(<EntryList {...defaultProps} />);
    
    // Verifica se a data é formatada corretamente
    const expectedDate = new Date(mockEntries[0].date).toLocaleDateString();
    const dateElements = screen.getAllByText(expectedDate);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('exibe categoria ou "Sem categoria" quando não há categoria', () => {
    const entriesWithoutCategory = [
      {
        ...mockEntries[0],
        category: undefined
      }
    ];
    
    render(<EntryList {...defaultProps} entries={entriesWithoutCategory} />);
    
    expect(screen.getByText('Sem categoria')).toBeInTheDocument();
  });

  it('exibe plataforma apenas para entradas de renda com plataforma', () => {
    render(<EntryList {...defaultProps} />);
    
    // Entry de renda com plataforma deve mostrar a plataforma
    const incomeEntry = mockEntries.find(e => e.type === 'INCOME' && e.platform);
    expect(incomeEntry).toBeDefined();
    expect(screen.getByText(incomeEntry!.platform!)).toBeInTheDocument();
    
    // Entry de despesa deve mostrar "-"
    const expenseEntry = mockEntries.find(e => e.type === 'EXPENSE');
    expect(expenseEntry).toBeDefined();
    // Conta quantos "-" existem na coluna plataforma
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('exibe valor bruto apenas para entradas de renda com gross_amount', () => {
    render(<EntryList {...defaultProps} />);
    
    const incomeEntry = mockEntries.find(e => e.type === 'INCOME' && e.gross_amount);
    expect(incomeEntry).toBeDefined();
    const expectedGrossAmount = `R$ ${incomeEntry!.gross_amount!.toFixed(2)}`;
    expect(screen.getByText(expectedGrossAmount)).toBeInTheDocument();
  });

  it('formata valores monetários corretamente', () => {
    render(<EntryList {...defaultProps} />);
    
    mockEntries.forEach(entry => {
      const expectedAmount = `${entry.type === 'INCOME' ? '+' : '-'} R$ ${entry.amount.toFixed(2)}`;
      expect(screen.getByText(expectedAmount)).toBeInTheDocument();
    });
  });

  it('aplica cores corretas para receitas e despesas', () => {
    render(<EntryList {...defaultProps} />);
    
    mockEntries.forEach(entry => {
      const amountText = `${entry.type === 'INCOME' ? '+' : '-'} R$ ${entry.amount.toFixed(2)}`;
      const amountElement = screen.getByText(amountText);
      
      const expectedClass = entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600';
      expect(amountElement).toHaveClass(expectedClass);
    });
  });

  it('chama onEdit quando botão Editar é clicado', () => {
    render(<EntryList {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('chama onDelete quando botão Excluir é clicado', () => {
    render(<EntryList {...defaultProps} />);
    
    const deleteButtons = screen.getAllByText('Excluir');
    fireEvent.click(deleteButtons[0]);
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockEntries[0].id);
  });

  it('renderiza botões de ação para cada entrada', () => {
    render(<EntryList {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Editar');
    const deleteButtons = screen.getAllByText('Excluir');
    
    expect(editButtons).toHaveLength(mockEntries.length);
    expect(deleteButtons).toHaveLength(mockEntries.length);
  });

  it('aplica estilos corretos aos botões de ação', () => {
    render(<EntryList {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Editar');
    const deleteButtons = screen.getAllByText('Excluir');
    
    editButtons.forEach(button => {
      expect(button).toHaveClass('text-indigo-700', 'bg-indigo-100');
    });
    
    deleteButtons.forEach(button => {
      expect(button).toHaveClass('text-red-700', 'bg-red-100');
    });
  });

  it('identifica corretamente entradas de corrida', () => {
    const rideEntry = {
      ...mockEntries[0],
      type: 'INCOME' as const,
      platform: 'UBER',
      gross_amount: 100.00
    };
    
    render(<EntryList {...defaultProps} entries={[rideEntry]} />);
    
    // Deve mostrar plataforma e valor bruto para corridas
    expect(screen.getByText('UBER')).toBeInTheDocument();
    expect(screen.getByText('R$ 100.00')).toBeInTheDocument();
  });

  it('não exibe plataforma para receitas que não são corridas', () => {
    const nonRideIncome = {
      ...mockEntries[0],
      type: 'INCOME' as const,
      platform: undefined,
      gross_amount: undefined
    };
    
    render(<EntryList {...defaultProps} entries={[nonRideIncome]} />);
    
    // Deve mostrar "-" na coluna plataforma e bruto
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThanOrEqual(2); // Pelo menos 2 "-" (plataforma e bruto)
  });

  it('mantém estrutura da tabela mesmo com lista vazia após loading', () => {
    const { rerender } = render(<EntryList {...defaultProps} isLoading={true} />);
    
    // Muda para não loading com lista vazia
    rerender(<EntryList {...defaultProps} entries={[]} isLoading={false} />);
    
    // Deve mostrar mensagem de lista vazia, não a estrutura da tabela
    expect(screen.queryByText('Data')).not.toBeInTheDocument();
    expect(screen.getByText(/nenhum lançamento encontrado/i)).toBeInTheDocument();
  });

  it('renderiza corretamente com uma única entrada', () => {
    const singleEntry = [mockEntries[0]];
    render(<EntryList {...defaultProps} entries={singleEntry} />);
    
    expect(screen.getByText(singleEntry[0].description)).toBeInTheDocument();
    expect(screen.getAllByText('Editar')).toHaveLength(1);
    expect(screen.getAllByText('Excluir')).toHaveLength(1);
  });

  it('lida com entradas sem dados opcionais', () => {
    const minimalEntry = {
      id: '999',
      amount: 50.00,
      date: '2023-01-01',
      type: 'EXPENSE' as const,
      description: 'Entrada mínima',
      category_id: '1',
      user_id: '1',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };
    
    render(<EntryList {...defaultProps} entries={[minimalEntry]} />);
    
    expect(screen.getByText('Entrada mínima')).toBeInTheDocument();
    expect(screen.getByText('Sem categoria')).toBeInTheDocument();
    expect(screen.getByText('- R$ 50.00')).toBeInTheDocument();
  });
});