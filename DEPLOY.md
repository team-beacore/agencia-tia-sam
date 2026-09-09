# Deploy — Agência Tia Sam (VPS Linux)

Guia passo a passo para colocar o projeto em produção em uma VPS Ubuntu.

## Pré-requisitos

- VPS Ubuntu Server LTS (22.04+; recomendado 24.04)
- Domínio próprio apontando para o IP da VPS (registro A)
- Acesso SSH
- Um destino de backup FORA da VPS (ver §15) — obrigatório

## Arquitetura

```
Internet
   ↓  HTTPS (443)
 Domínio
   ↓
 Nginx (client_max_body_size 8m)
   ↓  proxy reverso → 127.0.0.1:4000
 PM2 (fork, 1 instância)
   ↓
 Node.js 24 LTS (Express 5)
   ├── Frontend React (dist/)
   ├── API (/api/*)
   ├── Uploads públicos (/uploads/*)
   └── SQLite (node:sqlite, modo WAL)
         ↓
   $DATA_DIR/            ← variável de ambiente (produção: /var/www/agencia-tia-sam/data)
     ├── tiasam.db       (+ .db-wal / .db-shm)
     └── uploads/
```

O código **não** usa caminho fixo: tudo deriva de `DATA_DIR` (`server/db.js`).
Em produção, `DATA_DIR` é **obrigatório**: com `NODE_ENV=production` e `DATA_DIR`
ausente, o servidor **aborta o startup** (não existe fallback `./data` em produção).
Fora de produção, sem `DATA_DIR` os dados ficam em `./data` (relativo ao repositório).
Em produção use caminho **absoluto**, idealmente fora da pasta do código versionado pelo git.

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
# A porta 4000 NÃO deve ser aberta (o Nginx fala com o Node via 127.0.0.1).
```

## 3. Instalar Node.js (24 LTS — obrigatório)

O projeto usa `node:sqlite` **sem flag experimental**, disponível a partir do
Node 23.4+. A versão LTS recomendada (e exigida por `package.json → engines`)
é **Node.js 24 LTS**. Não instale Node 22 — ele exige `--experimental-sqlite`
e o aplicativo não subirá.

```bash
# NodeSource — Node 24 LTS
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node -v   # precisa ser >= 24
npm -v
```

## 4. Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 5. Instalar PM2 (+ rotação de logs)

```bash
sudo npm install -g pm2
pm2 --version
pm2 install pm2-logrotate    # evita que os logs ocupem o disco
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
| `NODE_ENV` | `production` |
| `JWT_SECRET` | saída de `openssl rand -hex 32` |
| `ADMIN_EMAIL` | email real do administrador |
| `ADMIN_PASSWORD` | senha forte (apenas no 1º boot — ver nota) |
| `CORS_ORIGINS` | `https://seu-dominio.com.br` |
| `DATA_DIR` | `/var/www/agencia-tia-sam/data` |
| `PORT` | `4000` |
| `TRUST_PROXY` | `1` |

**Comportamento de segurança do código (sem defaults hardcoded):**

- Produção sem `JWT_SECRET` → o processo **aborta** com erro claro.
- Produção sem `DATA_DIR` → o processo **aborta** com erro claro (não grava dados dentro do repo).
- Produção com banco vazio sem `ADMIN_PASSWORD` → o processo **aborta** com erro claro.
- Após o primeiro boot (admin criado), você pode **remover `ADMIN_PASSWORD` do
  `.env`** e reiniciar — o seed não roda de novo enquanto houver admin.
- Fora de produção, segredo ausente gera chave/senha **aleatória logada no
  console** (nunca um valor fixo).
- O sistema de login do painel usa a senha salva com bcrypt no banco; a troca
  de senha é feita em Configurações → Alterar senha.

Nunca versionar o `.env`. O arquivo já está no `.gitignore`.

## 8. Instalar dependências e buildar

```bash
# Opcional: evita o postinstall do playwright (devDep) baixar browsers na VPS
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci   # (npm install se o ci falhar)
npm run build
```

O build (`tsc -b && vite build`) gera `dist/`, servido pelo próprio Express.

## 9. Banco de dados (SQLite)

O banco e a pasta de uploads são criados automaticamente em `DATA_DIR` na
primeira execução (o diretório nem precisa existir antes, mas o usuário de
deploy precisa de permissão de escrita nele):

```bash
mkdir -p /var/www/agencia-tia-sam/data   # opcional; o app também cria
```

- Tabelas via `CREATE TABLE IF NOT EXISTS` + migrações aditivas idempotentes.
- Seed de conteúdo (`shared/seed.json`) roda **apenas por tabela vazia** —
  nunca sobrescreve dados existentes.
- **IMPORTANTE — dados persistentes:**
  - `git pull` de deploy **não** toca em `data/` nem em `DATA_DIR` (gitignored).
  - **NUNCA** execute `git clean -fdx` (nem `git reset --hard` agressivo com
    limpeza) no diretório de produção — isso apagaria arquivos não versionados,
    incluindo banco/uploads se `DATA_DIR` apontar para dentro do repositório.
  - **NUNCA** copie o `data/` de desenvolvimento/homologação para a produção
    (contém contas de teste). O primeiro boot em produção cria o admin a partir
    do `.env`.
  - Rode com **uma única instância** do Node (fork mode). SQLite + multi
    instância em cluster exige replanejar.

## 10. Iniciar com PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # execute o comando que ele imprimirá
```

O PM2 lê o `.env` via `node --env-file-if-exists=.env` (configurado no
`ecosystem.config.js`) e força `NODE_ENV=production`.

## 11. Configurar Nginx

```bash
sudo cp nginx/agencia-tia-sam.conf /etc/nginx/sites-available/agencia-tia-sam.conf
sudo nano /etc/nginx/sites-available/agencia-tia-sam.conf   # trocar seu-dominio.com.br
sudo ln -sf /etc/nginx/sites-available/agencia-tia-sam.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 12. DNS

Registros A apontando `seu-dominio.com.br` e `www.seu-dominio.com.br` para o IP da VPS.

## 13. SSL (Let's Encrypt + Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
sudo certbot renew --dry-run
```

Com HTTPS ativo, o cookie de sessão é emitido com `Secure` (o código aplica
`secure: NODE_ENV === 'production'`), então o login **só funciona via HTTPS**.

## 14. Testar

```bash
curl http://127.0.0.1:4000/api/public/health          # local
curl https://seu-dominio.com.br/api/public/health     # público
curl -I https://seu-dominio.com.br                    # frontend (200)

# Sem token, as rotas admin DEVEM responder 401:
curl -i https://seu-dominio.com.br/api/admin/services   # → HTTP/2 401

# Painel: https://seu-dominio.com.br/admin → login com ADMIN_EMAIL/ADMIN_PASSWORD
# Testar: criar serviço, upload de imagem, editar configurações.
```

## 15. Backup

### Estratégia (obrigatória): LOCAL + EXTERNO

O backup local (`backups/` na própria VPS) **não** protege contra perda do
disco/VPS. Configure também a cópia externa.

```bash
# 1) Testar o script (usa DATA_DIR do ambiente; aqui o do .env)
set -a && . ./.env && set +a
bash scripts/backup.sh
ls -lh backups/

# 2) Teste de RESTORE real, em diretório temporário isolado (não toca em dados reais)
bash scripts/test-restore.sh
```

O `backup.sh`:
- copia o SQLite de forma **WAL-safe** (`sqlite3 .backup`, ou fallback
  `wal_checkpoint(TRUNCATE)` via Node);
- roda `PRAGMA integrity_check` no arquivo gerado;
- copia `$DATA_DIR/uploads`;
- aplica retenção (`BACKUP_RETENTION_DAYS`, padrão 14);
- se `BACKUP_REMOTE` estiver definido, envia a pasta do backup via
  **rclone** (ex.: `rclone-tiasam:tia-sam-backups`) ou **rsync/ssh**
  (ex.: `backup@outra-maquina:/backups/tia-sam`). Credenciais ficam na
  configuração do rclone/SSH do servidor — **nunca** no repositório.
- se a cópia externa **falhar** (destino inacessível, rclone/rsync ausente):
  erro claro no log, **exit code 1** (o cron/log evidencia a falha) e o backup
  **local é preservado** intacto;
- se `BACKUP_REMOTE` **não** estiver definido, o backup local funciona
  normalmente (apenas um aviso no log) — mas nesse caso a segunda via externa
  ainda NÃO existe.

> **PENDENTE DE CONFIGURAÇÃO MANUAL:** o backup externo não funciona "out of
> box" — ele exige configurar rclone (`rclone config`, uma vez, interativo) ou
> a chave SSH de destino na VPS e definir `BACKUP_REMOTE` no `.env`. Até isso
> ser feito, todos os backups existem apenas no disco da própria VPS.

Exemplo de rclone para um bucket/S3/Drive (rodar uma vez, interativo):

```bash
sudo apt install -y rclone
rclone config    # criar um remote, ex.: "rclone-tiasam"
# no .env: BACKUP_REMOTE=rclone-tiasam:tia-sam-backups
```

### Agendar (cron, diário às 03:00)

```bash
crontab -e
# adicionar (com envio ao destino externo definido no .env):
0 3 * * * cd /var/www/agencia-tia-sam && set -a && . ./.env && set +a && bash scripts/backup.sh >> /var/log/tia-sam-backup.log 2>&1
```

### Restaurar (procedimento real)

```bash
pm2 stop tia-sam
set -a && . ./.env && set +a

cp backups/ANO-MES-DIA-HHMMSS/tiasam.db "$DATA_DIR/tiasam.db"
rm -f "$DATA_DIR"/tiasam.db-wal "$DATA_DIR"/tiasam.db-shm   # WAL do banco antigo não serve p/ o restaurado
cp -a backups/ANO-MES-DIA-HHMMSS/uploads "$DATA_DIR/uploads"

pm2 start tia-sam
curl http://127.0.0.1:4000/api/public/health
```

> Nota: o `.env` (com `JWT_SECRET`) **não** entra no backup por segurança
> (segredo). Guarde-o separadamente, em gerenciador de senhas/secret manager.
> Trocar o `JWT_SECRET` apenas invalida sessões de login — nada de dados.

## 16. Comandos úteis (PM2 / manutenção)

```bash
pm2 status                    # status dos processos
pm2 logs tia-sam --lines 100  # últimas linhas de log
pm2 restart tia-sam           # reiniciar (após git pull + build)
pm2 monit                     # CPU/memória
df -h                         # espaço em disco (backups/logs)
```

Atualização de versão (deploy de mudança):

```bash
cd /var/www/agencia-tia-sam
git pull
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
npm run build
pm2 restart tia-sam
# (NÃO usar git clean -fdx aqui — ver §9)
```

## 17. Variáveis de ambiente (resumo)

| Variável | Obrigatória | Valor esperado |
|---|---|---|
| `NODE_ENV` | Sim | `production` |
| `JWT_SECRET` | Sim | `openssl rand -hex 32` |
| `ADMIN_EMAIL` | Sim (1º boot) | email real |
| `ADMIN_PASSWORD` | Sim (1º boot) | senha forte; removível depois |
| `CORS_ORIGINS` | Sim | `https://seu-dominio.com.br` |
| `DATA_DIR` | Sim (produção) | caminho absoluto fora do código |
| `PORT` | Não | `4000` |
| `TRUST_PROXY` | Sim | `1` |
| `BACKUP_DIR` / `BACKUP_RETENTION_DAYS` / `BACKUP_REMOTE` | Recomendadas | ver §15 |

## 18. Verificação de saúde pós-deploy

Após o deploy, confirmar:

```bash
# 1. Servidor Node rodando
pm2 status

# 2. API responde
curl -s https://seu-dominio.com.br/api/public/health | jq .

# 3. Site carrega
curl -s -o /dev/null -w "%{http_code}" https://seu-dominio.com.br

# 4. Login funciona (e bloqueia sem token)
curl -s -X POST https://seu-dominio.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ADMIN_EMAIL","password":"ADMIN_PASSWORD"}' \
  -c /tmp/cookies.txt
curl -s -b /tmp/cookies.txt https://seu-dominio.com.br/api/auth/me

# 5. Upload funciona
curl -s -X POST https://seu-dominio.com.br/api/admin/upload \
  -b /tmp/cookies.txt -F "file=@/path/to/test.jpg"

# 6. Persistência: editar algo no painel, depois `pm2 restart tia-sam` e conferir que permanece.

# 7. Backup + restore testados nesta VPS:
#    bash scripts/test-restore.sh   (isolado)
#    bash scripts/backup.sh && ls backups/
```

## 19. Observações de segurança / histórico do Git

- O repositório já contém, **no histórico antigo de commits**, um arquivo de
  banco de desenvolvimento (`data/tiasam.db*`). Ele não está na versão atual,
  mas permanece acessível em commits antigos no GitHub. Providências:
  - Nunca reutilizar nenhuma credencial daquele banco; senha de produção deve
    ser única e forte (bcrypt cost 12).
  - Se desejado, limpar o histórico com `git filter-repo` + force push em
    procedimento planejado à parte (não feito automaticamente).
- Tokens de homologação (Vercel Blob/Turso) ficam apenas nas env vars dos
  respectivos provedores, nunca no repositório.
