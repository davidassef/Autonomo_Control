// Configuração global para testes Jest
import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Importar mocks personalizados
import "./__mocks__/fetchMock";
import { resetMockAuth } from "./__mocks__/AuthContextMock";
import { resetSystemConfigMocks } from "./__mocks__/systemConfigServiceMock";
import { resetApiMocks } from "./__mocks__/apiMock";

// Mock do axios
jest.mock("axios", () => require("./__mocks__/apiMock").default);

// Mock react-router-dom - simplified version
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({
    pathname: "/",
    search: "",
    hash: "",
    state: null,
    key: "default",
  })),
  useParams: jest.fn(() => ({})),
  BrowserRouter: ({ children }: any) => children,
  MemoryRouter: ({ children }: any) => children,
  Router: ({ children }: any) => children,
  Routes: ({ children }: any) => children,
  Route: ({ children }: any) => children,
  Link: ({ children, to, ...props }: any) => {
    return { ...props, href: to, children };
  },
  NavLink: ({ children, to, ...props }: any) => {
    return { ...props, href: to, children };
  },
}));

// Mock básico do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock básico do sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock do fetch
global.fetch = jest.fn();

// Mock do matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock do IntersectionObserver com tipagem correta
class MockIntersectionObserver implements IntersectionObserver {
  root: Element | Document | null = null;
  rootMargin: string = "0px";
  thresholds: ReadonlyArray<number> = [0];

  // Mock implementation

  observe(target: Element): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// Mock do ResizeObserver
class MockResizeObserver implements ResizeObserver {
  // Mock implementation
  observe(target: Element, options?: ResizeObserverOptions): void {}
  unobserve(target: Element): void {}
  disconnect(): void {}
}

global.ResizeObserver = MockResizeObserver;

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
  (localStorageMock.getItem as jest.Mock).mockClear();
  (localStorageMock.setItem as jest.Mock).mockClear();
  (localStorageMock.removeItem as jest.Mock).mockClear();
  (localStorageMock.clear as jest.Mock).mockClear();

  (sessionStorageMock.getItem as jest.Mock).mockClear();
  (sessionStorageMock.setItem as jest.Mock).mockClear();
  (sessionStorageMock.removeItem as jest.Mock).mockClear();
  (sessionStorageMock.clear as jest.Mock).mockClear();

  // Resetar mocks personalizados
  resetMockAuth();
  resetSystemConfigMocks();
  resetApiMocks();
});

// Configuração do Testing Library
configure({
  testIdAttribute: "data-testid",
});
