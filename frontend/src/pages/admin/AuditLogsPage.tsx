import React, { useState, useEffect } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { AuditLogsFilters } from "../../components/admin/AuditLogsFilters";
import { AuditLogsStats } from "../../components/admin/AuditLogsStats";
import { AuditLogsTable } from "../../components/admin/AuditLogsTable";
import { AuditLogDetailsModal } from "../../components/admin/AuditLogDetailsModal";
import { AuditLog, AuditLogFilter } from "../../services/auditLogs";
import { Shield, Trash2, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import Layout from "../../components/Layout";

export function AuditLogsPage() {
  const {
    logs,
    stats,
    availableActions,
    availableResourceTypes,
    loading,
    error,
    loadLogs,
    loadStats,
    cleanupLogs,
    refreshFilters,
  } = useAuditLogs();

  const [filters, setFilters] = useState<AuditLogFilter>({
    skip: 0,
    limit: 100,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadLogs(filters);
    loadStats();
    refreshFilters();
  }, [loadLogs, loadStats, refreshFilters, filters]);

  // Recarregar logs quando filtros mudarem
  useEffect(() => {
    loadLogs(filters);
  }, [loadLogs, filters]);

  const handleFiltersChange = (newFilters: AuditLogFilter) => {
    setFilters(newFilters);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedLog(null);
    setIsDetailsModalOpen(false);
  };

  const handleCleanupLogs = async () => {
    setCleanupLoading(true);
    try {
      await cleanupLogs();
      setIsCleanupModalOpen(false);
      // Recarregar dados
      loadLogs(filters);
      loadStats();
    } catch (error) {
      console.error("Erro ao limpar logs:", error);
      toast.error("Erro ao limpar logs antigos. Tente novamente.");
    } finally {
      setCleanupLoading(false);
    }
  };

  const exportLogs = () => {
    if (!logs || logs.length === 0) {
      toast.error("Não há logs para exportar");
      return;
    }

    const csvContent = [
      // Cabeçalho
      "Data,Ação,Tipo de Recurso,Usuário,Descrição,IP,ID do Recurso",
      // Dados
      ...logs.map((log) =>
        [
          new Date(log.timestamp).toLocaleString("pt-BR"),
          log.action,
          log.resource_type,
          log.performed_by || "Sistema",
          `"${(log.description || "").replace(/"/g, '""')}"`,
          log.ip_address || "",
          log.resource_id || "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `audit_logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Logs exportados com sucesso!");
  };

  if (error) {
    return (
      <Layout>
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar logs
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Logs de Auditoria
                </h1>
                <p className="text-gray-600">
                  Monitore todas as ações realizadas no sistema
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={exportLogs}
                disabled={!logs || logs.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </button>

              <button
                onClick={() => setIsCleanupModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Logs Antigos
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <AuditLogsStats stats={stats} loading={loading} />

        {/* Filtros */}
        <AuditLogsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableActions={availableActions}
          availableResourceTypes={availableResourceTypes}
          loading={loading}
        />

        {/* Tabela de logs */}
        <AuditLogsTable
          logs={logs}
          loading={loading}
          onViewDetails={handleViewDetails}
        />

        {/* Modal de detalhes */}
        <AuditLogDetailsModal
          log={selectedLog}
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
        />

        {/* Modal de confirmação de limpeza */}
        {isCleanupModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Confirmar Limpeza de Logs
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Esta ação irá remover permanentemente todos os logs de
                          auditoria com mais de 30 dias. Esta operação não pode
                          ser desfeita.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleCleanupLogs}
                    disabled={cleanupLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cleanupLoading ? "Limpando..." : "Confirmar Limpeza"}
                  </button>
                  <button
                    onClick={() => setIsCleanupModalOpen(false)}
                    disabled={cleanupLoading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
