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

✅ **Fase 1 — Fundação implementada e commitada** (13 commits, `48947ed` → `8d431d2`). O chrome
estrutural que toda página usa já existe em `src/components/blocks/`: `Header.astro`,
`MobileNav.astro`, `Footer.astro`, `WhatsAppFab.astro`, `EmptyState.astro`. O primitivo
`ContactPair` entrou em `src/components/ui/`, e `src/components/content/JsonLd.astro` injeta o
JSON-LD no `<head>`. O SEO técnico que não depende de conteúdo real também existe:
`src/lib/site.ts`, `src/lib/seo.ts`, `src/lib/jsonld.ts`, os endpoints `src/pages/sitemap.xml.ts`
e `src/pages/robots.txt.ts`, e a página `src/pages/404.astro`. `BaseLayout` deixou de ser
esqueleto: agora compõe Header + `<main>` + Footer + FAB e emite as meta tags de SEO/canonical de
verdade. A marca (`logo-mark`/`logo-lockup`) entrou junto, usada em `Header`, `Footer` e
`EmptyState`. `tests/` cresceu na mesma proporção — `tests/components/`, `tests/lib/`,
`tests/pages/`, `tests/scripts/`, `tests/system/` — 216 testes no total.

✅ **Fase 2 — `/lab` implementada e commitada** (16 commits a partir de `1306178`; os três
primeiros são correção de deriva de documentação, `c6d192f` é o último de código, e este parágrafo
fecha a fase). A rota
`src/pages/lab/index.astro` é o kitchen sink do handoff: `noindex`, fora do sitemap, renderizada
DENTRO da casca real da Fase 1. Ela tem doze seções, cada uma num partial de
`src/pages/lab/_sections/` (prefixo `_`, que o Astro não roteia — verificado no fonte da 7.2.0,
não presumido): a grade dos 31 tokens de cor nos dois temas, a escala tipográfica de dez tamanhos,
espaço e forma, os três matrizes de estado (ação, campo, imagem) e as telas de Home, Serviço,
Contato, Equipe, Índice e FAQ, fechando com os casos-limite de resiliência de conteúdo.
`tests/pages/lab.test.ts` trava sete contratos estruturais e mais oito de comportamento
(formulário e accordion); a suíte foi de 216 para 253 testes.

✅ **Fase 3 — extração de componentes implementada e commitada** (11 commits a partir de
`f050202`; este parágrafo fecha a fase). Oito componentes saíram da `/lab`, cada um aplicado aos
seus pontos de uso no MESMO commit que o criou, para a página nunca divergir dos componentes:
`ui/Action` (28 grafias viraram uma), `ui/BrandPlaceholder` (18 blocos, 6 tamanhos de símbolo
viraram 1), `ui/Field` (os três controles num arquivo só), `ui/Credential`, `ui/RuledList`,
`blocks/FaqItem` (11 ocorrências, zero mudança visual), `blocks/ServiceCard` (10),
`blocks/ProfessionalBio` (5) e `blocks/CtaBlock` (3). A `/lab` encolheu de 2.941 para 2.617
linhas e a suíte foi de 253 para 363 testes.

Duas decisões que valem para quem continuar:

- **Galeria não conta como ocorrência.** A `/lab` tem dois tipos de seção. Nas GALERIAS
  (`TokensColor`, `TokensShape`, as amostras congeladas de `StatesAction`/`StatesForm`) a utility
  crua É o assunto exibido — trocá-la por componente apagaria a evidência que a galeria existe
  para mostrar. Nas TELAS, markup cru é duplicação. Só a segunda conta para a regra de 3+. Foi por
  isso que a variante `ghost` e a paleta `accent-deep` NÃO foram construídas: as sete ocorrências
  delas vivem todas em galeria.
- **Rejeitados por não baterem a régua**, e vale registrar para não voltarem por hábito:
  `LocationBlock` (2 ocorrências byte a byte idênticas, mas sem variação de estado — é o caso que
  mais tenta), `ChooserBlock`, `FamilyBlock`, `FaqIndex`, `ContactForm` inteiro e o resumo de erro
  (1 cada). `SectionLabel` foi adiado por outro motivo: a string `label text-ink-muted` aparece 76
  vezes, mas ~63 são andaime de demonstração da própria `/lab` e ~13 são conteúdo real — extrair
  agora carimbaria o andaime dentro de um componente de site.

✅ **Fase 4 — páginas reais implementada e commitada.** O site existe. `src/content.config.ts`
define cinco coleções com schema Zod espelhando `PAGES.md` campo a campo, e as seis rotas
(`/`, `/servicos`, `/servicos/[slug]`, `/equipe`, `/duvidas`, `/contato`) são montadas a partir
dos componentes, não de markup novo. `localBusinessLd` ganhou seu primeiro chamador — só na Home,
porque `Physiotherapy` descreve a organização e não o documento. A suíte foi de 363 para 708
testes. Detalhes que valem para quem continuar:

- **`.strict()` em todo objeto de schema é a trava CFF/CREFITO, não estilo.** Verificado
  empiricamente contra o `astro/zod` instalado: sem ele, chave desconhecida é SILENCIOSAMENTE
  REMOVIDA — um `preco:` numa entrada sumiria sem erro nenhum. Com ele, o build para e diz o nome
  da chave. A `ficha` do serviço é enum fechado de seis chaves pelo mesmo motivo.
- **Fonte única virou derivação.** `src/lib/site.ts` guarda cada fato UMA vez, estruturado, e
  deriva toda apresentação por função pura. Os dígitos do telefone são digitados uma vez e
  `tel:`, `wa.me/` e o rótulo saem deles — um site que mostrasse um número e discasse outro era
  estado possível antes, e não é mais.
- **`src/lib/placeholders.ts`** separa prosa de identidade: a copy é real (não afirma nada
  verificável, então não depende de aprovação), o nome e o CREFITO são marcadores entre
  colchetes. `tests/system/placeholders.test.ts` imprime o inventário do que falta — é a
  checklist da troca.
- **Três agentes de escrita em `.claude/agents/`** (`copywriter`, `grammar-reviewer`,
  `cohesion-reviewer`). A trava CFF fica em três camadas: o schema não tem o campo, o teste varre
  o texto construído, os agentes auditam a intenção.
- **`SectionLabel` fechou sem virar componente:** é a prop `label` do `PageSection`.
- **`LocationBlock` foi extraído depois de ter sido rejeitado na Fase 3** — o que mudou foi o
  fato (com `AspectImage` ele passou a ter variação de estado), não a régua.
- **O formulário não envia**, e isso é a decisão: o destino depende da hospedagem, ainda em
  aberto. Ele valida no cliente e nunca finge sucesso.

**Ainda não existe** — e a ausência é temporária, não uma decisão contra:
CMS, hospedagem/deploy, CI, analytics, formulários que de fato enviem, favicon, imagem OG, as
rotas `/sobre`, `/blog` e `/politica-de-privacidade` (não desenhadas), e o dado real da clínica —
endereço, telefone, horário, nome e CREFITO das profissionais, mais o cadastro no Google Business
Profile (SEO local, ver "Decisões em aberto"). O próximo passo é a **Fase 5 — endurecimento**.

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

## Defeitos encontrados e fechados na Fase 2

Nenhum dos dois estava registrado como pendência: os dois apareceram ao construir a `/lab` e valem
registro porque a mesma classe de erro pode voltar.

- **Ponto cego do varredor de CLS em proporção fracionária.** `tests/system/cls.test.ts` aceitava
  `width`+`height` OU uma classe de `aspect-ratio`, e o regex da classe era
  `/(?:^|\s)aspect-[\w-]+(?:\s|$)/`. A barra da sintaxe de fração do Tailwind v4 não pertence a
  `[\w-]`, então `aspect-video` casava e `aspect-3/4`, `aspect-4/5`, `aspect-16/9` e `aspect-3/2` —
  as CINCO proporções canônicas do handoff — não casavam. Nada era afetado na época (nenhuma
  classe de proporção existia no projeto), e é justamente por isso que valia corrigir antes: a
  primeira imagem a usar uma delas teria `aspect-ratio` real no CSS e ainda assim contaria como
  "sem sinal de dimensão". Mesma família do anel de foco que chegou a 1.01:1 sem teste vermelho —
  checagem que parece cobertura e não é. Corrigido, com um bloco de regressão do próprio
  reconhecedor, no espírito do que `typography.test.ts` já fazia com sua extração de família.
- **Aninhamento inválido de `<details>`/`<summary>` no handoff.** `COMPONENTS.md § FaqAccordion`
  pedia o `<summary>` DENTRO de um `<h3>`. O modelo de conteúdo de `<details>` exige o `<summary>`
  como primeiro filho: com um cabeçalho no meio, o `<details>` fica sem `summary` nenhum, o
  navegador sintetiza o próprio marcador e o texto da pergunta some junto com a resposta quando o
  item está fechado. O mockup não tem nenhum `<details>`, então a divergência nunca apareceu na
  referência visual. Corrigido nos dois lugares — o handoff é documento vivo — invertendo para
  `<details><summary><h3>…</h3></summary>`, que é válido (o modelo de conteúdo de `<summary>`
  aceita cabeçalho) e preserva a navegação por cabeçalhos que era a intenção original.

## Pendências resolvidas na Fase 1

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
  (`--color-focus-ring`, que já é conforme sozinho). **Ganhou seu primeiro consumidor na Fase 2** —
  os campos com foco da `/lab` —, mas sempre ACOMPANHADO do anel sólido, então a condição da
  isenção segue valendo; ela precisa ser revisitada se algum dia o halo virar o único indicador.
  A justificativa em `tests/tokens/pairs.ts` está atualizada.

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
- ~~**Fase 2 — `/lab`.**~~ ✅ Feita. Página kitchen sink com o conteúdo bruto de todas as telas do
  handoff, `noindex`, renderizada DENTRO da casca real da Fase 1. Não é descartável: sobrevive como
  página viva de regressão visual, e é o teste de refatoração da Fase 3.
  Duas convenções que ela fixou, e que valem para quem for mexer nela:
  o texto é prosa pt-BR de verdade que não afirma NADA verificável sobre a clínica (dado de contato
  vem de `SITE`, nome próprio sai como `[Nome da profissional]`); e link dentro de uma seção de
  tela aponta para a ROTA REAL de produção (`/servicos`, `/duvidas`), nunca para âncora de outra
  seção — navegação interna existe só no sumário.
- ~~**Fase 3 — extração de componentes.**~~ ✅ Feita. Só extraiu o que se repetiu de fato: 3
  ocorrências, ou 2 + variação de estado. Ver "Status" para a lista do que saiu, do que foi
  rejeitado e por quê — e para a regra de que ocorrência em galeria não conta.
- ~~**Fase 4 — páginas reais.**~~ ✅ Feita. Content collections com schema Zod espelhando
  `PAGES.md`, e as seis rotas desenhadas montadas sobre os componentes. Ver "Status" para o que
  ficou decidido. Duas coisas NÃO aconteceram aqui, e é bom não procurá-las: o dado real da
  clínica (segue placeholder tipado, à espera da cliente) e as três rotas não desenhadas
  (`/sobre`, `/blog`, `/politica-de-privacidade`). Enquanto elas não existem, o texto que
  apontaria para elas é renderizado SEM link — `tests/system/links.test.ts` trava os dois lados.
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
- Estrutura de pastas: `src/components/ui/` (primitivos), `src/components/blocks/` (chrome
  estrutural), `src/components/content/` (`JsonLd`), `src/lib/` (helpers puros — `site.ts`,
  `seo.ts`, `jsonld.ts`), `src/styles/global.css` (tokens e base), `tests/tokens/` (contraste e
  invariantes dos tokens), `tests/components/` (Container API + axe-core), `tests/lib/`,
  `tests/pages/`, `tests/system/` (linkedom sobre `dist/**`), `scripts/`
  (`check-utilities.mjs`, o gate de arbitrary value/utility morta).
- `task --list` mostra todos os comandos disponíveis.

> O `~/.claude/CLAUDE.md` global (RTK) continua valendo; este arquivo é aditivo e escopado ao projeto.
