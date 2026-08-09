# Prompt para colar no Claude Code

> Cole tudo abaixo da linha em uma sessão nova do Claude Code, na raiz do projeto do site da Calu, com a pasta `design_handoff_calu/` já dentro dele.

---

Você vai implementar o design system e o site institucional da **Calu Pilates e Fisioterapia** (clínica de fisioterapia com studio de Pilates, Vila Clementino, São Paulo) em **Astro estático**.

Trabalhe em português nos textos de produto e nos nomes de conteúdo; código e nomes de arquivo em inglês.

## Antes de escrever qualquer código

**1. Leia a pasta de handoff, inteira, nesta ordem:**
- `design_handoff_calu/DESIGN-SYSTEM.md` — as regras invioláveis (público 60+, contraste AAA, piso de 17px, alvo de 52px, restrição CFF/CREFITO)
- `design_handoff_calu/COMPONENTS.md` — o inventário de componentes, com estados e critérios de teste
- `design_handoff_calu/PAGES.md` — as páginas e o modelo de conteúdo do CMS
- `design_handoff_calu/tokens.css` — a única fonte de cor, tipografia, espaço e forma
- `design_handoff_calu/CLAUDE.md` — copie para a raiz do projeto como `CLAUDE.md`

**2. Abra a referência visual no navegador:** `design_handoff_calu/Calu - Direcao de Marca.dc.html`. É um documento de design em HTML — **referência, não código para copiar**. As seções são: 01 tokens, 02 componentes, 03 Home mobile, 04 modo escuro completo, 05 Home 1280, 06 Serviço, 07 Contato, 08 Equipe, 09 Índice de serviços, 10 FAQ. Cada tela existe em 360px e em desktop.

**3. Explore o projeto de referência do autor** em `/Users/rodrigo.sicarelli/Workspace/Personal/rodrigo-sicarelli`.
Esse repositório é a régua de **como eu quero que as coisas sejam feitas** — não de como devem parecer (a aparência vem do handoff da Calu). Investigue e me diga, antes de codar, o que encontrou sobre:
- estrutura de pastas e organização de componentes;
- estratégia de **dark/light**: onde os tokens vivem, como o tema é alternado e persistido, como o flash na primeira pintura é evitado;
- estratégia de **responsividade**: breakpoints, uso de `clamp()`, container queries, mobile-first;
- padrões de CSS (módulos, camadas, nesting, convenção de nomes) e como eles evitam vazamento de estilo;
- setup de testes: framework, o que é testado num componente, onde ficam os arquivos;
- qualidade: lint, format, typecheck, hooks de commit, CI;
- padrões de acessibilidade já resolvidos ali.

**Reaproveite tudo que fizer sentido.** Se aquele projeto já resolveu bem o toggle de tema, o util de classe ou a config de teste, traga a mesma abordagem em vez de inventar outra. Onde a Calu exigir algo diferente (ela tem regras de contraste e tamanho mais duras), explique a divergência.

Ao terminar a exploração, **pare e me apresente**: (a) o que você encontrou, (b) o que vai reaproveitar, (c) o plano de implementação em fases. Só siga depois do meu ok.

## Estratégia de implementação

Nesta ordem, e sem pular etapa:

**Fase 0 — fundação**
Projeto Astro, TypeScript estrito, lint/format/typecheck, runner de teste e CI mínimo. `tokens.css` importado uma vez no layout raiz. `theme-init.js` inline no `<head>`. Reset de CSS enxuto. Fonte Source Serif 4 (variável, 400/600) self-hosted ou com `preconnect` + `font-display: swap`.

**Fase 1 — página de laboratório**
Crie uma rota **`/lab`** (fora do sitemap, com `noindex`) e monte ali **todo o conteúdo bruto das telas**, ainda sem componentizar: os tokens visíveis, cada estado de cada elemento, as duas Homes, Serviço, Contato, Equipe, Índice, FAQ, nos dois temas. É o kitchen sink do projeto.
Essa página serve para três coisas: enxergar repetição real antes de abstrair, validar tokens e contraste no navegador, e sobreviver como página viva de regressão visual. **Não a apague depois** — ela evolui junto com o sistema.

**Fase 2 — extração**
Só agora componentize, e **só o que se repetiu de fato** (regra prática: 3 ocorrências ou 2 ocorrências + variação de estado). Siga o inventário de `COMPONENTS.md`, de baixo para cima: primitivos → blocos → seções.
Para cada componente extraído: props tipadas e mínimas, sem margem externa própria, sem conhecimento da página, `class` repassável, slots para conteúdo. Substitua o markup na `/lab` pelo componente e confirme que **nada mudou visualmente** — a `/lab` é o seu teste de refatoração.

**Fase 3 — páginas reais**
Content collections com schema Zod espelhando `PAGES.md`, conteúdo de exemplo em PT-BR realista, e as páginas montadas só a partir dos componentes. Nenhuma página deve conter CSS próprio além de layout de seção.

**Fase 4 — endurecimento**
Testes, acessibilidade, performance, SEO local (LocalBusiness/JSON-LD, título e descrição por página, sitemap, Open Graph), e a documentação viva.

## Como quero os componentes

- **Genéricos e reutilizáveis**: um `ServiceCard` serve a Home, o índice e o bloco de relacionados. Se um componente só serve a uma página, ou ele é seção (e vive em `sections/`), ou está errado.
- **Isolados**: nenhum componente sabe onde está. Zero seletor global, zero `:global`, zero estilo que vaze. Estilo colocado com a marcação do componente.
- **Sem valor mágico**: só `var(--calu-*)`. Se precisar de um valor que não existe, **adicione um token** e justifique — não escreva o número.
- **Responsivos por construção**: `clamp()` e `auto-fit` antes de media query. Mobile-first, base 360px. Container query onde o componente puder viver em larguras diferentes (card na Home a 1 coluna e no índice a 2).
- **Acessíveis por padrão**: HTML semântico primeiro, ARIA só quando o HTML não dá conta. Foco visível sempre. Navegável por teclado. `prefers-reduced-motion` respeitado.
- **Testados**: cada componente com teste de render, de variantes/estados e de acessibilidade (axe). Além disso, testes que travam as regras do sistema:
  - nenhum controle abaixo de 52px de altura;
  - nenhum texto de produto abaixo de 17px;
  - contraste AAA no texto corrido nos dois temas;
  - imagem ausente não colapsa altura (CLS 0);
  - título 3× maior e lista de 8 itens não quebram o layout.
- **Documentados**: cada componente com um bloco de uso (props, variantes, quando não usar). Se o projeto de referência usar alguma ferramenta de catálogo, siga a mesma.

## Como quero o design system

Ele precisa ser **evolutivo**, não um dump de CSS:
- tokens em camadas — primitivos (a paleta que veio do logo) → semânticos (`--calu-surface`, `--calu-text-body`) → de componente, quando necessário. Componente consome semântico, nunca primitivo;
- tema é troca de valor, **nunca** de marcação ou de componente;
- adicionar uma variante deve custar um token e uma linha, não um `if` novo em três lugares;
- o que não é token (regra de tom, restrição regulatória, decisão de acessibilidade) fica documentado junto e citado no PR quando for relevante.

## Regras que não se negociam

1. Texto nunca abaixo de **17px**; corpo em 19–20px; rótulo de 15px só em caixa-alta curta.
2. Contraste **AAA (7:1)** no texto corrido, nos dois temas.
3. Alvo de toque **≥52px**, 56px na ação principal.
4. **CLS zero**: toda imagem com `width`, `height` e `aspect-ratio`.
5. **CFF/CREFITO**: proibido depoimento de paciente, foto antes/depois, promessa de resultado, superlativo e preço em destaque — inclusive como campo opcional no CMS. Se eu pedir, recuse e me lembre da regra.
6. **Telefone sempre ao lado do WhatsApp** (parte do público liga).
7. Uma fonte, **dois pesos**.
8. Layout resiliente a CMS: título 3× maior, lista de 2 a 8 itens, imagem ausente, seção vazia.
9. Nada depende de `hover` nem de ícone sem palavra.
10. Sem framework JS para funcionar. Sem dependência que não se justifique em uma frase.

## Como quero trabalhar

- Faça **uma fase por vez** e pare para eu revisar no fim de cada uma.
- Antes de codar cada fase, escreva o plano em bullets e espere meu ok.
- Commits pequenos e descritivos, um assunto por commit.
- Rode `typecheck`, `lint`, `test` e `build` antes de dizer que algo está pronto — e me diga o que rodou.
- Quando encontrar ambiguidade entre o handoff e o projeto de referência, **pergunte** em vez de escolher sozinho.
- Se algo no handoff estiver errado ou incoerente, aponte e proponha a correção no documento — ele é vivo.

Comece pela exploração dos três lugares (handoff, referência visual em HTML, projeto `rodrigo-sicarelli`) e me traga o plano.
