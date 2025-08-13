import React from 'react';
import { AuditLog, auditLogsService } from '../../services/auditLogs';
import { X, User, Calendar, Globe, FileText, Tag, Activity } from 'lucide-react';

interface AuditLogDetailsModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditLogDetailsModal({ log, isOpen, onClose }: AuditLogDetailsModalProps) {
  if (!isOpen || !log) {
    return null;
  }

  const formatDetails = (details: any) => {
    if (!details) return 'N/A';
    
    if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return details;
      }
    }
    
    return JSON.stringify(details, null, 2);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes do Log de Auditoria
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações básicas */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Activity className="h-4 w-4" />
                    <span>Ação</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      auditLogsService.getActionBadgeColor(log.action)
                    }`}>
                      {auditLogsService.formatAction(log.action)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Tag className="h-4 w-4" />
                    <span>Tipo de Recurso</span>
                  </label>
                  <span className="text-sm text-gray-900">
                    {auditLogsService.formatResourceType(log.resource_type)}
                  </span>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <User className="h-4 w-4" />
                    <span>Usuário</span>
                  </label>
                  <span className="text-sm text-gray-900">
                    {log.performed_by || 'Sistema'}
                  </span>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Data e Hora</span>
                  </label>
                  <span className="text-sm text-gray-900">
                    {auditLogsService.formatDate(log.timestamp)}
                  </span>
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <Globe className="h-4 w-4" />
                    <span>Endereço IP</span>
                  </label>
                  <span className="text-sm text-gray-900 font-mono">
                    {log.ip_address || 'N/A'}
                  </span>
                </div>

                {log.resource_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      ID do Recurso
                    </label>
                    <span className="text-sm text-gray-900 font-mono">
                      {log.resource_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Descrição e detalhes */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4" />
                    <span>Descrição</span>
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {log.description || 'Nenhuma descrição disponível'}
                  </p>
                </div>

                {log.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Detalhes Técnicos
                    </label>
                    <pre className="text-xs text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap border">
                      {formatDetails(log.details)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}