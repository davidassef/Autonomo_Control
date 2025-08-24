import { describe, it, expect } from "@jest/globals";
import {
  validateRequired,
  validateEmail,
  validatePassword,
} from "../../utils/validation";

describe("Validation Utils", () => {
  describe("validateRequired", () => {
    it("deve validar campos obrigatórios preenchidos", () => {
      expect(validateRequired("texto válido")).toBe(true);
      expect(validateRequired("a")).toBe(true);
      expect(validateRequired("  texto com espaços  ")).toBe(true);
    });

    it("deve rejeitar campos vazios ou inválidos", () => {
      expect(validateRequired("")).toBe(false);
      expect(validateRequired("   ")).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("deve validar emails válidos", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user123@test-domain.com",
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it("deve rejeitar emails inválidos", () => {
      const invalidEmails = [
        "",
        "invalid-email",
        "@domain.com",
        "user@",
        "user@domain",
        "user.domain.com",
        "user @domain.com",
        "user@domain .com",
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it("deve lidar com valores null/undefined", () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("deve validar senhas válidas", () => {
      const validPasswords = [
        "MinhaSenh@123",
        "Password!1",
        "Teste@2024",
        "Segur@nca1",
      ];

      validPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it("deve rejeitar senhas inválidas", () => {
      const invalidPasswords = [
        "",
        "123456",
        "password",
        "PASSWORD",
        "Password",
        "Password1",
        "Password!",
        "Pass@1", // Muito curta
      ];

      invalidPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it("deve lidar com valores null/undefined", () => {
      expect(validatePassword(null as any)).toBe(false);
      expect(validatePassword(undefined as any)).toBe(false);
    });
  });
});
