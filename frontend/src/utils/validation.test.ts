import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "./validation";

describe("Validation Utils", () => {
  describe("validateEmail", () => {
    it("deve validar emails válidos", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
        "user123@test-domain.com",
        "a@b.co",
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it("deve invalidar emails inválidos", () => {
      const invalidEmails = [
        "",
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "user..name@example.com",
        "user@example.",
        "user name@example.com",
        "user@ex ample.com",
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it("deve tratar valores null e undefined", () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });

    it("deve tratar tipos não string", () => {
      expect(validateEmail(123 as any)).toBe(false);
      expect(validateEmail({} as any)).toBe(false);
      expect(validateEmail([] as any)).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("deve validar senhas válidas", () => {
      const validPasswords = [
        "Password123!",
        "MySecure@Pass1",
        "Complex#Pass99",
        "Strong$Password2023",
        "Valid&Pass123",
      ];

      validPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it("deve invalidar senhas muito curtas", () => {
      const shortPasswords = ["", "123", "Pass1!", "Short7@"];

      shortPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it("deve invalidar senhas sem maiúscula", () => {
      const noUppercasePasswords = [
        "password123!",
        "mypass@word1",
        "lowercase#123",
      ];

      noUppercasePasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it("deve invalidar senhas sem minúscula", () => {
      const noLowercasePasswords = [
        "PASSWORD123!",
        "MYPASS@WORD1",
        "UPPERCASE#123",
      ];

      noLowercasePasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it("deve invalidar senhas sem número", () => {
      const noNumberPasswords = ["Password!", "MyPass@Word", "NoNumber#Pass"];

      noNumberPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it("deve invalidar senhas sem caractere especial", () => {
      const noSpecialCharPasswords = [
        "Password123",
        "MyPassWord1",
        "NoSpecial123",
      ];

      noSpecialCharPasswords.forEach((password) => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it("deve tratar valores null e undefined", () => {
      expect(validatePassword(null as any)).toBe(false);
      expect(validatePassword(undefined as any)).toBe(false);
    });

    it("deve tratar tipos não string", () => {
      expect(validatePassword(123 as any)).toBe(false);
      expect(validatePassword({} as any)).toBe(false);
      expect(validatePassword([] as any)).toBe(false);
    });
  });

  describe("validateRequired", () => {
    it("deve validar valores não vazios", () => {
      const validValues = ["text", "a", "123", "valid value", "0"];

      validValues.forEach((value) => {
        expect(validateRequired(value)).toBe(true);
      });
    });

    it("deve invalidar valores vazios", () => {
      const emptyValues = ["", "   ", "\t", "\n", "  \t  \n  "];

      emptyValues.forEach((value) => {
        expect(validateRequired(value)).toBe(false);
      });
    });

    it("deve tratar valores null e undefined", () => {
      expect(validateRequired(null as any)).toBe(false);
      expect(validateRequired(undefined as any)).toBe(false);
    });

    it("deve tratar tipos não string", () => {
      expect(validateRequired(0 as any)).toBe(false);
      expect(validateRequired(false as any)).toBe(false);
      expect(validateRequired({} as any)).toBe(false);
      expect(validateRequired([] as any)).toBe(false);
    });

    it("deve validar strings com apenas espaços como inválidas", () => {
      expect(validateRequired("   ")).toBe(false);
      expect(validateRequired("\t\t")).toBe(false);
      expect(validateRequired("\n\n")).toBe(false);
    });
  });

  describe("Casos extremos", () => {
    it("deve tratar strings muito longas", () => {
      const longString = "a".repeat(10000);
      expect(validateRequired(longString)).toBe(true);

      const longEmail = "a".repeat(100) + "@" + "b".repeat(100) + ".com";
      expect(validateEmail(longEmail)).toBe(false); // Email muito longo é inválido

      const longPassword = "A1!" + "a".repeat(1000);
      expect(validatePassword(longPassword)).toBe(true); // Senha longa mas válida
    });

    it("deve tratar caracteres especiais em emails", () => {
      expect(validateEmail("user@domain.com")).toBe(true);
      expect(validateEmail("user+tag@domain.com")).toBe(true);
      expect(validateEmail("user.name@domain.com")).toBe(true);
      expect(validateEmail("user_name@domain.com")).toBe(true);
      expect(validateEmail("user-name@domain.com")).toBe(true);
    });

    it("deve tratar caracteres Unicode", () => {
      expect(validateRequired("café")).toBe(true);
      expect(validateRequired("测试")).toBe(true);
      expect(validateRequired("🚀")).toBe(true);

      expect(validateEmail("café@example.com")).toBe(false); // Unicode em email geralmente inválido

      const unicodePassword = "Password123!测试";
      expect(validatePassword(unicodePassword)).toBe(true);
    });

    it("deve tratar quebras de linha e tabs", () => {
      expect(validateRequired("text\nwith\nbreaks")).toBe(true);
      expect(validateRequired("text\twith\ttabs")).toBe(true);
      expect(validateRequired("\n\t")).toBe(false); // Apenas whitespace
    });
  });

  describe("Performance", () => {
    it("deve validar muitos emails rapidamente", () => {
      const emails = Array.from(
        { length: 1000 },
        (_, i) => `user${i}@example.com`,
      );

      const start = performance.now();
      emails.forEach((email) => validateEmail(email));
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Deve ser rápido
    });

    it("deve validar muitas senhas rapidamente", () => {
      const passwords = Array.from({ length: 1000 }, (_, i) => `Password${i}!`);

      const start = performance.now();
      passwords.forEach((password) => validatePassword(password));
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Deve ser rápido
    });
  });

  describe("Integração", () => {
    it("deve funcionar em conjunto para validar formulário completo", () => {
      const formData = {
        email: "user@example.com",
        password: "SecurePass123!",
        fullName: "John Doe",
      };

      expect(validateEmail(formData.email)).toBe(true);
      expect(validatePassword(formData.password)).toBe(true);
      expect(validateRequired(formData.fullName)).toBe(true);
    });

    it("deve detectar formulário inválido", () => {
      const invalidFormData = {
        email: "invalid-email",
        password: "weak",
        fullName: "",
      };

      expect(validateEmail(invalidFormData.email)).toBe(false);
      expect(validatePassword(invalidFormData.password)).toBe(false);
      expect(validateRequired(invalidFormData.fullName)).toBe(false);
    });
  });
});
