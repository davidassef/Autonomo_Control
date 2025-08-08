import api from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('🔐 AuthService: Iniciando login...', { email });

    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    console.log('🔐 AuthService: FormData criado, enviando requisição...');
    console.log('🔐 AuthService: URL:', '/auth/token');

    try {
      const response = await api.post<AuthResponse>('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('✅ AuthService: Resposta recebida:', response.data);
      console.log('✅ AuthService: Status:', response.status);

      localStorage.setItem('token', response.data.access_token);
      console.log('✅ AuthService: Token armazenado no localStorage');

      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Erro na requisição de login:', error);
      console.error('❌ AuthService: Response:', error.response);
      console.error('❌ AuthService: URL completa tentada:', error.config?.url);
      throw error;
    }
  },

  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google', { token });
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },
  async getProfile(): Promise<User> {
    console.log('👤 AuthService: Buscando perfil do usuário...');
    try {
      const response = await api.get<User>('/auth/me');
      console.log('✅ AuthService: Perfil obtido:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ AuthService: Erro ao buscar perfil:', error);
      console.error('❌ AuthService: Response:', error.response);
      throw error;
    }
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const response = await api.post<User>('/users', { name, email, password });
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
