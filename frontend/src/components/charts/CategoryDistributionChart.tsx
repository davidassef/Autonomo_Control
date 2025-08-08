import React, { useMemo } from 'react';
import '../../utils/chartConfig'; // Importar configurações globais
import { ChartData } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Entry } from '../../types';

interface CategoryDistributionChartProps {
  entries: Entry[];
  type: 'income' | 'expense';
  isLoading: boolean;
}

const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ entries, type, isLoading }) => {
  // Função para calcular a distribuição por categorias
  const categoryData = useMemo(() => {
    const filteredEntries = entries.filter(entry => entry.type === type);
    const categorySums: Record<string, number> = {};
    const categoryNames: Record<string, string> = {};
    const categoryColors: Record<string, string> = {};

    // Definir cores padrão para algumas categorias
    const defaultColors = [
      'rgba(255, 99, 132, 0.7)',  // Vermelho
      'rgba(54, 162, 235, 0.7)',  // Azul
      'rgba(255, 206, 86, 0.7)',  // Amarelo
      'rgba(75, 192, 192, 0.7)',  // Verde claro
      'rgba(153, 102, 255, 0.7)', // Roxo
      'rgba(255, 159, 64, 0.7)',  // Laranja
      'rgba(199, 199, 199, 0.7)', // Cinza
      'rgba(83, 102, 255, 0.7)',  // Azul escuro
      'rgba(255, 99, 255, 0.7)',  // Rosa
      'rgba(159, 159, 64, 0.7)',  // Verde musgo
    ];

    // Agrupar por categoria
    filteredEntries.forEach(entry => {
      const categoryId = entry.category_id;
      const categoryName = entry.category?.name || 'Sem categoria';

      if (!categorySums[categoryId]) {
        categorySums[categoryId] = 0;
        categoryNames[categoryId] = categoryName;

        // Usar cor da categoria, se disponível, ou cor padrão
        categoryColors[categoryId] = entry.category?.color ||
          defaultColors[Object.keys(categoryColors).length % defaultColors.length];
      }
      categorySums[categoryId] += entry.amount;
    });

    // Ordenar por valor (do maior para o menor)
    const sortedCategoryIds = Object.keys(categorySums).sort(
      (a, b) => categorySums[b] - categorySums[a]
    );

    // Limitamos a 5 categorias principais, com "Outros" para o restante
    const mainCategories = sortedCategoryIds.slice(0, 5);
    const labels = mainCategories.map(id => categoryNames[id]);
    const data = mainCategories.map(id => categorySums[id]);
    const backgroundColor = mainCategories.map(id => categoryColors[id]);

    // Adicionar "Outros" se houver mais de 5 categorias
    if (sortedCategoryIds.length > 5) {
      const otherSum = sortedCategoryIds.slice(5).reduce(
        (sum, id) => sum + categorySums[id],
        0
      );
      labels.push('Outros');
      data.push(otherSum);
      backgroundColor.push('rgba(100, 100, 100, 0.7)');
    }

    return { labels, data, backgroundColor };
  }, [entries, type]);

  const chartData: ChartData<'pie'> = {
    labels: categoryData.labels,
    datasets: [
      {
        data: categoryData.data,
        backgroundColor: categoryData.backgroundColor,
        borderColor: categoryData.backgroundColor.map(color =>
          color.replace('0.7', '1')
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: type === 'expense' ? 'Distribuição de Despesas' : 'Distribuição de Receitas',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = Math.round(
              (value / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100
            );
            return `${label}: ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-48 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Se não houver dados, exibir uma mensagem
  if (categoryData.data.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 h-60 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Nenhum {type === 'expense' ? 'despesa' : 'receita'} no período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default React.memo(CategoryDistributionChart);
