# Calu Pilates e Fisioterapia — instruções do projeto

Site institucional de clínica de fisioterapia com studio de Pilates (Vila Clementino, São Paulo). Objetivo único: **gerar contato** (WhatsApp e formulário) e passar credibilidade clínica. Não é e-commerce e não tem agendamento.

## Stack
Astro estático. **Nada pode depender de framework JS para funcionar** — interação é CSS + JS mínimo (menu, accordion, tema, validação). Zero JS no cliente por padrão; use `client:*` só onde for inevitável.

## Fonte de verdade do design
`design_handoff_calu/` — leia **DESIGN-SYSTEM.md**, **COMPONENTS.md** e **PAGES.md** antes de escrever qualquer componente. `tokens.css` continua sendo a referência de **valores** (as cores derivadas do logo, os pisos de tipografia, os alvos de toque); a implementação vive em `src/styles/global.css`.

## Invioláveis
1. **Proibido arbitrary value** (`bg-[#...]`, `text-[19px]` etc.). A implementação usa Tailwind v4 CSS-first: os tokens vivem no `@theme` de `src/styles/global.css`, sob os namespaces do Tailwind (`--color-*`, `--text-*`, `--spacing-*` — o prefixo `--calu-*` foi descartado). Valor que faltar vira token nomeado no `@theme`, nunca hard-code no componente.
2. **Texto nunca abaixo de 17px.** Corpo em 19–20px. Rótulo de 15px só em caixa-alta curta.
3. **Contraste AAA (7:1)** no texto corrido, nos dois temas.
4. **Alvo de toque ≥52px** (56px na ação principal).
5. **CLS zero** — toda imagem com dimensão e `aspect-ratio`.
6. **CFF/CREFITO**: proibido depoimento, antes/depois, promessa de resultado, superlativo, preço em destaque. Não crie campo de CMS para isso.
7. **Telefone sempre ao lado do WhatsApp.**
8. **2 pesos de uma fonte só** (Source Serif 4 · 400/600).
9. Layout não pode quebrar com título 3× maior, lista de 2 ou 8 itens, ou imagem ausente.
10. Copy em **PT-BR real**, frase curta, sem jargão. Nada de lorem ipsum.

## Público
25–55 **e 60–75**, além do filho adulto pesquisando pelo pai/mãe. Decide no celular. Toda decisão de densidade, tamanho e clareza responde a isso.

## Convenções
- Componentes em `src/components/`, um por arquivo, sem margem externa própria.
- Conteúdo em content collections com schema Zod espelhando `PAGES.md`.
- Testes ao lado do componente. Rodar `task dod` (fmt → check → build → test) antes de dar tarefa por concluída — projeto é pnpm-only com go-task, sem `npm`.
- Commits pequenos, um componente por vez.
