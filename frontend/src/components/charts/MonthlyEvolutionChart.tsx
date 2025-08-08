import React, { useMemo } from 'react';
import '../../utils/chartConfig'; // Importar configurações globais
import { ChartData } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { MonthlySummary } from '../../types';

interface MonthlyEvolutionChartProps {
  monthlySummaries: MonthlySummary[];
  isLoading: boolean;
}

const MonthlyEvolutionChart: React.FC<MonthlyEvolutionChartProps> = ({ monthlySummaries, isLoading }) => {
  // Memoizar os dados do gráfico para evitar re-renders desnecessários
  const chartData: ChartData<'bar'> = useMemo(() => {
    // Função para obter os nomes dos meses dos últimos 6 meses
    const getLastSixMonthsLabels = (): string[] => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const current = new Date();
      const labels = [];

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (current.getMonth() - i + 12) % 12;
        labels.push(months[monthIndex]);
      }

      return labels;
    };

    return {
      labels: getLastSixMonthsLabels(),
      datasets: [
        {
          label: 'Receitas',
          data: monthlySummaries.map(summary => summary.total_income),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Despesas',
          data: monthlySummaries.map(summary => summary.total_expense),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [monthlySummaries]);

  // Memoizar as opções do gráfico
  const options = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução Financeira - Últimos 6 Meses',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    }
  }), []);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-48 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default React.memo(MonthlyEvolutionChart);
