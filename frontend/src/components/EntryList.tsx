import React from 'react';
import { Entry } from '../types';

interface EntryListProps {
  entries: Entry[];
  isLoading: boolean;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

const EntryList: React.FC<EntryListProps> = ({ entries, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-10 w-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
          Nenhum lançamento encontrado. Tente ajustar os filtros ou adicione um novo lançamento.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="divide-y divide-gray-200">
        <div className="hidden sm:grid sm:grid-cols-7 sm:gap-4 sm:px-6 sm:py-3 bg-gray-50 text-sm font-medium text-gray-500">
          <div>Data</div>
          <div>Descrição</div>
          <div>Categoria</div>
          <div>Plataforma</div>
          <div className="text-right">Bruto</div>
          <div className="text-right">Líquido</div>
          <div className="text-right">Ações</div>
        </div>

        {entries.map((entry) => {
          const isRide = entry.type === 'INCOME' && (entry.gross_amount || entry.platform);
          return (
            <div key={entry.id} className="px-4 py-4 sm:px-6 sm:grid sm:grid-cols-7 sm:gap-4">
              <div className="text-sm font-medium text-gray-900 sm:flex sm:items-center">
                {new Date(entry.date).toLocaleDateString()}
              </div>
              <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:flex sm:items-center">
                {entry.description}
              </div>
              <div className="mt-1 text-sm text-gray-500 sm:mt-0 sm:flex sm:items-center">
                {entry.category?.name || 'Sem categoria'}
              </div>
              <div className="mt-1 text-sm text-gray-500 sm:mt-0 sm:flex sm:items-center">
                {isRide ? (entry.platform || '-') : '-'}
              </div>
              <div className="mt-1 text-sm sm:mt-0 sm:text-right sm:flex sm:items-center sm:justify-end">
                {isRide && entry.gross_amount ? `R$ ${entry.gross_amount.toFixed(2)}` : '-'}
              </div>
              <div className={`mt-1 text-sm sm:mt-0 sm:text-right sm:flex sm:items-center sm:justify-end ${
                entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
              }`}>
                {entry.type === 'INCOME' ? '+' : '-'} R$ {entry.amount.toFixed(2)}
              </div>
              <div className="mt-2 sm:mt-0 sm:text-right sm:flex sm:items-center sm:justify-end">
                <button
                  onClick={() => onEdit(entry)}
                  className="inline-flex items-center py-1.5 px-3 text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="inline-flex items-center py-1.5 px-3 text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EntryList;
