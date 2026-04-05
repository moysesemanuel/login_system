# Login System

Central de autenticação para múltiplos projetos, preparada para `Neon + Vercel`.

- autenticação central para `ERP` e `Help Desk`
- persistência em PostgreSQL com `Prisma`
- sessão em cookie `HTTP-only`
- interface web de login e cadastro
- seleção da aplicação de destino
- API organizada por camadas
- validação de dados com `zod`

## Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod

## Como rodar

1. Instale as dependências:

```bash
yarn install
```

2. Gere o client do Prisma:

```bash
yarn prisma:generate
```

3. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

4. Sincronize o banco:

```bash
yarn prisma:push
```

5. Inicie em desenvolvimento:

```bash
yarn dev
```

6. Abra no navegador:

```txt
http://localhost:3333
```

## Rotas

### `POST /auth/register`

```json
{
  "name": "Moyses Costa",
  "email": "moyses@email.com",
  "password": "Senha123",
  "application": "erp"
}
```

### `POST /auth/login`

```json
{
  "email": "moyses@email.com",
  "password": "Senha123",
  "application": "help-desk"
}
```

### `GET /auth/me`

Lê a sessão pelo cookie `HTTP-only`.

### `POST /auth/logout`

Encerra a sessão atual e limpa o cookie.

## Variáveis de ambiente

- `DATABASE_URL`
- `DIRECT_URL` opcional
- `SESSION_SECRET`
- `APP_URL`
- `SALES_SYSTEM_URL`
- `HELP_DESK_URL`

## Próximos passos

- criar fluxo de recuperação de senha
- implementar SSO real entre os apps publicados
- criar autorização por permissões
- migrar a interface para Next.js quando o auth central estabilizar
