import React from 'react';

// Mock components para react-router-dom
export const MockBrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="mock-browser-router">{children}</div>;
};

export const MockRoutes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="mock-routes">{children}</div>;
};

export const MockRoute: React.FC<{ element?: React.ReactNode; path?: string }> = ({ element }) => {
  return <div data-testid="mock-route">{element}</div>;
};

export const MockLink: React.FC<{ 
  children: React.ReactNode; 
  to: string; 
  className?: string;
  [key: string]: any;
}> = ({ children, to, className, ...props }) => {
  return (
    <a 
      href={to} 
      className={className}
      data-testid="mock-link"
      {...props}
    >
      {children}
    </a>
  );
};

export const MockNavigate: React.FC<{ to: string; replace?: boolean }> = ({ to }) => {
  return <div data-testid="mock-navigate" data-to={to} />;
};

// Mock hooks
export const mockUseNavigate = () => {
  return jest.fn();
};

export const mockUseLocation = () => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
});

export const mockUseParams = () => ({});

// Wrapper para testes que precisam de router context
export const TestRouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MockBrowserRouter>
      <MockRoutes>
        <MockRoute element={children} />
      </MockRoutes>
    </MockBrowserRouter>
  );
};

// Helper para renderizar componentes com router context
export const renderWithRouter = (component: React.ReactElement) => {
  return <TestRouterWrapper>{component}</TestRouterWrapper>;
};