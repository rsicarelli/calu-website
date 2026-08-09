# Calu — Design System

> Regras que o código precisa respeitar. Quando esta pasta e o seu instinto discordarem, esta pasta ganha; se ela estiver errada, corrija o documento no mesmo PR.

## 1. De onde vem a identidade

Tudo descende do logo entregue pela cliente (`assets/logo-original.png`): sálvia `#7E8368` de fundo, lettering creme `#EDE7D9`, dourado `#C9A45C` no fruto da oliveira. Nenhuma cor foi inventada.

Duas adaptações foram necessárias e são obrigatórias:

| Cor do logo | Problema na tela | Token que resolve |
|---|---|---|
| sálvia `#7E8368` | 3,4:1 — reprova em texto; em bloco de tela inteira lê opaco/militar | `--calu-brand` `#414A38` para texto, `--calu-surface-brand` `#3E4A3C` para superfície |
| dourado `#C9A45C` | 2,1:1 sobre creme — invisível em botão claro | `--calu-accent` `#8F5E23` (bronze) no claro; o dourado puro só sobre escuro |

**Regras invioláveis de cor**
- `--calu-sage` nunca em texto, em nenhum tema.
- Dourado puro só sobre `--calu-surface-deep`.
- Máximo de 2 cores de fundo por página, fora o branco/creme base.
- Nada de gradiente decorativo, glassmorphism ou sombra colorida.
- Foco usa **sempre** `--calu-focus-ring` — nunca o bronze. O mockup de
  referência usava `#8F5E23` (4,96:1) no `:focus-visible`, que além de reprovar contraste
  sumiria de vez sobre um botão `accent`. O token vale `#414A38` (8,31:1 sobre `--calu-bg`)
  sobre superfície clara e é re-declarado como `#EDE7D9` dentro de bloco escuro pelo
  `data-surface` (ver `tokens.css`, "foco escopado"): `#414A38` dá 1,01:1 sobre
  `--calu-surface-brand` e 1,78:1 sobre `--calu-surface-deep`, ou seja, sumiria no rodapé e
  no CtaBlock. **Um anel só, dois valores — quem troca é a superfície, nunca o componente.**
- Outline de foco usa **sempre** `outline-offset: 2px`, para o anel cair na superfície da
  página em vez de colar no próprio elemento. A regra é `:focus-visible` **nu** — nunca
  `:where(:focus-visible)`, que vale (0,0,0) e perde para o `:-moz-focusring` do Preflight
  do Tailwind (0,1,0), na mesma camada: no Firefox o anel de 3px era substituído pelo anel
  padrão do navegador e sobrava só o offset. E a regra **não declara `border-radius`**:
  navegador moderno já segue o raio do próprio elemento no `outline`, e a declaração
  arredondava o ELEMENTO ao receber foco — mudava a forma de `<img>` e de link de rodapé
  exatamente quando ele precisa parecer estável.

## 2. Público — a restrição que manda no resto

Quem decide tem 25–55 **ou 60–75**, e frequentemente é o filho adulto pesquisando pelo pai/mãe. Isso não é "acessibilidade genérica", é o requisito funcional do produto:

1. **Corpo a partir de 19px** no mobile, 20px no desktop (`--calu-fs-body`).
2. **Piso absoluto de 17px** (`--calu-fs-small`) em qualquer texto que se leia — inclusive credencial CREFITO. Não existe 15px de texto no site; `--calu-fs-label` (15px) é só para rótulo em caixa-alta de 1–3 palavras.
   A exceção **nunca vem sozinha**: 15px só é legítimo junto com caixa-alta, `--calu-font-label`, `--calu-ls-label` e peso 600. Na implementação isso é a utility **`label`** de `src/styles/global.css`; pedir só o tamanho (`text-label`) produziria 15px em caixa normal na serifada — a exceção sem nenhuma das condições que a justificam —, então `text-label` foi endurecida para emitir o pacote inteiro. Não existe caminho curto para 15px em caixa normal.
3. **Contraste AAA (7:1)** no texto corrido, acima do AA pedido no brief. Vista cansada perde cinza claro antes de perder tamanho.
4. **Caixa-alta só em rótulo curto**, tracking `--calu-ls-label`. Nunca caixa-alta em frase ou em credencial.
5. **Alvo de 52px** (`--calu-target`), 56px na ação principal. Dois alvos adjacentes exigem separador visual.
6. **Nada depende de hover** nem de ícone sozinho. Toda ação tem palavra: "Ver detalhes", não uma seta solta.
7. **Telefone com o mesmo peso do WhatsApp**, em todo bloco de contato e no header desktop. Parte desse público liga.
8. **Frase curta, zero jargão.** "Traumato-ortopedia" → "dor e lesão de ombro, joelho e coluna". Termo técnico só onde é obrigatório (registro CREFITO).
9. **Link em texto corrido é sublinhado**, não só colorido.

## 3. Restrição regulatória (CFF/CREFITO) — trava de produto

O site **não pode** conter, nem como campo opcional no CMS:
- foto antes/depois;
- depoimento de paciente ou relato de resultado;
- promessa de cura ou garantia de resultado;
- superlativo ("melhor da cidade", "referência em");
- preço em destaque.

A credibilidade se constrói por outro caminho, e o código precisa dar lugar a isso: **formação da equipe, registro CREFITO ativo, estrutura do studio, explicação do método**. O rodapé exibe sempre a responsável técnica com número de registro.

Se alguém pedir um componente `<Testimonial>`, a resposta é não.

## 4. Tipografia

- Família única: **Source Serif 4** (variável), pesos **400 e 600 apenas**. Fallback: `ui-serif, Georgia, "Times New Roman", serif`.
- Rótulos em caixa-alta usam a **sans do sistema** (`--calu-font-label`) — sem download extra.
- Carregar com `font-display: swap` e `preconnect`; ou self-host o `.woff2` variável (preferível).
- Escala em `clamp()`: um token serve mobile e desktop, sem duplicar breakpoint.
- A escala tem **dez** tamanhos, não oito: além de display/h1/h2/h3/lead/body/small/label existem `--calu-fs-lockup` (25→28px, o "CaLu" do Header) e `--calu-fs-question` (21→22px, o `<summary>` do FaqItem). Os dois caíam entre `lead` e `h3` e viravam arbitrary value se não tivessem nome.
- **Título quebra palavra.** `h1..h6` levam `overflow-wrap: break-word` + `hyphens: auto` (que funciona porque o `<html>` declara `lang="pt-BR"`). Não é polimento: a 320px — o mínimo que a WCAG 1.4.10 exige, não os 360px do mockup — a caixa útil é 280px, e em `--calu-fs-display` "Acompanhamento" mede 322px, "condicionamento" 306px e "desenvolvimento" 301px. `text-wrap: balance` não quebra palavra.
- **Todo título é peso 600.** Na implementação a regra precisa de seletor nu (`h1, h2, …`), nunca `:where(h1, …)`: o Preflight do Tailwind emite `h1…h6 { font-weight: inherit }` na mesma camada com especificidade (0,0,1), e contra `:where()` — que vale (0,0,0) — é ele quem ganha. Com `:where()` o site inteiro renderizava títulos em 400 com a cor certa.

## 5. Layout

- Mobile-first, base **360px**. Breakpoints: **600 / 900 / 1280**.
- **600px (`sm:`) não tem nenhuma tela desenhada** — 5 das 6 telas do mockup existem só em
  360 e 900px. Regra pra não inventar layout no vácuo: em `sm:` só acontecem duas coisas — a
  coluna de leitura solta para a medida máxima, e listas passam de 1 para 2 colunas. Qualquer
  mudança estrutural real (grid, colunas lado a lado, sidebar) só acontece em `md:` (900px),
  que tem tela desenhada.
- Coluna de leitura travada em `--calu-measure` (68ch) mesmo em telas largas. **68ch é de texto**: como todo elemento é `border-box`, o contêiner que aplica o gutter soma `2 × gutter` ao `max-width` — senão a coluna real cai para ~59ch e a resposta de FAQ especificada em 64ch (`--calu-answer`) nunca cabe.
- **Container query, não só breakpoint.** Breakpoint responde à viewport; um card que vive em 1 coluna na Home e em linha no índice responde à **própria largura**. Dois limiares nomeados, e nenhum número solto no componente: `--calu-ct-thumb` (26rem/416px — cabe uma miniatura ao lado do texto: `ProfessionalBio` compacto) e `--calu-ct-row` (34rem/544px — cabe uma imagem 16/9 ao lado do texto: `ServiceCard` no índice de serviços). Continua valendo que **mudança estrutural de PÁGINA** só acontece em `md:`.
- **`--calu-header-h` (88px) é o orçamento de rolagem da página**, aplicado como `scroll-padding-top` no elemento de rolagem — não como `scroll-margin-top` em `:target`. A âncora é só um dos quatro caminhos; Tab, `scrollIntoView()` e restauração de foco também param elementos debaixo do header sticky, e o critério aqui é o **2.4.12 (AAA)**: nenhuma parte do elemento focado pode ficar coberta. Todo elemento sticky que entrar (`FaqIndex`, `ServiceAside`) entra nesse mesmo orçamento.
- Grid e flex com `gap`. Nunca margem em irmão para espaçar lista.
- **CLS zero**: toda imagem com `width`, `height` e `aspect-ratio` declarados. Proporções canônicas: hero 3/4 (mobile) e 4/5 (desktop), card 16/9, retrato 4/5, mapa 3/2.

## 6. Resiliência de conteúdo (CMS)

O layout não pode quebrar quando um editor não-técnico mexer. Todo componente precisa aguentar:

- título com **3× o tamanho previsto** (`text-wrap: balance`, sem `white-space: nowrap`, sem altura fixa);
- lista com **2 ou 8 itens** (sem grid de 3 fixo — use `auto-fit`/coluna única);
- **imagem ausente** → placeholder de marca (símbolo sobre `--calu-surface-brand`) na mesma proporção, nunca espaço em branco nem quebra;
- **seção inteira vazia** → não renderiza; se for uma página inteira, entra o estado vazio com CTA de contato;
- texto colado do Word com espaço duplo e aspas curvas.

## 7. Temas

Claro e escuro são **os mesmos tokens com outro valor**. Nenhum componente muda de marcação entre temas. O que muda de regra:

- dourado vira a cor de ação no escuro; bronze deixa de existir;
- verde inverte de papel: bloco no claro, fundo no escuro;
- sombra não existe no escuro — elevação é superfície mais clara + linha. O token vale **`0 0 #0000`** (sombra transparente), **nunca `none`**: `none` no meio da lista de `box-shadow` que o compilador monta é inválido e derruba a declaração inteira, levando junto o halo de foco (`ring-*`) do mesmo elemento;
- **`--calu-brand-tint` inverte de direção**: no claro é uma superfície de hover mais CLARA que o fundo; no escuro é mais ESCURA. Não é escolha estética. Com as frentes claras do tema escuro, o piso de 7:1 só admite fundo abaixo de uma luminância que `--calu-surface` já ocupa — a faixa "mais clara que o `bg` e ainda AAA" está tomada pelo card. O melhor tint elevado possível ficaria a ΔE00 0.47 de `--calu-surface`, isto é, indistinguível dele. Rebaixado, mantém o matiz da família e separa melhor de ambos (ΔE00 5.60 do `bg`, 7.29 do `surface`);
- fotos do ensaio são claras: no escuro o hero leva máscara `--calu-surface-deep` no rodapé e os cards ganham borda.

Padrão inicial = `prefers-color-scheme`; escolha do usuário persiste em `localStorage['calu-theme']`; `theme-init.js` inline no `<head>` evita o flash.

## 8. Movimento

Transições de 150ms em cor/fundo. Sem parallax, sem reveal on scroll, sem carrossel com autoplay. Respeitar `prefers-reduced-motion`.
