import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAdminUsers } from "./useAdminUsers";

// Mock das funções de serviço
jest.mock("../services/adminUsers", () => {
  return {
    listUsers: jest.fn().mockResolvedValue([
      {
        id: 1,
        email: "u1@example.com",
        name: "User 1",
        role: "USER",
        is_active: true,
      },
    ]),
    createUser: jest.fn().mockImplementation(async ({ email, name }: any) => ({
      id: 2,
      email,
      name,
      role: "USER",
      is_active: true,
    })),
    changeStatus: jest
      .fn()
      .mockImplementation(async (id: number, { is_active }: any) => ({
        id,
        email: "u1@example.com",
        name: "User 1",
        role: "USER",
        is_active,
      })),
    changeRole: jest
      .fn()
      .mockImplementation(async (id: number, { role }: any) => ({
        id,
        email: "u1@example.com",
        name: "User 1",
        role,
        is_active: true,
      })),
  };
});

const TestComponent: React.FC = () => {
  const { users, loading, create } = useAdminUsers();

  if (loading) {
    return <div data-testid="loading">loading</div>;
  }

  return (
    <div>
      <div data-testid="loading">loaded</div>
      <div data-testid="count">{users?.length || 0}</div>
      <button onClick={() => create("new@example.com", "New User", "USER")}>
        create
      </button>
    </div>
  );
};

describe("useAdminUsers hook", () => {
  it("carrega usuários iniciais", async () => {
    render(<TestComponent />);

    // Aguarda o carregamento inicial
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("loaded");
    });

    // Verifica se carregou 1 usuário
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
