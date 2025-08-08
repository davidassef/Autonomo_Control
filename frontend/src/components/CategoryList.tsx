import React from 'react';
import { Category } from '../types';

// Lista de ícones para associar com nomes
const COMMON_ICONS = {
  'home': '🏠',
  'food': '🍽️',
  'grocery': '🛒',
  'transport': '🚗',
  'health': '💊',
  'education': '📚',
  'entertainment': '🎬',
  'shopping': '👜',
  'utilities': '💡',
  'travel': '✈️',
  'sports': '⚽',
  'pets': '🐾',
  'gifts': '🎁',
  'salary': '💰',
  'investment': '📈',
  'savings': '💲',
  'other': '📋',
  'bills': '📄',
  'tax': '💼',
  'car': '🚙',
};

interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  activeType: 'income' | 'expense';
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  isLoading,
  activeType,
  onEdit,
  onDelete
}) => {
  // Função para obter o emoji por nome de ícone
  const getIconEmoji = (iconName: string | undefined): string => {
    if (!iconName) return '📋'; // Ícone padrão
    return (COMMON_ICONS as any)[iconName] || '📋';
  };

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

  if (categories.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
          Nenhuma categoria de {activeType === 'income' ? 'receita' : 'despesa'} encontrada.
          Adicione uma nova categoria usando o botão acima.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="divide-y divide-gray-200">
        <div className="hidden sm:grid sm:grid-cols-12 sm:gap-4 sm:px-6 sm:py-3 bg-gray-50 text-sm font-medium text-gray-500">
          <div className="sm:col-span-4">Nome</div>
          <div className="sm:col-span-5">Subcategorias</div>
          <div className="sm:col-span-3 text-right">Ações</div>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="px-4 py-4 sm:px-6 sm:grid sm:grid-cols-12 sm:gap-4">
            <div className="sm:col-span-4 text-sm font-medium text-gray-900 sm:flex sm:items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white"
                style={{ backgroundColor: category.color || '#CBD5E1' }}
              >
                <span className="text-lg">{getIconEmoji(category.icon)}</span>
              </div>
              <div>
                {category.name}
                {category.is_default && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Padrão
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1 text-sm text-gray-500 sm:mt-0 sm:col-span-5 sm:flex sm:items-center">
              {category.subcategories && category.subcategories.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {category.subcategories.map((subcategory, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {subcategory}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">Sem subcategorias</span>
              )}
            </div>

            <div className="mt-2 sm:mt-0 sm:col-span-3 sm:text-right sm:flex sm:items-center sm:justify-end">
              <button
                onClick={() => onEdit(category)}
                disabled={category.is_default}
                className={`inline-flex items-center py-1.5 px-3 text-xs font-medium rounded mr-2 ${
                  category.is_default
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                }`}
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(category.id)}
                disabled={category.is_default}
                className={`inline-flex items-center py-1.5 px-3 text-xs font-medium rounded ${
                  category.is_default
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-red-700 bg-red-100 hover:bg-red-200'
                }`}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;