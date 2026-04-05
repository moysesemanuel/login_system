# Login System

Projeto de autenticação feito para portfólio com foco em mostrar fundamentos importantes para trabalho freelancer e vagas internacionais:

- API organizada por camadas
- interface web de login e cadastro
- cadastro de usuário
- login com JWT
- rota protegida
- hash de senha com `bcryptjs`
- validação de dados com `zod`

## Stack

- Node.js
- TypeScript
- Express
- JWT
- Zod

## Como rodar

1. Instale as dependências:

```bash
yarn install
```

2. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

3. Inicie em desenvolvimento:

```bash
yarn dev
```

4. Abra no navegador:

```txt
http://localhost:3333
```

## Rotas

### `POST /auth/register`

```json
{
  "name": "Moyses Costa",
  "email": "moyses@email.com",
  "password": "Senha123"
}
```

### `POST /auth/login`

```json
{
  "email": "moyses@email.com",
  "password": "Senha123"
}
```

### `GET /auth/me`

Envie o header:

```txt
Authorization: Bearer <token>
```

## Próximos passos

- trocar o arquivo JSON por PostgreSQL
- adicionar refresh token
- criar fluxo de recuperação de senha
- migrar a interface para React ou Next.js
