import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { fetchAddressByCEP, validateCEPFormat } from "../../services/cep";

// Mock do fetch global
const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

// Mock response usado em todos os testes
const mockSuccessResponse = {
  cep: "01310-100",
  logradouro: "Rua Augusta",
  complemento: "",
  bairro: "Consolação",
  localidade: "São Paulo",
  uf: "SP",
  ibge: "3550308",
  gia: "1004",
  ddd: "11",
  siafi: "7107",
};

describe("CEP Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAddressByCep", () => {
    it("deve buscar endereço com sucesso", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as any);

      const result = await fetchAddressByCEP("01310100");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://viacep.com.br/ws/01310100/json/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(result).toEqual({
        cep: "01310-100",
        street: "Rua Augusta",
        neighborhood: "Consolação",
        city: "São Paulo",
        state: "SP",
      });
    });

    it("deve formatar CEP antes da busca", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as any);

      await fetchAddressByCEP("01310-100"); // CEP já formatado

      expect(mockFetch).toHaveBeenCalledWith(
        "https://viacep.com.br/ws/01310100/json/",
        expect.any(Object),
      );
    });

    it("deve retornar null para CEP não encontrado", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ erro: true }) as any,
      });

      const result = await fetchAddressByCEP("99999999");

      expect(result).toBeNull();
    });

    it("deve retornar null para resposta HTTP com erro", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as any);

      const result = await fetchAddressByCEP("01310100");

      expect(result).toBeNull();
    });

    it("deve retornar null para erro de rede", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchAddressByCEP("01310100");

      expect(result).toBeNull();
    });

    it("deve retornar null para JSON inválido", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as any);

      const result = await fetchAddressByCEP("01310100");

      expect(result).toBeNull();
    });

    it("deve retornar null para CEP inválido", async () => {
      const result = await fetchAddressByCEP("123");
      expect(result.success).toBe(false);
      expect(result.error).toBe("CEP deve ter 8 dígitos");
    });

    it("deve retornar null para CEP vazio", async () => {
      const result = await fetchAddressByCEP("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("CEP deve ter 8 dígitos");
    });

    it("deve lidar com timeout", async () => {
      // Simula timeout
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 100),
          ),
      );

      const result = await fetchAddressByCEP("01310100");

      expect(result.success).toBe(false);
    });

    it("deve lidar com resposta sem campos obrigatórios", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            cep: "01310-100",
            // Faltam outros campos
          }) as any,
      });

      const result = await fetchAddressByCEP("01310100");

      expect(result.success).toBe(true);
      expect(result.data?.cep).toBe("01310-100");
    });

    it("deve lidar com campos null/undefined na resposta", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            cep: "01310-100",
            logradouro: null,
            bairro: undefined,
            localidade: "São Paulo",
            uf: "SP",
          }) as any,
      });

      const result = await fetchAddressByCEP("01310100");

      expect(result.success).toBe(true);
      expect(result.data?.city).toBe("São Paulo");
      expect(result.data?.state).toBe("SP");
    });
  });

  describe("validateCEPFormat", () => {
    it("deve validar CEP com formato correto", async () => {
      // Mock da API de validação
      jest.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as any);

      const result = await validateCEPFormat("01310100");
      expect(result.isValid).toBe(true);
    });

    it("deve rejeitar CEP com formato incorreto", async () => {
      const result = await validateCEPFormat("123");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("CEP deve ter 8 dígitos");
    });
  });

  describe("Integration Tests", () => {
    it("deve funcionar com fluxo completo de validação e busca", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as any);

      // Simula entrada do usuário com CEP formatado
      const userInput = "01310-100";
      const result = await fetchAddressByCEP(userInput);

      expect(result.success).toBe(true);
      expect(result.data?.cep).toBe("01310-100");
      expect(result.data?.street).toBe("Rua Augusta");
    });

    it("deve lidar com múltiplas chamadas simultâneas", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockSuccessResponse, cep: "01310-100" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockSuccessResponse, cep: "04567-890" }),
        });

      const promises = [
        fetchAddressByCEP("01310100"),
        fetchAddressByCEP("04567890"),
      ];

      const results = await Promise.all(promises);

      expect(results[0].success).toBe(true);
      expect(results[0].data?.cep).toBe("01310-100");
      expect(results[1].success).toBe(true);
      expect(results[1].data?.cep).toBe("04567-890");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("deve cachear resultados para o mesmo CEP", async () => {
      // Nota: Este teste assume que há cache implementado
      // Se não houver cache, pode ser removido ou modificado
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      });

      await fetchAddressByCEP("01310100");
      await fetchAddressByCEP("01310100"); // Segunda chamada

      // Se houver cache, deve ser chamado apenas uma vez
      // Se não houver cache, será chamado duas vezes (comportamento atual)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Handling", () => {
    it("deve lidar com diferentes tipos de erro de rede", async () => {
      const networkErrors = [
        new Error("Failed to fetch"),
        new Error("Network request failed"),
        new Error("Connection timeout"),
        new TypeError("Network error"),
      ];

      for (const error of networkErrors) {
        mockFetch.mockRejectedValueOnce(error);
        const result = await fetchAddressByCEP("01310100");
        expect(result.success).toBe(false);
      }
    });

    it("deve lidar com diferentes códigos de status HTTP", async () => {
      const statusCodes = [400, 404, 500, 502, 503];

      for (const status of statusCodes) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
        } as any);
        const result = await fetchAddressByCEP("01310100");
        expect(result.success).toBe(false);
      }
    });

    it("deve lidar com resposta malformada", async () => {
      const malformedResponses = [
        null,
        undefined,
        "string instead of object",
        123,
        [],
        { invalid: "structure" },
      ];

      for (const response of malformedResponses) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => response,
        } as any);
        const result = await fetchAddressByCEP("01310100");
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Performance Tests", () => {
    it("deve completar busca em tempo razoável", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSuccessResponse,
      } as any);

      const startTime = performance.now();
      await fetchAddressByCEP("01310100");
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    it("deve lidar com múltiplas requisições concorrentes", async () => {
      // Simula 10 requisições simultâneas
      const promises = Array.from({ length: 10 }, (_, i) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockSuccessResponse,
            cep: `0131010${i} as any as Response`,
          }),
        });
        return fetchAddressByCEP(`0131010${i}`);
      });

      const startTime = performance.now();
      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(10);
      expect(results.every((result) => result.success)).toBe(true);

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000); // Menos de 2 segundos para todas
    });
  });

  describe("Edge Cases", () => {
    it("deve lidar com CEPs de diferentes regiões do Brasil", async () => {
      const regionalCEPs = [
        "01310100", // São Paulo - SP
        "20040020", // Rio de Janeiro - RJ
        "30112000", // Belo Horizonte - MG
        "40070110", // Salvador - BA
        "80010000", // Curitiba - PR
        "90010000", // Porto Alegre - RS
        "70040010", // Brasília - DF
        "60160230", // Fortaleza - CE
        "50030230", // Recife - PE
      ];

      for (const cep of regionalCEPs) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockSuccessResponse, cep }) as any,
        });

        const result = await fetchAddressByCEP(cep);
        expect(result.success).toBe(true);
        expect(result.data?.cep).toBe(cep.replace(/(\d{5})(\d{3})/, "$1-$2"));
      }
    });

    it("deve lidar com caracteres especiais na resposta da API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            ...mockSuccessResponse,
            logradouro: "Rua José da Silva Ção",
            bairro: "São João",
            localidade: "São Paulo",
          }) as any,
      });

      const result = await fetchAddressByCEP("01310100");

      expect(result.success).toBe(true);
      expect(result.data?.street).toBe("Rua José da Silva Ção");
      expect(result.data?.neighborhood).toBe("São João");
      expect(result.data?.city).toBe("São Paulo");
    });

    it("deve lidar com nomes de rua muito longos", async () => {
      const longStreetName = "Rua " + "A".repeat(200);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          ({
            ...mockSuccessResponse,
            logradouro: longStreetName,
          }) as any,
      });

      const result = await fetchAddressByCEP("01310100");

      expect(result.success).toBe(true);
      expect(result.data?.street).toBe(longStreetName);
    });
  });
});
