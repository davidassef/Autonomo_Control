# ⚙️ Configuração Avançada - Guia do Administrador

Este guia é destinado aos administradores do sistema Autônomo Control e contém instruções para configurações avançadas e manutenção do sistema.

## 🔒 Configurações de Segurança

### Autenticação de Dois Fatores (2FA)

Para habilitar a autenticação de dois fatores para todos os usuários:

1. Acesse o Painel de Controle de Administração
2. Navegue até "Configurações de Segurança"
3. Ative a opção "Exigir autenticação de dois fatores"
4. Configure as opções de recuperação
5. Clique em "Salvar alterações"

### Políticas de Senha

Para configurar políticas de senha:

```yaml
# Exemplo de configuração no arquivo .env
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL_CHAR=true
PASSWORD_EXPIRATION_DAYS=90
PASSWORD_HISTORY_COUNT=5
```

## 🖥️ Configuração do Servidor

### Variáveis de Ambiente

As principais variáveis de ambiente que podem ser configuradas:

```env
# Configurações do Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/autonomo_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Configurações de E-mail
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=yourpassword
EMAIL_FROM=noreply@autonomocontrol.com.br

# Configurações de Cache
REDIS_URL=redis://localhost:6379/0
CACHE_TTL=3600

# Configurações de Segurança
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Configuração do Web Server

#### Nginx (Exemplo de configuração)

```nginx
server {
    listen 80;
    server_name app.autonomocontrol.com.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.autonomocontrol.com.br;

    ssl_certificate /etc/letsencrypt/live/app.autonomocontrol.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.autonomocontrol.com.br/privkey.pem;

    # Otimizações de desempenho
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configuração do proxy para o frontend
    location / {
        root /var/www/autonomo-control/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Configuração do proxy para a API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configuração para o WebSocket
    location /ws {
        proxy_pass http://localhost:8000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

## 📊 Monitoramento e Logs

### Configuração de Logs

```python
# Exemplo de configuração de logging no Python
import logging
from logging.handlers import RotatingFileHandler

# Configuração básica
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(
            'logs/application.log',
            maxBytes=10485760,  # 10MB
            backupCount=5
        ),
        logging.StreamHandler()
    ]
)

# Exemplo de log
logger = logging.getLogger(__name__)
logger.info('Aplicação iniciada')
```

### Monitoramento com Prometheus e Grafana

1. Instale o Prometheus e Grafana
2. Configure o Prometheus para coletar métricas da sua aplicação
3. Importe os dashboards do Grafana
4. Configure alertas para métricas importantes

## 🔄 Backup e Recuperação

### Backup do Banco de Dados

```bash
# Comando para fazer backup do PostgreSQL
pg_dump -U username -d dbname -f backup_$(date +%Y%m%d).sql

# Compactar o backup
gzip backup_$(date +%Y%m%d).sql
```

### Script de Backup Automatizado

```bash
#!/bin/bash

# Configurações
DB_USER="username"
DB_NAME="dbname"
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Nome do arquivo de backup
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${DATE}.sql.gz"

# Fazer backup
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# Verificar se o backup foi criado com sucesso
if [ $? -eq 0 ]; then
    echo "Backup realizado com sucesso: $BACKUP_FILE"
    
    # Remover backups antigos
    find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +$KEEP_DAYS -delete
    echo "Backups com mais de $KEEP_DAYS dias removidos"
else
    echo "Erro ao realizar o backup"
    exit 1
fi
```

## 🔄 Atualizações

### Processo de Atualização

1. Fazer backup do banco de dados
2. Manter os usuários informados sobre a janela de manutenção
3. Executar migrações do banco de dados (se necessário)
4. Atualizar o código-fonte
5. Reiniciar os serviços
6. Verificar se tudo está funcionando corretamente
7. Enviar notificação de conclusão

### Comandos úteis para atualização

```bash
# Parar serviços
sudo systemctl stop autonomo-backend
sudo systemctl stop autonomo-frontend

# Atualizar o código
git pull origin main

# Instalar dependências (se necessário)
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# Executar migrações do banco de dados
alembic upgrade head

# Reconstruir frontend (se necessário)
cd frontend && npm run build && cd ..

# Reiniciar serviços
sudo systemctl start autonomo-backend
sudo systemctl start autonomo-frontend

# Verificar status dos serviços
sudo systemctl status autonomo-backend
sudo systemctl status autonomo-frontend
```

## 🛠️ Solução de Problemas

### Problemas Comuns e Soluções

#### API não responde
1. Verificar se o serviço está em execução: `sudo systemctl status autonomo-backend`
2. Verificar logs: `journalctl -u autonomo-backend -n 50 --no-pager`
3. Verificar se a porta está em uso: `sudo lsof -i :8000`

#### Problemas de Conexão com o Banco de Dados
1. Verificar se o PostgreSQL está em execução: `sudo systemctl status postgresql`
2. Verificar logs do PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-14-main.log`
3. Testar conexão: `psql -U username -d dbname -h localhost -p 5432`

#### Problemas no Frontend
1. Limpar cache do navegador
2. Verificar erros no console do navegador (F12 > Console)
3. Verificar logs do servidor web

## 📞 Suporte

Para suporte adicional, entre em contato com nossa equipe:

- **E-mail**: suporte@autonomocontrol.com.br
- **Telefone**: +55 (11) 1234-5678
- **Horário de Atendimento**: Segunda a Sexta, das 9h às 18h (horário de Brasília)

## 📝 Check-list de Segurança

- [ ] Senhas fortes para todos os acessos
- [ ] Firewall configurado corretamente
- [ ] Atualizações de segurança aplicadas
- [ ] Backups funcionando e testados
- [ ] Monitoramento ativo
- [ ] Políticas de acesso definidas
- [ ] Registro de auditoria habilitado
- [ ] Certificados SSL válidos
- [ ] Autenticação de dois fator habilitada para administradores
