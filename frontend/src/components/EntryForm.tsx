import React, { useState, useEffect } from 'react';
import { Entry, Category } from '../types';

interface EntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>) => void;
  entry: Entry | null;
  categories: Category[];
  isLoading: boolean;
}

const EntryForm: React.FC<EntryFormProps> = ({
  isOpen,
  onClose,
  onSave,
  entry,
  categories,
  isLoading,
}) => {
  const [formData, setFormData] = useState<Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  type: 'EXPENSE',
    description: '',
    category_id: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (entry) {
      setFormData({
        amount: entry.amount,
        date: entry.date.split('T')[0],
        type: entry.type,
        description: entry.description,
        category_id: entry.category_id,
      });
    } else {
      setFormData({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
                type: 'EXPENSE',
        description: '',
        category_id: '',
      });
    }
  }, [entry, isOpen]);

  useEffect(() => {
    if (categories.length > 0) {
            setFilteredCategories(categories.filter(cat => cat.type.toUpperCase() === formData.type));
    }
  }, [categories, formData.type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else if (name === 'type') {
      setFormData({
        ...formData,
                [name]: value as 'INCOME' | 'EXPENSE',
        category_id: '', // Reset category when type changes
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.amount <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }

    if (!formData.description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }

    if (!formData.category_id) {
      setError('Selecione uma categoria.');
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {entry ? 'Editar Lançamento' : 'Novo Lançamento'}
                  </h3>

                  {error && (
                    <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Tipo
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="expense">Despesa</option>
                          <option value="EXPENSE">Despesa</option>
                          <option value="INCOME">Receita</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="amount"
                          id="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Data
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Descrição
                      </label>
                      <input
                        type="text"
                        name="description"
                        id="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                        Categoria
                      </label>
                      <select
                        id="category_id"
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {filteredCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.type === 'INCOME' && (
                      <div className="border-t pt-4 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700">Dados de Corrida (opcional)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="platform">Plataforma</label>
                            <select
                              name="platform"
                              id="platform"
                              value={(formData as any).platform || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">--</option>
                              <option value="UBER">UBER</option>
                              <option value="99">99</option>
                              <option value="INDRIVE">INDRIVE</option>
                              <option value="OUTRA">OUTRA</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="city">Cidade</label>
                            <input
                              type="text"
                              name="city"
                              id="city"
                              value={(formData as any).city || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="distance_km">Distância (km)</label>
                            <input
                              type="number"
                              step="0.01"
                              name="distance_km"
                              id="distance_km"
                              value={(formData as any).distance_km || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="duration_min">Duração (min)</label>
                            <input
                              type="number"
                              name="duration_min"
                              id="duration_min"
                              value={(formData as any).duration_min || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="gross_amount">Valor Bruto</label>
                            <input
                              type="number"
                              step="0.01"
                              name="gross_amount"
                              id="gross_amount"
                              value={(formData as any).gross_amount || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="platform_fee">Taxa Plataforma</label>
                            <input
                              type="number"
                              step="0.01"
                              name="platform_fee"
                              id="platform_fee"
                              value={(formData as any).platform_fee || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="tips_amount">Gorjetas</label>
                            <input
                              type="number"
                              step="0.01"
                              name="tips_amount"
                              id="tips_amount"
                              value={(formData as any).tips_amount || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="shift_tag">Turno</label>
                            <select
                              name="shift_tag"
                              id="shift_tag"
                              value={(formData as any).shift_tag || ''}
                              onChange={handleChange}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="">--</option>
                              <option value="MANHA">Manhã</option>
                              <option value="TARDE">Tarde</option>
                              <option value="NOITE">Noite</option>
                              <option value="MADRUGADA">Madrugada</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Preencha qualquer campo adicional para registrar detalhes da corrida. O valor líquido será calculado no backend se você informar bruto, taxa e gorjeta.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EntryForm;
