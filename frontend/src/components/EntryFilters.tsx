import React from "react";
import { Category } from "../types";

interface EntryFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
    type: "" | "INCOME" | "EXPENSE";
    categoryId: number;
    platform: string;
    shift_tag: string;
    city: string;
  };
  categories: Category[];
  isLoading: boolean;
  onFilterChange: (filters: EntryFiltersProps["filters"]) => void;
}

const EntryFilters: React.FC<EntryFiltersProps> = ({
  filters,
  categories,
  isLoading,
  onFilterChange,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const processedValue =
      name === "categoryId" ? (value === "" ? 0 : Number(value)) : value;
    onFilterChange({
      ...filters,
      [name]: processedValue,
    });
  };

  const handleReset = () => {
    onFilterChange({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
      type: "",
      categoryId: 0,
      platform: "",
      shift_tag: "",
      city: "",
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h2 className="text-lg font-medium text-gray-900 mb-3">Filtros</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700"
          >
            Data Inicial
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700"
          >
            Data Final
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700"
          >
            Tipo
          </label>
          <select
            id="type"
            name="type"
            value={filters.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Todos</option>
            <option value="INCOME">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700"
          >
            Categoria
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={filters.categoryId}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="platform"
            className="block text-sm font-medium text-gray-700"
          >
            Plataforma
          </label>
          <select
            id="platform"
            name="platform"
            value={filters.platform}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Todas</option>
            <option value="UBER">UBER</option>
            <option value="99">99</option>
            <option value="INDRIVE">INDRIVE</option>
            <option value="OUTRA">OUTRA</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="shift_tag"
            className="block text-sm font-medium text-gray-700"
          >
            Turno
          </label>
          <select
            id="shift_tag"
            name="shift_tag"
            value={filters.shift_tag}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Todos</option>
            <option value="MANHA">Manhã</option>
            <option value="TARDE">Tarde</option>
            <option value="NOITE">Noite</option>
            <option value="MADRUGADA">Madrugada</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700"
          >
            Cidade
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={filters.city}
            onChange={handleChange}
            placeholder="Cidade"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default EntryFilters;
