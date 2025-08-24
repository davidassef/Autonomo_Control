import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useSystemReports } from "../hooks/useSystemReports";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
} from "lucide-react";

const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "users" | "usage" | "financial" | "engagement" | "health"
  >("dashboard");

  const {
    isLoadingUserStats,
    isLoadingUsageStats,
    isLoadingFinancialOverview,
    isLoadingHealthMetrics,
    isLoadingEngagementReport,
    isLoadingDashboard,
    userStatistics,
    // usageStatistics,
    // financialOverview,
    // healthMetrics,
    // engagementReport,
    dashboardData,
    error,
    fetchUserStatistics,
    fetchUsageStatistics,
    fetchFinancialOverview,
    fetchHealthMetrics,
    fetchEngagementReport,
    fetchDashboardData,
    refreshAllReports,
    clearError,
  } = useSystemReports();

  // Verificar se o usuário tem permissão
  const isAdmin = user?.role === "ADMIN" || user?.role === "MASTER";
  const isMaster = user?.role === "MASTER";

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, fetchDashboardData]);

  useEffect(() => {
    if (isAdmin && activeTab !== "dashboard" && activeTab !== "health") {
      switch (activeTab) {
        case "users":
          fetchUserStatistics(selectedPeriod);
          break;
        case "usage":
          fetchUsageStatistics(selectedPeriod);
          break;
        case "financial":
          fetchFinancialOverview(selectedPeriod);
          break;
        case "engagement":
          fetchEngagementReport(selectedPeriod);
          break;
      }
    }
  }, [
    activeTab,
    selectedPeriod,
    isAdmin,
    fetchUserStatistics,
    fetchUsageStatistics,
    fetchFinancialOverview,
    fetchEngagementReport,
  ]);

  useEffect(() => {
    if (isMaster && activeTab === "health") {
      fetchHealthMetrics();
    }
  }, [activeTab, isMaster, fetchHealthMetrics]);

  const handleRefresh = async () => {
    clearError();
    if (activeTab === "dashboard") {
      await fetchDashboardData();
    } else if (activeTab === "health") {
      await fetchHealthMetrics();
    } else {
      await refreshAllReports(selectedPeriod);
    }
  };

  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('pt-BR', {
  //     style: 'currency',
  //     currency: 'BRL'
  //   }).format(value);
  // };

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('pt-BR');
  // };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600">
              Você não tem permissão para acessar os relatórios administrativos.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Relatórios Administrativos
            </h1>
            <p className="text-gray-600 mt-1">
              Estatísticas e métricas do sistema
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Period Selector */}
            {activeTab !== "dashboard" && activeTab !== "health" && (
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={365}>Último ano</option>
              </select>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={
                isLoadingDashboard ||
                isLoadingUserStats ||
                isLoadingUsageStats ||
                isLoadingFinancialOverview ||
                isLoadingEngagementReport ||
                isLoadingHealthMetrics
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingDashboard || isLoadingUserStats || isLoadingUsageStats || isLoadingFinancialOverview || isLoadingEngagementReport || isLoadingHealthMetrics ? "animate-spin" : ""}`}
              />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "dashboard"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Usuários</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("usage")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "usage"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Uso do Sistema</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("financial")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "financial"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Financeiro</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("engagement")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "engagement"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Engajamento</span>
              </div>
            </button>

            {isMaster && (
              <button
                onClick={() => setActiveTab("health")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "health"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span>Saúde do Sistema</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {isLoadingDashboard ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">
                    Carregando dashboard...
                  </span>
                </div>
              ) : dashboardData ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Total de Usuários
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardData.summary.total_users}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Activity className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Usuários Ativos (30d)
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardData.summary.active_users_30d}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Entradas (30d)
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {dashboardData.summary.total_entries_30d}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts and Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users by Role */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Usuários por Função
                      </h3>
                      <div className="space-y-3">
                        {dashboardData.users_by_role.map((item) => (
                          <div
                            key={item.role}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {item.role}
                            </span>
                            <span className="text-sm text-gray-900">
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Most Active Users */}
                    <div className="bg-white shadow rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Usuários Mais Ativos
                      </h3>
                      <div className="space-y-3">
                        {dashboardData.most_active_users.map((user, index) => (
                          <div
                            key={user.email}
                            className="flex justify-between items-center"
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {user.name || user.email}
                              </span>
                              <span className="text-xs text-gray-500 block">
                                {user.email}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {user.entries_count} entradas
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum dado disponível</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {isLoadingUserStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-gray-600">
                    Carregando estatísticas de usuários...
                  </span>
                </div>
              ) : userStatistics ? (
                <>
                  {/* User Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Total
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {userStatistics.total_users}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Ativos
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {userStatistics.active_users}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Clock className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Novos
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {userStatistics.new_users}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Bloqueados
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {userStatistics.blocked_users}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Most Active Users Table */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        Usuários Mais Ativos
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Entradas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userStatistics.most_active_users.map(
                            (user, index) => (
                              <tr key={user.email}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user.name || "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {user.entries_count}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhum dado disponível</p>
                </div>
              )}
            </div>
          )}

          {/* Placeholder for other tabs */}
          {(activeTab === "usage" ||
            activeTab === "financial" ||
            activeTab === "engagement" ||
            activeTab === "health") && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Implementação em andamento...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Esta seção será implementada em breve.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminReportsPage;
