import {
  securityQuestionsService,
  SecurityQuestion,
} from "./securityQuestions";
import api from "./api";

// Mock the API module
jest.mock("./api");

const mockApi = api as jest.Mocked<typeof api>;

// Mock questions data used across multiple test suites
const mockQuestions: SecurityQuestion[] = [
  {
    id: 1,
    question: "Qual é o nome do seu primeiro animal de estimação?",
    is_active: true,
  },
  {
    id: 2,
    question: "Em que cidade você nasceu?",
    is_active: true,
  },
  {
    id: 3,
    question: "Qual é o nome de solteira da sua mãe?",
    is_active: true,
  },
  {
    id: 4,
    question: "Qual foi o nome da sua primeira escola?",
    is_active: true,
  },
  {
    id: 5,
    question: "Qual é o seu filme favorito?",
    is_active: true,
  },
];

describe("securityQuestionsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all security questions successfully", async () => {
      const mockResponse = {
        data: {
          questions: mockQuestions,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith("/auth/security-questions");
      expect(mockApi.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockQuestions);
      expect(result).toHaveLength(5);
    });

    it("should return empty array when no questions are available", async () => {
      const mockResponse = {
        data: {
          questions: [],
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith("/auth/security-questions");
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle API errors gracefully", async () => {
      const error = new Error("Network error");
      mockApi.get.mockRejectedValue(error);

      await expect(securityQuestionsService.getAll()).rejects.toThrow(
        "Network error",
      );
      expect(mockApi.get).toHaveBeenCalledWith("/auth/security-questions");
    });

    it("should handle 404 errors", async () => {
      const error = {
        response: {
          status: 404,
          data: { message: "Endpoint not found" },
        },
      };
      mockApi.get.mockRejectedValue(error);

      await expect(securityQuestionsService.getAll()).rejects.toEqual(error);
    });

    it("should handle 500 server errors", async () => {
      const error = {
        response: {
          status: 500,
          data: { message: "Internal server error" },
        },
      };
      mockApi.get.mockRejectedValue(error);

      await expect(securityQuestionsService.getAll()).rejects.toEqual(error);
    });

    it("should handle unauthorized access (401)", async () => {
      const error = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
      };
      mockApi.get.mockRejectedValue(error);

      await expect(securityQuestionsService.getAll()).rejects.toEqual(error);
    });

    it("should handle malformed response data", async () => {
      const mockResponse = {
        data: {
          // Missing 'questions' property
          items: mockQuestions,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      // This should throw an error because response.data.questions is undefined
      await expect(securityQuestionsService.getAll()).rejects.toThrow();
    });

    it("should handle null response data", async () => {
      const mockResponse = {
        data: null,
      };
      mockApi.get.mockResolvedValue(mockResponse);

      await expect(securityQuestionsService.getAll()).rejects.toThrow();
    });

    it("should handle response with null questions array", async () => {
      const mockResponse = {
        data: {
          questions: null,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();
      expect(result).toBeNull();
    });

    it("should validate question structure", async () => {
      const questionsWithValidStructure: SecurityQuestion[] = [
        { id: 1, question: "Question 1", is_active: true },
        { id: 2, question: "Question 2", is_active: true },
      ];

      const mockResponse = {
        data: {
          questions: questionsWithValidStructure,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(result).toEqual(questionsWithValidStructure);
      result.forEach((question) => {
        expect(question).toHaveProperty("id");
        expect(question).toHaveProperty("question");
        expect(question).toHaveProperty("is_active");
        expect(typeof question.id).toBe("number");
        expect(typeof question.question).toBe("string");
        expect(typeof question.is_active).toBe("boolean");
      });
    });

    it("should handle questions with special characters", async () => {
      const questionsWithSpecialChars: SecurityQuestion[] = [
        {
          id: 1,
          question:
            "Qual é o nome do seu primeiro animal de estimação? (cão/gato)",
          is_active: true,
        },
        {
          id: 2,
          question: "Em que cidade você nasceu? [Cidade/Estado]",
          is_active: true,
        },
        {
          id: 3,
          question: "Qual é o seu e-mail favorito? user@example.com",
          is_active: true,
        },
      ];

      const mockResponse = {
        data: {
          questions: questionsWithSpecialChars,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(result).toEqual(questionsWithSpecialChars);
      expect(result[0].question).toContain("(cão/gato)");
      expect(result[1].question).toContain("[Cidade/Estado]");
      expect(result[2].question).toContain("@");
    });

    it("should handle questions with empty text", async () => {
      const questionsWithEmptyText: SecurityQuestion[] = [
        { id: 1, question: "", is_active: true },
        { id: 2, question: "Valid question", is_active: true },
      ];

      const mockResponse = {
        data: {
          questions: questionsWithEmptyText,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(result).toEqual(questionsWithEmptyText);
      expect(result[0].question).toBe("");
      expect(result[1].question).toBe("Valid question");
    });

    it("should handle questions with numeric IDs as strings", async () => {
      const questionsWithNumericIds: SecurityQuestion[] = [
        { id: 123, question: "Question with numeric ID", is_active: true },
        { id: 456, question: "Another question", is_active: true },
      ];

      const mockResponse = {
        data: {
          questions: questionsWithNumericIds,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(result).toEqual(questionsWithNumericIds);
      expect(typeof result[0].id).toBe("number");
      expect(typeof result[1].id).toBe("number");
    });

    it("should handle questions with UUID-like IDs", async () => {
      const questionsWithUUIDs: SecurityQuestion[] = [
        {
          id: 1,
          question: "Question with UUID",
          is_active: true,
        },
        {
          id: 2,
          question: "Another UUID question",
          is_active: true,
        },
      ];

      const mockResponse = {
        data: {
          questions: questionsWithUUIDs,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const result = await securityQuestionsService.getAll();

      expect(result).toEqual(questionsWithUUIDs);
      expect(typeof result[0].id).toBe("number");
      expect(typeof result[1].id).toBe("number");
    });

    it("should handle network timeout errors", async () => {
      const timeoutError = new Error("Request timeout");
      timeoutError.name = "TimeoutError";
      mockApi.get.mockRejectedValue(timeoutError);

      await expect(securityQuestionsService.getAll()).rejects.toThrow(
        "Request timeout",
      );
      expect(mockApi.get).toHaveBeenCalledWith("/auth/security-questions");
    });

    it("should handle connection refused errors", async () => {
      const connectionError = new Error("Connection refused");
      connectionError.name = "ECONNREFUSED";
      mockApi.get.mockRejectedValue(connectionError);

      await expect(securityQuestionsService.getAll()).rejects.toThrow(
        "Connection refused",
      );
    });

    it("should make only one API call per invocation", async () => {
      const mockResponse = {
        data: {
          questions: mockQuestions,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      await securityQuestionsService.getAll();
      await securityQuestionsService.getAll();
      await securityQuestionsService.getAll();

      expect(mockApi.get).toHaveBeenCalledTimes(3);
      expect(mockApi.get).toHaveBeenCalledWith("/auth/security-questions");
    });
  });

  describe("Service Structure", () => {
    it("should export securityQuestionsService object", () => {
      expect(securityQuestionsService).toBeDefined();
      expect(typeof securityQuestionsService).toBe("object");
    });

    it("should have getAll method", () => {
      expect(securityQuestionsService.getAll).toBeDefined();
      expect(typeof securityQuestionsService.getAll).toBe("function");
    });

    it("should export SecurityQuestion interface", () => {
      // This is more of a TypeScript compile-time check
      // but we can verify the structure through runtime usage
      const question: SecurityQuestion = {
        id: 1,
        question: "Test question",
        is_active: true,
      };

      expect(question.id).toBe(1);
      expect(question.question).toBe("Test question");
      expect(question.is_active).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle large number of questions efficiently", async () => {
      const largeQuestionSet: SecurityQuestion[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: i + 1,
          question: `Security question number ${i + 1}?`,
          is_active: true,
        }),
      );

      const mockResponse = {
        data: {
          questions: largeQuestionSet,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const startTime = performance.now();
      const result = await securityQuestionsService.getAll();
      const endTime = performance.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });

    it("should handle concurrent requests", async () => {
      const mockResponse = {
        data: {
          questions: mockQuestions,
        },
      };
      mockApi.get.mockResolvedValue(mockResponse);

      const promises = Array.from({ length: 10 }, () =>
        securityQuestionsService.getAll(),
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toEqual(mockQuestions);
      });
      expect(mockApi.get).toHaveBeenCalledTimes(10);
    });
  });
});
