import React, { useState } from "react";
import { AuditLogFilter } from "../../services/auditLogs";
import { Search, Filter, Calendar, X } from "lucide-react";

interface AuditLogsFiltersProps {
  filters: AuditLogFilter;
  onFiltersChange: (filters: AuditLogFilter) => void;
  availableActions: string[];
  availableResourceTypes: string[];
  loading: boolean;
}

export function AuditLogsFilters({
  filters,
  onFiltersChange,
  availableActions,
  availableResourceTypes,
  loading,
}: AuditLogsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<AuditLogFilter>(filters);

  const handleFilterChange = (
    key: keyof AuditLogFilter,
    value: string | number | undefined,
  ) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: AuditLogFilter = {
      skip: 0,
      limit: 100,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.entries(localFilters).some(
    ([key, value]) =>
      key !== "skip" && key !== "limit" && value !== undefined && value !== "",
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              Filtros ativos
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? "Ocultar" : "Expandir"}
          </button>
        </div>
      </div>

      {/* Filtros básicos - sempre visíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por usuário
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={localFilters.performed_by || ""}
              onChange={(e) =>
                handleFilterChange("performed_by", e.target.value)
              }
              placeholder="Email do usuário..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ação
          </label>
          <select
            value={localFilters.action || ""}
            onChange={(e) => handleFilterChange("action", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as ações</option>
            {availableActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Recurso
          </label>
          <select
            value={localFilters.resource_type || ""}
            onChange={(e) =>
              handleFilterChange("resource_type", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            {availableResourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros avançados - expansíveis */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Data Inicial</span>
              </div>
            </label>
            <input
              type="date"
              value={localFilters.start_date || ""}
              onChange={(e) => handleFilterChange("start_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Data Final</span>
              </div>
            </label>
            <input
              type="date"
              value={localFilters.end_date || ""}
              onChange={(e) => handleFilterChange("end_date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Buscando..." : "Aplicar Filtros"}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-700">Limite:</label>
          <select
            value={localFilters.limit || 100}
            onChange={(e) =>
              handleFilterChange("limit", parseInt(e.target.value))
            }
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>
    </div>
  );
}
