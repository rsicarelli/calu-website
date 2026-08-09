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
sistema de tokens, não páginas. Componentes de UI (`src/components/ui/`) e a página `/lab`
(Fase 1) são o próximo passo, não algo já implementado.

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
  propósito, não esquecido: CI entra na Fase 4 (endurecimento), não antes.
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
- SEO local: Google Business Profile, JSON-LD (`MedicalBusiness` / `Physiotherapy`), sitemap.
- Analytics.
- Licença, se e quando o repositório se tornar público.

## Fases seguintes

Contexto para quem pegar o projeto depois da Fase 0 (tokens):

- **Fase 1 — `/lab`.** Página kitchen sink com o conteúdo bruto de todas as telas do handoff,
  `noindex`. Não é descartável: sobrevive como página viva de regressão visual.
- **Fase 2 — extração de componentes.** Só extrai o que se repetiu de fato: 3 ocorrências, ou 2 +
  variação de estado. Nada de componentizar por antecipação. É quando `src/components/blocks/`
  passa a existir ao lado de `src/components/ui/`.
- **Fase 3 — páginas reais.** Content collections com schema Zod espelhando `PAGES.md` do
  handoff, substituindo o conteúdo bruto do `/lab` pelas páginas de verdade.
- **Fase 4 — endurecimento.** A11y, performance, SEO local, e só então CI/GitHub Actions.

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
  Fase 2), `src/styles/global.css` (tokens e base), `tests/tokens/` (contraste e invariantes dos
  tokens), `scripts/` (`check-utilities.mjs`, o gate de arbitrary value/utility morta).
- `task --list` mostra todos os comandos disponíveis.

> O `~/.claude/CLAUDE.md` global (RTK) continua valendo; este arquivo é aditivo e escopado ao projeto.
