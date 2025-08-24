// Tipos relacionados às configurações do sistema

export interface SystemConfig {
  [key: string]: any;
}

export interface ConfigUpdateRequest {
  key: string;
  value: any;
}

export interface MultipleConfigUpdateRequest {
  configs: { [key: string]: any };
}

export interface ConfigHistoryItem {
  id: number;
  key: string;
  old_value: any;
  new_value: any;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
}

export interface UseSystemConfigState {
  configs: { [key: string]: any };
  categories: string[];
  history: ConfigHistoryItem[];
  loading: boolean;
  updating: boolean;
  error: string | null;
}

export interface UseSystemConfigReturn extends UseSystemConfigState {
  // Funções de carregamento
  loadConfigs: (category?: string, publicOnly?: boolean) => Promise<void>;
  loadConfigsByCategory: (category: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadHistory: (key?: string, limit?: number) => Promise<void>;

  // Funções de atualização
  updateConfig: (key: string, value: any) => Promise<boolean>;
  updateMultipleConfigs: (configs: { [key: string]: any }) => Promise<boolean>;
  resetToDefaults: () => Promise<boolean>;
  initializeDefaults: () => Promise<boolean>;

  // Funções utilitárias
  getConfigValue: (key: string) => any;
  refresh: () => Promise<void>;
}