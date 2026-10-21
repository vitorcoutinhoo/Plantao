# Plantão

Sistema de gestão de plantões: escalas, colaboradores, relatórios, valores/feriados e comunicação por e-mail.

- **Backend:** Go 1.25 (Gin + Uber Fx), PostgreSQL 16, JWT com chaves RSA
- **Frontend:** React 19 + TypeScript + Vite + Tailwind ([frontend/](frontend/))

## Pré-requisitos

- [Go 1.25+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/) e npm
- [Docker](https://www.docker.com/) e Docker Compose (opcional, mas recomendado para o banco)
- OpenSSL (para gerar as chaves JWT)

## 1. Gerar as chaves JWT

A autenticação usa um par de chaves RSA. Elas não são versionadas (`*.pem` está no `.gitignore`), então cada ambiente precisa gerar as suas:

```bash
mkdir -p internal/infra/security/keys
openssl genrsa -out internal/infra/security/keys/private.pem 2048
openssl rsa -in internal/infra/security/keys/private.pem -pubout -out internal/infra/security/keys/public.pem
```

> O `Dockerfile` copia exatamente a pasta `internal/infra/security/keys`, então mantenha as chaves nesse caminho.

## 2. Configurar o `.env`

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
SERVER_HOST=localhost
SERVER_PORT=8080
PUBLIC_URL=http://localhost:8080
FRONTEND_URL=http://localhost:5173/plantao

# Banco de dados
DB_URL=postgres://postgres:password@localhost:5432/plantao?sslmode=disable

# JWT
JWT_PRIVATE_KEY_PATH=internal/infra/security/keys/private.pem
JWT_PUBLIC_KEY_PATH=internal/infra/security/keys/public.pem
EXPIRATION_TIME_MINUTES=60

# Uploads (fotos/arquivos dos colaboradores)
FILE_PATH=uploads

# Sincronização de feriados (API Invertexto)
FERIADOS_TOKEN_API=seu_token_aqui
ESTADO=SP
CIDADE=
```

| Variável | Descrição |
| --- | --- |
| `SERVER_HOST` / `SERVER_PORT` | Endereço em que a API escuta |
| `PUBLIC_URL` | URL pública da API (usada em links gerados, ex.: uploads) |
| `FRONTEND_URL` | URL do frontend (usada em links de e-mail, ex.: convites) |
| `DB_URL` | String de conexão do PostgreSQL |
| `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` | Caminho das chaves geradas no passo 1 |
| `EXPIRATION_TIME_MINUTES` | Validade do token em minutos (**obrigatória** — a API não sobe sem ela) |
| `FILE_PATH` | Pasta onde os uploads são salvos |
| `FERIADOS_TOKEN_API` | Token da API [Invertexto](https://api.invertexto.com/) para buscar feriados |
| `ESTADO` / `CIDADE` | UF e cidade usadas para feriados estaduais/municipais |

A configuração de SMTP **não** fica no `.env`: ela é cadastrada pela própria aplicação (ver [docs/config-smtp.md](docs/config-smtp.md)).

## 3. Banco de dados

Os scripts SQL de criação do schema ficam na pasta `seed/` (não versionada). Peça os arquivos `.sql` à equipe e coloque-os em `seed/` na raiz do projeto. Ao subir o Postgres pelo Docker pela primeira vez, eles são executados automaticamente.

```bash
docker compose up -d postgres
```

> Os scripts de `seed/` só rodam quando o volume está vazio. Para recriar o banco do zero: `docker compose down -v` e suba de novo.

## 4. Rodar o backend

### Opção A — Localmente (desenvolvimento)

Com o Postgres rodando:

```bash
go mod download
go run ./cmd/api
```

A API fica disponível em `http://localhost:8080/api/v1`.

### Opção B — Tudo via Docker

Sobe a API e o banco juntos (o `docker-compose.yaml` já sobrescreve `SERVER_HOST`, `PUBLIC_URL` e `DB_URL` para funcionar dentro da rede do Docker):

```bash
docker compose up -d --build
```

Logs: `docker compose logs -f app`

## 5. Rodar o frontend

```bash
cd frontend
npm install
```

Depois, rode o Vite apontando para a API:

```bash
# bash / Git Bash
VITE_API_URL=http://localhost:8080/api/v1/ npm run dev
```

```powershell
# PowerShell
$env:VITE_API_URL="http://localhost:8080/api/v1/"; npm run dev
```

Acesse **http://localhost:5173/plantao/** (o app usa `base: '/plantao/'`).

> O CORS da API só libera `http://localhost:5173` e `http://127.0.0.1:5173`. Se mudar a porta do Vite, ajuste em [internal/api/http/router.go](internal/api/http/router.go).

### Build de produção

```bash
cd frontend
npm run build   # gera frontend/dist
```

Sem `VITE_API_URL`, o frontend chama `/api/v1/` no mesmo domínio — então em produção ele deve ser servido atrás de um proxy reverso que encaminhe `/api` para o backend.

## Testes

```bash
go test ./...
```

Os testes de repositório (`internal/infra/persistence/postgres`) precisam de um banco de teste e são pulados se `TEST_DATABASE_URL` não estiver definida:

```bash
TEST_DATABASE_URL=postgres://postgres:password@localhost:5432/plantao_test?sslmode=disable go test ./...
```

Lint do frontend:

```bash
cd frontend && npm run lint
```

## Documentação da API

A documentação dos endpoints está em [docs/](docs/):

- [Endpoints](docs/api-endpoints.md) · [Autenticação](docs/auth.md) · [Usuários](docs/usuarios.md) · [Colaboradores](docs/colaboradores.md)
- [Plantões](docs/plantoes.md) · [Feriados](docs/feriados.md) · [Valores](docs/config-valores.md)
- [Comunicação](docs/comunicacao.md) · [SMTP](docs/config-smtp.md)

## Estrutura

```
cmd/api/            # ponto de entrada (main.go)
internal/
  api/              # controllers, DTOs, rotas, middlewares
  domain/           # regras de negócio (plantão, colaborador, usuário, ...)
  infra/            # config, Postgres, JWT, SMTP, storage, cliente de feriados
  worker/           # jobs em background (status/lembretes de plantão, sync de feriados)
  fx/               # módulos de injeção de dependência
frontend/           # aplicação React
docs/               # documentação da API
```
