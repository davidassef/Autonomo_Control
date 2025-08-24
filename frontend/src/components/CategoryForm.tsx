import React, { useState, useEffect } from "react";
import { Category } from "../types";
import ColorPicker from "./ColorPicker";
import IconPicker from "./IconPicker";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    category: Omit<Category, "id" | "created_at" | "updated_at" | "user_id">,
  ) => void;
  category: Category | null;
  defaultType: "income" | "expense";
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  defaultType,
}) => {
  const [formData, setFormData] = useState<
    Omit<Category, "id" | "created_at" | "updated_at" | "user_id">
  >({
    name: "",
    type: defaultType,
    subcategories: [],
    icon: "",
    color: "",
  });

  const [subcategoryInput, setSubcategoryInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type.toLowerCase() as "income" | "expense",
        subcategories: category.subcategories || [],
        icon: category.icon || "",
        color: category.color || "",
      });
    } else {
      setFormData({
        name: "",
        type: defaultType,
        subcategories: [],
        icon: "",
        color: "",
      });
    }
    setSubcategoryInput("");
    setError(null);
  }, [category, defaultType, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddSubcategory = () => {
    if (!subcategoryInput.trim()) {
      return;
    }

    if (formData.subcategories?.includes(subcategoryInput.trim())) {
      setError("Esta subcategoria já existe");
      return;
    }

    setFormData({
      ...formData,
      subcategories: [
        ...(formData.subcategories || []),
        subcategoryInput.trim(),
      ],
    });
    setSubcategoryInput("");
    setError(null);
  };

  const handleRemoveSubcategory = (index: number) => {
    const newSubcategories = [...(formData.subcategories || [])];
    newSubcategories.splice(index, 1);
    setFormData({
      ...formData,
      subcategories: newSubcategories,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("O nome da categoria é obrigatório");
      return;
    }

    onSave(formData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubcategory();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {category ? "Editar Categoria" : "Nova Categoria"}
                  </h3>

                  {error && (
                    <div
                      className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                      role="alert"
                    >
                      <span className="block sm:inline">{error}</span>
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nome
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
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
                        value={formData.type}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subcategorias
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={subcategoryInput}
                          onChange={(e) => setSubcategoryInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Adicionar subcategoria"
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md rounded-r-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubcategory}
                          className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Adicionar
                        </button>
                      </div>
                      {formData.subcategories &&
                      formData.subcategories.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.subcategories.map((subcategory, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {subcategory}
                              <button
                                type="button"
                                onClick={() => handleRemoveSubcategory(index)}
                                className="ml-1.5 text-gray-500 hover:text-gray-700"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          Nenhuma subcategoria adicionada
                        </p>
                      )}
                    </div>

                    {/* Campos para ícone e cor com os novos componentes */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="icon"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Ícone
                        </label>
                        <div className="mt-1">
                          <IconPicker
                            value={formData.icon || ""}
                            onChange={(value) =>
                              setFormData({ ...formData, icon: value })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="color"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Cor
                        </label>
                        <div className="mt-1">
                          <ColorPicker
                            value={formData.color || ""}
                            onChange={(value) =>
                              setFormData({ ...formData, color: value })
                            }
                          />
                        </div>
                      </div>
                    </div>
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

export default CategoryForm;
