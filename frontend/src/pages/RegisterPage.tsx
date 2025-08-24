import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  securityQuestionsService,
  SecurityQuestion,
} from "../services/securityQuestions";
import {
  validateCPF,
  formatCPF,
  validatePhone,
  formatPhone,
  validateBirthDate,
  validateCEP,
  formatCEP,
  BRAZILIAN_STATES,
} from "../utils/validators";
import { fetchAddressByCEP } from "../services/cep";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion1Id, setSecurityQuestion1Id] = useState("");
  const [securityAnswer1, setSecurityAnswer1] = useState("");
  const [securityQuestion2Id, setSecurityQuestion2Id] = useState("");
  const [securityAnswer2, setSecurityAnswer2] = useState("");
  const [securityQuestion3Id, setSecurityQuestion3Id] = useState("");
  const [securityAnswer3, setSecurityAnswer3] = useState("");
  const [availableQuestions, setAvailableQuestions] = useState<
    SecurityQuestion[]
  >([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Novos campos opcionais
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

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
        console.error("Erro ao carregar perguntas secretas:", err);
        setQuestionsError(
          "Erro ao carregar perguntas secretas. Tente novamente.",
        );
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, []);

  const validatePassword = () => {
    if (password.length < 8) {
      setPasswordError("A senha deve ter pelo menos 8 caracteres");
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError("As senhas não coincidem");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const validateSecurityQuestions = () => {
    if (!securityQuestion1Id || !securityQuestion2Id || !securityQuestion3Id) {
      setQuestionsError("Selecione todas as três perguntas secretas");
      return false;
    }

    if (
      !securityAnswer1.trim() ||
      !securityAnswer2.trim() ||
      !securityAnswer3.trim()
    ) {
      setQuestionsError("Responda todas as três perguntas secretas");
      return false;
    }

    // Verificar se as perguntas são diferentes
    const selectedQuestions = [
      securityQuestion1Id,
      securityQuestion2Id,
      securityQuestion3Id,
    ];
    const uniqueQuestions = new Set(selectedQuestions);
    if (uniqueQuestions.size !== 3) {
      setQuestionsError("Selecione três perguntas diferentes");
      return false;
    }

    setQuestionsError(null);
    return true;
  };

  // Função para buscar endereço por CEP
  const handleCepChange = async (value: string) => {
    const formattedCep = formatCEP(value);
    setCep(formattedCep);
    setCepError("");

    // Limpar campos de endereço se CEP for inválido
    if (!validateCEP(value)) {
      setStreet("");
      setNeighborhood("");
      setCity("");
      setState("");
      return;
    }

    // Buscar endereço se CEP for válido
    if (validateCEP(value)) {
      setIsLoadingCep(true);
      try {
        const response = await fetchAddressByCEP(value);
        if (response.success && response.data) {
          setStreet(response.data.street || "");
          setNeighborhood(response.data.neighborhood || "");
          setCity(response.data.city || "");
          setState(response.data.state || "");
        } else {
          setCepError(response.error || "CEP não encontrado");
        }
      } catch (error) {
        setCepError("CEP não encontrado ou inválido");
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Função para validar campos opcionais
  const validateOptionalFields = () => {
    const errors: { [key: string]: string } = {};

    if (cpf && !validateCPF(cpf)) {
      errors.cpf = "CPF inválido";
    }

    if (birthDate && !validateBirthDate(birthDate)) {
      errors.birthDate =
        "Data de nascimento inválida ou idade menor que 16 anos";
    }

    if (phone && !validatePhone(phone)) {
      errors.phone = "Telefone inválido";
    }

    if (cep && !validateCEP(cep)) {
      errors.cep = "CEP inválido";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setQuestionsError(null);

    if (!validatePassword()) return;
    if (!validateSecurityQuestions()) return;

    // Validar campos opcionais
    if (!validateOptionalFields()) {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name,
        email,
        password,
        securityQuestions: [
          {
            question_id: parseInt(securityQuestion1Id),
            answer: securityAnswer1,
          },
          {
            question_id: parseInt(securityQuestion2Id),
            answer: securityAnswer2,
          },
          {
            question_id: parseInt(securityQuestion3Id),
            answer: securityAnswer3,
          },
        ],
        optionalFields: {
          ...(cpf && { cpf: cpf.replace(/\D/g, "") }), // Remover formatação
          ...(birthDate && { birth_date: birthDate }),
          ...(phone && { phone: phone.replace(/\D/g, "") }), // Remover formatação
          ...(cep && { cep: cep.replace(/\D/g, "") }), // Remover formatação
          ...(street && { street }),
          ...(number && { number }),
          ...(complement && { complement }),
          ...(neighborhood && { neighborhood }),
          ...(city && { city }),
          ...(state && { state }),
        },
      });
      navigate("/");
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para obter perguntas disponíveis para um dropdown específico
  const getAvailableQuestionsForDropdown = (currentQuestionId: string) => {
    const selectedQuestions = [
      securityQuestion1Id,
      securityQuestion2Id,
      securityQuestion3Id,
    ]
      .filter((id) => id && id !== currentQuestionId)
      .map((id) => parseInt(id));

    return availableQuestions.filter((q) => !selectedQuestions.includes(q.id));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Autônomo Control
          </h1>
          <h2 className="mt-6 text-center text-xl font-bold text-gray-900">
            Criar uma nova conta
          </h2>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <span
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={clearError}
            >
              <svg
                className="fill-current h-6 w-6 text-red-500"
                role="button"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <title>Fechar</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
              </svg>
            </span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome completo
              </label>
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
              <label htmlFor="email-address" className="sr-only">
                E-mail
              </label>
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
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
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
              <label htmlFor="confirm-password" className="sr-only">
                Confirmar senha
              </label>
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

          {/* Campos opcionais */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informações Adicionais (Opcionais)
            </h3>
            <div className="space-y-4">
              {/* CPF */}
              <div>
                <label
                  htmlFor="cpf"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CPF
                </label>
                <input
                  id="cpf"
                  name="cpf"
                  type="text"
                  className={`appearance-none relative block w-full px-3 py-2 border ${validationErrors.cpf ? "border-red-300" : "border-gray-300"} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  maxLength={14}
                />
                {validationErrors.cpf && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.cpf}
                  </p>
                )}
              </div>

              {/* Data de Nascimento */}
              <div>
                <label
                  htmlFor="birth-date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Data de Nascimento
                </label>
                <input
                  id="birth-date"
                  name="birth-date"
                  type="date"
                  className={`appearance-none relative block w-full px-3 py-2 border ${validationErrors.birthDate ? "border-red-300" : "border-gray-300"} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                {validationErrors.birthDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.birthDate}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  className={`appearance-none relative block w-full px-3 py-2 border ${validationErrors.phone ? "border-red-300" : "border-gray-300"} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={15}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* CEP */}
              <div>
                <label
                  htmlFor="cep"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  CEP
                </label>
                <div className="relative">
                  <input
                    id="cep"
                    name="cep"
                    type="text"
                    className={`appearance-none relative block w-full px-3 py-2 border ${validationErrors.cep || cepError ? "border-red-300" : "border-gray-300"} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                  />
                  {isLoadingCep && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                </div>
                {(validationErrors.cep || cepError) && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.cep || cepError}
                  </p>
                )}
              </div>

              {/* Endereço - só aparece se CEP for válido */}
              {(street || neighborhood || city || state) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logradouro */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="street"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Logradouro
                    </label>
                    <input
                      id="street"
                      name="street"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      readOnly
                    />
                  </div>

                  {/* Número */}
                  <div>
                    <label
                      htmlFor="number"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Número
                    </label>
                    <input
                      id="number"
                      name="number"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                    />
                  </div>

                  {/* Complemento */}
                  <div>
                    <label
                      htmlFor="complement"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Complemento
                    </label>
                    <input
                      id="complement"
                      name="complement"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="Apto 101"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                    />
                  </div>

                  {/* Bairro */}
                  <div>
                    <label
                      htmlFor="neighborhood"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bairro
                    </label>
                    <input
                      id="neighborhood"
                      name="neighborhood"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      readOnly
                    />
                  </div>

                  {/* Cidade */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Cidade
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      readOnly
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Estado
                    </label>
                    <select
                      id="state"
                      name="state"
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    >
                      <option value="">Selecione o estado</option>
                      {BRAZILIAN_STATES.map((stateOption) => (
                        <option
                          key={stateOption.value}
                          value={stateOption.value}
                        >
                          {stateOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Perguntas de Segurança
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Escolha 3 perguntas diferentes e forneça suas respostas. Essas
              informações serão usadas para recuperar sua senha caso necessário.
            </p>

            {isLoadingQuestions ? (
              <div className="text-center py-4">
                <div className="text-sm text-gray-600">
                  Carregando perguntas...
                </div>
              </div>
            ) : questionsError ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {questionsError}
              </div>
            ) : (
              <div className="space-y-4">
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
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-2"
                    value={securityQuestion1Id}
                    onChange={(e) => {
                      setSecurityQuestion1Id(e.target.value);
                      setSecurityAnswer1(""); // Limpar resposta ao trocar pergunta
                    }}
                  >
                    <option value="">Selecione uma pergunta</option>
                    {getAvailableQuestionsForDropdown(securityQuestion1Id).map(
                      (question) => (
                        <option key={question.id} value={question.id}>
                          {question.question}
                        </option>
                      ),
                    )}
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
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-2"
                    value={securityQuestion2Id}
                    onChange={(e) => {
                      setSecurityQuestion2Id(e.target.value);
                      setSecurityAnswer2(""); // Limpar resposta ao trocar pergunta
                    }}
                  >
                    <option value="">Selecione uma pergunta</option>
                    {getAvailableQuestionsForDropdown(securityQuestion2Id).map(
                      (question) => (
                        <option key={question.id} value={question.id}>
                          {question.question}
                        </option>
                      ),
                    )}
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
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm mb-2"
                    value={securityQuestion3Id}
                    onChange={(e) => {
                      setSecurityQuestion3Id(e.target.value);
                      setSecurityAnswer3(""); // Limpar resposta ao trocar pergunta
                    }}
                  >
                    <option value="">Selecione uma pergunta</option>
                    {getAvailableQuestionsForDropdown(securityQuestion3Id).map(
                      (question) => (
                        <option key={question.id} value={question.id}>
                          {question.question}
                        </option>
                      ),
                    )}
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
            <div className="text-sm text-red-600">{passwordError}</div>
          )}

          {questionsError && (
            <div className="text-sm text-red-600">{questionsError}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
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
