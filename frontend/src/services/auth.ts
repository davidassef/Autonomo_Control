import api from "./api";
import { AuthResponse, User } from "../types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log("🔐 AuthService: Iniciando login...", { email });

    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    console.log("🔐 AuthService: FormData criado, enviando requisição...");
    console.log("🔐 AuthService: URL:", "/auth/token");

    try {
      const response = await api.post<AuthResponse>("/auth/token", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      console.log("✅ AuthService: Resposta recebida:", response.data);
      console.log("✅ AuthService: Status:", response.status);

      localStorage.setItem("token", response.data.access_token);
      console.log("✅ AuthService: Token armazenado no localStorage");

      return response.data;
    } catch (error: any) {
      console.error("❌ AuthService: Erro na requisição de login:", error);
      console.error("❌ AuthService: Response:", error.response);
      console.error("❌ AuthService: URL completa tentada:", error.config?.url);
      throw error;
    }
  },

  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/google", { token });
    localStorage.setItem("token", response.data.access_token);
    return response.data;
  },
  async getProfile(): Promise<User> {
    console.log("👤 AuthService: Buscando perfil do usuário...");
    try {
      const response = await api.get<User>("/auth/me");
      console.log("✅ AuthService: Perfil obtido:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ AuthService: Erro ao buscar perfil:", error);
      console.error("❌ AuthService: Response:", error.response);
      throw error;
    }
  },

  async register(
    name: string,
    email: string,
    password: string,
    securityQuestions: Array<{ question_id: number; answer: string }>,
    optionalFields?: any,
  ): Promise<User> {
    const requestData = {
      name,
      full_name: name, // Campo obrigatório no schema UserCreate
      email,
      password,
      security_questions: securityQuestions,
      ...optionalFields, // Incluir campos opcionais se fornecidos
    };

    const response = await api.post<any>("/auth/register", requestData);

    // O endpoint /auth/register retorna um token, não os dados do usuário
    // Armazenar o token e buscar os dados do usuário
    localStorage.setItem("token", response.data.access_token);

    // Buscar dados do usuário após registro
    const userResponse = await api.get<User>("/auth/me");
    return userResponse.data;
  },

  logout(): void {
    localStorage.removeItem("token");
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      // Decodificar o token JWT para verificar se não expirou
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Se o token expirou, remover do localStorage
      if (payload.exp && payload.exp < currentTime) {
        localStorage.removeItem("token");
        return false;
      }

      return true;
    } catch (error) {
      // Se não conseguir decodificar o token, considerá-lo inválido
      localStorage.removeItem("token");
      return false;
    }
  },
};
