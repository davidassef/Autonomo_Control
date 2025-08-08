# 🚀 Configuração do Ambiente de Produção

Este guia descreve como configurar o Autônomo Control para um ambiente de produção seguro e escalável.

## 1. Requisitos do Servidor

### Mínimos Recomendados
- **CPU**: 2 núcleos
- **Memória**: 4GB RAM
- **Armazenamento**: 20GB SSD
- **Sistema Operacional**: Ubuntu 20.04 LTS ou superior

### Recomendado para Produção
- **CPU**: 4+ núcleos
- **Memória**: 8GB+ RAM
- **Armazenamento**: 50GB+ SSD
- **Backup**: Configuração de backup automático

## 2. Configuração Inicial do Servidor

### Atualizar o Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar Dependências
```bash
# Dependências básicas
sudo apt install -y git python3-pip python3-venv nginx supervisor

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Node.js (usando NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts
```

## 3. Configuração do Banco de Dados

### Criar Usuário e Banco de Dados
```bash
sudo -u postgres createuser -P autonomo_user
sudo -u postgres createdb -O autonomo_user autonomo_prod
```

### Configurar Acesso ao PostgreSQL
Edite o arquivo `pg_hba.conf`:
```bash
sudo nano /etc/postgresql/12/main/pg_hba.conf
```

Adicione a linha:
```
host    autonomo_prod    autonomo_user    127.0.0.1/32    md5
```

Reinicie o PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 4. Implantação da Aplicação

### Clonar o Repositório
```bash
cd /opt
sudo git clone https://github.com/seu-usuario/autonomo-control.git
sudo chown -R $USER:$USER autonomo-control/
cd autonomo-control
```

### Configurar Ambiente Virtual
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Configurações do Banco de Dados
DATABASE_URL=postgresql://autonomo_user:SUA_SENHA@localhost:5432/autonomo_prod

# Configurações de Segurança
SECRET_KEY=sua_chave_secreta_muito_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 horas

# Configurações do Email (opcional)
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
EMAIL_USER=seu_email@example.com
EMAIL_PASSWORD=sua_senha
```

### Aplicar Migrações
```bash
alembic upgrade head
```

## 5. Configuração do Frontend

### Instalar Dependências e Build
```bash
cd frontend
npm install
npm run build
```

## 6. Configuração do Gunicorn

### Instalar Gunicorn
```bash
pip install gunicorn
```

### Criar Arquivo de Configuração
Crie o arquivo `/etc/systemd/system/autonomo.service`:
```ini
[Unit]
Description=Gunicorn instance to serve Autônomo Control
After=network.target

[Service]
User=seu_usuario
Group=www-data
WorkingDirectory=/opt/autonomo-control
Environment="PATH=/opt/autonomo-control/venv/bin"
ExecStart=/opt/autonomo-control/venv/bin/gunicorn --workers 3 --bind unix:autonomo.sock -m 007 app.main:app

[Install]
WantedBy=multi-user.target
```

### Iniciar o Serviço
```bash
sudo systemctl start autonomo
sudo systemctl enable autonomo
```

## 7. Configuração do Nginx

### Criar Arquivo de Configuração
Crie o arquivo `/etc/nginx/sites-available/autonomo`:
```nginx
server {
    listen 80;
    server_name seu_dominio.com www.seu_dominio.com;

    location / {
        root /opt/autonomo-control/frontend/build;
        try_files $uri /index.html;
    }

    location /api {
        include proxy_params;
        proxy_pass http://unix:/opt/autonomo-control/autonomo.sock;
    }

    location /docs {
        include proxy_params;
        proxy_pass http://unix:/opt/autonomo-control/autonomo.sock;
    }

    location /admin {
        include proxy_params;
        proxy_pass http://unix:/opt/autonomo-control/autonomo.sock;
    }
}
```

### Habilitar o Site e Reiniciar Nginx
```bash
sudo ln -s /etc/nginx/sites-available/autonomo /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Configurar HTTPS com Let's Encrypt

### Instalar o Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obter Certificado SSL
```bash
sudo certbot --nginx -d seu_dominio.com -d www.seu_dominio.com
```

### Renovar Automaticamente
O Certbot configura a renovação automática. Você pode testar com:
```bash
sudo certbot renew --dry-run
```

## 9. Backup e Monitoramento

### Script de Backup
Crie um script de backup em `/usr/local/bin/backup_autonomo.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backup/autonomo"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# Fazer backup do banco de dados
pg_dump -U autonomo_user -d autonomo_prod > "$BACKUP_DIR/autonomo_db_$DATE.sql"

# Fazer backup dos arquivos de mídia
tar -czf "$BACKUP_DIR/autonomo_media_$DATE.tar.gz" /opt/autonomo-control/static

# Manter apenas os últimos 7 backups
find "$BACKUP_DIR" -type f -mtime +7 -delete
```

### Agendar Backup Diário
```bash
sudo crontab -e
```

Adicione a linha:
```
0 2 * * * /usr/local/bin/backup_autonomo.sh
```

## 10. Atualizando a Aplicação

### Atualizar Código Fonte
```bash
cd /opt/autonomo-control
git pull
source venv/bin/activate
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
alembic upgrade head
sudo systemctl restart autonomo
```

## 11. Monitoramento

### Instalar e Configurar o Supervisor
```bash
sudo apt install -y supervisor
```

Crie o arquivo `/etc/supervisor/conf.d/autonomo.conf`:
```ini
[program:autonomo]
command=/opt/autonomo-control/venv/bin/gunicorn --workers 3 --bind unix:/opt/autonomo-control/autonomo.sock -m 007 app.main:app
directory=/opt/autonomo-control
user=seu_usuario
autostart=true
autorestart=true
stderr_logfile=/var/log/autonomo/autonomo.err.log
stdout_logfile=/var/log/autonomo/autonomo.out.log
```

### Iniciar o Supervisor
```bash
sudo mkdir -p /var/log/autonomo
sudo systemctl restart supervisor
sudo supervisorctl reread
sudo supervisorctl update
```

## 12. Próximos Passos

- [Configurar Backup Automático](#9-backup-e-monitoramento)
- [Monitorar Logs](#11-monitoramento)
- [Configurar Firewall](#13-configuração-de-firewall)

## 13. Configuração de Firewall

### Habilitar UFW
```bash
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Verificar Status
```bash
sudo ufw status
```
