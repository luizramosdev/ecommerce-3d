# Ecommerce 3D

E-commerce de produtos impressos em 3D.

## Tecnologias

- Node.js 22 + Express
- SQLite (better-sqlite3)
- HTML/CSS/JS (frontend)
- Docker

---

## Pré-requisitos (Windows)

### Opção 1 — Com Docker (recomendado)

Instale o **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- Execute o instalador e reinicie o computador
- Abra o Docker Desktop e aguarde ele iniciar (ícone na bandeja fica verde)

**(Opcional)** Para usar os comandos `make`, instale o Make:
- Abra o **PowerShell como Administrador**
- Instale o Chocolatey (gerenciador de pacotes): https://chocolatey.org/install
- Execute: `choco install make`

### Opção 2 — Sem Docker

Instale o Node.js e as ferramentas de compilação:

1. Baixe o Node.js 22 LTS em https://nodejs.org/
2. Durante a instalação, **marque a opção "Automatically install the necessary tools"** (isso instala o Python e o Visual Studio Build Tools, necessários para compilar o `better-sqlite3`)
3. Após a instalação, reinicie o computador

Para verificar se tudo foi instalado, abra o **Prompt de Comando** e execute:

```
node -v
npm -v
```

---

## Como iniciar

### Com Docker

Abra o **Prompt de Comando** na pasta do projeto.

**Usando Make:**

```
make up       # iniciar
make down     # parar
make logs     # ver logs
```

**Usando Docker Compose diretamente:**

```
docker compose up -d --build       # iniciar
docker compose down                # parar
docker compose logs -f app         # ver logs
```

Acesse: http://localhost:3000

### Sem Docker

Abra o **Prompt de Comando** na pasta do projeto e execute:

```
npm install
npm run dev
```

Acesse: http://localhost:3000

> O banco de dados SQLite é criado automaticamente na pasta `backend/data/` na primeira execução, já com produtos e um usuário admin de exemplo.

---

## Usuário admin padrão

- Email: `admin@3dstore.com`
- Senha: `admin123`
