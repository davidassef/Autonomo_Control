import api from "./api";

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
  config_key: string;
  config_value: string;
  value_type: string;
  category: string;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
  updated_by: {
    name: string | null;
    email: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

class SystemConfigService {
  /**
   * Obtém todas as configurações do sistema
   */
  async getAllConfigs(
    category?: string,
    publicOnly?: boolean,
  ): Promise<SystemConfig> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (publicOnly) params.append("public_only", "true");

    const response = await api.get<ApiResponse<SystemConfig>>(
      `/system-config/?${params.toString()}`,
    );
    return response.data.data;
  }

  /**
   * Obtém apenas as configurações públicas (não requer autenticação)
   */
  async getPublicConfigs(): Promise<SystemConfig> {
    const response = await api.get<ApiResponse<SystemConfig>>(
      "/system-config/public",
    );
    return response.data.data;
  }

  /**
   * Obtém configurações de uma categoria específica
   */
  async getConfigsByCategory(category: string): Promise<SystemConfig> {
    const response = await api.get<ApiResponse<SystemConfig>>(
      `/system-config/category/${category}`,
    );
    return response.data.data;
  }

  /**
   * Obtém uma configuração específica por chave
   */
  async getConfigByKey(key: string): Promise<any> {
    const response = await api.get<ApiResponse<{ [key: string]: any }>>(
      `/system-config/key/${key}`,
    );
    return response.data.data[key];
  }

  /**
   * Atualiza uma configuração específica
   */
  async updateConfig(key: string, value: any): Promise<string> {
    const response = await api.put<ApiResponse<null>>("/system-config/", {
      key,
      value,
    });
    return response.data.message;
  }

  /**
   * Atualiza múltiplas configurações de uma vez
   */
  async updateMultipleConfigs(configs: { [key: string]: any }): Promise<{
    success: boolean;
    message: string;
    results?: { [key: string]: boolean };
  }> {
    const response = await api.put<ApiResponse<{ [key: string]: boolean }>>(
      "/system-config/multiple",
      { configs },
    );

    return {
      success: response.data.success,
      message: response.data.message,
      results: response.data.data,
    };
  }

  /**
   * Reseta todas as configurações para os valores padrão
   */
  async resetToDefaults(): Promise<string> {
    const response = await api.post<ApiResponse<null>>("/system-config/reset");
    return response.data.message;
  }

  /**
   * Inicializa as configurações padrão no banco de dados
   */
  async initializeDefaults(): Promise<string> {
    const response = await api.post<ApiResponse<null>>(
      "/system-config/initialize",
    );
    return response.data.message;
  }

  /**
   * Obtém o histórico de alterações das configurações
   */
  async getConfigHistory(
    key?: string,
    limit: number = 50,
  ): Promise<ConfigHistoryItem[]> {
    const params = new URLSearchParams();
    if (key) params.append("key", key);
    params.append("limit", limit.toString());

    const response = await api.get<ApiResponse<ConfigHistoryItem[]>>(
      `/system-config/history?${params.toString()}`,
    );
    return response.data.data;
  }

  /**
   * Obtém todas as categorias de configuração disponíveis
   */
  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>(
      "/system-config/categories",
    );
    return response.data.data;
  }
}

export const systemConfigService = new SystemConfigService();
export default systemConfigService;
