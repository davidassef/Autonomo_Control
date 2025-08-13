import api from './api';

export interface SecurityQuestion {
  id: string;
  text: string;
}

export const securityQuestionsService = {
  /**
   * Busca todas as perguntas secretas disponíveis
   */
  async getAll(): Promise<SecurityQuestion[]> {
    const response = await api.get<{ questions: SecurityQuestion[] }>('/auth/security-questions');
    return response.data.questions;
  }
};