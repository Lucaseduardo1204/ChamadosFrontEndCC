# Chamados — Frontend

Frontend Angular do sistema de controle de chamados de suporte técnico. Consome a API REST Spring Boot em `http://localhost:8080`.

## Pré-requisitos

- Node 24 LTS e npm 11 (confira com `node -v` e `npm -v`)
- Backend (Spring Boot + PostgreSQL) rodando em `http://localhost:8080`
- Um usuário do tipo **ANALISTA** cadastrado no banco, para fazer login

## Passo a passo para rodar

1. **Suba o backend** em `http://localhost:8080`. O front não usa dados falsos: sem a API, o login falha.

2. **Instale as dependências** (só na primeira vez ou quando o `package.json` mudar):

   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**

   ```bash
   npm start
   ```

4. **Abra no navegador** `http://localhost:4200`.
   Use `localhost` (e não `127.0.0.1`): o CORS do backend só aceita requisições de `http://localhost:4200`.

5. **Faça login** com o e-mail e a senha de um usuário ANALISTA. Após entrar, você é levado para a lista de chamados.

Para parar o servidor, pressione `Ctrl+C` no terminal. Enquanto ele roda, a página recarrega sozinha ao salvar um arquivo.

## Problemas comuns

| Sintoma | Causa provável |
|---------|----------------|
| "Credenciais inválidas" no login | E-mail ou senha não conferem com o banco |
| Erro genérico ao entrar ou lista sem dados | Backend não está respondendo em `localhost:8080` |
| Volta para a tela de login sozinho | O token JWT expirou (dura 2 horas); entre de novo |
| Porta 4200 ocupada | Rode `npx ng serve --port 4300`, mas libere essa porta no CORS do backend, senão as requisições serão bloqueadas |

## Outros comandos

| Comando | O que faz |
|---------|-----------|
| `npm run build` | Gera a build de produção em `dist/chamados-frontend` |
| `npm test -- --watch=false` | Roda todos os testes unitários (Vitest) |
| `npx ng test --watch=false --include <arquivo.spec.ts>` | Roda um único arquivo de teste |
| `npx prettier --write "src/**/*.{ts,html,css}"` | Formata o código |

A especificação completa do sistema está em [`CHAMADOS-FRONTEND-SPEC.md`](CHAMADOS-FRONTEND-SPEC.md).
