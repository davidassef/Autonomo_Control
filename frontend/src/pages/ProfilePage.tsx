import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import {
  securityQuestionsService,
  SecurityQuestion,
} from "../services/securityQuestions";

interface ProfileData {
  name: string;
  email: string;
}

interface SecurityQuestions {
  question1Id: number;
  answer1: string;
  question2Id: number;
  answer2: string;
  question3Id: number;
  answer3: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Security questions
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestions>(
    {
      question1Id: 0,
      answer1: "",
      question2Id: 0,
      answer2: "",
      question3Id: 0,
      answer3: "",
    },
  );

  // Available security questions
  const [availableQuestions, setAvailableQuestions] = useState<
    SecurityQuestion[]
  >([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Password confirmation
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email,
      });
    }
  }, [user]);

  // Carregar perguntas secretas disponíveis
  useEffect(() => {
    const loadSecurityQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const questions = await securityQuestionsService.getAll();
        setAvailableQuestions(questions);
        setQuestionsError(null);
      } catch (error) {
        console.error("Erro ao carregar perguntas secretas:", error);
        setQuestionsError(
          "Erro ao carregar perguntas secretas. Tente novamente.",
        );
      } finally {
        setQuestionsLoading(false);
      }
    };

    loadSecurityQuestions();
  }, []);

  // Função para validar perguntas secretas
  const validateSecurityQuestions = (): boolean => {
    if (
      !securityQuestions.question1Id ||
      !securityQuestions.question2Id ||
      !securityQuestions.question3Id
    ) {
      setMessage({
        type: "error",
        text: "Por favor, selecione todas as três perguntas secretas.",
      });
      return false;
    }

    if (
      !securityQuestions.answer1.trim() ||
      !securityQuestions.answer2.trim() ||
      !securityQuestions.answer3.trim()
    ) {
      setMessage({
        type: "error",
        text: "Por favor, responda todas as perguntas secretas.",
      });
      return false;
    }

    const selectedQuestions = [
      securityQuestions.question1Id,
      securityQuestions.question2Id,
      securityQuestions.question3Id,
    ];
    const uniqueQuestions = new Set(selectedQuestions);
    if (uniqueQuestions.size !== 3) {
      setMessage({
        type: "error",
        text: "Por favor, selecione três perguntas diferentes.",
      });
      return false;
    }

    return true;
  };

  // Função para obter perguntas disponíveis para cada dropdown
  const getAvailableQuestionsForDropdown = (
    currentQuestionId: number,
  ): SecurityQuestion[] => {
    return availableQuestions.filter(
      (question) =>
        question.id === currentQuestionId ||
        (question.id !== securityQuestions.question1Id &&
          question.id !== securityQuestions.question2Id &&
          question.id !== securityQuestions.question3Id),
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPasswordConfirm(true);
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateSecurityQuestions()) return;

    setShowPasswordConfirm(true);
  };

  const confirmAndSave = async () => {
    if (!currentPassword) {
      setMessage({
        type: "error",
        text: "Digite sua senha atual para confirmar as alterações.",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const endpoint =
        activeTab === "profile"
          ? "/api/auth/profile/update"
          : "/api/auth/security-questions/update";
      const payload =
        activeTab === "profile"
          ? { ...profileData, current_password: currentPassword }
          : {
              security_question_1_id: securityQuestions.question1Id,
              security_answer_1: securityQuestions.answer1,
              security_question_2_id: securityQuestions.question2Id,
              security_answer_2: securityQuestions.answer2,
              security_question_3_id: securityQuestions.question3Id,
              security_answer_3: securityQuestions.answer3,
              current_password: currentPassword,
            };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text:
            activeTab === "profile"
              ? "Dados do perfil atualizados com sucesso!"
              : "Perguntas secretas atualizadas com sucesso!",
        });
        setIsEditing(false);
        setShowPasswordConfirm(false);
        setCurrentPassword("");

        if (activeTab === "security") {
          setSecurityQuestions({
            question1Id: 0,
            answer1: "",
            question2Id: 0,
            answer2: "",
            question3Id: 0,
            answer3: "",
          });
        }
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text:
            errorData.detail ||
            "Erro ao atualizar dados. Verifique sua senha atual.",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowPasswordConfirm(false);
    setCurrentPassword("");
    setMessage(null);

    if (activeTab === "profile" && user) {
      setProfileData({ name: user.name, email: user.email });
    } else if (activeTab === "security") {
      setSecurityQuestions({
        question1Id: 0,
        answer1: "",
        question2Id: 0,
        answer2: "",
        question3Id: 0,
        answer3: "",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Meu Perfil
            </h1>

            {message && (
              <div
                className={`mb-4 border px-4 py-3 rounded relative ${
                  message.type === "success"
                    ? "bg-green-100 border-green-400 text-green-700"
                    : "bg-red-100 border-red-400 text-red-700"
                }`}
                role="alert"
              >
                <span className="block sm:inline">{message.text}</span>
                <button
                  onClick={() => setMessage(null)}
                  className="absolute top-0 bottom-0 right-0 px-4 py-3"
                >
                  <svg
                    className="fill-current h-6 w-6"
                    role="button"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setIsEditing(false);
                    setShowPasswordConfirm(false);
                    setMessage(null);
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "profile"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Dados Pessoais
                </button>
                <button
                  onClick={() => {
                    setActiveTab("security");
                    setIsEditing(false);
                    setShowPasswordConfirm(false);
                    setMessage(null);
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "security"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Perguntas Secretas
                </button>
              </nav>
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Informações Pessoais
                  </h2>
                  {!isEditing && !showPasswordConfirm && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Editar
                    </button>
                  )}
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          !isEditing ? "bg-gray-50" : ""
                        }`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                          !isEditing ? "bg-gray-50" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {isEditing && !showPasswordConfirm && (
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Perguntas Secretas
                  </h2>
                  {!isEditing && !showPasswordConfirm && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      Alterar Respostas
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  As perguntas secretas são usadas para recuperar sua senha.
                  Mantenha suas respostas seguras e fáceis de lembrar.
                </p>

                <form onSubmit={handleSecuritySubmit}>
                  {questionsLoading ? (
                    <div className="text-center py-4">
                      <div className="text-gray-600">
                        Carregando perguntas...
                      </div>
                    </div>
                  ) : questionsError ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {questionsError}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Primeira pergunta */}
                      <div>
                        <label
                          htmlFor="security-question-1"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Primeira pergunta secreta
                        </label>
                        <select
                          id="security-question-1"
                          name="security-question-1"
                          required
                          disabled={!isEditing}
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2 ${
                            !isEditing ? "bg-gray-50" : ""
                          }`}
                          value={securityQuestions.question1Id}
                          onChange={(e) => {
                            setSecurityQuestions((prev) => ({
                              ...prev,
                              question1Id: parseInt(e.target.value) || 0,
                              answer1: "", // Limpar resposta ao trocar pergunta
                            }));
                          }}
                        >
                          <option value="">Selecione uma pergunta</option>
                          {getAvailableQuestionsForDropdown(
                            securityQuestions.question1Id,
                          ).map((question) => (
                            <option key={question.id} value={question.id}>
                              {question.question}
                            </option>
                          ))}
                        </select>
                        {securityQuestions.question1Id && (
                          <input
                            id="security-answer-1"
                            name="security-answer-1"
                            type="text"
                            required
                            disabled={!isEditing}
                            className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              !isEditing ? "bg-gray-50" : ""
                            }`}
                            placeholder={
                              isEditing ? "Digite sua resposta" : "••••••••••"
                            }
                            value={securityQuestions.answer1}
                            onChange={(e) =>
                              setSecurityQuestions((prev) => ({
                                ...prev,
                                answer1: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>

                      {/* Segunda pergunta */}
                      <div>
                        <label
                          htmlFor="security-question-2"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Segunda pergunta secreta
                        </label>
                        <select
                          id="security-question-2"
                          name="security-question-2"
                          required
                          disabled={!isEditing}
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2 ${
                            !isEditing ? "bg-gray-50" : ""
                          }`}
                          value={securityQuestions.question2Id}
                          onChange={(e) => {
                            setSecurityQuestions((prev) => ({
                              ...prev,
                              question2Id: parseInt(e.target.value) || 0,
                              answer2: "", // Limpar resposta ao trocar pergunta
                            }));
                          }}
                        >
                          <option value="">Selecione uma pergunta</option>
                          {getAvailableQuestionsForDropdown(
                            securityQuestions.question2Id,
                          ).map((question) => (
                            <option key={question.id} value={question.id}>
                              {question.question}
                            </option>
                          ))}
                        </select>
                        {securityQuestions.question2Id && (
                          <input
                            id="security-answer-2"
                            name="security-answer-2"
                            type="text"
                            required
                            disabled={!isEditing}
                            className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              !isEditing ? "bg-gray-50" : ""
                            }`}
                            placeholder={
                              isEditing ? "Digite sua resposta" : "••••••••••"
                            }
                            value={securityQuestions.answer2}
                            onChange={(e) =>
                              setSecurityQuestions((prev) => ({
                                ...prev,
                                answer2: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>

                      {/* Terceira pergunta */}
                      <div>
                        <label
                          htmlFor="security-question-3"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Terceira pergunta secreta
                        </label>
                        <select
                          id="security-question-3"
                          name="security-question-3"
                          required
                          disabled={!isEditing}
                          className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2 ${
                            !isEditing ? "bg-gray-50" : ""
                          }`}
                          value={securityQuestions.question3Id}
                          onChange={(e) => {
                            setSecurityQuestions((prev) => ({
                              ...prev,
                              question3Id: parseInt(e.target.value) || 0,
                              answer3: "", // Limpar resposta ao trocar pergunta
                            }));
                          }}
                        >
                          <option value="">Selecione uma pergunta</option>
                          {getAvailableQuestionsForDropdown(
                            securityQuestions.question3Id,
                          ).map((question) => (
                            <option key={question.id} value={question.id}>
                              {question.question}
                            </option>
                          ))}
                        </select>
                        {securityQuestions.question3Id && (
                          <input
                            id="security-answer-3"
                            name="security-answer-3"
                            type="text"
                            required
                            disabled={!isEditing}
                            className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                              !isEditing ? "bg-gray-50" : ""
                            }`}
                            placeholder={
                              isEditing ? "Digite sua resposta" : "••••••••••"
                            }
                            value={securityQuestions.answer3}
                            onChange={(e) =>
                              setSecurityQuestions((prev) => ({
                                ...prev,
                                answer3: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {isEditing && !showPasswordConfirm && (
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Password Confirmation Modal */}
            {showPasswordConfirm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Confirmar Alterações
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Para sua segurança, digite sua senha atual para confirmar
                      as alterações.
                    </p>

                    <div className="mb-4">
                      <label
                        htmlFor="current-password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Senha Atual
                      </label>
                      <input
                        type="password"
                        id="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Digite sua senha atual"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowPasswordConfirm(false);
                          setCurrentPassword("");
                        }}
                        disabled={isSubmitting}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmAndSave}
                        disabled={isSubmitting || !currentPassword}
                        className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSubmitting ? "Salvando..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
