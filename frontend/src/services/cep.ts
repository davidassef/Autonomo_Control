/**
 * Serviço para integração com API de CEP
 */

import api from "./api";

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string;
}

export interface CEPResponse {
  success: boolean;
  data?: AddressData;
  error?: string;
}

/**
 * Busca dados de endereço por CEP
 */
export const fetchAddressByCEP = async (cep: string): Promise<CEPResponse> => {
  try {
    // Remove formatação do CEP
    const cleanCEP = cep.replace(/\D/g, "");

    if (cleanCEP.length !== 8) {
      return {
        success: false,
        error: "CEP deve ter 8 dígitos",
      };
    }

    const response = await api.get(`/cep/${cleanCEP}`);

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Erro ao buscar CEP",
      };
    }
  } catch (error: any) {
    console.error("Erro ao buscar CEP:", error);

    if (error.response?.status === 404) {
      return {
        success: false,
        error: "CEP não encontrado",
      };
    }

    return {
      success: false,
      error: "Erro ao conectar com o serviço de CEP",
    };
  }
};

/**
 * Valida formato do CEP
 */
export const validateCEPFormat = async (
  cep: string,
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const cleanCEP = cep.replace(/\D/g, "");

    if (cleanCEP.length !== 8) {
      return {
        isValid: false,
        error: "CEP deve ter 8 dígitos",
      };
    }

    const response = await api.get(`/cep/${cleanCEP}/validate`);

    return {
      isValid: response.data.valid,
      error: response.data.valid ? undefined : "CEP inválido",
    };
  } catch (error: any) {
    console.error("Erro ao validar CEP:", error);
    return {
      isValid: false,
      error: "Erro ao validar CEP",
    };
  }
};
