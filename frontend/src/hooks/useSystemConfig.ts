import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import systemConfigService, { SystemConfig, ConfigHistoryItem } from '../services/systemConfigService';

interface UseSystemConfigState {
  configs: SystemConfig;
  categories: string[];
  history: ConfigHistoryItem[];
  loading: boolean;
  error: string | null;
  updating: boolean;
}

interface UseSystemConfigReturn extends UseSystemConfigState {
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

export function useSystemConfig(): UseSystemConfigReturn {
  const [state, setState] = useState<UseSystemConfigState>({
    configs: {},
    categories: [],
    history: [],
    loading: false,
    error: null,
    updating: false
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setUpdating = useCallback((updating: boolean) => {
    setState(prev => ({ ...prev, updating }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false, updating: false }));
  }, []);

  const loadConfigs = useCallback(async (category?: string, publicOnly?: boolean) => {
    try {
      setLoading(true);
      const configs = await systemConfigService.getAllConfigs(category, publicOnly);
      setState(prev => ({ ...prev, configs, loading: false, error: null }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar configurações';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [setLoading, setError]);

  const loadConfigsByCategory = useCallback(async (category: string) => {
    try {
      setLoading(true);
      const configs = await systemConfigService.getConfigsByCategory(category);
      setState(prev => ({ ...prev, configs, loading: false, error: null }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar configurações da categoria';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [setLoading, setError]);

  const loadCategories = useCallback(async () => {
    try {
      const categories = await systemConfigService.getCategories();
      setState(prev => ({ ...prev, categories }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar categorias';
      console.error('Erro ao carregar categorias:', errorMessage);
    }
  }, []);

  const loadHistory = useCallback(async (key?: string, limit: number = 50) => {
    try {
      const history = await systemConfigService.getConfigHistory(key, limit);
      setState(prev => ({ ...prev, history }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao carregar histórico';
      console.error('Erro ao carregar histórico:', errorMessage);
    }
  }, []);

  const updateConfig = useCallback(async (key: string, value: any): Promise<boolean> => {
    try {
      setUpdating(true);
      const message = await systemConfigService.updateConfig(key, value);
      
      // Atualizar o estado local
      setState(prev => ({
        ...prev,
        configs: { ...prev.configs, [key]: value },
        updating: false
      }));
      
      toast.success(message);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar configuração';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [setUpdating, setError]);

  const updateMultipleConfigs = useCallback(async (configs: { [key: string]: any }): Promise<boolean> => {
    try {
      setUpdating(true);
      const result = await systemConfigService.updateMultipleConfigs(configs);
      
      if (result.success) {
        // Atualizar o estado local
        setState(prev => ({
          ...prev,
          configs: { ...prev.configs, ...configs },
          updating: false
        }));
        
        toast.success(result.message);
        return true;
      } else {
        setError(result.message);
        toast.error(result.message);
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar configurações';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [setUpdating, setError]);

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    try {
      setUpdating(true);
      const message = await systemConfigService.resetToDefaults();
      
      // Recarregar configurações
      await loadConfigs();
      
      toast.success(message);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao resetar configurações';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [setUpdating, setError, loadConfigs]);

  const initializeDefaults = useCallback(async (): Promise<boolean> => {
    try {
      setUpdating(true);
      const message = await systemConfigService.initializeDefaults();
      
      // Recarregar configurações
      await loadConfigs();
      
      toast.success(message);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erro ao inicializar configurações';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, [setUpdating, setError, loadConfigs]);

  const getConfigValue = useCallback((key: string) => {
    return state.configs[key];
  }, [state.configs]);

  const refresh = useCallback(async () => {
    await loadConfigs();
    await loadCategories();
  }, [loadConfigs, loadCategories]);

  // Carregar dados iniciais
  useEffect(() => {
    refresh();
  }, []);

  return {
    ...state,
    loadConfigs,
    loadConfigsByCategory,
    loadCategories,
    loadHistory,
    updateConfig,
    updateMultipleConfigs,
    resetToDefaults,
    initializeDefaults,
    getConfigValue,
    refresh
  };
}

export default useSystemConfig;