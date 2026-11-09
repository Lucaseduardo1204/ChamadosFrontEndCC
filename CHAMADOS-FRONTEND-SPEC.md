# CHAMADOS FRONTEND — SPEC PARA DESENVOLVIMENTO

## Visão geral

Frontend Angular para um sistema de controle de chamados de suporte técnico.
Consome uma API REST Spring Boot rodando em `http://localhost:8080`.
Autenticação via JWT. Apenas analistas operam o sistema; o solicitante é só um texto (nome) informado no chamado.

---

## Stack e ambiente

- Angular 22 (standalone components, signals, new control flow `@if`/`@for`)
- TypeScript
- CSS puro (sem Tailwind, sem SCSS)
- Node 24 LTS / npm 11
- Backend: Spring Boot 3.4.1 + PostgreSQL 16 (Docker)
- Autenticação: JWT via `Authorization: Bearer <token>`

---

## Autenticação — Fluxo JWT

### Login
- `POST http://localhost:8080/login`
- Body: `{ "email": "string", "senha": "string" }`
- Response (200): `{ "token": "string" }`
- O token deve ser armazenado no `localStorage` com a chave `token`.
- Em caso de erro (401): exibir mensagem "Credenciais inválidas".

### Requisições autenticadas
- Todas as requisições (exceto login) devem enviar o header:
  `Authorization: Bearer <token do localStorage>`
- Implementar um **HTTP Interceptor** que anexa o token automaticamente em toda requisição.
- Se o token expirar (resposta 401/403), redirecionar para a tela de login e limpar o localStorage.

### Guardas de rota
- Rotas protegidas só acessíveis se houver token no localStorage.
- Sem token → redireciona para `/login`.
- Após login bem-sucedido → redireciona para `/chamados`.

---

## Endpoints da API

### Autenticação
| Método | Rota | Body | Resposta | Auth |
|--------|------|------|----------|------|
| POST | `/login` | `{ email, senha }` | `{ token }` | Não |

### Usuários
| Método | Rota | Body | Resposta | Auth |
|--------|------|------|----------|------|
| GET | `/usuarios` | — | `Usuario[]` | Sim |
| POST | `/usuarios` | `{ nome, email, tipoUsuario, fundacao, senha }` | `Usuario` | Sim |

### Chamados
| Método | Rota | Body | Resposta | Auth | Restrição |
|--------|------|------|----------|------|-----------|
| GET | `/chamados` | — | `ChamadoResponse[]` | Sim | — |
| GET | `/chamados/{id}` | — | `ChamadoResponse` | Sim | — |
| POST | `/chamados` | `ChamadoRequest` | `ChamadoResponse` | Sim | — |
| PATCH | `/chamados/{id}/responsavel` | `{ responsavelId }` | `ChamadoResponse` | Sim | ANALISTA |
| PATCH | `/chamados/{id}/situacao` | `{ situacao }` | `ChamadoResponse` | Sim | ANALISTA |
| DELETE | `/chamados/{id}` | — | 204 No Content | Sim | ANALISTA |
| GET | `/chamados/exportar` | — | arquivo .xlsx | Sim | — |
| POST | `/chamados/exportar` | `{ ids: number[] }` (não vazio) | arquivo .xlsx só com os chamados informados | Sim | — |

### Interações
| Método | Rota | Body | Resposta | Auth |
|--------|------|------|----------|------|
| POST | `/chamados/{id}/interacoes` | `{ texto }` (autor vem do token) | `InteracaoResponse` | Sim |
| GET | `/chamados/{id}/interacoes` | — | `InteracaoResponse[]` | Sim |

---

## Modelos de dados (interfaces TypeScript)

```typescript
interface LoginRequest {
  email: string;
  senha: string;
}

interface LoginResponse {
  token: string;
}

interface UsuarioResumo {
  id: number;
  nome: string;
  fundacao: 'FAEC' | 'FAMEP' | 'PMA';
}

interface ChamadoRequest {
  codigoChamado: string;
  lotacao: string; // texto livre, até 10 caracteres
  prioridade: 'BLOQUEIO' | 'CRITICO' | 'NORMAL' | 'BAIXA' | 'TRIVIAL';
  tipo: 'SISTEMA' | 'TECNICA';
  sistema: string;
  resumo: string;
  descricao: string;
  solicitante: string; // texto livre, até 100 caracteres
}

interface ChamadoResponse {
  id: number;
  codigoChamado: string;
  lotacao: string;
  dataHoraCriacao: string;
  situacao: 'ABERTA' | 'FECHADA' | 'RESOLVIDA';
  prioridade: 'BLOQUEIO' | 'CRITICO' | 'NORMAL' | 'BAIXA' | 'TRIVIAL';
  tipo: 'SISTEMA' | 'TECNICA';
  sistema: string;
  resumo: string;
  descricao: string;
  solicitante: string;
  responsavel: UsuarioResumo | null;
}

interface InteracaoRequest {
  texto: string;
}

interface InteracaoResponse {
  id: number;
  autor: UsuarioResumo;
  texto: string;
  dataHora: string;
}

interface AlterarResponsavel {
  responsavelId: number;
}

interface AlterarSituacao {
  situacao: 'ABERTA' | 'FECHADA' | 'RESOLVIDA';
}
```

---

## Estrutura de telas e rotas

### `/login` — Tela de login
- Campos: email (input text), senha (input password)
- Botão "Entrar"
- Ao logar com sucesso, guarda o token e redireciona para `/chamados`
- Erro: exibe mensagem "Credenciais inválidas"
- Layout centralizado, simples

### `/chamados` — Lista de chamados (tela principal / dashboard)
- Tabela com os chamados vindos de `GET /chamados`
- Colunas: Código, Lotação, Situação, Prioridade, Tipo, Sistema, Resumo, Solicitante, Responsável, Data
- Cada linha clicável → navega para `/chamados/{id}`
- Indicadores visuais de situação:
  - ABERTA = verde
  - RESOLVIDA = azul
  - FECHADA = cinza
- Indicadores visuais de prioridade:
  - BLOQUEIO/CRITICO = vermelho
  - NORMAL = amarelo
  - BAIXA/TRIVIAL = cinza
- Barra de pesquisa (filtro client-side por código, resumo ou solicitante)
- Botão "Novo Chamado" → abre modal ou navega para `/chamados/novo`
- Botão "Exportar Excel" → chama `GET /chamados/exportar` e faz download do arquivo
- Checkbox por linha (e no cabeçalho, que marca todos os resultados do filtro, em todas as páginas): com chamados marcados o botão vira "Exportar selecionados (N)" e chama `POST /chamados/exportar` com os ids
- Lista filtrada e nada marcado: o botão vira "Exportar filtrados (N)" e exporta todos os resultados do filtro (não só a página atual), também via `POST /chamados/exportar`
- Filtros de situação, prioridade, tipo, lotação e responsável aceitam vários valores (somam dentro do filtro e se combinam entre filtros)
- Botão "Sair" (logout) → limpa o localStorage e redireciona para `/login`

### `/chamados/novo` — Criar chamado
- Formulário com os campos do `ChamadoRequest`:
  - Código do chamado (texto livre)
  - Lotação (texto livre, obrigatório, até 10 caracteres)
  - Prioridade (select: BLOQUEIO, CRITICO, NORMAL, BAIXA, TRIVIAL)
  - Tipo (select: SISTEMA, TECNICA)
  - Sistema (texto livre)
  - Resumo (texto)
  - Descrição (textarea)
  - Solicitante (texto livre, obrigatório, até 100 caracteres — não é um usuário cadastrado)
- Validação no front (campos obrigatórios)
- Ao salvar → `POST /chamados` → redireciona para a lista
- Botão "Cancelar" → volta para a lista

### `/chamados/{id}` — Detalhe do chamado
- Exibe todos os dados do chamado (código, lotação, situação, prioridade, tipo, sistema, resumo, descrição, solicitante, responsável, data)
- Seção **"Atribuir Responsável"** (se não tem responsável ou para trocar):
  - Select com analistas (filtrar `GET /usuarios` por tipoUsuario = ANALISTA)
  - Botão "Atribuir" → `PATCH /chamados/{id}/responsavel`
- Seção **"Alterar Situação"**:
  - Select com as situações permitidas
  - Botão "Alterar" → `PATCH /chamados/{id}/situacao`
  - Se o chamado está FECHADA, desabilitar (estado terminal)
- Seção **"Interações"** (histórico):
  - Lista de interações de `GET /chamados/{id}/interacoes`, ordenadas por data
  - Cada interação mostra: autor, texto, data/hora
  - Campo de texto + botão "Comentar" → `POST /chamados/{id}/interacoes`
- Botão **"Inativar Chamado"** → confirmação → `DELETE /chamados/{id}` → volta para a lista
- Botão "Voltar" → volta para a lista

---

## Regras de negócio que o front deve respeitar

1. **Chamado nasce ABERTA** — a situação não é enviada na criação (o backend crava).
2. **Chamado FECHADA é terminal** — não permite alterar situação se já está FECHADA (desabilitar o controle).
3. **Responsável deve ser ANALISTA** — na atribuição, só listar usuários do tipo ANALISTA.
4. **Interação: autor vem do token** — o front NÃO envia autorId no body, só o texto. O backend pega do token.
5. **Soft delete** — o botão "Inativar" chama DELETE, que marca como inativo. O chamado some da listagem mas permanece no banco.
6. **Exportar Excel** — o GET retorna bytes de um .xlsx. O front deve fazer download do arquivo (criar blob + link temporário).

---

## Regras de UI/UX

- Design limpo e profissional, cores neutras com acentos para status
- Layout responsivo (desktop-first, funcional em tablet)
- Sidebar com menu de navegação (Dashboard/Chamados, Sair)
- Header com logo ou nome do sistema
- Feedbacks visuais: loading spinner ao buscar dados, mensagens de sucesso/erro em toast ou alert
- Confirmação antes de inativar chamado
- Formulários com validação visual (campos obrigatórios em vermelho se vazios ao submeter)

---

## Estrutura sugerida de pastas

```
src/app/
├── guards/
│   └── auth.guard.ts
├── interceptors/
│   └── auth.interceptor.ts
├── models/
│   ├── chamado.model.ts
│   ├── usuario.model.ts
│   └── interacao.model.ts
├── services/
│   ├── auth.service.ts
│   ├── chamado.service.ts
│   └── usuario.service.ts
├── login/
│   ├── login.ts
│   ├── login.html
│   └── login.css
├── chamados/
│   ├── lista/
│   │   ├── chamados-lista.ts
│   │   ├── chamados-lista.html
│   │   └── chamados-lista.css
│   ├── detalhe/
│   │   ├── chamado-detalhe.ts
│   │   ├── chamado-detalhe.html
│   │   └── chamado-detalhe.css
│   └── novo/
│       ├── chamado-novo.ts
│       ├── chamado-novo.html
│       └── chamado-novo.css
├── app.ts
├── app.html
├── app.css
├── app.config.ts
└── app.routes.ts
```

---

## Configurações necessárias no `app.config.ts`

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

---

## CORS

O backend já está configurado para aceitar requisições de `http://localhost:4200` com os métodos GET, POST, PATCH e DELETE.

---

## Notas para o agente de IA

- Usar Angular 22 com standalone components (sem NgModules).
- Usar o novo control flow (`@if`, `@for`, `@switch`) em vez de `*ngIf`, `*ngFor`.
- Usar signals onde fizer sentido.
- CSS puro, sem frameworks de estilo.
- Não usar SSR.
- O backend já roda em localhost:8080 — não precisa criar mock, consumir a API real.
- O token JWT expira em 2 horas.
- Todas as respostas de erro da API seguem o formato: `{ "erro": "mensagem" }`.
