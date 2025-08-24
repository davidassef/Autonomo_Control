import {
  listUsers,
  createUser,
  changeRole,
  changeStatus,
  AdminUser,
  CreateUserPayload,
  ChangeRolePayload,
  ChangeStatusPayload,
} from "./adminUsers";
import api from "./api";

// Mock do módulo api
jest.mock("./api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("AdminUsers Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listUsers", () => {
    const mockUsers: AdminUser[] = [
      {
        id: 1,
        email: "user1@example.com",
        name: "User 1",
        role: "USER",
        is_active: true,
        created_at: "2023-01-01T00:00:00Z",
      },
      {
        id: 2,
        email: "admin@example.com",
        name: "Admin User",
        role: "ADMIN",
        is_active: true,
        created_at: "2023-01-02T00:00:00Z",
      },
    ];

    it("deve listar usuários sem parâmetros", async () => {
      mockedApi.get.mockResolvedValue({ data: mockUsers });

      const result = await listUsers();

      expect(mockedApi.get).toHaveBeenCalledWith("/admin/users", {
        params: undefined,
      });
      expect(result).toEqual(mockUsers);
    });

    it("deve listar usuários com parâmetros de filtro", async () => {
      const filteredUsers = [mockUsers[1]];
      mockedApi.get.mockResolvedValue({ data: filteredUsers });

      const params = { role: "ADMIN", active: true };
      const result = await listUsers(params);

      expect(mockedApi.get).toHaveBeenCalledWith("/admin/users", { params });
      expect(result).toEqual(filteredUsers);
    });

    it("deve tratar erro na listagem de usuários", async () => {
      const error = new Error("Failed to fetch users");
      mockedApi.get.mockRejectedValue(error);

      await expect(listUsers()).rejects.toThrow("Failed to fetch users");
      expect(mockedApi.get).toHaveBeenCalledWith("/admin/users", {
        params: undefined,
      });
    });
  });

  describe("createUser", () => {
    const mockUser: AdminUser = {
      id: 3,
      email: "newuser@example.com",
      name: "New User",
      role: "USER",
      is_active: true,
      created_at: "2023-01-03T00:00:00Z",
    };

    const payload: CreateUserPayload = {
      email: "newuser@example.com",
      name: "New User",
    };

    it("deve criar usuário sem opções", async () => {
      mockedApi.post.mockResolvedValue({ data: mockUser });

      const result = await createUser(payload);

      expect(mockedApi.post).toHaveBeenCalledWith("/admin/users", payload, {
        headers: undefined,
      });
      expect(result).toEqual(mockUser);
    });

    it("deve criar usuário com role específica", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };
      mockedApi.post.mockResolvedValue({ data: adminUser });

      const options = { role: "ADMIN" as const };
      const result = await createUser(payload, options);

      expect(mockedApi.post).toHaveBeenCalledWith(
        "/admin/users?role=ADMIN",
        payload,
        { headers: undefined },
      );
      expect(result).toEqual(adminUser);
    });

    it("deve criar usuário com master key", async () => {
      mockedApi.post.mockResolvedValue({ data: mockUser });

      const options = { masterKey: "master-key-123" };
      const result = await createUser(payload, options);

      expect(mockedApi.post).toHaveBeenCalledWith("/admin/users", payload, {
        headers: { "X-Master-Key": "master-key-123" },
      });
      expect(result).toEqual(mockUser);
    });

    it("deve criar usuário com role e master key", async () => {
      const adminUser = { ...mockUser, role: "ADMIN" as const };
      mockedApi.post.mockResolvedValue({ data: adminUser });

      const options = { role: "ADMIN" as const, masterKey: "master-key-123" };
      const result = await createUser(payload, options);

      expect(mockedApi.post).toHaveBeenCalledWith(
        "/admin/users?role=ADMIN",
        payload,
        { headers: { "X-Master-Key": "master-key-123" } },
      );
      expect(result).toEqual(adminUser);
    });

    it("deve tratar erro na criação de usuário", async () => {
      const error = new Error("Failed to create user");
      mockedApi.post.mockRejectedValue(error);

      await expect(createUser(payload)).rejects.toThrow(
        "Failed to create user",
      );
    });
  });

  describe("changeRole", () => {
    const mockUser: AdminUser = {
      id: 1,
      email: "user@example.com",
      name: "User",
      role: "ADMIN",
      is_active: true,
    };

    const payload: ChangeRolePayload = { role: "ADMIN" };
    const userId = 1;
    const masterKey = "master-key-123";

    it("deve alterar role do usuário", async () => {
      mockedApi.patch.mockResolvedValue({ data: mockUser });

      const result = await changeRole(userId, payload, masterKey);

      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/admin/users/${userId}/role`,
        payload,
        { headers: { "X-Master-Key": masterKey } },
      );
      expect(result).toEqual(mockUser);
    });

    it("deve tratar erro na alteração de role", async () => {
      const error = new Error("Failed to change role");
      mockedApi.patch.mockRejectedValue(error);

      await expect(changeRole(userId, payload, masterKey)).rejects.toThrow(
        "Failed to change role",
      );
    });
  });

  describe("changeStatus", () => {
    const mockUser: AdminUser = {
      id: 1,
      email: "user@example.com",
      name: "User",
      role: "USER",
      is_active: false,
    };

    const payload: ChangeStatusPayload = { is_active: false };
    const userId = 1;

    it("deve alterar status do usuário", async () => {
      mockedApi.patch.mockResolvedValue({ data: mockUser });

      const result = await changeStatus(userId, payload);

      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/admin/users/${userId}/status`,
        payload,
      );
      expect(result).toEqual(mockUser);
    });

    it("deve ativar usuário", async () => {
      const activeUser = { ...mockUser, is_active: true };
      const activePayload: ChangeStatusPayload = { is_active: true };
      mockedApi.patch.mockResolvedValue({ data: activeUser });

      const result = await changeStatus(userId, activePayload);

      expect(mockedApi.patch).toHaveBeenCalledWith(
        `/admin/users/${userId}/status`,
        activePayload,
      );
      expect(result).toEqual(activeUser);
    });

    it("deve tratar erro na alteração de status", async () => {
      const error = new Error("Failed to change status");
      mockedApi.patch.mockRejectedValue(error);

      await expect(changeStatus(userId, payload)).rejects.toThrow(
        "Failed to change status",
      );
    });
  });
});
