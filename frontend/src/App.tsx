import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingState from './components/LoadingState';
import './App.css';

// Importando páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EntriesPage from './pages/EntriesPage';
import CategoriesPage from './pages/CategoriesPage';
import ReportsPage from './pages/ReportsPage';
const NotFoundPage = () => <div className="p-4">404 - Page Not Found</div>;

// Componente para rotas protegidas
const PrivateRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState fullScreen message="Verificando autenticação..." />;
  }

  return user ? <>{element}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rotas protegidas */}
            <Route path="/" element={<PrivateRoute element={<DashboardPage />} />} />
            <Route path="/entries" element={<PrivateRoute element={<EntriesPage />} />} />
            <Route path="/categories" element={<PrivateRoute element={<CategoriesPage />} />} />
            <Route path="/reports" element={<PrivateRoute element={<ReportsPage />} />} />

            {/* Rota 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
