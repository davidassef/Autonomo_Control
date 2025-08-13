import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { securityQuestionsService, SecurityQuestion } from '../services/securityQuestions';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion1Id, setSecurityQuestion1Id] = useState('');
  const [securityAnswer1, setSecurityAnswer1] = useState('');
  const [securityQuestion2Id, setSecurityQuestion2Id] = useState('');
  const [securityAnswer2, setSecurityAnswer2] = useState('');
  const [securityQuestion3Id, setSecurityQuestion3Id] = useState('');
  const [securityAnswer3, setSecurityAnswer3] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<SecurityQuestion[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Carregar perguntas secretas disponíveis
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        const questions = await securityQuestionsService.getAll();
        setAvailableQuestions(questions);
      } catch (err) {
        console.error('Erro ao carregar perguntas secretas:', err);
        setQuestionsError('Erro ao carregar perguntas secretas. Tente novamente.');
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateSecurityQuestions = () => {
    if (!securityQuestion1Id || !securityQuestion2Id || !securityQuestion3Id) {
      setQuestionsError('Selecione todas as três perguntas secretas');
      return false;
    }
    
    if (!securityAnswer1.trim() || !securityAnswer2.trim() || !securityAnswer3.trim()) {
      setQuestionsError('Responda todas as três perguntas secretas');
      return false;
    }

    // Verificar se as perguntas são diferentes
    const selectedQuestions = [securityQuestion1Id, securityQuestion2Id, securityQuestion3Id];
    const uniqueQuestions = new Set(selectedQuestions);
    if (uniqueQuestions.size !== 3) {
      setQuestionsError('Selecione três perguntas diferentes');
      return false;
    }

    setQuestionsError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setQuestionsError(null);

    if (!validatePassword()) return;
    if (!validateSecurityQuestions()) return;

    setIsSubmitting(true);

    try {
      await register(
        name, 
        email, 
        password, 
        securityQuestion1Id, 
        securityAnswer1, 
        securityQuestion2Id, 
        securityAnswer2, 
        securityQuestion3Id, 
        securityAnswer3
      );
      navigate('/');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para obter perguntas disponíveis para um dropdown específico
  const getAvailableQuestionsForDropdown = (currentQuestionId: string) => {
    const selectedQuestions = [securityQuestion1Id, securityQuestion2Id, securityQuestion3Id]
      .filter(id => id && id !== currentQuestionId);
    
    return availableQuestions.filter(q => !selectedQuestions.includes(q.id));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">Autônomo Control</h1>
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">Criar uma nova conta</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={clearError}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Fechar</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Nome completo</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">E-mail</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirmar senha</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Perguntas de Segurança</h3>
            <p className="text-sm text-gray-600 mb-4">Escolha 3 perguntas diferentes e forneça suas respostas. Essas informações serão usadas para recuperar sua senha caso necessário.</p>
            
            {isLoadingQuestions ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-600">Carregando perguntas...</div>
              </div>
            ) : questionsError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {questionsError}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Primeira pergunta */}
                <div>
                  <label htmlFor="security-question-1" className="block text-sm font-medium text-gray-700 mb-1">
                    Primeira pergunta secreta
                  </label>
                  <select
                    id="security-question-1"
                    name="security-question-1"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-2"
                    value={securityQuestion1Id}
                    onChange={(e) => {
                      setSecurityQuestion1Id(e.target.value);
                      setSecurityAnswer1(''); // Limpar resposta ao trocar pergunta
                    }}
                  >
                    <option value="">Selecione uma pergunta</option>
                    {getAvailableQuestionsForDropdown(securityQuestion1Id).map((question) => (
                      <option key={question.id} value={question.id}>
                        {question.text}
                      </option>
                    ))}
                  </select>
                  {securityQuestion1Id && (
                    <input
                      id="security-answer-1"
                      name="security-answer-1"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Digite sua resposta"
                      value={securityAnswer1}
                      onChange={(e) => setSecurityAnswer1(e.target.value)}
                    />
                  )}
                </div>
                
                {/* Segunda pergunta */}
                <div>
                  <label htmlFor="security-question-2" className="block text-sm font-medium text-gray-700 mb-1">
                    Segunda pergunta secreta
                  </label>
                  <select
                    id="security-question-2"
                    name="security-question-2"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-2"
                    value={securityQuestion2Id}
                    onChange={(e) => {
                      setSecurityQuestion2Id(e.target.value);
                      setSecurityAnswer2(''); // Limpar resposta ao trocar pergunta
                    }}
                  >
                    <option value="">Selecione uma pergunta</option>
                    {getAvailableQuestionsForDropdown(securityQuestion2Id).map((question) => (
                      <option key={question.id} value={question.id}>
                        {question.text}
                      </option>
                    ))}
                  </select>
                  {securityQuestion2Id && (
                    <input
                      id="security-answer-2"
                      name="security-answer-2"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Digite sua resposta"
                      value={securityAnswer2}
                      onChange={(e) => setSecurityAnswer2(e.target.value)}
                    />
                  )}
                </div>
                
                {/* Terceira pergunta */}
                <div>
                  <label htmlFor="security-question-3" className="block text-sm font-medium text-gray-700 mb-1">
                    Terceira pergunta secreta
                  </label>
                  <select
                    id="security-question-3"
                    name="security-question-3"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-2"
                    value={securityQuestion3Id}
                    onChange={(e) => {
                      setSecurityQuestion3Id(e.target.value);
                      setSecurityAnswer3(''); // Limpar resposta ao trocar pergunta
                    }}
                  >
                    <option value="">Selecione uma pergunta</option>
                    {getAvailableQuestionsForDropdown(securityQuestion3Id).map((question) => (
                      <option key={question.id} value={question.id}>
                        {question.text}
                      </option>
                    ))}
                  </select>
                  {securityQuestion3Id && (
                    <input
                      id="security-answer-3"
                      name="security-answer-3"
                      type="text"
                      required
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Digite sua resposta"
                      value={securityAnswer3}
                      onChange={(e) => setSecurityAnswer3(e.target.value)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {passwordError && (
            <div className="text-sm text-red-600">
              {passwordError}
            </div>
          )}

          {questionsError && (
            <div className="text-sm text-red-600">
              {questionsError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Já tem uma conta? Faça login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
