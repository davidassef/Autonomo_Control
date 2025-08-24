// Mock para SystemConfigService
import { jest } from "@jest/globals";

// Importar tipos reais do service
import {
  SystemConfig,
} from "../types/systemConfig";

// Dados mock para testes - usando a estrutura real do SystemConfig
const mockConfigsData: SystemConfig = {
  app_name: "Autonomo Control",
  max_users: "100",
  theme: "light",
  password_min_length: "8",
  smtp_host: "localhost",
  smtp_port: "587",
};

// Mock das funções do service - retornando apenas os dados como o service real faz
const mockGetAllConfigs = jest
  .fn<() => Promise<SystemConfig>>()
  .mockResolvedValue({
    app_name: "Autonomo Control",
    max_users: "100",
    theme: "light",
    password_min_length: "8",
    smtp_host: "localhost",
    smtp_port: "587",
  });

const mockGetConfigsByCategory = jest
  .fn<(category: string) => Promise<Partial<SystemConfig>>>()
  .mockResolvedValue({
    app_name: "Autonomo Control",
  });

const mockGetConfigByKey = jest
  .fn<(key: string) => Promise<string>>()
  .mockResolvedValue("Autonomo Control");

const mockUpdateConfig = jest
  .fn<(key: string, value: any) => Promise<string>>()
  .mockResolvedValue("Configuração atualizada com sucesso");

const mockUpdateMultipleConfigs = jest
  .fn<
    (configs: Record<string, any>) => Promise<{
      success: boolean;
      message: string;
      results: Record<string, boolean>;
    }>
  >()
  .mockResolvedValue({
    success: true,
    message: "Configurações atualizadas com sucesso",
    results: { app_name: true, theme: true },
  });

const mockResetToDefaults = jest
  .fn<() => Promise<string>>()
  .mockResolvedValue("Configurações resetadas com sucesso");

const mockInitializeDefaults = jest
  .fn<() => Promise<string>>()
  .mockResolvedValue("Configurações inicializadas com sucesso");

const mockGetConfigHistory = jest
  .fn<(key: string) => Promise<any[]>>()
  .mockResolvedValue([]);

const mockGetCategories = jest
  .fn<() => Promise<string[]>>()
  .mockResolvedValue(["app", "ui", "security"]);

const mockGetPublicConfigs = jest
  .fn<() => Promise<Partial<SystemConfig>>>()
  .mockResolvedValue({
    app_name: "Autonomo Control",
    theme: "light",
  });

const mockCreateConfig = jest
  .fn<
    (key: string, value: any) => Promise<{ success: boolean; message: string }>
  >()
  .mockImplementation((key: string, value: any) => {
    (mockConfigsData as any)[key] = value;
    return Promise.resolve({
      success: true,
      message: "Configuração criada com sucesso",
    });
  });

const mockDeleteConfig = jest
  .fn<(key: string) => Promise<{ success: boolean; message: string }>>()
  .mockImplementation((key: string) => {
    if (key in mockConfigsData) {
      delete (mockConfigsData as any)[key];
      return Promise.resolve({
        success: true,
        message: "Configuração deletada com sucesso",
      });
    }
    return Promise.resolve({
      success: false,
      message: "Configuração não encontrada",
    });
  });

// Mock do service completo
export const mockSystemConfigService = {
  getAllConfigs: mockGetAllConfigs,
  getPublicConfigs: mockGetPublicConfigs,
  getConfigsByCategory: mockGetConfigsByCategory,
  getConfigByKey: mockGetConfigByKey,
  updateConfig: mockUpdateConfig,
  updateMultipleConfigs: mockUpdateMultipleConfigs,
  resetToDefaults: mockResetToDefaults,
  initializeDefaults: mockInitializeDefaults,
  getConfigHistory: mockGetConfigHistory,
  getCategories: mockGetCategories,
};

// Helpers para controlar o estado do mock
export const setMockConfigsData = (data: SystemConfig) => {
  Object.keys(mockConfigsData).forEach(
    (key) => delete (mockConfigsData as any)[key],
  );
  Object.assign(mockConfigsData, data);
};

export const resetSystemConfigMocks = () => {
  mockGetAllConfigs.mockClear();
  mockGetPublicConfigs.mockClear();
  mockGetConfigsByCategory.mockClear();
  mockGetConfigByKey.mockClear();
  mockUpdateConfig.mockClear();
  mockUpdateMultipleConfigs.mockClear();
  mockResetToDefaults.mockClear();
  mockInitializeDefaults.mockClear();
  mockGetConfigHistory.mockClear();
  mockGetCategories.mockClear();

  // Reset para dados padrão
  setMockConfigsData({
    app_name: "Autonomo Control",
    max_users: "100",
    theme: "light",
    password_min_length: "8",
    smtp_host: "localhost",
    smtp_port: "587",
  });
};

// Exportar dados mock para uso em testes
export {
  mockConfigsData,
  mockGetAllConfigs,
  mockGetConfigsByCategory,
  mockGetConfigByKey,
  mockUpdateConfig,
  mockCreateConfig,
  mockDeleteConfig,
};
