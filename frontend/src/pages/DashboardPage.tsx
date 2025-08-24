import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useEntries } from "../hooks/useEntries";
import MonthlyEvolutionChart from "../components/charts/MonthlyEvolutionChart";
import CategoryDistributionChart from "../components/charts/CategoryDistributionChart";

const DashboardPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "year">(
    "month",
  );

  // Get current month range
  const now = new Date();
  const getDateRange = () => {
    if (selectedPeriod === "month") {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0],
      };
    } else {
      return {
        startDate: new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0],
        endDate: new Date(now.getFullYear(), 11, 31)
          .toISOString()
          .split("T")[0],
      };
    }
  };

  const {
    entries,
    summary,
    monthlySummaries,
    isLoading,
    isSummaryLoading,
    error,
    fetchLastSixMonthsSummaries,
  } = useEntries(getDateRange());

  useEffect(() => {
    fetchLastSixMonthsSummaries();
  }, [fetchLastSixMonthsSummaries]);

  const handlePeriodChange = (period: "month" | "year") => {
    setSelectedPeriod(period);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handlePeriodChange("month")}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                selectedPeriod === "month"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-gray-300`}
            >
              Este Mês
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("year")}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                selectedPeriod === "year"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              } border border-l-0 border-gray-300`}
            >
              Este Ano
            </button>
          </div>
        </div>
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}{" "}
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg content-loader">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Receitas {selectedPeriod === "month" ? "do Mês" : "do Ano"}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {isSummaryLoading ? (
                  <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
                ) : (
                  `R$ ${summary?.total_income.toFixed(2) || "0.00"}`
                )}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg content-loader">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Despesas {selectedPeriod === "month" ? "do Mês" : "do Ano"}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                {isSummaryLoading ? (
                  <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
                ) : (
                  `R$ ${summary?.total_expense.toFixed(2) || "0.00"}`
                )}
              </dd>
            </div>
          </div>{" "}
          <div className="bg-white overflow-hidden shadow rounded-lg content-loader">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Saldo {selectedPeriod === "month" ? "do Mês" : "do Ano"}
              </dt>
              <dd
                className={`mt-1 text-3xl font-semibold ${(summary?.balance || 0) >= 0 ? "text-indigo-600" : "text-red-600"}`}
              >
                {isSummaryLoading ? (
                  <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
                ) : (
                  `R$ ${(summary?.balance || 0).toFixed(2)}`
                )}
              </dd>
            </div>
          </div>
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Evolution Chart */}
          <div className="col-span-1 lg:col-span-2">
            <div className="chart-container">
              <MonthlyEvolutionChart
                monthlySummaries={monthlySummaries}
                isLoading={isSummaryLoading}
              />
            </div>
          </div>

          {/* Category Distribution Charts */}
          <div className="bg-white shadow rounded-lg overflow-hidden chart-container">
            <CategoryDistributionChart
              entries={entries}
              type="EXPENSE"
              isLoading={isLoading}
            />{" "}
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden chart-container">
            <CategoryDistributionChart
              entries={entries}
              type="INCOME"
              isLoading={isLoading}
            />
          </div>
        </div>
        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg layout-stable">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Transações Recentes
            </h3>
            <Link
              to="/entries"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover-optimized"
            >
              Ver todas
            </Link>
          </div>
          <div className="overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-4 loading-state">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : entries.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {entries.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            entry.type === "INCOME"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {entry.type === "INCOME" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 11l5-5m0 0l5 5m-5-5v12"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 13l-5 5m0 0l-5-5m5 5V6"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.category?.name || "Sem categoria"} •{" "}
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          entry.type === "INCOME"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {entry.type === "INCOME" ? "+" : "-"} R${" "}
                        {entry.amount.toFixed(2)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 text-center text-gray-500">
                Nenhuma transação encontrada neste período.
              </div>
            )}{" "}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
