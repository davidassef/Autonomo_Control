import React, { useState } from "react";
import { useEntries } from "../hooks/useEntries";
import { useCategories } from "../hooks/useCategories";
import { Entry } from "../types";
import Layout from "../components/Layout";
import EntryForm from "../components/EntryForm";
import EntryList from "../components/EntryList";
import EntryFilters from "../components/EntryFilters";

const EntriesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
    type: "" as "" | "INCOME" | "EXPENSE",
    categoryId: 0,
    platform: "",
    shift_tag: "",
    city: "",
  });

  // Converter filtros para o formato esperado pelo useEntries
  const useEntriesFilters = {
    ...filters,
    type: filters.type === "" ? undefined : filters.type,
    platform: filters.platform || undefined,
    shift_tag: filters.shift_tag || undefined,
    city: filters.city || undefined,
  };
  const {
    entries,
    isLoading,
    error,
    refreshEntries,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useEntries(useEntriesFilters);

  const { categories, isLoading: categoriesLoading } = useCategories();

  const handleOpenModal = (entry?: Entry) => {
    if (entry) {
      setSelectedEntry(entry);
    } else {
      setSelectedEntry(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleSaveEntry = async (
    entry: Omit<
      Entry,
      "id" | "created_at" | "updated_at" | "user_id" | "category"
    >,
  ) => {
    try {
      if (selectedEntry) {
        await updateEntry(Number(selectedEntry.id), entry);
      } else {
        await addEntry(entry);
      }
      handleCloseModal();
      refreshEntries();
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
      try {
        await deleteEntry(Number(id));
      } catch (error) {
        console.error("Error deleting entry:", error);
      }
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Lançamentos</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Novo Lançamento
          </button>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <EntryFilters
          filters={filters}
          categories={categories}
          isLoading={categoriesLoading}
          onFilterChange={handleFilterChange}
        />

        <EntryList
          entries={entries}
          isLoading={isLoading}
          onEdit={handleOpenModal}
          onDelete={handleDeleteEntry}
        />

        <EntryForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEntry}
          entry={selectedEntry}
          categories={categories}
          isLoading={categoriesLoading}
        />
      </div>
    </Layout>
  );
};

export default EntriesPage;
