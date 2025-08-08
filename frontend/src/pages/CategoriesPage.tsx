import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../types';
import Layout from '../components/Layout';
import CategoryList from '../components/CategoryList';
import CategoryForm from '../components/CategoryForm';

const CategoriesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeType, setActiveType] = useState<'income' | 'expense'>('expense');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    categories,
    isLoading,
    error,
    refreshCategories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  // Filtra categorias baseado no tipo ativo (receita/despesa) e termo de busca
  const filteredCategories = categories.filter(
    category => category.type.toLowerCase() === activeType &&
    (searchTerm === '' || category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
    } else {
      setSelectedCategory(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = async (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      // Converte o tipo para o formato esperado pelo backend
      const categoryToSave = {
        ...category,
        type: category.type.toUpperCase() as 'INCOME' | 'EXPENSE'
      };

      if (selectedCategory) {
        await updateCategory(selectedCategory.id, categoryToSave);
      } else {
        await addCategory(categoryToSave);
      }
      handleCloseModal();
      refreshCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setActiveType(type);
    setSearchTerm(''); // Limpa a busca ao trocar o tipo
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Categorias</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nova Categoria
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Alternador de tipo */}
        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleTypeChange('expense')}
              className={`px-4 py-2 rounded-md ${
                activeType === 'expense'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => handleTypeChange('income')}
              className={`px-4 py-2 rounded-md ${
                activeType === 'income'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Receitas
            </button>
          </div>
        </div>

        {/* Campo de busca */}
        <div className="bg-white shadow-sm rounded-lg p-4">
          <div className="max-w-md mx-auto">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Limpar busca</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <CategoryList
          categories={filteredCategories}
          isLoading={isLoading}
          activeType={activeType}
          onEdit={handleOpenModal}
          onDelete={handleDeleteCategory}
        />

        <CategoryForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCategory}
          category={selectedCategory}
          defaultType={activeType}
        />
      </div>
    </Layout>
  );
};

export default CategoriesPage;