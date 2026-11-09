# Trilha de exercícios — frontend

Exercícios em cima deste próprio projeto, do mais simples ao mais difícil. Cada um ensina um ponto e
vem com **critérios de pronto** para você conferir sozinho se acertou.

## Como usar

1. **Uma branch por exercício:** `git switch -c ex01-...`. Se der errado, é só descartar.
2. **Leia antes de escrever:** cada exercício indica os arquivos de referência. Entenda o padrão que já existe e siga
   o mesmo estilo (nomes em português, signals, `@if`/`@for`, CSS com as variáveis de `styles.css`).
3. **Confira sempre** antes de considerar pronto:
   ```bash
   npx prettier --write "src/**/*.{ts,html,css}"
   npm test -- --watch=false
   npm run build
   npm start   # e olhe a tela, nos temas claro e escuro
   ```
4. **Só olhe a dica se travar por mais de 30 minutos.** Travar faz parte do aprendizado.
5. Quando terminar, mande o `git diff` para o Claude pedindo uma revisão **sem a solução pronta**.

Legenda: 🟢 base · 🟡 intermediário · 🔴 avançado · ⚫ full-stack

---

## Nível 1 — Ler e entender (🟢)

### Ex. 1 — Mapa do fluxo de dados
**Aprende:** signals, `computed` e de onde vem cada dado.
**Referência:** `chamados/lista/chamados-lista.ts`, `chamados/filtros.ts`.

**Tarefa:** sem mudar código, desenhe (no papel ou num `.md`) o caminho de um filtro: você escolhe "Situação:
Aberta" → o que acontece na URL → `filtros` → `chamadosFiltrados` → `pagina` → `chamadosDaPagina` → tela.
Depois responda:
1. Por que `pagina` usa `linkedSignal` e não `signal`?
2. O que aconteceria se a lista guardasse os filtros num `signal` em vez da URL? O que você perderia?
3. Por que os `<option>` usam `[selected]` em vez de `[value]` no `<select>`? (o comentário no HTML explica)

**Pronto quando:** você consegue explicar as três respostas em voz alta sem olhar o código.

---

### Ex. 2 — Testes que quebram de propósito
**Aprende:** o que os testes realmente protegem.
**Referência:** `chamados/filtros.spec.ts`, `shared/paginacao/paginacao.spec.ts`.

**Tarefa:** introduza um bug de cada vez e rode os testes:
- em `filtrarChamados`, troque `data >= f.de` por `data > f.de`;
- em `paginar`, remova o `Math.min(...)`;
- em `abasVisiveis`, troque `p - numeros[i - 1] > 1` por `>= 1`.

Para cada um, anote **qual teste falhou e por quê**. Se algum bug **não** fizer nenhum teste falhar, escreva o teste que faltava.

**Pronto quando:** todo bug introduzido é pego por pelo menos um teste, e você desfez os bugs.

---

## Nível 2 — Pequenas funcionalidades (🟢 → 🟡)

### Ex. 3 — Filtro por sistema 🟢
**Aprende:** estender uma estrutura existente de ponta a ponta.
**Referência:** `chamados/filtros.ts` (veja como `lotacao` foi feito), `dashboard/estatisticas.ts` (`porSistema`).

**Tarefa:**
1. Adicione `sistema` em `FiltrosChamado`, `FILTROS_VAZIOS`, `filtrosDaUrl` e `filtrarChamados`.
2. Adicione o select "Sistema" na lista, com as opções vindas dos chamados (crie `sistemasDistintos`).
3. Em `porSistema`, troque `filtro: {}` por `filtro: { sistema }`, para que as barras de "Sistema" do dashboard
   passem a ser clicáveis.

**Pronto quando:**
- [ ] `/chamados?sistema=Frotas` abre filtrado, e o F5 mantém o filtro.
- [ ] Clicar numa barra de "Sistema" no dashboard abre a lista filtrada.
- [ ] "Limpar filtros" limpa o sistema também.
- [ ] Novo teste em `filtros.spec.ts` para o filtro por sistema (ignorando maiúsculas).

**Dica:** o TypeScript vai apontar quase todos os lugares que faltam mudar. Siga os erros de compilação.

---

### Ex. 4 — Pesquisa sem travar 🟡
**Aprende:** debounce e custo de atualizar a URL a cada tecla.
**Referência:** `chamados-lista.html` (campo Pesquisar), `filtrar()` no `.ts`.

**Problema:** hoje, cada tecla na pesquisa faz um `router.navigate`.

**Tarefa:** faça a URL só ser atualizada **300 ms depois da última tecla**, mantendo o campo responsivo enquanto você digita.

**Pronto quando:**
- [ ] Digitar "balancete" rápido gera uma única atualização da URL. Confira com um `console.log` temporário no `filtrar`.
- [ ] Apagar tudo volta a lista inteira.
- [ ] Nenhum outro filtro ficou mais lento: os selects continuam imediatos.

**Dica:** um `Subject<string>` com `debounceTime(300)` e `takeUntilDestroyed()`, ou um `setTimeout` guardado num
campo e cancelado a cada tecla. Tente os dois e compare.

---

### Ex. 5 — Paginação na lista de usuários 🟢
**Aprende:** reaproveitar componente.
**Referência:** `shared/paginacao/`, uso em `chamados-lista.*`; alvo: `usuarios/lista/`.

**Tarefa:** adicione paginação de 15 na lista de usuários e uma pesquisa por nome ou e-mail.

**Pronto quando:**
- [ ] Com mais de 15 usuários aparecem as abas; com 15 ou menos, não.
- [ ] Pesquisar volta para a página 1.
- [ ] Você **não** copiou código da paginação: só importou.

---

## Nível 3 — Interação e estado (🟡)

### Ex. 6 — Ordenar a tabela clicando na coluna
**Aprende:** estado derivado composto (filtrar → ordenar → paginar) e acessibilidade de tabela.
**Referência:** `chamados-lista.*`.

**Tarefa:** clicar no cabeçalho Código, Prioridade ou Data ordena a lista; clicar de novo inverte. Guarde na URL
(`?ordem=data&dir=desc`). O padrão é data, mais recentes primeiro.

**Pronto quando:**
- [ ] A ordem é aplicada **antes** da paginação: a página 1 tem os 15 primeiros da ordem, não os 15 primeiros ordenados.
- [ ] Prioridade ordena por gravidade (Bloqueio → Trivial), não em ordem alfabética. Use a ordem de `PRIORIDADES`.
- [ ] O `<th>` ativo tem `aria-sort="ascending"` ou `"descending"`, e o cabeçalho é um `<button>` (acessível por teclado).
- [ ] Teste unitário da função de ordenação, que deve ser pura e ficar fora do componente.

**Dica:** `computed(() => paginar(ordenar(filtrarChamados(...), ordem), pagina))`. Pense em qual sinal deve
resetar a página.

---

### Ex. 7 — Lembrar o período do dashboard
**Aprende:** escolher onde guardar estado (URL, `localStorage` ou memória) e tratar falhas.
**Referência:** `dashboard/dashboard.ts` (`periodo`, `lotacao`), `services/theme.service.ts` (usa `localStorage`).

**Tarefa:** o período e a lotação escolhidos no dashboard devem continuar ao voltar para a página.

**Pronto quando:**
- [ ] Você escreveu, num comentário, **por que** escolheu URL ou `localStorage` para isso.
- [ ] Um valor inválido guardado (por exemplo `periodo=abc`) cai no padrão de 30 dias, sem quebrar.
- [ ] Com `localStorage` indisponível (modo privado ou bloqueado), a página funciona. Use `try/catch`.

---

### Ex. 8 — Teste de componente da paginação
**Aprende:** testar o DOM com `TestBed`, não só funções.
**Referência:** `chamados/detalhe/chamado-detalhe.spec.ts` (um teste de componente que já existe).

**Tarefa:** crie testes que montam `<app-paginacao>` e verificam:
- com `total = 10` não renderiza nada;
- com `total = 40` mostra 3 abas, e a aba 1 tem `aria-current="page"`;
- clicar em "›" muda o `model` `pagina` para 2;
- o botão "‹" fica desabilitado na primeira página.

**Pronto quando:** os 4 testes passam e **falham** se você quebrar o componente, por exemplo tirando o `[disabled]`.

---

## Nível 4 — Qualidade e experiência (🔴)

### Ex. 9 — Gráfico navegável pelo teclado
**Aprende:** acessibilidade de verdade em visualização de dados.
**Referência:** `dashboard/dashboard.html` (série temporal), sinal `pontoAtivo`.

**Problema:** hoje o destaque das colunas só funciona com o mouse.

**Tarefa:** o gráfico recebe foco com Tab. As setas ← e → movem o destaque entre as colunas e Home/End vão ao
início e ao fim. O texto do destaque, que já tem `aria-live`, é lido pelo leitor de tela.

**Pronto quando:**
- [ ] Dá para percorrer todos os pontos só com o teclado, sem 90 paradas de Tab: o gráfico é **um** único elemento focável.
- [ ] A coluna ativa tem destaque visível também quando está com foco.
- [ ] Ao sair do gráfico (blur), volta a mostrar o pico.

---

### Ex. 10 — "Há quanto tempo em análise"
**Aprende:** cálculos com datas, fuso horário e formatação relativa.
**Referência:** `chamados-ls/chamados-ls-lista.*`, `dashboard/estatisticas.ts` (`formatarData`).

**Tarefa:** na tabela de Chamados LS, adicione a coluna "Tempo", com os dias desde a abertura (em análise) ou o tempo
total até a conclusão. Destaque em vermelho os que estão em análise há mais de 15 dias.

**Pronto quando:**
- [ ] Função pura `diasEntre(inicio, fim)` testada, incluindo a virada de mês e de ano.
- [ ] Um chamado aberto hoje mostra "hoje", não "0 dias".
- [ ] O destaque usa `--cor-perigo-texto` (não uma cor fixa) e funciona no tema escuro.
- [ ] A coluna pode ser ordenada, se você fez o Ex. 6.

**Armadilha:** `new Date('2026-09-20')` é meia-noite **UTC**. Leia o comentário de `data()` em `dashboard.ts`.

---

### Ex. 11 — Estados de carregamento e erro
**Aprende:** a tela quando a rede falha.
**Referência:** qualquer lista; o indicador do LS no dashboard mostra "—" quando a busca falha.

**Tarefa:** desligue o backend e navegue pelo sistema. Anote cada tela que fica em branco, trava no spinner ou
mostra informação errada. Corrija para que cada uma mostre uma mensagem clara e um botão **"Tentar de novo"**.

**Pronto quando:**
- [ ] Nenhuma tela fica em branco sem explicação com o backend desligado.
- [ ] "Tentar de novo" funciona depois de religar o backend, sem F5.
- [ ] Você criou **um** componente de erro reaproveitado, não um HTML copiado em cada tela.

---

## Nível 5 — Full-stack (⚫)

### Ex. 12 — Editar a observação de um LS em análise
**Aprende:** a funcionalidade inteira: banco, API, validação, tela e testes dos dois lados.
**Referência:** `../chamados/.../ChamadoLsService.java`, `ChamadoLsController.java`,
`ChamadoLsServiceTest.java`; `chamados/detalhe/secao-ls.*`.

**Tarefa:** permitir editar a observação de um registro do LS **enquanto ele está em análise**.
1. Backend: `PATCH /chamados-ls/{id}/observacao` com `{ observacao }`, `@Size(max = 500)`, e 422 se o registro não estiver `EM_ANALISE`.
2. Testes no `ChamadoLsServiceTest`: edita quando em análise, recusa quando concluído, grava sem espaços nas pontas.
3. Front: botão "Editar" na seção LS do detalhe, que troca o texto por um `textarea` com Salvar e Cancelar.

**Pronto quando:**
- [ ] `./mvnw test` e `npm test` passam, com os testes novos.
- [ ] Editar um registro concluído pela API (curl ou Postman) retorna 422 com mensagem em português.
- [ ] Cancelar a edição restaura o texto original.
- [ ] Um erro do servidor aparece no toast e não perde o que foi digitado.
- [ ] Você atualizou o `ALTERACOES.md` do backend com o que mudou, como e por quê.

**Pergunta para responder no PR:** por que a regra "só edita em análise" precisa estar no **backend**, se o
front já esconde o botão?

---

## Depois da trilha

Você vai ter praticado os pilares: estado derivado com signals, URL como fonte da verdade, lógica pura testável,
componentes reaproveitáveis, acessibilidade, tratamento de falhas e uma funcionalidade inteira do banco à tela.
O próximo passo natural é **performance**: medir com o Angular DevTools, usar `track` bem e fazer a paginação no
servidor quando a lista passar de alguns milhares de chamados.
