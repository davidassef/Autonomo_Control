import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SystemConfigPage from "./SystemConfigPage";
import useSystemConfig from "../hooks/useSystemConfig";
import { toast } from "sonner";

// Mock dependencies
jest.mock("../hooks/useSystemConfig");
jest.mock("sonner");
jest.mock("../components/LoadingState", () => {
  return function MockLoadingState({ message }: { message: string }) {
    return <div data-testid="loading-state">{message}</div>;
  };
});

// Mock UI components
jest.mock("../components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-description">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-title">{children}</div>
  ),
}));

jest.mock("../components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock("../components/ui/input", () => ({
  Input: ({
    onChange,
    value,
    type,
    min,
    max,
    placeholder,
    id,
    ...props
  }: any) => (
    <input
      onChange={onChange}
      value={value}
      type={type}
      min={min}
      max={max}
      placeholder={placeholder}
      id={id}
      data-testid={`input-${id}`}
      {...props}
    />
  ),
}));

jest.mock("../components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => (
    <label htmlFor={htmlFor} data-testid={`label-${htmlFor}`}>
      {children}
    </label>
  ),
}));

jest.mock("../components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      id={id}
      data-testid={`switch-${id}`}
    />
  ),
}));

jest.mock("../components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div
      data-testid="tabs"
      data-value={value}
      onClick={() => onValueChange && onValueChange("general")}
    >
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tab-trigger-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock("../components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <span data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock("../components/ui/separator", () => ({
  Separator: ({ orientation }: { orientation?: string }) => (
    <div data-testid="separator" data-orientation={orientation} />
  ),
}));

jest.mock("../components/ui/alert", () => ({
  Alert: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="alert-description">{children}</div>
  ),
}));

const mockUseSystemConfig = useSystemConfig as jest.MockedFunction<
  typeof useSystemConfig
>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Mock data
const mockConfigs = {
  app_name: "Autonomo Control",
  app_version: "1.0.0",
  maintenance_mode: false,
  max_users: 100,
  allow_registration: true,
  default_user_role: "USER",
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_symbols: false,
  temp_password_expiry_hours: 24,
  session_timeout_minutes: 60,
  max_login_attempts: 5,
  lockout_duration_minutes: 15,
  smtp_host: "smtp.gmail.com",
  smtp_port: 587,
  smtp_username: "test@example.com",
  smtp_password: "password123",
  smtp_use_tls: true,
  email_from: "noreply@autonomocontrol.com",
  backup_enabled: true,
  backup_frequency_hours: 24,
  backup_retention_days: 30,
  backup_path: "./backups",
  log_level: "INFO",
  log_retention_days: 90,
  audit_log_enabled: true,
};

// Mock window.confirm
Object.defineProperty(window, "confirm", {
  writable: true,
  value: jest.fn(),
});

describe("SystemConfigPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSystemConfig.mockReturnValue({
      configs: mockConfigs,
      categories: [],
      history: [],
      loading: false,
      error: null,
      updating: false,
      loadConfigs: jest.fn().mockResolvedValue(undefined),
      loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
      loadCategories: jest.fn().mockResolvedValue(undefined),
      loadHistory: jest.fn().mockResolvedValue(undefined),
      updateConfig: jest.fn().mockResolvedValue(true),
      updateMultipleConfigs: jest.fn().mockResolvedValue(true),
      resetToDefaults: jest.fn().mockResolvedValue(true),
      initializeDefaults: jest.fn().mockResolvedValue(true),
      getConfigValue: jest.fn().mockReturnValue(undefined),
      refresh: jest.fn().mockResolvedValue(undefined),
    });

    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render system config page with correct title", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Configurações do Sistema")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Gerencie as configurações globais da aplicação (apenas MASTER)",
        ),
      ).toBeInTheDocument();
    });

    it("should render all category tabs", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Geral")).toBeInTheDocument();
      expect(screen.getByText("Usuários")).toBeInTheDocument();
      expect(screen.getByText("Segurança")).toBeInTheDocument();
      expect(screen.getByText("E-mail")).toBeInTheDocument();
      expect(screen.getByText("Backup")).toBeInTheDocument();
      expect(screen.getByText("Logs")).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Atualizar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Alterações")).toBeInTheDocument();
      expect(screen.getByText("Descartar Alterações")).toBeInTheDocument();
      expect(screen.getByText("Inicializar Padrões")).toBeInTheDocument();
      expect(screen.getByText("Resetar Tudo")).toBeInTheDocument();
    });

    it("should show loading state when configs are loading", () => {
      mockUseSystemConfig.mockReturnValue({
        configs: {},
        categories: [],
        history: [],
        loading: true,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("loading-state")).toBeInTheDocument();
      expect(
        screen.getByText("Carregando configurações do sistema..."),
      ).toBeInTheDocument();
    });

    it("should populate fields with config values", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByDisplayValue("Autonomo Control")).toBeInTheDocument();
      expect(screen.getByDisplayValue("1.0.0")).toBeInTheDocument();
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error alert when there is an error", () => {
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: "Failed to load configurations",
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("alert")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to load configurations"),
      ).toBeInTheDocument();
    });
  });

  describe("Configuration Fields", () => {
    it("should render string fields correctly", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("input-app_name")).toBeInTheDocument();
      expect(screen.getByTestId("label-app_name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Autonomo Control")).toBeInTheDocument();
    });

    it("should render number fields correctly", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("input-max_users")).toBeInTheDocument();
      expect(screen.getByTestId("input-max_users")).toHaveAttribute(
        "type",
        "number",
      );
      expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    });

    it("should render boolean fields correctly", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("switch-maintenance_mode")).toBeInTheDocument();
      expect(screen.getByTestId("switch-maintenance_mode")).not.toBeChecked();

      expect(
        screen.getByTestId("switch-allow_registration"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("switch-allow_registration")).toBeChecked();
    });

    it("should render password fields with correct type", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("input-smtp_password")).toHaveAttribute(
        "type",
        "password",
      );
    });

    it("should update string field values", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const appNameInput = screen.getByTestId("input-app_name");
      fireEvent.change(appNameInput, { target: { value: "New App Name" } });

      expect(screen.getByDisplayValue("New App Name")).toBeInTheDocument();
    });

    it("should update number field values", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const maxUsersInput = screen.getByTestId("input-max_users");
      fireEvent.change(maxUsersInput, { target: { value: "200" } });

      expect(screen.getByDisplayValue("200")).toBeInTheDocument();
    });

    it("should update boolean field values", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const maintenanceModeSwitch = screen.getByTestId(
        "switch-maintenance_mode",
      );
      fireEvent.change(maintenanceModeSwitch, { target: { checked: true } });

      expect(maintenanceModeSwitch).toBeChecked();
    });
  });

  describe("Changes Detection", () => {
    it("should show unsaved changes badge when fields are modified", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      // Initially no changes
      expect(
        screen.queryByText("Alterações não salvas"),
      ).not.toBeInTheDocument();

      // Make a change
      const appNameInput = screen.getByTestId("input-app_name");
      fireEvent.change(appNameInput, { target: { value: "Modified Name" } });

      // Should show unsaved changes badge
      expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();
    });

    it("should enable save button when there are changes", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const saveButton = screen.getByText("Salvar Alterações");
      expect(saveButton).toBeDisabled();

      // Make a change
      const appNameInput = screen.getByTestId("input-app_name");
      fireEvent.change(appNameInput, { target: { value: "Modified Name" } });

      expect(saveButton).not.toBeDisabled();
    });

    it("should enable discard button when there are changes", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const discardButton = screen.getByText("Descartar Alterações");
      expect(discardButton).toBeDisabled();

      // Make a change
      const appNameInput = screen.getByTestId("input-app_name");
      fireEvent.change(appNameInput, { target: { value: "Modified Name" } });

      expect(discardButton).not.toBeDisabled();
    });
  });

  describe("Save Functionality", () => {
    it("should call updateMultipleConfigs with changed values only", async () => {
      const mockUpdateMultipleConfigs = jest.fn().mockResolvedValue(true);
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: mockUpdateMultipleConfigs,
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      // Make changes
      const appNameInput = screen.getByTestId("input-app_name");
      fireEvent.change(appNameInput, { target: { value: "New App Name" } });

      const maxUsersInput = screen.getByTestId("input-max_users");
      fireEvent.change(maxUsersInput, { target: { value: "200" } });

      // Save changes
      const saveButton = screen.getByText("Salvar Alterações");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateMultipleConfigs).toHaveBeenCalledWith({
          app_name: "New App Name",
          max_users: 200,
        });
      });
    });

    it("should show info toast when no changes to save", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const saveButton = screen.getByText("Salvar Alterações");
      fireEvent.click(saveButton);

      expect(mockToast.info).toHaveBeenCalledWith(
        "Nenhuma alteração para salvar",
      );
    });

    it("should disable save button while updating", () => {
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: true,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const saveButton = screen.getByText("Salvando...");
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Discard Changes", () => {
    it("should restore original values when discarding changes", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      // Make a change
      const appNameInput = screen.getByTestId("input-app_name");
      fireEvent.change(appNameInput, { target: { value: "Modified Name" } });

      expect(screen.getByDisplayValue("Modified Name")).toBeInTheDocument();

      // Discard changes
      const discardButton = screen.getByText("Descartar Alterações");
      fireEvent.click(discardButton);

      // Should restore original value
      expect(screen.getByDisplayValue("Autonomo Control")).toBeInTheDocument();
      expect(
        screen.queryByText("Alterações não salvas"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Reset and Initialize", () => {
    it("should call resetToDefaults when reset button is clicked and confirmed", async () => {
      const mockResetToDefaults = jest.fn().mockResolvedValue(true);
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: mockResetToDefaults,
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const resetButton = screen.getByText("Resetar Tudo");
      fireEvent.click(resetButton);

      expect(window.confirm).toHaveBeenCalledWith(
        "Tem certeza que deseja resetar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.",
      );

      await waitFor(() => {
        expect(mockResetToDefaults).toHaveBeenCalled();
      });
    });

    it("should not call resetToDefaults when reset is cancelled", () => {
      (window.confirm as jest.Mock).mockReturnValue(false);

      const mockResetToDefaults = jest.fn();
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: mockResetToDefaults,
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const resetButton = screen.getByText("Resetar Tudo");
      fireEvent.click(resetButton);

      expect(mockResetToDefaults).not.toHaveBeenCalled();
    });

    it("should call initializeDefaults when initialize button is clicked and confirmed", async () => {
      const mockInitializeDefaults = jest.fn().mockResolvedValue(true);
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: mockInitializeDefaults,
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const initializeButton = screen.getByText("Inicializar Padrões");
      fireEvent.click(initializeButton);

      expect(window.confirm).toHaveBeenCalledWith(
        "Tem certeza que deseja inicializar as configurações padrão? Isso pode sobrescrever configurações existentes.",
      );

      await waitFor(() => {
        expect(mockInitializeDefaults).toHaveBeenCalled();
      });
    });
  });

  describe("Refresh Functionality", () => {
    it("should call refresh when refresh button is clicked", () => {
      const mockRefresh = jest.fn();
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: mockRefresh,
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const refreshButton = screen.getByText("Atualizar");
      fireEvent.click(refreshButton);

      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should disable refresh button while loading", () => {
      mockUseSystemConfig.mockReturnValue({
        configs: mockConfigs,
        categories: [],
        history: [],
        loading: true,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const refreshButton = screen.getByText("Atualizar");
      expect(refreshButton).toBeDisabled();
    });
  });

  describe("Tab Navigation", () => {
    it("should render general tab content by default", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("tab-content-general")).toBeInTheDocument();
      expect(
        screen.getByText("Configurações gerais da aplicação"),
      ).toBeInTheDocument();
    });

    it("should show different field types in different categories", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      // General tab should have string and boolean fields
      expect(screen.getByTestId("input-app_name")).toBeInTheDocument();
      expect(screen.getByTestId("switch-maintenance_mode")).toBeInTheDocument();
    });
  });

  describe("Field Validation", () => {
    it("should handle number field min/max constraints", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const maxUsersInput = screen.getByTestId("input-max_users");
      expect(maxUsersInput).toHaveAttribute("min", "1");
      expect(maxUsersInput).toHaveAttribute("max", "10000");
    });

    it("should handle empty number fields", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const maxUsersInput = screen.getByTestId("input-max_users");
      fireEvent.change(maxUsersInput, { target: { value: "" } });

      expect(screen.getByDisplayValue("0")).toBeInTheDocument();
    });

    it("should handle invalid number input", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const maxUsersInput = screen.getByTestId("input-max_users");
      fireEvent.change(maxUsersInput, { target: { value: "invalid" } });

      expect(screen.getByDisplayValue("0")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty configs object", () => {
      mockUseSystemConfig.mockReturnValue({
        configs: {},
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByText("Configurações do Sistema")).toBeInTheDocument();
    });

    it("should handle null/undefined config values", () => {
      mockUseSystemConfig.mockReturnValue({
        configs: {
          app_name: null,
          max_users: undefined,
          maintenance_mode: null,
        },
        categories: [],
        history: [],
        loading: false,
        error: null,
        updating: false,
        loadConfigs: jest.fn().mockResolvedValue(undefined),
        loadConfigsByCategory: jest.fn().mockResolvedValue(undefined),
        loadCategories: jest.fn().mockResolvedValue(undefined),
        loadHistory: jest.fn().mockResolvedValue(undefined),
        updateConfig: jest.fn().mockResolvedValue(true),
        updateMultipleConfigs: jest.fn(),
        resetToDefaults: jest.fn(),
        initializeDefaults: jest.fn(),
        getConfigValue: jest.fn().mockReturnValue(undefined),
        refresh: jest.fn(),
      });

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("input-app_name")).toHaveValue("");
      expect(screen.getByTestId("input-max_users")).toHaveValue("");
      expect(screen.getByTestId("switch-maintenance_mode")).not.toBeChecked();
    });
  });

  describe("Performance", () => {
    it("should render quickly with many configuration fields", () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render in less than 1 second
    });

    it("should have stable function references", () => {
      const { rerender } = render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      const saveButton = screen.getByText("Salvar Alterações");
      const originalOnClick = saveButton.onclick;

      rerender(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      // Function references should be stable to prevent unnecessary re-renders
      expect(saveButton.onclick).toBe(originalOnClick);
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form fields", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId("label-app_name")).toBeInTheDocument();
      expect(screen.getByTestId("label-max_users")).toBeInTheDocument();
      expect(screen.getByTestId("label-maintenance_mode")).toBeInTheDocument();
    });

    it("should have proper field descriptions", () => {
      render(
        <TestWrapper>
          <SystemConfigPage />
        </TestWrapper>,
      );

      expect(
        screen.getByText("Ativa o modo de manutenção da aplicação"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Permite que novos usuários se registrem"),
      ).toBeInTheDocument();
    });
  });
});
