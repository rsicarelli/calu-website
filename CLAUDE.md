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

🚧 **Bootstrap.** Só a casca: esqueleto Astro, toolchain (mise + pnpm + task) e gates de
qualidade locais (ESLint + Prettier + `astro check`) com hook de pre-commit.

**Ainda não existe** — e a ausência é temporária, não uma decisão contra:
CMS, hospedagem/deploy, CI, SEO, analytics, formulários, design/identidade visual, favicon/logo,
e qualquer conteúdo real da clínica. O `index.astro` é um placeholder com o nome e nada mais.

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

## Stack pretendida (ainda não implementada)

- **CMS:** Git-based com interface visual (Sveltia / Decap / similar) — escolha guiada pela
  restrição nº 1.
- **Hospedagem:** Cloudflare Pages, com auto-deploy no push.

## Guardrails (não violar sem decisão explícita)

- **Nenhuma integration `@astrojs/*` e nenhum framework de CSS** até a fase de design começar.
- **Nenhum conteúdo real da clínica** (textos, endereço, telefone, horários, preços, fotos,
  nomes de profissionais) antes de ser levantado com a cliente e aprovado. Não inventar
  placeholder que pareça real.
- **`site` no `astro.config.mjs` é placeholder** (`calupilates.com.br`) — o domínio ainda não
  foi confirmado nem registrado.
- **`typescript` fica em `~6.0.x`.** O `latest` do npm é 7.x e **quebra** duas dependências:
  `typescript-eslint` declara peer `<6.1.0` e `@astrojs/check` aceita `^5 || ^6`. Não trocar o
  til por caret.
- **Não adicionar CI/GitHub Actions** nesta fase — o gate é local por design.

## Decisões em aberto (adiadas)

- Domínio definitivo e registro; hospedagem e pipeline de deploy.
- CMS e o fluxo de edição da cliente.
- Design, identidade visual e abordagem de CSS (vanilla vs framework).
- Formulário de contato / agendamento (e para onde as mensagens vão).
- SEO local: Google Business Profile, JSON-LD (`MedicalBusiness` / `Physiotherapy`), sitemap.
- Analytics.
- Licença, se e quando o repositório se tornar público.

## Convenções

- **Commits em inglês**, Conventional Commits, com trailer `Co-Authored-By` — ver
  `.claude/skills/commit/SKILL.md`. O **conteúdo** do site é em pt-BR; o **código e os commits**
  seguem em inglês.
- Trabalho **direto na `main`** — repositório fechado, sem fluxo de PR.
- Antes de commitar: `task dod`. O pre-commit roda `fmt:check` + `typecheck` + `lint`.
- Alias `@/*` → `src/*` (via `paths` no `tsconfig.json`; Astro/Vite resolvem sozinhos).
- `task --list` mostra todos os comandos disponíveis.

> O `~/.claude/CLAUDE.md` global (RTK) continua valendo; este arquivo é aditivo e escopado ao projeto.
