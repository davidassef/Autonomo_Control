import React from 'react';

// Mock manual do react-router-dom
export const BrowserRouter = ({ children }: any) => (
  <div data-testid="mock-browser-router">{children}</div>
);

export const Routes = ({ children }: any) => (
  <div data-testid="mock-routes">{children}</div>
);

export const Route = ({ element }: any) => (
  <div data-testid="mock-route">{element}</div>
);

export const Navigate = ({ to }: any) => (
  <div data-testid="mock-navigate" data-to={to} />
);

export const Link = ({ children, to, ...props }: any) => (
  <a href={to} data-testid="mock-link" {...props}>
    {children}
  </a>
);

export const useNavigate = () => {
  return jest.fn();
};

export const useLocation = () => ({
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
  key: 'test'
});

export const useParams = () => ({});

export const useSearchParams = () => [
  new URLSearchParams(),
  jest.fn()
];

export const Outlet = () => <div data-testid="mock-outlet" />;