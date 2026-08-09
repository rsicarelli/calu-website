# CLAUDE.md — norte do projeto

> Leia isto primeiro. Registra o que estamos construindo e as decisões já tomadas, para não
> re-litigá-las. Este repositório está em estágio de **casca**: a maior parte ainda é decisão
> em aberto, e é importante não confundir "ainda não existe" com "foi decidido que não terá".

## O que estamos construindo

**Site institucional da Calu Pilates e Fisioterapia** — estúdio de Pilates e clínica de
fisioterapia na **Vila Clementino, São Paulo**. Site estático, **em português apenas**, com
público majoritariamente **mobile**.

## Quem

- **Cliente:** Calu Pilates e Fisioterapia.
- **Dev/mantenedor:** Rodrigo Sicarelli. Repositório privado, sem contribuidores externos.
- **Quem vai editar o conteúdo:** as pessoas da clínica — **não técnicas**. Isso é a restrição
  mais importante deste projeto e está detalhada abaixo.

## Status

✅ **Fase 0 do design system implementada.** O handoff de design (`design_handoff_calu/`) chegou
e foi traduzido em tokens: `src/styles/global.css` tem a paleta, a escala tipográfica, o espaço,
a forma e os dois temas (claro/escuro) do handoff, sob os namespaces do Tailwind v4. Os gates
locais ganharam uma checagem própria de estilos (`check:styles`) e uma suíte de testes (Vitest)
que valida contraste e invariantes dos tokens direto no CSS.

**Ainda não existe** — e a ausência é temporária, não uma decisão contra:
CMS, hospedagem/deploy, CI, SEO, analytics, formulários, favicon/logo, e qualquer conteúdo real
da clínica. O `index.astro` continua um placeholder com o nome e nada mais — a Fase 0 trouxe o
sistema de tokens, não páginas. O próximo passo é a **Fase 1 — Fundação**: o chrome estrutural
(`Header`, `Footer`, `MobileNav`, `WhatsAppFab`) e o SEO técnico que não depende de conteúdo real
— nada disso está implementado ainda. A página `/lab` foi reordenada para depois dela (agora
Fase 2).

## Restrições firmes

1. **As editoras não são técnicas.** Qualquer fluxo de edição que exija terminal, markdown cru
   sem preview, ou editar arquivo de configuração está **descartado**. A escolha do CMS será
   feita por esse critério antes de qualquer outro.
2. **Português apenas — permanentemente.** Sem i18n, sem `/pt-br/`, sem hreflang, sem locale
   detection. Não reintroduzir por analogia com outros projetos.
3. **Conteúdo em formato aberto no Git**, sem vendor lock. O repositório é a fonte da verdade.
4. **Core Web Vitals verdes são requisito, não meta.** Público mobile, provavelmente em rede
   móvel. Cada dependência de runtime precisa se justificar contra isso.
5. **pnpm** como package manager; `pnpm-lock.yaml` commitado.
6. **Sem licença definida** — repositório privado por enquanto.

## Stack decidida

- **Framework:** Astro (SSG, zero-JS por padrão), template `minimal`, **sem integrations**.
- **Toolchain:** mise (Node + pnpm + go-task), pinado em `mise.toml`.
- **Qualidade:** ESLint 10 (flat config) + Prettier 3 + `astro check`, via `task` e o hook
  `.githooks/pre-commit`. Roda **só local** — não há CI.
- **CSS: Tailwind v4 CSS-first** (`@tailwindcss/vite`), sem `tailwind.config.js`. Os tokens vivem
  em `@theme static` dentro de `src/styles/global.css`, sob os namespaces do próprio Tailwind
  (`--color-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`,
  `--container-*`) — é isso que faz cada token virar utility (`--color-surface` gera
  `bg-surface`). O prefixo `--calu-*` do handoff foi **descartado** na implementação: dentro do
  `@theme` ele impede a geração de utility, e não há multi-marca que justifique prefixo.
- **Fonte:** Source Serif 4, self-hosted via Fonts API nativa do Astro (`fontProviders.google()`),
  subsets `latin` + `latin-ext` (cobrem os diacríticos do pt-BR), `display: swap`, preload só do
  `latin`. Zero CDN de fonte em runtime.
- **Tema:** atributo `data-theme` no `<html>`, persistido em `localStorage['calu-theme']`, script
  inline no `<head>` antes do CSS (evita flash). Trocar de tema é trocar o valor da mesma custom
  property — nenhum componente muda de marcação, e `dark:` é raro.
- **Testes:** Vitest. `tests/tokens/` valida contraste e invariantes lendo `global.css` direto
  (sem DOM, sem build). Componentes vão usar `experimental_AstroContainer` + `axe-core`; testes
  de sistema vão usar `linkedom` sobre `dist/**`.
- **Zero JS de framework.** Sem React nem similar. Interação (tema, menu, accordion) é `<script>`
  vanilla.

## Stack pretendida (ainda não implementada)

- **CMS:** Git-based com interface visual (Sveltia / Decap / similar) — escolha guiada pela
  restrição nº 1.
- **Hospedagem:** Cloudflare Pages, com auto-deploy no push.

## Guardrails (não violar sem decisão explícita)

> O guardrail antigo ("nenhuma integration `@astrojs/*` e nenhum framework de CSS até a fase de
> design começar") **foi cumprido, não ignorado**: o gatilho era a chegada do handoff de design,
> o handoff chegou, e o Tailwind entrou como parte da implementação da Fase 0 — não por atalho.
> Ele sai da lista porque deixou de ser uma restrição em vigor.

- **Nenhum conteúdo real da clínica** (textos, endereço, telefone, horários, preços, fotos,
  nomes de profissionais) antes de ser levantado com a cliente e aprovado. Não inventar
  placeholder que pareça real.
- **Domínio registrado:** `calupilates.com.br`, registrado no Registro.br em 2026-08-09. `site`
  no `astro.config.mjs` deixou de ser placeholder — já reflete o domínio real. DNS e hospedagem
  ainda em aberto (ver "Decisões em aberto").
- **`typescript` fica em `~6.0.x`.** O `latest` do npm é 7.x e **quebra** duas dependências:
  `typescript-eslint` declara peer `<6.1.0` e `@astrojs/check` aceita `^5 || ^6`. Não trocar o
  til por caret.
- **Não adicionar CI/GitHub Actions** nesta fase — o gate é local por design. Isso é adiado de
  propósito, não esquecido: CI entra na Fase 5 (endurecimento), não antes.
- **Proibido arbitrary value** — `p-[13px]`, `text-[#8F5E23]`, `min-h-[52px]`, `text-(--x)`.
  Valor que falta vira token nomeado no `@theme` de `src/styles/global.css`, nunca hard-code no
  componente. Travado por `scripts/check-utilities.mjs`, que roda em `task check` (via
  `check:styles`). O script tem duas travas: arbitrary value, e **classe que não gera CSS** —
  necessária porque no Tailwind v4 uma utility inexistente não quebra o build, vira no-op
  silencioso, e o piso de 17px de texto seria violado em silêncio.
- **Regras invioláveis do design** (do handoff, ver `design_handoff_calu/CLAUDE.md`): texto nunca
  abaixo de 17px; contraste AAA 7:1 nos dois temas; alvo de toque ≥52px, 56px na ação principal;
  CLS zero; uma fonte e dois pesos (400/600); telefone sempre ao lado do WhatsApp; nada depende
  de hover nem de ícone sem palavra; **CFF/CREFITO** — proibido depoimento de paciente, foto
  antes/depois, promessa de resultado, superlativo e preço em destaque, inclusive como campo
  opcional de CMS.
- `design_handoff_calu/` é **documento vivo**, não um artefato congelado: `tokens.css` é a
  referência de valores, `src/styles/global.css` é a implementação. Divergência encontrada entre
  os dois se corrige no handoff também, não só no código.

## Decisões em aberto (adiadas)

- Hospedagem e pipeline de deploy (domínio já registrado — ver guardrails).
- CMS e o fluxo de edição da cliente.
- Formulário de contato / agendamento (e para onde as mensagens vão).
- SEO local: cadastro no Google Business Profile, e os dados reais que preenchem o JSON-LD
  `MedicalBusiness`/`Physiotherapy` (a função construtora pura e o sitemap técnico nascem na
  Fase 1 — falta só o conteúdo aprovado pela cliente para os consumir, depois).
- Analytics.
- Licença, se e quando o repositório se tornar público.

## Pendências resolvidas nesta fase

Registradas na Fase 0 como dívida pendente; fechadas na Fase 1 — Fundação. Cada bullet é somado
pelo commit da sub-fase correspondente conforme ela é implementada.

- **Cobertura do contrato de contraste generalizada.** `tests/tokens/invariants.test.ts`
  só exigia par medido para tokens `--color-ink*` — foi essa lacuna que deixou o anel de foco
  chegar a 1.01:1 sem teste vermelho no passado. Agora todo `--color-*` do `@theme` precisa
  aparecer em algum par de `pairs.ts` OU estar em `EXEMPT_COLOR_TOKENS`, lista pequena com
  justificativa escrita por entrada.
- **Ponto cego do gate em variante arbitrária de breakpoint.** Verificado empiricamente com o
  parser real do Tailwind: `scripts/check-utilities.mjs` passou a reprovar variante arbitrária de
  media/container query (`@min-[…]:`, `min-[…]:`, `max-[…]:`, `@[…]:`) sem tocar nos usos legítimos
  de variante arbitrária de atributo (`aria-[…]:`, `[&_…]:`, `has-[…]:`, `supports-[…]:`) que o
  projeto já usa.
- **Advertência do `max-w-measure`.** Comentário adicionado junto à declaração de
  `--container-measure` em `global.css`: a utility crua emite 68ch sem somar o gutter — usar
  sempre `container-measure` ou `<Container>`.
- **Três bugs de contraste reais descobertos pela cobertura generalizada, no tema escuro e/ou
  claro.** Generalizar o invariante (primeiro bullet) expôs pares nunca medidos antes:
  `--color-line` (borda padrão do `ThemeToggle`) e `--color-line-strong` (borda no estado
  pressionado) — ambos abaixo de 3:1 em algum tema, escondidos atrás de isenções com justificativa
  incorreta ou nunca medidos; e `--color-focus-halo`, abaixo de 3:1 no escuro (1.46:1 contra
  `--color-surface-brand`, 1.61:1 contra `--color-surface-deep`). Mesma classe do defeito histórico
  do anel de foco a 1.01:1. Correções: `--color-line` ajustado para `#8F7B50` no claro (4.03:1
  contra `--color-surface`, 3.67:1 contra `--color-bg`) e `#6B7A64` no escuro (3.34:1 contra
  `--color-surface`, 3.62:1 contra `--color-bg`) — era `#DED6C4`/`#2E3C33`, 1.42:1/1.32:1 contra
  `--color-surface`; e `--color-line-strong` para `#748268` no escuro (3.73:1 contra
  `--color-surface`), já corrigido numa passada anterior desta mesma leva — os dois agora com par
  medido real em `pairs.ts`, mantendo `--color-line` visivelmente mais sutil que
  `--color-line-strong` pra preservar a distinção de estado no `ThemeToggle`. `--color-focus-halo`
  foi isento em vez de corrigido: é reforço decorativo supletivo ao anel de foco sólido
  (`--color-focus-ring`, que já é conforme sozinho) e não tem consumidor hoje; a isenção precisa
  ser revisitada se isso mudar.

## Fases seguintes

Contexto para quem pegar o projeto depois da Fase 0 (tokens):

> **Nota de reordenação (2026-08-09):** este roadmap já teve uma Fase 1 diferente — a página
> `/lab` (kitchen sink). Ela foi empurrada para Fase 2, e uma nova Fase 1 entrou no lugar: o
> chrome estrutural (`Header`, `MobileNav`, `Footer`, `WhatsAppFab`) e o SEO técnico (sitemap,
> robots, meta tags, o construtor de JSON-LD). Motivo: Header/Footer/nav não são "conteúdo que se
> repete e por isso é extraído depois" — a regra de espera de "3 ocorrências, ou 2 + variação" (ver
> Fase 3) vale para blocos de CONTEÚDO como `ServiceCard`/`FaqItem`, não para a casca que envolve
> TODA página, `/lab` incluída. Construir `/lab` sem Header/Footer reais produziria uma página de
> regressão visual que nunca reflete a casca de verdade — o oposto do que ela existe para fazer.

- **Fase 1 — Fundação.** Chrome estrutural que toda página usa: `Header` + `MobileNav`, `Footer`,
  `WhatsAppFab`, os primitivos `ContactPair` e `EmptyState`, a página `/404`, e o SEO técnico que
  não depende de conteúdo real (sitemap, `robots.txt`, meta tags OpenGraph/Twitter, JSON-LD
  `MedicalBusiness`/`Physiotherapy` como função pura, ainda sem chamador). Também fecha 3
  pendências registradas na Fase 0 (ver "Pendências resolvidas nesta fase"). `BaseLayout` sai
  desta fase com a casca real — Header, Footer, `<main>` e FAB compostos — em vez do esqueleto de
  hoje. `src/components/blocks/` passa a existir aqui.
- **Fase 2 — `/lab`.** Página kitchen sink com o conteúdo bruto de todas as telas do handoff,
  `noindex`, agora renderizada DENTRO da casca real da Fase 1 (não mais um documento solto). Não é
  descartável: sobrevive como página viva de regressão visual.
- **Fase 3 — extração de componentes.** Só extrai o que se repetiu de fato: 3 ocorrências, ou 2 +
  variação de estado. Nada de componentizar por antecipação. `src/components/blocks/` já existe
  desde a Fase 1 — esta fase continua populando a mesma pasta com conteúdo extraído (`ServiceCard`,
  `Hero`, `FaqAccordion`, `CtaBlock`…).
- **Fase 4 — páginas reais.** Content collections com schema Zod espelhando `PAGES.md` do handoff,
  substituindo o conteúdo bruto do `/lab` pelas páginas de verdade — e é quando dado real da
  clínica (endereço, telefone, horário, equipe) entra pela primeira vez, aprovado pela cliente.
  `localBusinessLd` (Fase 1) ganha seu primeiro chamador aqui; `src/lib/site.ts` troca os
  placeholders pelos dados reais.
- **Fase 5 — endurecimento.** A11y, performance, SEO local (cadastro no Google Business Profile),
  e só então CI/GitHub Actions.

## Convenções

- **Commits em inglês**, Conventional Commits, com trailer `Co-Authored-By` — ver
  `.claude/skills/commit/SKILL.md`. O **conteúdo** do site é em pt-BR; o **código e os commits**
  seguem em inglês.
- Trabalho **direto na `main`** — repositório fechado, sem fluxo de PR.
- Antes de commitar: `task dod` (fmt → check → build → test). `task check` roda typecheck, lint,
  `fmt:check` e `check:styles`. O pre-commit chama `task check` por um único alvo — de propósito,
  para nunca divergir do gate quando um novo check entrar.
- Alias `@/*` → `src/*` (via `paths` no `tsconfig.json`; Astro/Vite resolvem sozinhos).
- Estrutura de pastas: `src/components/ui/` (primitivos; `src/components/blocks/` chega na
  Fase 1), `src/lib/` (helpers puros — `site.ts`, `seo.ts`, `jsonld.ts`), `src/styles/global.css`
  (tokens e base), `tests/tokens/` (contraste e invariantes dos tokens), `tests/components/`
  (Container API + axe-core), `tests/system/` (linkedom sobre `dist/**`), `scripts/`
  (`check-utilities.mjs`, o gate de arbitrary value/utility morta).
- `task --list` mostra todos os comandos disponíveis.

> O `~/.claude/CLAUDE.md` global (RTK) continua valendo; este arquivo é aditivo e escopado ao projeto.
