import React from 'react';
import { AuditLogStats } from '../../services/auditLogs';
import { BarChart3, Users, Activity, Calendar, TrendingUp } from 'lucide-react';

interface AuditLogsStatsProps {
  stats: AuditLogStats | null;
  loading: boolean;
}

export function AuditLogsStats({ stats, loading }: AuditLogsStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Estatísticas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total de Logs',
      value: stats.total_logs.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Usuários Únicos',
      value: stats.unique_users.toLocaleString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Logs Hoje',
      value: stats.logs_today.toLocaleString(),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Logs Esta Semana',
      value: stats.logs_this_week.toLocaleString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">Estatísticas de Auditoria</h3>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Top ações */}
      {stats.top_actions && stats.top_actions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Ações Mais Frequentes</h4>
          <div className="space-y-2">
            {stats.top_actions.map((action, index) => {
              const percentage = stats.total_logs > 0 ? (action.count / stats.total_logs) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-blue-600 rounded-full">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{action.action}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{action.count} vezes</span>
                    <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top usuários */}
      {stats.top_users && stats.top_users.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Usuários Mais Ativos</h4>
          <div className="space-y-2">
            {stats.top_users.map((user, index) => {
              const percentage = stats.total_logs > 0 ? (user.count / stats.total_logs) * 100 : 0;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-green-600 rounded-full">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{user.user}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{user.count} ações</span>
                    <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}