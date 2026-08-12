# calu-website

Site institucional da **Calu Pilates e Fisioterapia** — estúdio de Pilates e clínica de
fisioterapia na Vila Clementino, São Paulo.

> **Status:** 🚧 Em construção — o design system e a casca estrutural existem; o conteúdo, não.
> Já implementados: os tokens do handoff de design (cor, tipografia, espaço, forma, tema claro e
> escuro) em `src/styles/global.css`, o chrome que toda página usa (`Header` + `MobileNav`,
> `Footer`, `WhatsAppFab`, `EmptyState`), a página `/404` e o SEO técnico (sitemap, `robots.txt`,
> meta tags, JSON-LD). **Ainda não existem:** CMS, hospedagem/deploy, CI, analytics, formulários,
> favicon e qualquer conteúdo real da clínica.

## O que é isto

Um site institucional estático, em português, construído com Astro. O repositório é a fonte da
verdade do código e do conteúdo.

## Stack

| Camada     | Escolha                                            |
| ---------- | -------------------------------------------------- |
| Framework  | **Astro 7** (SSG, zero-JS por padrão)              |
| Toolchain  | **mise** (Node + pnpm + go-task)                   |
| Qualidade  | ESLint 10 + Prettier 3 + `astro check`, via `task` |
| Idioma     | **pt-BR** apenas                                   |
| CSS        | **Tailwind v4 CSS-first** — tokens em `@theme`     |
| Design     | handoff em `design_handoff_calu/`, implementado    |
| Testes     | **Vitest** — tokens, componentes, páginas, sistema |
| CMS        | _a decidir_ — Git-based, com interface visual      |
| Hospedagem | _a decidir_ — provavelmente Cloudflare Pages       |

## Estrutura

```
src/
  pages/           # rotas
  layouts/         # BaseLayout
  components/      # ui/, blocks/, content/
  content/         # content collections
  assets/          # brand/ — imagens processadas pelo Astro
  lib/             # helpers
  styles/          # tokens e estilos globais
scripts/           # utilitários de build/checagem
tests/             # Vitest

astro.config.mjs   Taskfile.yml   mise.toml   eslint.config.js   vitest.config.ts
```

Não há diretório `public/`: os assets passam pelo pipeline do Astro (`src/assets/`, e a Fonts
API gera `_astro/fonts/`). Crie um `public/` só se aparecer arquivo que precise ser servido
sem processamento — `robots.txt` e afins.

## Desenvolvimento local

O toolchain é pinado com [mise](https://mise.jdx.dev) (`mise.toml`: Node, pnpm e go-task).

```bash
mise install      # provisiona Node + pnpm + task
task install      # instala as dependências
task dev          # sobe o dev server em localhost:4321
task build        # gera o site em dist/
task preview      # serve o dist/ — o HTML real de produção
task check        # typecheck + lint + fmt:check + check:styles
task check:styles # reprova arbitrary value e classe que não gera CSS
task test         # Vitest (depende de build — os testes de sistema leem dist/)
task dod          # formata + gates + build + testes (rode antes de commitar)
```

O `check:styles` é específico deste projeto: **arbitrary value é proibido** (`p-[13px]`,
`text-[#8F5E23]`). Valor que falta vira token nomeado no `@theme` de `src/styles/global.css`.
O mesmo script também reprova classe que não gera CSS — no Tailwind v4 uma utility inexistente
não quebra o build, vira no-op silencioso.

O Astro mantém os servidores de `dev` e `preview` **em background**, então eles seguem no ar
depois que o comando retorna. Para derrubá-los:

```bash
task dev:stop       # só o dev
task preview:stop   # só o preview
task stop           # os dois
```

`task --list` mostra todos os comandos. Para ativar o gate de pre-commit:

```bash
task hooks:install
```

Sem o `mise`, dá para usar o pnpm diretamente (`pnpm install`, `pnpm dev`, `pnpm build`) desde
que o Node seja a versão do `.nvmrc`.

## Licenciamento

Repositório privado e proprietário. Todos os direitos reservados.
