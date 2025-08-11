import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useEntries } from '../hooks/useEntries';
import MonthlyEvolutionChart from '../components/charts/MonthlyEvolutionChart';
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart';

const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [reportType, setReportType] = useState<'overview' | 'INCOME' | 'EXPENSE'>('overview');

  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'month':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        };
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return {
          startDate: new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), quarterStart + 3, 0).toISOString().split('T')[0]
        };
      case 'year':
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        };
      default:
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        };
    }
  };

  const { entries, summary, monthlySummaries, isLoading, isSummaryLoading, error, fetchLastSixMonthsSummaries } = useEntries(getDateRange());

  useEffect(() => {
    fetchLastSixMonthsSummaries();
  }, [fetchLastSixMonthsSummaries]);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month': return 'Este Mês';
      case 'quarter': return 'Este Trimestre';
      case 'year': return 'Este Ano';
      default: return 'Período';
    }
  };

  const getBalance = () => {
    return (summary?.total_income || 0) - (summary?.total_expense || 0);
  };

  const getBalanceColor = () => {
    const balance = getBalance();
    return balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Relatórios Financeiros</h1>

          {/* Period Selector */}
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                selectedPeriod === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300`}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('quarter')}
              className={`px-4 py-2 text-sm font-medium ${
                selectedPeriod === 'quarter'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-300`}
            >
              Trimestre
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                selectedPeriod === 'year'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-l-0 border-gray-300`}
            >
              Ano
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Receitas {getPeriodLabel()}</dt>
              <dd className="mt-1 text-2xl font-semibold text-green-600">
                {isSummaryLoading ? (
                  <div className="animate-pulse h-6 w-20 bg-gray-200 rounded"></div>
                ) : (
                  `R$ ${summary?.total_income.toFixed(2) || '0.00'}`
                )}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Despesas {getPeriodLabel()}</dt>
              <dd className="mt-1 text-2xl font-semibold text-red-600">
                {isSummaryLoading ? (
                  <div className="animate-pulse h-6 w-20 bg-gray-200 rounded"></div>
                ) : (
                  `R$ ${summary?.total_expense.toFixed(2) || '0.00'}`
                )}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Saldo {getPeriodLabel()}</dt>
              <dd className={`mt-1 text-2xl font-semibold ${getBalanceColor()}`}>
                {isSummaryLoading ? (
                  <div className="animate-pulse h-6 w-20 bg-gray-200 rounded"></div>
                ) : (
                  `R$ ${getBalance().toFixed(2)}`
                )}
              </dd>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Transações {getPeriodLabel()}</dt>
              <dd className="mt-1 text-2xl font-semibold text-blue-600">
                {isLoading ? (
                  <div className="animate-pulse h-6 w-16 bg-gray-200 rounded"></div>
                ) : (
                  entries.length
                )}
              </dd>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tipo de Relatório</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setReportType('overview')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'overview'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setReportType('INCOME')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'INCOME'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setReportType('EXPENSE')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'EXPENSE'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Despesas
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {reportType === 'overview' && (
            <>
              {/* Monthly Evolution Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução Mensal</h3>
                <MonthlyEvolutionChart
                  monthlySummaries={monthlySummaries}
                  isLoading={isLoading}
                />
              </div>

              {/* Category Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição de Receitas</h3>
                  <CategoryDistributionChart
                    entries={entries}
                    type="INCOME"
                    isLoading={isLoading}
                  />
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição de Despesas</h3>
                  <CategoryDistributionChart
                    entries={entries}
                    type="EXPENSE"
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          {reportType === 'INCOME' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Análise Detalhada de Receitas</h3>
              <CategoryDistributionChart
                entries={entries}
                type="INCOME"
                isLoading={isLoading}
              />
            </div>
          )}

          {reportType === 'EXPENSE' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Análise Detalhada de Despesas</h3>
              <CategoryDistributionChart
                entries={entries}
                type="EXPENSE"
                isLoading={isLoading}
              />
            </div>
          )}
        </div>

        {/* Detailed Analysis Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Análise Detalhada</h3>

          {isSummaryLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Resumo do Período</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Receitas:</span>
                      <span className="font-medium text-green-600">
                        R$ {summary?.total_income.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Despesas:</span>
                      <span className="font-medium text-red-600">
                        R$ {summary?.total_expense.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 font-medium">Saldo Final:</span>
                      <span className={`font-semibold ${getBalanceColor()}`}>
                        R$ {getBalance().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Indicadores</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Transações:</span>
                      <span className="font-medium">{entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receita Média:</span>                      <span className="font-medium text-green-600">
                        R$ {entries.filter(e => e.type === 'INCOME').length > 0 && summary?.total_income
                          ? ((summary.total_income) / entries.filter(e => e.type === 'INCOME').length).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Despesa Média:</span>                      <span className="font-medium text-red-600">
                        R$ {entries.filter(e => e.type === 'EXPENSE').length > 0 && summary?.total_expense
                          ? ((summary.total_expense) / entries.filter(e => e.type === 'EXPENSE').length).toFixed(2)
                          : '0.00'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
