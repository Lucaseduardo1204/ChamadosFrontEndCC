# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Angular 22 frontend for a support-ticket ("chamados") system. `CHAMADOS-FRONTEND-SPEC.md` (in Portuguese) is the authoritative spec for endpoints, models, screens, and business rules — check it before changing behavior. Domain names stay in Portuguese (`chamado`, `solicitante`, `responsavel`, `situacao`, `interacao`, …) to match the API. The backend (Spring Boot) must be running at `http://localhost:8080`; there are no mocks.

## Commands

- `npm start` — dev server at `http://localhost:4200` (the only origin the backend's CORS allows)
- `npm run build` — production build to `dist/chamados-frontend` (enforces style budgets: 4 kB warning / 8 kB error per component stylesheet)
- `npm test -- --watch=false` — run all unit tests (Vitest via `@angular/build:unit-test`, jsdom, globals enabled)
- `npx ng test --watch=false --include src/app/interceptors/auth.interceptor.spec.ts` — run one spec file; `--filter <regex>` filters by test name
- `npx prettier --write "src/**/*.{ts,html,css}"` — format (config in `.prettierrc`; no linter is configured)

## Stack constraints (from the spec)

- Standalone components only (no NgModules), signals for component state, new control flow (`@if`/`@for`/`@switch`) — never `*ngIf`/`*ngFor`.
- Plain CSS only — no Tailwind, SCSS, or UI frameworks. No SSR.
- File naming without `.component` suffix (`login/login.ts`, `chamados/lista/chamados-lista.ts`).
- The app is zoneless (Angular default): view updates depend on signals, so store async results in signals rather than plain fields.

## Deploy

Render static site via `render.yaml` (SPA rewrite + security headers, Node version in `.node-version`). Full steps in `../chamados/DEPLOY.md`.

## Architecture

- **Auth**: `AuthService` stores the JWT in `localStorage` under `token`. The functional `authInterceptor` adds `Authorization: Bearer <token>` to every request except `POST /login`, and on 401/403 (except from login, where 401 means "Credenciais inválidas") calls `logout()`, which clears the token and routes to `/login`. `authGuard` protects everything under the `Shell` layout route.
- **Routing** (`app.routes.ts`): `/login` is standalone; `/chamados`, `/chamados/novo`, `/chamados/:id`, `/usuarios`, `/usuarios/novo`, `/usuarios/:id` are children of `layout/shell` (header + sidebar). `novo` must stay before `:id`. `UsuarioForm` serves both create and edit (edit mode = `id` input present). `withComponentInputBinding()` is on, so `:id` arrives as the `id` input of `ChamadoDetalhe`.
- **Services** (`services/`) are thin `HttpClient` wrappers per resource; `API_URL` (from `src/environments/`: `environment.development.ts` → `localhost:8080` for `npm start`, `environment.ts` → the Render API URL for production builds), `mensagemErro()` and `errosDeCampo()` live in `services/api.ts`. The backend returns errors in three shapes: `{ "erro": "..." }` (most), `{ "Erro": "..." }` (unparseable JSON) and, for `@Valid` failures, 400 with `{ "<campo>": "<mensagem>" }`; `mensagemErro()` handles all three, and forms can use `errosDeCampo()` to mark fields (see `ChamadoNovo.aplicarErrosDoServidor`). User feedback goes through `ToastService`, rendered by `layout/toasts` at the app root.
- **Models** (`models/`) define enum unions from `as const` arrays (`SITUACOES`, `PRIORIDADES`, `TIPOS`, `FUNDACOES`) plus display-label maps (`SITUACAO_LABEL`, …) used to populate selects and badges.
- **Styling**: shared styles (design tokens as CSS variables, `.btn`, `.card`, `.campo`, tables, `.spinner`, badge classes) live in `src/styles.css`; component CSS holds only layout specifics. Never hardcode colors: light and dark themes redefine the same tokens (dark applies via `data-tema="escuro"` on `<html>`, set by `ThemeService`/the header toggle, or via `prefers-color-scheme` when no choice is saved; an inline script in `index.html` applies the saved choice before boot). `--cor-primaria`/`--cor-perigo` are fill colors — use `--cor-destaque`/`--cor-perigo-texto` for text. Badges use `situacao-<VALOR>` / `prioridade-<VALOR>` classes, e.g. `class="badge" [class]="'situacao-' + c.situacao"`.
- Locale is `pt-BR` (registered in `app.config.ts`); dates render with `date: 'dd/MM/yyyy HH:mm'`.

## Business rules that are easy to get wrong

- Creating a chamado never sends `situacao` (backend sets `ABERTA`).
- Text length limits (`LIMITES_CHAMADO`, `LIMITE_INTERACAO` in `models/`) mirror the backend's `@Size` and the DB column sizes in `../chamados/schema.sql`; change all three together.
- Only `ANALISTA` users can log in (the backend rejects other profiles at `/login` with 422 and requires the role on every route); `/login` answers 429 after repeated wrong passwords. Passwords are 8–72 chars (`LIMITES_USUARIO`).
- Users are never deleted, only deactivated (`PATCH /usuarios/{id}/ativo`); inactive users can't log in and are excluded from the responsible-analyst select. User mutations use PATCH (backend CORS doesn't allow PUT); `GET /usuarios/me` returns the logged-in user. Changing your own e-mail invalidates the token (JWT subject = e-mail), so the form logs out.
- Form field errors (server `@Valid` maps, local validators) go through `shared/form-erros.ts` (`aplicarErrosDoServidor`, `mensagemDoCampo`).
- `solicitante` is free text (max 100 chars) in both request and response — not a user reference. `lotacao` is also free text (max 10 chars, `VARCHAR(10)`), not the `Fundacao` enum. `GET /usuarios` is only used for the responsible-analyst select.
- `FECHADA` is terminal: the situation control is disabled when a chamado is `FECHADA`.
- The responsible-user select lists only users with `tipoUsuario === 'ANALISTA'` (filtered from `GET /usuarios`).
- `POST /chamados/{id}/interacoes` sends only `{ texto }` — the author comes from the token.
- `DELETE /chamados/{id}` is a soft delete ("Inativar"), gated by an inline confirmation.
- **Chamados LS**: LS is the company intranet; an analyst opens a ticket there tied to an existing chamado and records it here (`chamados_ls` table; `GET /chamados-ls`, `GET|POST /chamados/{id}/ls`, `PATCH /chamados-ls/{id}/situacao`). `EM_ANALISE` → `CONCLUIDO`/`CANCELADO` only (terminal); at most one `EM_ANALISE` per chamado; `numeroLs` unique (max 20); a `FECHADA` chamado can't be sent. The `/chamados-ls` page defaults to `EM_ANALISE` (no query param); LS records are created either from the chamado detail (`SecaoLs`) or from `/chamados-ls/novo` (picks the chamado by code; `motivoInelegivel` mirrors the backend rules). New DB tables need `../chamados/migracoes/*.sql` applied manually (ddl-auto=validate).
- Lists (`/chamados`, `/chamados-ls`) paginate client-side in 15-item tabs via `shared/paginacao`; filters live in query params, and the page resets to 1 when they change (`linkedSignal`).
- `GET /chamados/exportar` (all) and `POST /chamados/exportar` with `{ ids }` (the rows checked in the list or, with nothing checked but filters active, all filtered rows; selection is a `Set` of ids that survives paging/filter changes, header checkbox = all filtered rows across every page) are fetched as a blob and downloaded via a temporary object URL + anchor.
- Status colors: ABERTA green, RESOLVIDA blue, FECHADA gray. Priority: BLOQUEIO/CRITICO red, NORMAL yellow, BAIXA/TRIVIAL gray.
