import { toast } from "sonner";

/**
 * Hook para gerenciar notificações toast
 * Wrapper para a biblioteca sonner com funcionalidades customizadas
 */
export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast(message);
  };

  const showWarning = (message: string) => {
    toast(message, {
      style: {
        background: "#f59e0b",
        color: "#ffffff",
      },
    });
  };

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    toast, // Exporta o toast original para casos específicos
  };
};

export default useToast;
