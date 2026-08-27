# Deploy — Agência Tia Sam (VPS Linux)

Guia passo a passo para colocar o projeto em produção em uma VPS Ubuntu.

## Pré-requisitos

- VPS Ubuntu Server LTS
- Domínio próprio apontando para o IP da VPS (registro A)
- Acesso SSH

## Arquitetura

```
Internet
   ↓  HTTPS
 Domínio
   ↓  porta 443
 Nginx
   ↓  proxy reverso
 Node.js (Express) — porta 4000
   ├── Frontend React (dist/)
   ├── API (/api/*)
   └── Uploads (/uploads/*)
   └── SQLite (data/tiasam.db)
```

## 1. Preparar o servidor

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar utilitários básicos
sudo apt install -y curl git sqlite3 ufw
```

## 2. Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh            # porta 22
sudo ufw allow http           # porta 80
sudo ufw allow https          # porta 443
sudo ufw enable
sudo ufw status verbose
```

## 3. Instalar Node.js

O projeto **exige Node.js ≥ 22.13** (usa `node:sqlite` nativo). Recomenda-se Node.js 22 LTS.

```bash
# Opção A — NodeSource (recomendada)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Opção B — nvm
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# nvm install 22

# Verificar
node -v   # precisa ser >= 22.13
npm -v
```

## 4. Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 5. Instalar PM2

```bash
sudo npm install -g pm2
pm2 --version
```

## 6. Clonar o projeto

```bash
sudo mkdir -p /var/www
sudo chown "$USER:$USER" /var/www
cd /var/www
git clone https://github.com/team-beacore/agencia-tia-sam.git
cd agencia-tia-sam
```

## 7. Configurar ambiente (.env)

Crie o arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
nano .env
```

**Preencha obrigatoriamente:**

| Variável | Valor esperado |
|---|---|
| `JWT_SECRET` | `openssl rand -hex 32` (rode este comando e cole o resultado) |
| `ADMIN_PASSWORD` | Senha forte para o primeiro login no painel |
| `CORS_ORIGINS` | `https://seu-dominio.com.br` |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `TRUST_PROXY` | `1` |
| `ADMIN_EMAIL` | Email do administrador (opcional) |

Nunca versionar o `.env`. O arquivo já está no `.gitignore`.

## 8. Instalar dependências e buildar

```bash
npm ci                # ou npm install (se npm ci falhar por lockfile)
npm run build
```

## 9. Banco de dados (SQLite)

O banco é criado automaticamente na primeira execução.
Não é necessário instalar PostgreSQL/MySQL.

```bash
# O arquivo será criado em data/tiasam.db
# As tabelas são criadas via CREATE TABLE IF NOT EXISTS
# Os dados iniciais vêm de shared/seed.json
```

## 10. Iniciar com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

O comando `pm2 startup` exibirá uma instrução como:

```
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

Execute o comando exibido para que o PM2 reinicie a aplicação automaticamente após reboot.

## 11. Configurar Nginx

```bash
# Copiar a configuração de referência
sudo cp nginx/agencia-tia-sam.conf /etc/nginx/sites-available/agencia-tia-sam.conf

# Editar: substituir "seu-dominio.com.br" pelo domínio real
sudo nano /etc/nginx/sites-available/agencia-tia-sam.conf

# Ativar o site
sudo ln -sf /etc/nginx/sites-available/agencia-tia-sam.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

## 12. DNS

No painel de DNS do seu domínio, crie registros A apontando para o IP da VPS:

```
seu-dominio.com.br   A   <IP_DA_VPS>
www.seu-dominio.com.br   A   <IP_DA_VPS>
```

## 13. SSL (Let's Encrypt + Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br

# A renovação é automática (systemd timer). Verificar:
sudo certbot renew --dry-run
```

## 14. Testar

```bash
# Health check local (pelo Node)
curl http://127.0.0.1:4000/api/public/health

# Health check público (pelo domínio)
curl https://seu-dominio.com.br/api/public/health

# Frontend
curl -I https://seu-dominio.com.br
# Deve retornar 200 e o HTML do site

# Painel admin
# Acessar https://seu-dominio.com.br/admin/login
# Fazer login com o email e senha configurados no .env
# Testar: criar/editar serviço, upload de imagem, alterar configurações
```

## 15. Backup

### Configurar backup diário

```bash
# Editar crontab
crontab -e

# Adicionar a linha abaixo (roda às 03:00 todos os dias)
0 3 * * * cd /var/www/agencia-tia-sam && bash scripts/backup.sh >> /var/log/tia-sam-backup.log 2>&1
```

### Testar o backup

```bash
bash scripts/backup.sh
ls -lh backups/
```

### Restaurar

```bash
# Parar o servidor
pm2 stop tia-sam

# Restaurar banco
cp backups/20250826-030000/tiasam.db data/tiasam.db

# Restaurar uploads
cp -a backups/20250826-030000/uploads data/uploads

# Reiniciar
pm2 start tia-sam
```

## 16. Comandos úteis (PM2)

```bash
pm2 status                 # status dos processos
pm2 logs tia-sam           # logs em tempo real
pm2 logs tia-sam --lines 100  # últimas 100 linhas
pm2 restart tia-sam        # reiniciar
pm2 stop tia-sam           # parar
pm2 delete tia-sam         # remover do PM2
pm2 monit                  # monitorar CPU/memória
```

## 17. Variáveis de ambiente (resumo)

| Variável | Obrigatória | Valor esperado |
|---|---|---|
| `NODE_ENV` | Sim | `production` |
| `PORT` | Não | `4000` |
| `TRUST_PROXY` | Sim | `1` |
| `JWT_SECRET` | Sim | `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | Sim (1º boot) | Senha forte |
| `ADMIN_EMAIL` | Não | admin@seu-dominio.com.br |
| `CORS_ORIGINS` | Sim | `https://seu-dominio.com.br` |

## 18. Verificação de saúde

Após o deploy, confirmar:

```bash
# 1. Servidor Node rodando
pm2 status

# 2. API responde
curl -s https://seu-dominio.com.br/api/public/health | jq .

# 3. Site carrega
curl -s -o /dev/null -w "%{http_code}" https://seu-dominio.com.br

# 4. Login funciona
curl -s -X POST https://seu-dominio.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@...","password":"..."}' \
  -c /tmp/cookies.txt

# 5. Upload funciona
curl -s -X POST https://seu-dominio.com.br/api/admin/upload \
  -b /tmp/cookies.txt \
  -F "file=@/path/to/test.jpg"
```