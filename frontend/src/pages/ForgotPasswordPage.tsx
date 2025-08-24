import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SecurityQuestion } from "../services/securityQuestions";

const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<
    "username" | "choose" | "email" | "security" | "secret_key"
  >("username");
  const [email, setEmail] = useState("");
  const [inputUsername, setInputUsername] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState({
    answer1: "",
    answer2: "",
    answer3: "",
  });
  const [userQuestions, setUserQuestions] = useState<SecurityQuestion[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [username, setUsername] = useState("");
  const [secretKey, setSecretKey] = useState("");

  // Função para verificar tipo de usuário
  const checkUserType = async (usernameOrEmail: string) => {
    setIsCheckingUser(true);
    setMessage(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/auth/check-user-type/${encodeURIComponent(usernameOrEmail)}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Usuário não encontrado");
        }
        throw new Error("Erro ao verificar usuário");
      }

      const data = await response.json();
      setUserRole(data.user_role);
      setEmail(data.email); // Definir o email para uso posterior
      setUsername(data.username || data.email); // Definir username
      setStep("choose");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Erro ao verificar usuário",
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  // Função para lidar com o envio do username
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      checkUserType(inputUsername.trim());
    }
  };

  // Função para buscar as perguntas secretas do usuário
  const fetchUserQuestions = async (userEmail: string) => {
    if (!userEmail.trim()) return;

    setQuestionsLoading(true);
    setQuestionsError(null);

    try {
      const response = await fetch(
        `/api/auth/user-security-questions?email=${encodeURIComponent(userEmail)}`,
      );

      if (response.ok) {
        const questions = await response.json();
        setUserQuestions(questions);
      } else {
        const errorData = await response.json();
        setQuestionsError(
          errorData.detail || "Erro ao carregar perguntas do usuário.",
        );
      }
    } catch (error) {
      console.error("Erro ao buscar perguntas do usuário:", error);
      setQuestionsError("Erro de conexão ao carregar perguntas.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Buscar perguntas quando o email for alterado (com debounce)
  useEffect(() => {
    if (step === "security" && email.includes("@")) {
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
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Um email com instruções para redefinir sua senha foi enviado para seu endereço de email.",
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.detail || "Erro ao solicitar redefinição de senha.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
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
        type: "error",
        text: "As senhas não coincidem.",
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "A senha deve ter pelo menos 8 caracteres.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/auth/password-reset/security-questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            security_answer_1: securityAnswers.answer1,
            security_answer_2: securityAnswers.answer2,
            security_answer_3: securityAnswers.answer3,
            new_password: newPassword,
          }),
        },
      );

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Senha redefinida com sucesso! Você pode fazer login com sua nova senha.",
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text:
            errorData.detail ||
            "Erro ao redefinir senha. Verifique suas respostas.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecretKeyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "As senhas não coincidem.",
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "A senha deve ter pelo menos 8 caracteres.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/secret-keys/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          secret_key: secretKey,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Senha do Master redefinida com sucesso! Você pode fazer login com sua nova senha.",
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.detail || "Chave secreta inválida ou expirada.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
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
        type: "error",
        text: "As senhas não coincidem.",
      });
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "A senha deve ter pelo menos 8 caracteres.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/password-reset/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Senha redefinida com sucesso! Você pode fazer login com sua nova senha.",
        });
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.detail || "Token inválido ou expirado.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro de conexão. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Autônomo Control
          </h1>
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
            {step === "username" && "Recuperar Senha"}
            {step === "choose" && "Escolher Método"}
            {step === "email" && "Recuperar por Email"}
            {step === "security" && "Recuperar por Perguntas Secretas"}
            {step === "secret_key" && "Recuperar por Chave Secreta (Master)"}
          </h2>
        </div>

        {message && (
          <div
            className={`border px-4 py-3 rounded relative ${
              message.type === "success"
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
            role="alert"
          >
            <span className="block sm:inline">{message.text}</span>
          </div>
        )}

        {step === "username" && (
          <form className="mt-8 space-y-6" onSubmit={handleUsernameSubmit}>
            <div>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Digite seu nome de usuário ou email para continuar:
              </p>

              <label htmlFor="input-username" className="sr-only">
                Nome de usuário ou email
              </label>
              <input
                id="input-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nome de usuário ou email"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                disabled={isCheckingUser}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isCheckingUser || !inputUsername.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isCheckingUser ? "Verificando..." : "Continuar"}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}

        {step === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Usuário: <strong>{username || email}</strong>
              <br />
              Escolha como você gostaria de redefinir sua senha:
            </p>

            <div className="space-y-3">
              {/* Mostrar opções baseadas no role do usuário */}
              {(userRole === "MASTER" || userRole === "ADMIN") && (
                <button
                  type="button"
                  onClick={() => setStep("secret_key")}
                  className="w-full flex items-center justify-center px-4 py-3 border border-yellow-300 rounded-md shadow-sm bg-yellow-50 text-sm font-medium text-yellow-700 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0119 9z"
                    />
                  </svg>
                  🔑 Redefinir via Chave Secreta
                </button>
              )}

              {userRole === "USER" && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Redefinir via Email
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("security")}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Redefinir via Perguntas Secretas
                  </button>
                </>
              )}
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStep("username");
                  setInputUsername("");
                  setUserRole("");
                  setEmail("");
                  setUsername("");
                }}
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Voltar
              </button>
              <br />
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar ao Login
              </Link>
            </div>
          </div>
        )}

        {step === "email" && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailReset}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Digite seu email para receber instruções de recuperação de
                senha.
              </p>

              <label htmlFor="email" className="sr-only">
                Email
              </label>
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
                {isSubmitting ? "Enviando..." : "Enviar Email de Recuperação"}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar às Opções
              </button>
              <br />
              <Link
                to="/login"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
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
                  disabled={
                    isSubmitting ||
                    !resetToken ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
                </button>
              </div>
            </div>
          </form>
        )}

        {step === "security" && (
          <form className="mt-8 space-y-6" onSubmit={handleSecurityReset}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Digite seu email e responda às perguntas secretas para redefinir
                sua senha.
              </p>

              <label htmlFor="email-security" className="sr-only">
                Email
              </label>
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
                <div className="text-gray-600">
                  Carregando suas perguntas secretas...
                </div>
              </div>
            ) : questionsError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {questionsError}
              </div>
            ) : userQuestions.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="answer1"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {userQuestions[0]?.question}
                  </label>
                  <input
                    id="answer1"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Sua resposta"
                    value={securityAnswers.answer1}
                    onChange={(e) =>
                      setSecurityAnswers((prev) => ({
                        ...prev,
                        answer1: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="answer2"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {userQuestions[1]?.question}
                  </label>
                  <input
                    id="answer2"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Sua resposta"
                    value={securityAnswers.answer2}
                    onChange={(e) =>
                      setSecurityAnswers((prev) => ({
                        ...prev,
                        answer2: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="answer3"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {userQuestions[2]?.question}
                  </label>
                  <input
                    id="answer3"
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Sua resposta"
                    value={securityAnswers.answer3}
                    onChange={(e) =>
                      setSecurityAnswers((prev) => ({
                        ...prev,
                        answer3: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ) : email.includes("@") ? (
              <div className="text-center py-4">
                <div className="text-gray-600">
                  Digite um email válido para ver suas perguntas secretas.
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="confirm-new-password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                {isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar às Opções
              </button>
              <br />
              <Link
                to="/login"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}

        {step === "secret_key" && (
          <form className="mt-8 space-y-6" onSubmit={handleSecretKeyReset}>
            <div>
              <p className="text-sm text-gray-600 mb-4">
                🔑 <strong>Recuperação Master:</strong> Digite seu username e
                chave secreta para redefinir sua senha.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Esta opção é exclusiva para a conta Master do sistema.
                    </p>
                  </div>
                </div>
              </div>

              <label htmlFor="username-master" className="sr-only">
                Username
              </label>
              <input
                id="username-master"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm mb-4"
                placeholder="Username do Master"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <label htmlFor="secret-key" className="sr-only">
                Chave Secreta
              </label>
              <input
                id="secret-key"
                name="secret-key"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm mb-4"
                placeholder="Chave Secreta (16 caracteres)"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
                maxLength={16}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="new-password-master"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nova senha
                </label>
                <input
                  id="new-password-master"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password-master"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirmar nova senha
                </label>
                <input
                  id="confirm-new-password-master"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !username ||
                  !secretKey ||
                  !newPassword ||
                  !confirmPassword
                }
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
              >
                {isSubmitting ? "Redefinindo..." : "🔑 Redefinir Senha Master"}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Voltar às Opções
              </button>
              <br />
              <Link
                to="/login"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
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
