# calu-website

Site institucional da **Calu Pilates e Fisioterapia** — estúdio de Pilates e clínica de
fisioterapia na Vila Clementino, São Paulo.

> **Status:** 🚧 Bootstrap — só a casca. Esqueleto Astro, toolchain e gates de qualidade locais.
> **O setup de CMS e de deploy ainda não foi feito**, e não há conteúdo, design nem hospedagem.

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
| CMS        | _a decidir_ — Git-based, com interface visual      |
| Hospedagem | _a decidir_ — provavelmente Cloudflare Pages       |
| Design     | _a decidir_                                        |

## Estrutura

```
src/
  pages/           # rotas
  layouts/         # BaseLayout
  components/      # (vazio)
  content/         # (vazio)
public/            # assets estáticos (vazio)

astro.config.mjs   Taskfile.yml   mise.toml   eslint.config.js
```

## Desenvolvimento local

O toolchain é pinado com [mise](https://mise.jdx.dev) (`mise.toml`: Node, pnpm e go-task).

```bash
mise install      # provisiona Node + pnpm + task
task install      # instala as dependências
task dev          # sobe o dev server em localhost:4321
task build        # gera o site em dist/
task dod          # formata + typecheck + lint + build (rode antes de commitar)
```

`task --list` mostra todos os comandos. Para ativar o gate de pre-commit:

```bash
task hooks:install
```

Sem o `mise`, dá para usar o pnpm diretamente (`pnpm install`, `pnpm dev`, `pnpm build`) desde
que o Node seja a versão do `.nvmrc`.

## Licenciamento

Repositório privado e proprietário. Todos os direitos reservados.
