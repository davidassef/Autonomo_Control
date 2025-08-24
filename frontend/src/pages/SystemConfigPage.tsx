import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Settings,
  Save,
  RotateCcw,
  Shield,
  Mail,
  Database,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import useSystemConfig from "../hooks/useSystemConfig";
import LoadingState from "../components/LoadingState";

interface ConfigField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean";
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

interface CategoryConfig {
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: ConfigField[];
}

const SystemConfigPage: React.FC = () => {
  const {
    configs,
    loading,
    error,
    updating,
    updateMultipleConfigs,
    resetToDefaults,
    initializeDefaults,
    refresh,
  } = useSystemConfig();

  const [localConfigs, setLocalConfigs] = useState<{ [key: string]: any }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");

  // Configuração das categorias e campos
  const categoryConfigs: CategoryConfig[] = [
    {
      name: "general",
      title: "Geral",
      description: "Configurações gerais da aplicação",
      icon: <Settings className="h-4 w-4" />,
      fields: [
        {
          key: "app_name",
          label: "Nome da Aplicação",
          type: "string",
          placeholder: "Autonomo Control",
        },
        {
          key: "app_version",
          label: "Versão",
          type: "string",
          placeholder: "1.0.0",
        },
        {
          key: "maintenance_mode",
          label: "Modo de Manutenção",
          type: "boolean",
          description: "Ativa o modo de manutenção da aplicação",
        },
      ],
    },
    {
      name: "users",
      title: "Usuários",
      description: "Configurações relacionadas aos usuários",
      icon: <Users className="h-4 w-4" />,
      fields: [
        {
          key: "max_users",
          label: "Máximo de Usuários",
          type: "number",
          min: 1,
          max: 10000,
        },
        {
          key: "allow_registration",
          label: "Permitir Registro",
          type: "boolean",
          description: "Permite que novos usuários se registrem",
        },
        {
          key: "default_user_role",
          label: "Papel Padrão",
          type: "string",
          placeholder: "USER",
        },
      ],
    },
    {
      name: "security",
      title: "Segurança",
      description: "Configurações de segurança e autenticação",
      icon: <Shield className="h-4 w-4" />,
      fields: [
        {
          key: "password_min_length",
          label: "Comprimento Mínimo da Senha",
          type: "number",
          min: 4,
          max: 50,
        },
        {
          key: "password_require_uppercase",
          label: "Exigir Maiúsculas",
          type: "boolean",
        },
        {
          key: "password_require_lowercase",
          label: "Exigir Minúsculas",
          type: "boolean",
        },
        {
          key: "password_require_numbers",
          label: "Exigir Números",
          type: "boolean",
        },
        {
          key: "password_require_symbols",
          label: "Exigir Símbolos",
          type: "boolean",
        },
        {
          key: "temp_password_expiry_hours",
          label: "Expiração Senha Temporária (horas)",
          type: "number",
          min: 1,
          max: 168,
        },
        {
          key: "session_timeout_minutes",
          label: "Timeout de Sessão (minutos)",
          type: "number",
          min: 5,
          max: 1440,
        },
        {
          key: "max_login_attempts",
          label: "Máximo de Tentativas de Login",
          type: "number",
          min: 1,
          max: 20,
        },
        {
          key: "lockout_duration_minutes",
          label: "Duração do Bloqueio (minutos)",
          type: "number",
          min: 1,
          max: 1440,
        },
      ],
    },
    {
      name: "email",
      title: "E-mail",
      description: "Configurações do servidor de e-mail",
      icon: <Mail className="h-4 w-4" />,
      fields: [
        {
          key: "smtp_host",
          label: "Servidor SMTP",
          type: "string",
          placeholder: "smtp.gmail.com",
        },
        {
          key: "smtp_port",
          label: "Porta SMTP",
          type: "number",
          min: 1,
          max: 65535,
        },
        { key: "smtp_username", label: "Usuário SMTP", type: "string" },
        { key: "smtp_password", label: "Senha SMTP", type: "string" },
        { key: "smtp_use_tls", label: "Usar TLS", type: "boolean" },
        {
          key: "email_from",
          label: "E-mail Remetente",
          type: "string",
          placeholder: "noreply@autonomocontrol.com",
        },
      ],
    },
    {
      name: "backup",
      title: "Backup",
      description: "Configurações de backup do sistema",
      icon: <Database className="h-4 w-4" />,
      fields: [
        { key: "backup_enabled", label: "Backup Habilitado", type: "boolean" },
        {
          key: "backup_frequency_hours",
          label: "Frequência (horas)",
          type: "number",
          min: 1,
          max: 168,
        },
        {
          key: "backup_retention_days",
          label: "Retenção (dias)",
          type: "number",
          min: 1,
          max: 365,
        },
        {
          key: "backup_path",
          label: "Caminho do Backup",
          type: "string",
          placeholder: "./backups",
        },
      ],
    },
    {
      name: "logging",
      title: "Logs",
      description: "Configurações de logs e auditoria",
      icon: <FileText className="h-4 w-4" />,
      fields: [
        {
          key: "log_level",
          label: "Nível de Log",
          type: "string",
          placeholder: "INFO",
        },
        {
          key: "log_retention_days",
          label: "Retenção de Logs (dias)",
          type: "number",
          min: 1,
          max: 365,
        },
        {
          key: "audit_log_enabled",
          label: "Log de Auditoria Habilitado",
          type: "boolean",
        },
      ],
    },
  ];

  // Sincronizar configurações locais com as do servidor
  useEffect(() => {
    setLocalConfigs(configs);
    setHasChanges(false);
  }, [configs]);

  // Verificar se há mudanças
  useEffect(() => {
    const hasChanges = Object.keys(localConfigs).some(
      (key) => localConfigs[key] !== configs[key],
    );
    setHasChanges(hasChanges);
  }, [localConfigs, configs]);

  const handleConfigChange = (key: string, value: any) => {
    setLocalConfigs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("Nenhuma alteração para salvar");
      return;
    }

    // Filtrar apenas as configurações que mudaram
    const changedConfigs: { [key: string]: any } = {};
    Object.keys(localConfigs).forEach((key) => {
      if (localConfigs[key] !== configs[key]) {
        changedConfigs[key] = localConfigs[key];
      }
    });

    const success = await updateMultipleConfigs(changedConfigs);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Tem certeza que deseja resetar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.",
      )
    ) {
      await resetToDefaults();
    }
  };

  const handleInitialize = async () => {
    if (
      window.confirm(
        "Tem certeza que deseja inicializar as configurações padrão? Isso pode sobrescrever configurações existentes.",
      )
    ) {
      await initializeDefaults();
    }
  };

  const renderField = (field: ConfigField) => {
    const value = localConfigs[field.key];

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.key}
              checked={Boolean(value)}
              onCheckedChange={(checked: boolean) =>
                handleConfigChange(field.key, checked)
              }
            />
            <Label htmlFor={field.key}>{field.label}</Label>
          </div>
        );

      case "number":
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              value={value || ""}
              onChange={(e) =>
                handleConfigChange(field.key, parseInt(e.target.value) || 0)
              }
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
            />
          </div>
        );

      default: // string
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type={field.key.includes("password") ? "password" : "text"}
              value={value || ""}
              onChange={(e) => handleConfigChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  if (loading && Object.keys(configs).length === 0) {
    return <LoadingState message="Carregando configurações do sistema..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as configurações globais da aplicação (apenas MASTER)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>

          {hasChanges && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alterações não salvas
            </Badge>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updating}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {updating ? "Salvando..." : "Salvar Alterações"}
        </Button>

        <Button
          variant="outline"
          onClick={() => setLocalConfigs(configs)}
          disabled={!hasChanges || updating}
        >
          Descartar Alterações
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          onClick={handleInitialize}
          disabled={updating}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Inicializar Padrões
        </Button>

        <Button variant="destructive" onClick={handleReset} disabled={updating}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar Tudo
        </Button>
      </div>

      {/* Configuration Tabs */}
      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-6">
          {categoryConfigs.map((category) => (
            <TabsTrigger
              key={category.name}
              value={category.name}
              className="flex items-center gap-2"
            >
              {category.icon}
              <span className="hidden sm:inline">{category.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categoryConfigs.map((category) => (
          <TabsContent key={category.name} value={category.name}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category.icon}
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {category.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      {renderField(field)}
                      {field.description && (
                        <p className="text-sm text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default SystemConfigPage;
