import { entryService } from "./entries";
import api from "./api";
import { Entry, EntrySummary, MonthlySummary } from "../types";

// Mock do módulo api
jest.mock("./api");

const mockApi = api as jest.Mocked<typeof api>;

describe("EntryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEntry: Entry = {
    id: "1",
    amount: 150.5,
    description: "Test Entry",
    type: "EXPENSE",
    date: "2024-01-15",
    category_id: "1",
    category: {
      id: "1",
      name: "Food",
      type: "EXPENSE",
      subcategories: [],
      user_id: "1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    platform: "cash",
    shift_tag: "morning",
    city: "São Paulo",
    user_id: "1",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  };

  const mockEntries: Entry[] = [mockEntry];

  const mockSummary: EntrySummary = {
    total_income: 1000.0,
    total_expense: 500.0,
    balance: 500.0,
    count_income: 5,
    count_expense: 5,
    total_count: 10,
  };

  const mockMonthlySummary: MonthlySummary = {
    year: 2024,
    month: "01",
    total_income: 2000.0,
    total_expense: 1200.0,
    balance: 800.0,
    count_income: 15,
    count_expense: 10,
    total_count: 25,
  };

  describe("getAll", () => {
    it("deve buscar todas as entradas sem filtros", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      const result = await entryService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith("/entries", {
        params: undefined,
      });
      expect(result).toEqual(mockEntries);
    });

    it("deve buscar entradas com filtros de data", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      const params = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      const result = await entryService.getAll(params);

      expect(mockApi.get).toHaveBeenCalledWith("/entries", { params });
      expect(result).toEqual(mockEntries);
    });

    it("deve buscar entradas com filtro de tipo", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      const params = { type: "expense" as const };

      const result = await entryService.getAll(params);

      expect(mockApi.get).toHaveBeenCalledWith("/entries", { params });
      expect(result).toEqual(mockEntries);
    });

    it("deve buscar entradas com filtro de categoria", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      const params = { category_id: 1 };

      const result = await entryService.getAll(params);

      expect(mockApi.get).toHaveBeenCalledWith("/entries", { params });
      expect(result).toEqual(mockEntries);
    });

    it("deve buscar entradas com todos os filtros", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      const params = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        type: "income" as const,
        category_id: 2,
      };

      const result = await entryService.getAll(params);

      expect(mockApi.get).toHaveBeenCalledWith("/entries", { params });
      expect(result).toEqual(mockEntries);
    });

    it("deve tratar erro ao buscar entradas", async () => {
      const mockError = {
        response: {
          status: 500,
          data: { detail: "Server error" },
        },
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(entryService.getAll()).rejects.toEqual(mockError);
    });
  });

  describe("getById", () => {
    it("deve buscar entrada por ID", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntry });

      const result = entryService.getById(1);

      expect(mockApi.get).toHaveBeenCalledWith("/entries/1");
      expect(result).toEqual(mockEntry);
    });

    it("deve tratar erro quando entrada não encontrada", async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: "Entry not found" },
        },
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(entryService.getById(999)).rejects.toEqual(mockError);
    });
  });

  describe("create", () => {
    const newEntryData = {
      amount: 200.75,
      description: "New Entry",
      type: "INCOME" as const,
      date: "2024-01-20",
      category_id: "2",
      platform: "credit_card",
      shift_tag: "afternoon",
      city: "Rio de Janeiro",
    };

    it("deve criar nova entrada", async () => {
      const createdEntry = { ...mockEntry, ...newEntryData, id: 2 };
      mockApi.post.mockResolvedValue({ data: createdEntry });

      const result = await entryService.create(newEntryData);

      expect(mockApi.post).toHaveBeenCalledWith("/entries", newEntryData);
      expect(result).toEqual(createdEntry);
    });

    it("deve tratar erro de validação ao criar entrada", async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ["body", "amount"],
                msg: "ensure this value is greater than 0",
                type: "value_error.number.not_gt",
              },
            ],
          },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(
        entryService.create({ ...newEntryData, amount: -10 }),
      ).rejects.toEqual(mockError);
    });

    it("deve tratar erro de categoria não encontrada", async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: "Category not found" },
        },
      };

      mockApi.post.mockRejectedValue(mockError);

      await expect(
        entryService.create({ ...newEntryData, category_id: "999" }),
      ).rejects.toEqual(mockError);
    });
  });

  describe("update", () => {
    const updateData = {
      amount: 150.25,
      description: "Updated Entry",
    };

    it("deve atualizar entrada existente", async () => {
      const updatedEntry = { ...mockEntry, ...updateData };
      mockApi.put.mockResolvedValue({ data: updatedEntry });

      const result = await entryService.update(1, updateData);

      expect(mockApi.put).toHaveBeenCalledWith("/entries/1", updateData);
      expect(result).toEqual(updatedEntry);
    });

    it("deve atualizar entrada com dados parciais", async () => {
      const partialUpdate = { description: "Only description updated" };
      const updatedEntry = { ...mockEntry, ...partialUpdate };
      mockApi.put.mockResolvedValue({ data: updatedEntry });

      const result = await entryService.update(1, partialUpdate);

      expect(mockApi.put).toHaveBeenCalledWith("/entries/1", partialUpdate);
      expect(result).toEqual(updatedEntry);
    });

    it("deve tratar erro quando entrada não encontrada para atualização", async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: "Entry not found" },
        },
      };

      mockApi.put.mockRejectedValue(mockError);

      await expect(entryService.update(999, updateData)).rejects.toEqual(
        mockError,
      );
    });

    it("deve tratar erro de validação na atualização", async () => {
      const mockError = {
        response: {
          status: 422,
          data: {
            detail: [
              {
                loc: ["body", "date"],
                msg: "invalid date format",
                type: "value_error.date",
              },
            ],
          },
        },
      };

      mockApi.put.mockRejectedValue(mockError);

      await expect(
        entryService.update(1, { date: "invalid-date" }),
      ).rejects.toEqual(mockError);
    });
  });

  describe("delete", () => {
    it("deve excluir entrada existente", async () => {
      mockApi.delete.mockResolvedValue({});

      await entryService.delete(1);

      expect(mockApi.delete).toHaveBeenCalledWith("/entries/1");
    });

    it("deve tratar erro quando entrada não encontrada para exclusão", async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: "Entry not found" },
        },
      };

      mockApi.delete.mockRejectedValue(mockError);

      await expect(entryService.delete(999)).rejects.toEqual(mockError);
    });

    it("deve tratar erro de permissão na exclusão", async () => {
      const mockError = {
        response: {
          status: 403,
          data: { detail: "Not authorized to delete this entry" },
        },
      };

      mockApi.delete.mockRejectedValue(mockError);

      await expect(entryService.delete(1)).rejects.toEqual(mockError);
    });
  });

  describe("getSummary", () => {
    it("deve buscar resumo sem filtros", async () => {
      mockApi.get.mockResolvedValue({ data: mockSummary });

      const result = await entryService.getSummary();

      expect(mockApi.get).toHaveBeenCalledWith("/entries/summary", {
        params: undefined,
      });
      expect(result).toEqual(mockSummary);
    });

    it("deve buscar resumo com filtros de data", async () => {
      mockApi.get.mockResolvedValue({ data: mockSummary });

      const params = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      const result = await entryService.getSummary(params);

      expect(mockApi.get).toHaveBeenCalledWith("/entries/summary", { params });
      expect(result).toEqual(mockSummary);
    });

    it("deve tratar erro ao buscar resumo", async () => {
      const mockError = {
        response: {
          status: 500,
          data: { detail: "Error calculating summary" },
        },
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(entryService.getSummary()).rejects.toEqual(mockError);
    });
  });

  describe("getMonthlySummary", () => {
    it("deve buscar resumo mensal", async () => {
      mockApi.get.mockResolvedValue({ data: mockMonthlySummary });

      const result = await entryService.getMonthlySummary(2024, 1);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/entries/summary/monthly/2024/1",
      );
      expect(result).toEqual(mockMonthlySummary);
    });

    it("deve buscar resumo mensal para diferentes meses", async () => {
      const februarySummary = { ...mockMonthlySummary, month: 2 };
      mockApi.get.mockResolvedValue({ data: februarySummary });

      const result = await entryService.getMonthlySummary(2024, 2);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/entries/summary/monthly/2024/2",
      );
      expect(result).toEqual(februarySummary);
    });

    it("deve buscar resumo mensal para diferentes anos", async () => {
      const nextYearSummary = { ...mockMonthlySummary, year: 2025 };
      mockApi.get.mockResolvedValue({ data: nextYearSummary });

      const result = await entryService.getMonthlySummary(2025, 1);

      expect(mockApi.get).toHaveBeenCalledWith(
        "/entries/summary/monthly/2025/1",
      );
      expect(result).toEqual(nextYearSummary);
    });

    it("deve tratar erro ao buscar resumo mensal", async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: "Invalid month or year" },
        },
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(entryService.getMonthlySummary(2024, 13)).rejects.toEqual(
        mockError,
      );
    });

    it("deve tratar erro de servidor ao buscar resumo mensal", async () => {
      const mockError = {
        response: {
          status: 500,
          data: { detail: "Error calculating monthly summary" },
        },
      };

      mockApi.get.mockRejectedValue(mockError);

      await expect(entryService.getMonthlySummary(2024, 1)).rejects.toEqual(
        mockError,
      );
    });
  });

  describe("integração entre métodos", () => {
    it("deve criar e buscar entrada", async () => {
      const newEntryData = {
        amount: 300.0,
        description: "Integration Test Entry",
        type: "EXPENSE" as const,
        date: "2024-01-25",
        category_id: "cat1",
        platform: "debit_card",
        shift_tag: "evening",
        city: "Brasília",
      };

      const createdEntry = { ...mockEntry, ...newEntryData, id: 3 };

      // Mock para criação
      mockApi.post.mockResolvedValue({ data: createdEntry });

      // Mock para busca por ID
      mockApi.get.mockResolvedValue({ data: createdEntry });

      // Criar entrada
      const created = await entryService.create(newEntryData);
      expect(created).toEqual(createdEntry);

      // Buscar entrada criada
      const fetched = entryService.getById(3);
      expect(fetched).toEqual(createdEntry);

      expect(mockApi.post).toHaveBeenCalledWith("/entries", newEntryData);
      expect(mockApi.get).toHaveBeenCalledWith("/entries/3");
    });

    it("deve atualizar e buscar entrada", async () => {
      const updateData = {
        amount: 250.0,
        description: "Updated Integration Entry",
      };
      const updatedEntry = { ...mockEntry, ...updateData };

      // Mock para atualização
      mockApi.put.mockResolvedValue({ data: updatedEntry });

      // Mock para busca por ID
      mockApi.get.mockResolvedValue({ data: updatedEntry });

      // Atualizar entrada
      const updated = await entryService.update(1, updateData);
      expect(updated).toEqual(updatedEntry);

      // Buscar entrada atualizada
      const fetched = entryService.getById(1);
      expect(fetched).toEqual(updatedEntry);

      expect(mockApi.put).toHaveBeenCalledWith("/entries/1", updateData);
      expect(mockApi.get).toHaveBeenCalledWith("/entries/1");
    });
  });

  describe("tratamento de tipos", () => {
    it("deve aceitar tipo expense", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      await entryService.getAll({ type: "expense" });

      expect(mockApi.get).toHaveBeenCalledWith("/entries", {
        params: { type: "expense" },
      });
    });

    it("deve aceitar tipo income", async () => {
      mockApi.get.mockResolvedValue({ data: mockEntries });

      await entryService.getAll({ type: "income" });

      expect(mockApi.get).toHaveBeenCalledWith("/entries", {
        params: { type: "income" },
      });
    });
  });

  describe("tratamento de erros de rede", () => {
    it("deve propagar erro de timeout", async () => {
      const timeoutError = {
        code: "ECONNABORTED",
        message: "timeout of 5000ms exceeded",
      };

      mockApi.get.mockRejectedValue(timeoutError);

      await expect(entryService.getAll()).rejects.toEqual(timeoutError);
    });

    it("deve propagar erro de conexão", async () => {
      const connectionError = {
        code: "ECONNREFUSED",
        message: "connect ECONNREFUSED 127.0.0.1:8000",
      };

      mockApi.post.mockRejectedValue(connectionError);

      await expect(
        entryService.create({
          amount: 100,
          description: "Test",
          type: "EXPENSE",
          date: "2024-01-01",
          category_id: "cat1",
        }),
      ).rejects.toEqual(connectionError);
    });
  });
});
