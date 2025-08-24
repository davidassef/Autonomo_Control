import React from "react";
import { render, screen } from "@testing-library/react";
import { RoleBadge } from "./RoleBadge";
import { AdminUser } from "../../services/adminUsers";

describe("RoleBadge", () => {
  describe("Renderização de Roles", () => {
    it("deve renderizar role MASTER corretamente", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("MASTER");
    });

    it("deve renderizar role ADMIN corretamente", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("ADMIN");
    });

    it("deve renderizar role USER corretamente", () => {
      render(<RoleBadge role="USER" />);

      const badge = screen.getByText("USER");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("USER");
    });
  });

  describe("Estilos Condicionais", () => {
    it("deve aplicar classes CSS corretas para role MASTER", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("bg-purple-100 text-purple-700");
    });

    it("deve aplicar classes CSS corretas para role ADMIN", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge).toHaveClass("bg-amber-100 text-amber-700");
    });

    it("deve aplicar classes CSS corretas para role USER", () => {
      render(<RoleBadge role="USER" />);

      const badge = screen.getByText("USER");
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });
  });

  describe("Classes CSS Base", () => {
    it("deve ter classes base comuns para todos os roles", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("px-2 py-1 rounded text-xs font-semibold");
    });

    it("deve ter elemento span como container", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge.tagName).toBe("SPAN");
    });

    it("deve ter padding horizontal e vertical corretos", () => {
      render(<RoleBadge role="USER" />);

      const badge = screen.getByText("USER");
      expect(badge).toHaveClass("px-2 py-1");
    });

    it("deve ter bordas arredondadas", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("rounded");
    });

    it("deve ter texto pequeno e em negrito", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge).toHaveClass("text-xs font-semibold");
    });
  });

  describe("Combinações de Classes", () => {
    it("deve ter todas as classes necessárias para MASTER", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass(
        "px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700",
      );
    });

    it("deve ter todas as classes necessárias para ADMIN", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge).toHaveClass(
        "px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700",
      );
    });

    it("deve ter todas as classes necessárias para USER", () => {
      render(<RoleBadge role="USER" />);

      const badge = screen.getByText("USER");
      expect(badge).toHaveClass(
        "px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700",
      );
    });
  });

  describe("Diferenciação Visual", () => {
    it("deve ter cores diferentes para cada role", () => {
      const { rerender } = render(<RoleBadge role="MASTER" />);
      const masterBadge = screen.getByText("MASTER");
      expect(masterBadge).toHaveClass("bg-purple-100 text-purple-700");

      rerender(<RoleBadge role="ADMIN" />);
      const adminBadge = screen.getByText("ADMIN");
      expect(adminBadge).toHaveClass("bg-amber-100 text-amber-700");
      expect(adminBadge).not.toHaveClass("bg-purple-100 text-purple-700");

      rerender(<RoleBadge role="USER" />);
      const userBadge = screen.getByText("USER");
      expect(userBadge).toHaveClass("bg-gray-100 text-gray-700");
      expect(userBadge).not.toHaveClass("bg-purple-100 text-purple-700");
      expect(userBadge).not.toHaveClass("bg-amber-100 text-amber-700");
    });

    it("deve usar cores de destaque para MASTER (roxo)", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("bg-purple-100 text-purple-700");
    });

    it("deve usar cores de alerta para ADMIN (âmbar)", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge).toHaveClass("bg-amber-100 text-amber-700");
    });

    it("deve usar cores neutras para USER (cinza)", () => {
      render(<RoleBadge role="USER" />);

      const badge = screen.getByText("USER");
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });
  });

  describe("Mudanças de Props", () => {
    it("deve atualizar corretamente quando role muda", () => {
      const { rerender } = render(<RoleBadge role="USER" />);

      expect(screen.getByText("USER")).toBeInTheDocument();
      expect(screen.getByText("USER")).toHaveClass("bg-gray-100 text-gray-700");

      rerender(<RoleBadge role="ADMIN" />);

      expect(screen.queryByText("USER")).not.toBeInTheDocument();
      expect(screen.getByText("ADMIN")).toBeInTheDocument();
      expect(screen.getByText("ADMIN")).toHaveClass(
        "bg-amber-100 text-amber-700",
      );

      rerender(<RoleBadge role="MASTER" />);

      expect(screen.queryByText("ADMIN")).not.toBeInTheDocument();
      expect(screen.getByText("MASTER")).toBeInTheDocument();
      expect(screen.getByText("MASTER")).toHaveClass(
        "bg-purple-100 text-purple-700",
      );
    });

    it("deve manter estrutura HTML ao mudar role", () => {
      const { rerender } = render(<RoleBadge role="USER" />);

      let badge = screen.getByText("USER");
      expect(badge.tagName).toBe("SPAN");
      expect(badge).toHaveClass("px-2 py-1 rounded text-xs font-semibold");

      rerender(<RoleBadge role="MASTER" />);

      badge = screen.getByText("MASTER");
      expect(badge.tagName).toBe("SPAN");
      expect(badge).toHaveClass("px-2 py-1 rounded text-xs font-semibold");
    });
  });

  describe("Casos de Borda", () => {
    it("deve lidar com role undefined", () => {
      render(<RoleBadge role={undefined as any} />);

      // Deve renderizar o valor undefined como texto
      const badge = screen.getByText("");
      expect(badge).toBeInTheDocument();
      // Deve usar estilo padrão (USER)
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });

    it("deve lidar com role null", () => {
      render(<RoleBadge role={null as any} />);

      // Deve renderizar o valor null como texto vazio
      const badge = screen.getByText("");
      expect(badge).toBeInTheDocument();
      // Deve usar estilo padrão (USER)
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });

    it("deve lidar com role inválido", () => {
      render(<RoleBadge role={"INVALID_ROLE" as any} />);

      const badge = screen.getByText("INVALID_ROLE");
      expect(badge).toBeInTheDocument();
      // Deve usar estilo padrão (USER) para roles não reconhecidos
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });

    it("deve lidar com string vazia", () => {
      render(<RoleBadge role={"" as any} />);

      const badge = screen.getByText("");
      expect(badge).toBeInTheDocument();
      // Deve usar estilo padrão (USER)
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });

    it("deve lidar com role em minúsculas", () => {
      render(<RoleBadge role={"admin" as any} />);

      const badge = screen.getByText("admin");
      expect(badge).toBeInTheDocument();
      // Deve usar estilo padrão (USER) pois não é exatamente 'ADMIN'
      expect(badge).toHaveClass("bg-gray-100 text-gray-700");
    });
  });

  describe("Tipagem TypeScript", () => {
    it("deve aceitar tipos válidos de AdminUser role", () => {
      // Estes devem compilar sem erros TypeScript
      const validRoles: AdminUser["role"][] = ["MASTER", "ADMIN", "USER"];

      validRoles.forEach((role) => {
        const { unmount } = render(<RoleBadge role={role} />);
        expect(screen.getByText(role)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Acessibilidade", () => {
    it("deve ter texto legível para todos os roles", () => {
      const roles: AdminUser["role"][] = ["MASTER", "ADMIN", "USER"];

      roles.forEach((role) => {
        const { unmount } = render(<RoleBadge role={role} />);
        const badge = screen.getByText(role);

        // Deve ter texto visível
        expect(badge).toHaveTextContent(role);
        // Deve ter contraste adequado (classes de cor específicas)
        const hasValidTextColor =
          badge.classList.contains("text-purple-700") ||
          badge.classList.contains("text-amber-700") ||
          badge.classList.contains("text-gray-700");
        expect(hasValidTextColor).toBe(true);

        unmount();
      });
    });

    it("deve ter tamanho de fonte adequado para leitura", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("text-xs");
    });

    it("deve ter peso de fonte adequado para destaque", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge).toHaveClass("font-semibold");
    });
  });

  describe("Layout e Espaçamento", () => {
    it("deve ter padding interno adequado", () => {
      render(<RoleBadge role="USER" />);

      const badge = screen.getByText("USER");
      expect(badge).toHaveClass("px-2 py-1");
    });

    it("deve ter bordas arredondadas para aparência suave", () => {
      render(<RoleBadge role="MASTER" />);

      const badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("rounded");
    });

    it("deve ser um elemento inline por padrão", () => {
      render(<RoleBadge role="ADMIN" />);

      const badge = screen.getByText("ADMIN");
      expect(badge.tagName).toBe("SPAN");
    });
  });

  describe("Performance", () => {
    it("deve renderizar rapidamente", () => {
      const startTime = performance.now();

      render(<RoleBadge role="MASTER" />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Deve renderizar em menos de 5ms
      expect(renderTime).toBeLessThan(5);
    });

    it("deve lidar com múltiplos re-renders eficientemente", () => {
      const { rerender } = render(<RoleBadge role="USER" />);

      const roles: AdminUser["role"][] = ["MASTER", "ADMIN", "USER"];

      // Simular múltiplos re-renders
      for (let i = 0; i < 20; i++) {
        const role = roles[i % roles.length];
        rerender(<RoleBadge role={role} />);
        expect(screen.getByText(role)).toBeInTheDocument();
      }
    });
  });

  describe("Consistência Visual", () => {
    it("deve manter consistência de tamanho entre diferentes roles", () => {
      const { rerender } = render(<RoleBadge role="MASTER" />);
      let badge = screen.getByText("MASTER");
      expect(badge).toHaveClass("text-xs px-2 py-1");

      rerender(<RoleBadge role="ADMIN" />);
      badge = screen.getByText("ADMIN");
      expect(badge).toHaveClass("text-xs px-2 py-1");

      rerender(<RoleBadge role="USER" />);
      badge = screen.getByText("USER");
      expect(badge).toHaveClass("text-xs px-2 py-1");
    });

    it("deve manter consistência de formato entre diferentes roles", () => {
      const roles: AdminUser["role"][] = ["MASTER", "ADMIN", "USER"];

      roles.forEach((role) => {
        const { unmount } = render(<RoleBadge role={role} />);
        const badge = screen.getByText(role);

        expect(badge).toHaveClass("px-2 py-1 rounded text-xs font-semibold");

        unmount();
      });
    });
  });
});
