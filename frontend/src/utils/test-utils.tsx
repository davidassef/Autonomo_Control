import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "../contexts/AuthContext";
import { Entry, Category, User } from "../types";

// Mock data para testes
export const mockUser: User = {
  id: "1",
  email: "test@example.com",
  name: "Test User",
  role: "USER",
  is_active: true,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
};

export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Alimentação",
    type: "EXPENSE",
    icon: "🍔",
    color: "#FF6B6B",
    subcategories: ["Restaurante", "Supermercado"],
    user_id: "1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Transporte",
    type: "INCOME",
    icon: "🚗",
    color: "#4ECDC4",
    subcategories: ["Uber", "99"],
    user_id: "1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

export const mockEntries: Entry[] = [
  {
    id: "1",
    amount: 50.0,
    gross_amount: 60.0,
    date: "2023-01-01",
    type: "INCOME",
    description: "Corrida Uber",
    category_id: "2",
    category: mockCategories[1],
    platform: "UBER",
    shift_tag: "MANHA",
    city: "São Paulo",
    user_id: "1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    amount: 25.0,
    date: "2023-01-01",
    type: "EXPENSE",
    description: "Almoço",
    category_id: "1",
    category: mockCategories[0],
    user_id: "1",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

// Mock de resumo de entradas
export const mockSummary = {
  total_income: 50.0,
  total_expense: 25.0,
  balance: 25.0,
  count_income: 1,
  count_expense: 1,
  total_count: 2,
};

// Mock de resumos mensais
export const mockMonthlySummaries = [
  {
    year: 2023,
    month: "01",
    total_income: 50.0,
    total_expense: 25.0,
    balance: 25.0,
    count_income: 1,
    count_expense: 1,
    total_count: 2,
  },
  {
    year: 2023,
    month: "02",
    total_income: 100.0,
    total_expense: 50.0,
    balance: 50.0,
    count_income: 2,
    count_expense: 2,
    total_count: 4,
  },
];

// Mock do contexto de autenticação
const mockAuthContextValue = {
  user: mockUser,
  token: "mock-token",
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  isAuthenticated: true,
};

// Provider customizado para testes
interface AllTheProvidersProps {
  children: React.ReactNode;
  authValue?: any;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  authValue = mockAuthContextValue,
}) => {
  return <AuthProvider>{children}</AuthProvider>;
};

// Função de render customizada
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  authValue?: any;
}

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { authValue, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders authValue={authValue}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Mock das funções de API
export const mockApiCalls = {
  // Auth Service
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),

  // Entries Service
  getEntries: jest.fn(),
  createEntry: jest.fn(),
  updateEntry: jest.fn(),
  deleteEntry: jest.fn(),
  getEntriesSummary: jest.fn(),

  // Categories Service
  getCategories: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

// Função para resetar todos os mocks
export const resetAllMocks = () => {
  Object.values(mockApiCalls).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
};

// Função para simular delay em promises
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock de respostas de API
export const mockApiResponses = {
  entries: {
    success: { data: mockEntries, total: mockEntries.length },
    empty: { data: [], total: 0 },
    error: { error: "Erro ao carregar lançamentos" },
  },
  categories: {
    success: { data: mockCategories, total: mockCategories.length },
    empty: { data: [], total: 0 },
    error: { error: "Erro ao carregar categorias" },
  },
  auth: {
    success: { user: mockUser, token: "mock-token" },
    error: { error: "Credenciais inválidas" },
  },
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
