import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SecurityQuestion } from '../services/securityQuestions';

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'choose' | 'email' | 'security'>('choose');
  const [email, setEmail] = useState('');
  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: '',
    answer2: '',
    answer3: ''
  });
  const [userQuestions, setUserQuestions] = useState<SecurityQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetToken, setResetToken] = useState('');

  // Função para buscar as perguntas secretas do usuário
  const fetchUserQuestions = async (userEmail: string) => {
    if (!userEmail.trim()) return;
    
    setQuestionsLoading(true);
    setQuestionsError(null);
    
    try {
      const response = await fetch(`/api/auth/user-security-questions?email=${encodeURIComponent(userEmail)}`);
      
      if (response.ok) {
        const questions = await response.json();
        setUserQuestions(questions);
      } else {
        const errorData = await response.json();
        setQuestionsError(errorData.detail || 'Erro ao carregar perguntas do usuário.');
      }
    } catch (error) {
      console.error('Erro ao buscar perguntas do usuário:', error);
      setQuestionsError('Erro de conexão ao carregar perguntas.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Buscar perguntas quando o email for alterado (com debounce)
  useEffect(() => {
    if (step === 'security' && email.includes('@')) {
      const timeoutId = setTimeout(() => {
        fetchUserQuestions(email);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setUserQuestions([]);
      setQuestionsError(null);
    }
  }, [email, step]);

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Um email com instruções para redefinir sua senha foi enviado para seu endereço de email.'
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.detail || 'Erro ao solicitar redefinição de senha.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecurityReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'As senhas não coincidem.'
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'A senha deve ter pelo menos 8 caracteres.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/password-reset/security-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          security_answer_1: securityAnswers.answer1,
          security_answer_2: securityAnswers.answer2,
          security_answer_3: securityAnswers.answer3,
          new_password: newPassword
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Senha redefinida com sucesso! Você pode fazer login com sua nova senha.'
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.detail || 'Erro ao redefinir senha. Verifique suas respostas.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTokenReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'As senhas não coincidem.'
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: 'error',
        text: 'A senha deve ter pelo menos 8 caracteres.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/password-reset/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: newPassword
        }),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Senha redefinida com sucesso! Você pode fazer login com sua nova senha.'
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.detail || 'Token inválido ou expirado.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro de conexão. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">Autônomo Control</h1>
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
            {step === 'choose' && 'Recuperar Senha'}
            {step === 'email' && 'Recuperar por Email'}
            {step === 'security' && 'Recuperar por Perguntas Secretas'}
          </h2>
        </div>

        {message && (
          <div className={`border px-4 py-3 rounded relative ${
            message.type === 'success' 
              ? 'bg-green-100 border-green-400 text-green-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`} role="alert">
            <span className="block sm:inline">{message.text}</span>
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              Escolha como você gostaria de recuperar sua senha:
            </p>
            
            <button
              onClick={() => setStep('email')}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Recuperar por Email
            </button>
            
            <button
              onClick={() => setStep('security')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Recuperar por Perguntas Secretas
            </button>
            
            <div className="text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Voltar ao Login
              </Link>
            </div>
          </div>
        )}

        {step === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailReset}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Digite seu email para receber instruções de recuperação de senha.
              </p>
              
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar às Opções
              </button>
              <br />
              <Link to="/login" className="font-medium text-gray-600 hover:text-gray-500">
                Voltar ao Login
              </Link>
            </div>

            {/* Campo para inserir token do email */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Já recebeu o email? Digite o token e sua nova senha:
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Token do email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
                
                <input
                  type="password"
                  placeholder="Nova senha"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                
                <input
                  type="password"
                  placeholder="Confirmar nova senha"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                
                <button
                  type="button"
                  onClick={handleTokenReset}
                  disabled={isSubmitting || !resetToken || !newPassword || !confirmPassword}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === 'security' && (
          <form className="mt-8 space-y-6" onSubmit={handleSecurityReset}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Digite seu email e responda às perguntas secretas para redefinir sua senha.
              </p>
              
              <label htmlFor="email-security" className="sr-only">Email</label>
              <input
                id="email-security"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-4"
                placeholder="Seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {questionsLoading ? (
              <div className="text-center py-4">
                <div className="text-gray-600">Carregando suas perguntas secretas...</div>
              </div>
            ) : questionsError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {questionsError}
              </div>
            ) : userQuestions.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="answer1" className="block text-sm font-medium text-gray-700 mb-1">
                    {userQuestions[0]?.text}
                  </label>
                  <input
                    id="answer1"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Sua resposta"
                    value={securityAnswers.answer1}
                    onChange={(e) => setSecurityAnswers(prev => ({ ...prev, answer1: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label htmlFor="answer2" className="block text-sm font-medium text-gray-700 mb-1">
                    {userQuestions[1]?.text}
                  </label>
                  <input
                    id="answer2"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Sua resposta"
                    value={securityAnswers.answer2}
                    onChange={(e) => setSecurityAnswers(prev => ({ ...prev, answer2: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label htmlFor="answer3" className="block text-sm font-medium text-gray-700 mb-1">
                    {userQuestions[2]?.text}
                  </label>
                  <input
                    id="answer3"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Sua resposta"
                    value={securityAnswers.answer3}
                    onChange={(e) => setSecurityAnswers(prev => ({ ...prev, answer3: e.target.value }))}
                  />
                </div>
              </div>
            ) : email.includes('@') ? (
              <div className="text-center py-4">
                <div className="text-gray-600">Digite um email válido para ver suas perguntas secretas.</div>
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nova senha
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar às Opções
              </button>
              <br />
              <Link to="/login" className="font-medium text-gray-600 hover:text-gray-500">
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;