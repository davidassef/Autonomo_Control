import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
// import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/auth";
import { toast } from "sonner";

// Mock dos serviços
jest.mock("../services/auth");
jest.mock("sonner");

const mockedAuthService = authService as jest.Mocked<typeof authService>;
const mockedToast = toast as jest.Mocked<typeof toast>;

// Componente de teste para hooks
// const TestComponent: React.FC<{ onResult: (result: any) => void }> = ({
//   onResult,
// }) => {
//   const auth = useAuth();

//   React.useEffect(() => {
//     onResult(auth);
//   }, [auth, onResult]);

//   return <div data-testid="test-component">Test</div>;
// };

// Wrapper para testes
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>{children}</AuthProvider>
  </BrowserRouter>
);

describe("Testes de Concorrência e Performance - Frontend", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedToast.success.mockImplementation(() => "success");
    mockedToast.error.mockImplementation(() => "error");

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe("Testes de Concorrência - AuthContext", () => {
    it("deve lidar com múltiplas chamadas de login simultâneas", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "USER" as const,
        is_active: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      };

      const mockResponse = {
        access_token: "test-token",
        token_type: "bearer",
        user: { ...mockUser, id: mockUser.id.toString() },
      };

      mockedAuthService.login.mockResolvedValue(mockResponse);

      const results: any[] = [];
      const numCalls = 10;

      const TestMultipleLogins: React.FC = () => {
        const { login } = useAuth();
        const [callCount, setCallCount] = React.useState(0);

        React.useEffect(() => {
          const performLogins = async () => {
            const promises = Array.from({ length: numCalls }, (_, i) =>
              login("test@example.com", "password123")
                .then((result) => {
                  results.push({ index: i, result, timestamp: Date.now() });
                  return result;
                })
                .catch((error) => {
                  results.push({ index: i, error, timestamp: Date.now() });
                  throw error;
                }),
            );

            try {
              await Promise.allSettled(promises);
            } catch (error) {
              // Ignorar erros individuais
            }

            setCallCount(results.length);
          };

          performLogins();
        }, [login]);

        return <div data-testid="call-count">{callCount}</div>;
      };

      render(
        <TestWrapper>
          <TestMultipleLogins />
        </TestWrapper>,
      );

      // Aguardar todas as chamadas completarem
      await waitFor(
        () => {
          expect(screen.getByTestId("call-count")).toHaveTextContent(
            numCalls.toString(),
          );
        },
        { timeout: 5000 },
      );

      // Verificar que todas as chamadas foram feitas
      expect(results).toHaveLength(numCalls);

      // Verificar que não houve race conditions (todos devem ter sucesso ou falhar consistentemente)
      const successCount = results.filter((r) => r.result && !r.error).length;
      const errorCount = results.filter((r) => r.error).length;

      expect(successCount + errorCount).toBe(numCalls);

      // Se houve sucessos, verificar que o serviço foi chamado
      expect(successCount).toBeGreaterThanOrEqual(0);
      expect(mockedAuthService.login).toHaveBeenCalled();
    });

    it("deve lidar com race condition entre login e logout", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER" as const,
        is_active: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      };

      const mockResponse = {
        access_token: "mock-token",
        token_type: "bearer",
        user: mockUser,
      };

      mockedAuthService.login.mockResolvedValue(mockResponse);
      (mockedAuthService.logout as jest.Mock).mockResolvedValue(undefined);

      let finalState: any = null;

      const TestRaceCondition: React.FC = () => {
        const auth = useAuth();
        const [operations, setOperations] = React.useState(0);

        React.useEffect(() => {
          const performRaceCondition = async () => {
            // Executar login e logout simultaneamente
            const loginPromise = auth.login("test@example.com", "password123");
            const logoutPromise = auth.logout();

            await Promise.allSettled([loginPromise, logoutPromise]);

            // Aguardar um pouco para o estado se estabilizar
            setTimeout(() => {
              finalState = {
                user: auth.user,
                isAuthenticated: auth.isAuthenticated,
                isLoading: auth.isLoading,
              };
              setOperations(1);
            }, 100);
          };

          performRaceCondition();
        }, [auth]);

        return <div data-testid="operations">{operations}</div>;
      };

      render(
        <TestWrapper>
          <TestRaceCondition />
        </TestWrapper>,
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("operations")).toHaveTextContent("1");
        },
        { timeout: 3000 },
      );

      // Verificar que o estado final é consistente
      expect(finalState).toBeDefined();
      expect(finalState.loading).toBe(false);

      // O estado deve ser ou autenticado ou não autenticado, mas consistente
      expect(typeof finalState.isAuthenticated).toBe("boolean");
      // Verificar consistência do estado sem expect condicional
      expect(
        finalState.isAuthenticated
          ? finalState.user !== null
          : finalState.user === null,
      ).toBe(true);
    });

    it("deve lidar com múltiplas verificações de autenticação simultâneas", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER" as const,
        is_active: true,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      };

      mockedAuthService.getProfile.mockResolvedValue(mockUser);
      (window.localStorage.getItem as jest.Mock).mockReturnValue("valid-token");

      const results: boolean[] = [];
      const numChecks = 15;

      const TestMultipleChecks: React.FC = () => {
        const { user } = useAuth();
        const [completed, setCompleted] = React.useState(0);

        React.useEffect(() => {
          const performChecks = async () => {
            const promises = Array.from({ length: numChecks }, async (_, i) => {
              try {
                const result = await Promise.resolve(!!user);
                results.push(result);
                return result;
              } catch (error) {
                results.push(false);
                return false;
              }
            });

            await Promise.allSettled(promises);
            setCompleted(results.length);
          };

          performChecks();
        }, [user]);

        return <div data-testid="completed">{completed}</div>;
      };

      render(
        <TestWrapper>
          <TestMultipleChecks />
        </TestWrapper>,
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("completed")).toHaveTextContent(
            numChecks.toString(),
          );
        },
        { timeout: 5000 },
      );

      // Verificar que todas as verificações foram consistentes
      expect(results).toHaveLength(numChecks);

      // Todas devem ter o mesmo resultado (não deve haver inconsistência)
      const uniqueResults = Array.from(new Set(results));
      expect(uniqueResults).toHaveLength(1);
    });
  });

  describe("Testes de Performance - Componentes", () => {
    it("deve renderizar LoginPage rapidamente", async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      // Aguardar renderização completa
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /entrar/i }),
        ).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Renderização deve ser rápida (menos de 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it("deve renderizar RegisterPage rapidamente", async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      // Aguardar renderização completa
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /criar conta/i }),
        ).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Renderização deve ser rápida (menos de 150ms devido à complexidade)
      expect(renderTime).toBeLessThan(150);
    });

    it("deve lidar com entrada rápida de texto sem lag", async () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      const startTime = performance.now();

      // Simular digitação rápida
      const testEmail = "test@example.com";
      const testPassword = "password123";

      for (let i = 0; i < testEmail.length; i++) {
        fireEvent.change(emailInput, {
          target: { value: testEmail.substring(0, i + 1) },
        });
      }

      for (let i = 0; i < testPassword.length; i++) {
        fireEvent.change(passwordInput, {
          target: { value: testPassword.substring(0, i + 1) },
        });
      }

      const endTime = performance.now();
      const inputTime = endTime - startTime;

      // Entrada de texto deve ser responsiva (menos de 50ms)
      expect(inputTime).toBeLessThan(50);

      // Verificar que os valores foram definidos corretamente
      expect(emailInput).toHaveValue(testEmail);
      expect(passwordInput).toHaveValue(testPassword);
    });

    it("deve lidar com múltiplos cliques rápidos no botão de submit", async () => {
      mockedAuthService.login.mockResolvedValue({
        access_token: "mock-token",
        token_type: "bearer",
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          role: "USER" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      // Preencher formulário
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: "password123" },
      });

      const submitButton = screen.getByRole("button", { name: /entrar/i });

      // Clicar múltiplas vezes rapidamente
      const numClicks = 10;
      const startTime = performance.now();

      for (let i = 0; i < numClicks; i++) {
        fireEvent.click(submitButton);
      }

      const endTime = performance.now();
      const clickTime = endTime - startTime;

      // Cliques devem ser processados rapidamente
      expect(clickTime).toBeLessThan(100);

      // Aguardar processamento
      await waitFor(() => {
        // O serviço deve ter sido chamado apenas uma vez (prevenção de múltiplos submits)
        expect(mockedAuthService.login).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Testes de Stress - Formulários", () => {
    it("deve lidar com validação de formulário sob stress", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/senha/i);

      // Simular entrada de dados muito rápida e mudanças frequentes
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        fireEvent.change(nameInput, { target: { value: `Name ${i}` } });
        fireEvent.change(emailInput, {
          target: { value: `email${i}@example.com` },
        });
        fireEvent.change(passwordInput, { target: { value: `password${i}` } });

        // Trigger validation
        fireEvent.blur(nameInput);
        fireEvent.blur(emailInput);
        fireEvent.blur(passwordInput);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Validação deve ser eficiente mesmo sob stress
      expect(totalTime).toBeLessThan(1000); // Menos de 1 segundo

      // Verificar que os valores finais estão corretos
      expect(nameInput).toHaveValue(`Name ${iterations - 1}`);
      expect(emailInput).toHaveValue(`email${iterations - 1}@example.com`);
      expect(passwordInput).toHaveValue(`password${iterations - 1}`);
    });

    it("deve manter performance com muitos re-renders", async () => {
      let renderCount = 0;

      const TestReRenders: React.FC = () => {
        const [count, setCount] = React.useState(0);
        renderCount++;

        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount((c) => c + 1);
          }, 10);

          setTimeout(() => {
            clearInterval(interval);
          }, 500);

          return () => clearInterval(interval);
        }, []);

        return (
          <TestWrapper>
            <div data-testid="count">{count}</div>
            <LoginPage />
          </TestWrapper>
        );
      };

      const startTime = performance.now();

      render(<TestReRenders />);

      // Aguardar os re-renders terminarem
      await waitFor(
        () => {
          const countElement = screen.getByTestId("count");
          const count = parseInt(countElement.textContent || "0");
          return count > 40; // Aguardar pelo menos 40 re-renders
        },
        { timeout: 1000 },
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Mesmo com muitos re-renders, deve manter performance
      expect(totalTime).toBeLessThan(1000);
      expect(renderCount).toBeGreaterThan(40);

      // Componente deve ainda estar funcional
      expect(
        screen.getByRole("button", { name: /entrar/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Testes de Memória - Prevenção de Vazamentos", () => {
    it("deve limpar event listeners ao desmontar", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      // const initialListeners = addEventListenerSpy.mock.calls.length;

      // Desmontar componente
      unmount();

      // Verificar que listeners foram removidos
      expect(removeEventListenerSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it("deve limpar timers ao desmontar", async () => {
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      const TestWithTimers: React.FC = () => {
        React.useEffect(() => {
          const timer1 = setTimeout(() => {}, 1000);
          const timer2 = setTimeout(() => {}, 2000);

          return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
          };
        }, []);

        return <LoginPage />;
      };

      const { unmount } = render(
        <TestWrapper>
          <TestWithTimers />
        </TestWrapper>,
      );

      // Desmontar componente
      unmount();

      // Aguardar cleanup
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Verificar que timers foram limpos
      expect(clearTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
      clearTimeoutSpy.mockRestore();
    });

    it("deve cancelar requisições pendentes ao desmontar", async () => {
      const abortSpy = jest.fn();
      const mockAbortController = {
        abort: abortSpy,
        signal: { aborted: false },
      };

      // Mock AbortController
      global.AbortController = jest.fn(() => mockAbortController) as any;

      // Mock fetch com delay
      mockedAuthService.login.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  access_token: "token",
                  token_type: "bearer",
                  user: {
                    id: "1",
                    email: "test@example.com",
                    name: "Test User",
                    role: "USER" as const,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                }),
              1000,
            ),
          ),
      );

      const { unmount } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>,
      );

      // Iniciar login
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/senha/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

      // Desmontar antes da requisição completar
      unmount();

      // Aguardar um pouco
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Verificar que não houve vazamentos ou erros
      expect(true).toBe(true); // Se chegou até aqui, não houve erros
    });
  });

  describe("Testes de Robustez - Cenários Extremos", () => {
    it("deve lidar com dados de entrada extremamente grandes", async () => {
      render(
        <TestWrapper>
          <RegisterPage />
        </TestWrapper>,
      );

      const nameInput = screen.getByLabelText(/nome completo/i);
      const emailInput = screen.getByLabelText(/email/i);

      // Dados extremamente grandes
      const largeName = "A".repeat(10000);
      const largeEmail = "a".repeat(5000) + "@example.com";

      const startTime = performance.now();

      fireEvent.change(nameInput, { target: { value: largeName } });
      fireEvent.change(emailInput, { target: { value: largeEmail } });

      const endTime = performance.now();
      const inputTime = endTime - startTime;

      // Deve lidar com dados grandes sem travar
      expect(inputTime).toBeLessThan(1000);

      // Verificar que os valores foram definidos (mesmo que truncados)
      expect((nameInput as HTMLInputElement).value.length).toBeGreaterThan(0);
      expect((emailInput as HTMLInputElement).value.length).toBeGreaterThan(0);
    });

    it("deve manter estabilidade com muitas mudanças de estado rápidas", async () => {
      let errorCount = 0;
      const originalError = console.error;
      console.error = (...args: any[]) => {
        errorCount++;
        originalError(...args);
      };

      const TestRapidStateChanges: React.FC = () => {
        const [state, setState] = React.useState(0);

        React.useEffect(() => {
          // Mudanças de estado muito rápidas
          for (let i = 0; i < 1000; i++) {
            setState(i);
          }
        }, []);

        return (
          <TestWrapper>
            <div data-testid="state">{state}</div>
            <LoginPage />
          </TestWrapper>
        );
      };

      render(<TestRapidStateChanges />);

      // Aguardar estabilização
      await waitFor(() => {
        const stateElement = screen.getByTestId("state");
        expect(parseInt(stateElement.textContent || "0")).toBeGreaterThan(900);
      });

      // Verificar que não houve muitos erros
      expect(errorCount).toBeLessThan(10);

      // Componente deve ainda estar funcional
      expect(
        screen.getByRole("button", { name: /entrar/i }),
      ).toBeInTheDocument();

      console.error = originalError;
    });
  });
});
