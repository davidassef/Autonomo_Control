// Configurações globais do Chart.js para melhor performance
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar apenas os componentes necessários
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Configurações globais para melhor performance
ChartJS.defaults.animation = {
  duration: 300, // Reduzir duração da animação
  easing: "easeInOutQuart",
};

ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Configurações para reduzir re-renders
ChartJS.defaults.interaction = {
  mode: "index" as const,
  intersect: false,
  axis: "x" as const,
  includeInvisible: false,
};

// Otimizações de performance
ChartJS.defaults.elements.point.radius = 3;
ChartJS.defaults.elements.point.hoverRadius = 5;

export default ChartJS;
