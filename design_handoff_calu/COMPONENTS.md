# Componentes

Ordem de construção sugerida: **primitivos → blocos → seções → páginas**. Cada um isolado, testado e sem conhecimento da página que o usa.

Regra geral: componente **não** define margem externa nem largura de página. Quem posiciona é o container/seção. Todo componente aceita `class` e repassa atributos.

Regra transversal de foco: todo elemento sticky (`Header`, `FaqIndex`, `ServiceAside`) entra no orçamento de `scroll-padding-top` da página, para que o elemento focado por teclado não fique escondido atrás dele.

---

## Primitivos

### Skip link
Primeiro elemento focável do `<body>`, antes do `Header`. Escondido até receber foco (deslocado para fora da tela, nunca `display: none`), alvo de 52px quando visível, aponta para `<main id="conteudo" tabindex="-1">`. Existe no código (`BaseLayout`) — este documento só faltava registrá-lo como primitivo.
**Teste**: primeiro Tab da página foca o skip link; ativá-lo move o foco para `<main>`.

### Button / ButtonLink
Variantes: `primary` (fundo `--calu-accent`, texto `--calu-on-accent`), `secondary` (borda `--calu-brand`, fundo transparente), `ghost` (só texto).
Tamanhos: `md` = `--calu-target` (52px), `lg` = `--calu-target-primary` (56px).
Estados: hover (`--calu-accent-hover` / `--calu-brand-tint`), focus-visible (outline 3px `--calu-focus-ring`, offset 2px), disabled (`--calu-disabled-bg` + `--calu-disabled-text`, `cursor: not-allowed`), loading (texto "Enviando…", `aria-busy`).
O botão **não** sabe em que superfície está: o `offset: 2px` joga o anel no fundo atrás dele, e quem re-declara `--calu-focus-ring` em bloco escuro é o `data-surface` do bloco (`tokens.css`, "foco escopado"). Não criar variante `on-dark` do Button por causa de foco.
Raio `--calu-radius-1`. Peso 600. Nunca menor que 52px de altura.
**Teste**: altura ≥52px em todas as variantes; contraste do par fundo/texto ≥4,5:1 nos dois temas; foco visível.

### Link
Em texto corrido: cor `--calu-brand` + `text-decoration: underline`, `text-underline-offset: 3px`. Fora de texto (nav, card): sem sublinhado, mas com alvo ≥52px.

### Label (rótulo de seção)
Caixa-alta, `--calu-fs-label`, `--calu-font-label`, peso 600, tracking `--calu-ls-label`, cor `--calu-text-muted`. **Máximo 3 palavras.** Se o texto crescer, o componente deve degradar para caixa normal em `--calu-fs-small` em vez de virar um bloco de caixa-alta.
O texto vem do CMS em **caixa normal** — a caixa-alta é só `text-transform: uppercase` na apresentação, nunca a forma armazenada. Se a pessoa editora digitar já em maiúsculas, leitores de tela como o VoiceOver soletram letra por letra em vez de ler a palavra.

### Credential
Exibe "Fisioterapeuta · CREFITO-3/000000-F". `--calu-fs-small` (17px), **caixa normal**, peso 600, cor `--calu-text-muted`. Nunca caixa-alta, nunca abaixo de 17px — é a informação que sustenta a confiança.

### FieldText / FieldSelect / FieldTextarea
`<label>` sempre visível (nunca placeholder como rótulo), `--calu-fs-small` peso 600. Input 52px, borda `--calu-input-border`, raio 4, fonte 19px.
Foco: borda `--calu-brand` + halo 3px `--calu-focus-halo`.
Erro: borda 2px `--calu-error`, mensagem abaixo em `--calu-error`, `aria-describedby` + `aria-invalid`. **Não existe token de borda de erro** — `--calu-error-border` foi removido por reprovar a WCAG 1.4.11 em quase toda superfície; a borda de erro é `--calu-error` mesmo (9,36:1 sobre `--calu-input-bg` no claro, 7,78:1 no escuro).
Opcional marcado no label ("E-mail (opcional)") — nunca asterisco solto. Campo obrigatório leva o atributo `required`: é o sinal programático; a marcação visual cobre o caso oposto (opcional), não o substitui.

### AspectImage
Recebe `src`, `alt` (`string`, **obrigatório no tipo** — não opcional; imagem decorativa usa a prop `decorative`, que força `alt=""` de forma explícita, nunca um `alt` opcional que vira string vazia por omissão e fica indistinguível de esquecimento), `ratio`, `sizes`. Renderiza `width`/`height` e `aspect-ratio` sempre. **Sem `src` → `BrandPlaceholder`** na mesma proporção (símbolo do logo sobre `--calu-surface-brand`), sempre decorativo — `alt=""` + `aria-hidden="true"`, porque é ausência de foto, não informação. `loading="lazy"` exceto no hero (`fetchpriority="high"`).
**Teste**: sem imagem não colapsa altura; CLS = 0; toda imagem não decorativa chega ao build com `alt` preenchido.

### ThemeToggle
Dois botões de 52px dentro de pílula, ou um botão com `aria-pressed`. Persiste em `localStorage['calu-theme']`. Fica no header, nunca só no rodapé.

### ContactPair
Par WhatsApp + telefone com o **mesmo peso visual** — mesmo tamanho e peso de fonte, mesmo tratamento de ícone (nenhum dos dois só ícone). Marcado com o atributo `data-contact-pair` no elemento que envolve o par.
Usado em todo bloco de contato: header desktop, `CtaBlock`, topo do `ContactForm`, `FamilyBlock`, `Footer`, `EmptyState`.
**Teste**: em todo `[data-contact-pair]`, `font-size` e `font-weight` computados de WhatsApp e telefone são iguais — é o que torna a regra 7 do `DESIGN-SYSTEM.md` ("telefone com o mesmo peso do WhatsApp") verificável.

---

## Blocos

### Header + MobileNav
Lockup: medalhão circular (`--calu-surface-deep`, 46–52px) com o símbolo + "CaLu" em 25–28px + assinatura "Pilates e Fisioterapia" em 15px **caixa normal**.
**Correção**: na implementação, a assinatura "Pilates e Fisioterapia" sai em `text-small` (17px, caixa normal), não em 15px. `--calu-fs-label`/`text-label` foi endurecido de propósito para SEMPRE emitir caixa-alta (DESIGN-SYSTEM §2.2: "não existe 15px de texto no site" fora desse pacote fechado, e "a exceção nunca vem sozinha" — 15px só é legítimo junto com caixa-alta, `--calu-font-label`, tracking e peso 600); criar um segundo token de 15px em caixa normal contradiria essa regra explícita e reabriria exatamente o buraco que o endurecimento fechou. `text-small` já existe, já é caixa normal, e já está coberto pelo piso tipográfico testado do projeto — ver `src/components/blocks/Header.astro`.
Mobile: botão "Menu" (palavra, não hambúrguer sozinho) com `aria-expanded` e `aria-controls` apontando para o `id` do painel; painel com links de 52px empilhados e CTA WhatsApp no fim.
Painel aberto: o restante da página recebe `inert` — é isso que torna a prisão de foco real, em vez de um laço de `keydown` tentando recapturar o Tab. Fechar (Esc, clique fora ou seleção de um link) devolve o foco ao botão que abriu o menu.
Trava de rolagem do body, se existir enquanto o painel está aberto, não pode usar `position: fixed` no `<body>` — perde a posição de rolagem e quebra o refluxo ao reabrir.
Desktop: nav inline (`aria-label="Principal"`) + **telefone visível** + botão WhatsApp.
Cada `<nav>` da página declara um `aria-label` distinto do outro (aqui "Principal", no rodapé "Rodapé") — vai haver mais de um `<nav>` na página, e a regra `landmark-unique` do axe reprova dois sem rótulo que os diferencie.
Sticky com fundo sólido (`--calu-bg`), nunca translúcido.
**Teste**: navegação por teclado abre/fecha o menu; com o painel aberto, o resto da página fica `inert` e o foco não escapa dele; Esc fecha e devolve o foco ao botão "Menu".

### Hero
Mobile: imagem 3/4 no topo, painel de texto sobrepondo −40px com fundo `--calu-bg`. **A legenda/conteúdo da imagem precisa de padding inferior ≥56px** para não ficar atrás do painel.
Desktop: grid 1fr/1fr, texto à esquerda, imagem 4/5 à direita.
Título `--calu-fs-display`, `text-wrap: balance`, máx. 14ch no desktop. Dois CTAs: WhatsApp (primary) + secundário.

### ChooserBlock
Bloco "Não sabe qual escolher?" no topo do índice de serviços, antes da lista de `ServiceCard`. Texto curto reconhecendo a dúvida + CTA de conversa (WhatsApp, palavra explícita, nunca só ícone) em vez de forçar a escolha sozinho.
**Teste**: CTA com palavra visível; alvo ≥52px.

### ServiceCard
Ordem obrigatória: **frase em português comum** ("Estou com dor em algum lugar") → nome técnico (h2/h3) → descrição → "Ver detalhes".
Imagem 16/9 com fallback de marca. Card inteiro clicável, mas com texto de ação explícito — o link real é o "Ver detalhes", e a área clicável do card inteiro vem de um `::after` posicionado sobre o card (padrão *link estendido*), **nunca** um `<a>` envolvendo todo o conteúdo do card: isso produziria um nome acessível com o card inteiro (frase + nome técnico + descrição lidos como um link só).
Aguenta título de 3 linhas.

### ServiceAside
Aside do template de Serviço, sticky no desktop (empilha depois do conteúdo principal no mobile, sem sticky/fixed). Três blocos: Resumo (as chaves presentes de `ficha` — `duracao`, `turma`, `roupa`, `pedidoMedico`, `local`, `frequencia`), Quem conduz (retrato pequeno + nome + `Credential` de `profissional`, quando houver) e CTA (`ContactPair` + botão).
**Estados**: chave de `ficha` ausente não renderiza linha vazia; sem `profissional`, o bloco "Quem conduz" não aparece.
**Teste**: sticky não sobrepõe o footer nem ultrapassa a viewport; em mobile sai do fluxo sticky e aparece após o conteúdo.

### ProfessionalBio
Retrato 4/5 (com fallback), nome (h2/h3), `Credential`, parágrafo do que atende, lista de formação com **1 a 6 itens**.
Mobile: empilhado, retrato de 112px ao lado do texto em contextos compactos; nunca duas colunas espremidas em 360px.

### FaqAccordion / FaqItem
Padrão: `<details>/<summary>`, não o par `aria-expanded`/`aria-controls` de botão+painel — os dois são mutuamente exclusivos, e o vocabulário do projeto (`[&_summary]:hidden`) já aponta pra cá. `<details>` funciona sem JS, coerente com o inviolável "nada depende de framework JS para funcionar"; o trade-off aceito é menos controle sobre a animação de abrir/fechar e sobre o anúncio em leitores de tela mais antigos, que nem sempre falam "expandido"/"recolhido" pra esse elemento.
Cada pergunta é um `<h3>` **dentro** do `<summary>`, e não o contrário — para a navegação por cabeçalhos do leitor de tela alcançar cada pergunta sem quebrar o elemento. `<summary>` de 64px, sinal +/− em `--calu-accent` marcado `aria-hidden="true"`: o estado é comunicado só pela semântica nativa de abertura, não pelo sinal.

**Correção (Fase 2).** Este documento pedia o inverso — `<summary>` dentro de um `<h3>` — e isso **não funciona**. O modelo de conteúdo de `<details>` é "um `<summary>` seguido de conteúdo de fluxo", com o `<summary>` como **primeiro filho**; com um `<h3>` no meio, o `<details>` fica sem `summary` nenhum, o navegador sintetiza o próprio marcador ("Detalhes") e o texto da pergunta some junto com o resto do conteúdo quando o item está fechado. O caminho certo inverte o aninhamento: `<details><summary><h3>…</h3></summary>`. É válido — o modelo de conteúdo de `<summary>` aceita explicitamente conteúdo de cabeçalho — mantém o `<summary>` como primeiro filho, e preserva a navegação por cabeçalhos que era a intenção original. O mockup não tem nenhum `<details>`, então a divergência nunca apareceu na referência visual.
**Não é exclusivo**: abrir um não fecha o outro — cada `<details>` fica sem atributo `name` compartilhado. Primeiro item de cada grupo aberto por padrão (`open` no `<details>`).
Painel fechado sai do fluxo pelo comportamento nativo do `<details>` — nunca `height: 0` + `overflow: hidden`, que deixa o conteúdo alcançável por Tab e por leitor de tela mesmo escondido visualmente. Resposta em 19px, `line-height: 1.7`, máx. 64ch.
**Teste**: Enter e Espaço alternam (nativo do `<summary>`); estado inicial correto; conteúdo do painel some do fluxo de foco e da árvore de acessibilidade quando fechado.

### FaqIndex
Índice lateral sticky do FAQ no desktop, com os três grupos (Antes de começar / No dia a dia do tratamento / Pagamento e recibo) como âncoras. Some no mobile — lá a navegação é rolar pelos grupos direto.
**Estados**: grupo em foco na rolagem tem indicador visual que não depende só de cor.
**Teste**: sticky não cobre conteúdo com foco de teclado; links de âncora com alvo ≥52px.

### CtaBlock
Duas skins: `deep` (fundo `--calu-surface-deep`, CTA dourado) e `brand` (fundo `--calu-surface-brand`). Título, apoio, **WhatsApp + telefone** (`ContactPair`).
Na skin `brand` existe **um único nível de texto**: `--calu-text-on-brand` (8,20:1) para título, apoio e `ContactPair`. Nenhum cinza-esverdeado do sistema chega a 7:1 sobre `--calu-surface-brand` (#3E4A3C) — `--calu-text-on-deep-2` dá 4,87:1, e os candidatos mais claros medidos (#CED2C3, #D5D9CA) param em 6,06 e 6,49. O limite é a superfície, não a paleta: **a hierarquia dentro dessa skin vem de tamanho e peso, não de tom.** Na skin `deep` a escada de três tons continua valendo (`on-deep` / `on-deep-2` / `on-deep-3`).
Os dois blocos são superfície escura: declaram `data-surface="deep"` / `data-surface="brand"`, que re-escopa o anel de foco (ver `tokens.css`, "foco escopado").
**Teste**: com `data-surface`, o anel de foco de todo controle interno mede ≥3:1 contra o fundo do bloco nos dois temas.

### ContactForm
O componente mais sensível a improviso — aqui a especificação é longa de propósito.
Campos: Nome (`autocomplete="name"`), Telefone/WhatsApp (`autocomplete="tel"`), E-mail opcional (`autocomplete="email"`), **"Para quem é o atendimento"** (Para mim / Para meu pai ou minha mãe / Para outra pessoa da família), Interesse, Mensagem. `autocomplete` correto não é polimento (WCAG 1.3.5, AA): para o público de 60–75 anos, é a diferença entre enviar e desistir no meio do preenchimento.
Se "Para quem é o atendimento" for grupo de rádio, vive em `<fieldset>` com `<legend>` visível — sem isso as três opções ficam órfãs da pergunta (1.3.1), soltas pra quem navega por leitor de tela.
Estados: idle; erro por campo + resumo no topo; enviando; sucesso (bloco de confirmação com prazo de resposta e atalho de WhatsApp).
**Correção**: enviando usa `aria-disabled="true"` no botão + bloqueio do submit no handler, **nunca** o atributo `disabled` — `disabled` tira o botão da ordem de foco e o foco do usuário se perde no meio do envio. Não reintroduzir `disabled` aqui.
Erro por campo é sempre a soma de três sinais, nunca cor sozinha: texto da mensagem nomeando o campo ("Informe seu telefone", nunca "Campo obrigatório" — WCAG 3.3.1), borda 1px→2px, `aria-invalid="true"`. Ícone é opcional; se entrar, `aria-hidden`.
Resumo de erro: `<div tabindex="-1">` com `<h2>` ("Não foi possível enviar") e `<ul>` — cada item é um link para o `id` do campo com erro. Recebe `.focus()` no submit inválido, com estilo próprio em **`:focus`, não só `:focus-visible`**: em Chrome, um contêiner com `tabindex="-1"` focado via script não casa `:focus-visible`, e o resumo ficaria sem anel.
Validação nativa + JS mínimo. Honeypot anti-spam escondido com `display: none` — **nunca** `sr-only` ou `clip-path`, que deixam o campo acessível ao leitor de tela: a pessoa preenche e é barrada como spam — mais `tabindex="-1"`, `aria-hidden="true"` e `autocomplete="off"`. Sem captcha visual.
**Teste**: submit sem telefone mostra erro acessível (texto + borda + `aria-invalid`) e move o foco para o resumo; sucesso é anunciado (`role="status"`).

### LocationBlock ("Onde estamos")
Mapa estático 3/2 (`AspectImage`, fallback de marca — nunca embed interativo, custa JS e CLS) + endereço.
**Estados**: sem imagem de mapa → `BrandPlaceholder` na mesma proporção 3/2, nunca colapsa a altura.
**Teste**: CLS = 0 mesmo sem imagem; link/CTA de rota com alvo ≥52px.

### AccessList ("Como é chegar aqui")
Lista de linhas: degrau, elevador, banheiro adaptado, estacionamento, metrô, acompanhante. Fecha com "Precisa de alguma adaptação? Avise antes."
Cada item é conteúdo do CMS — a lista aceita 2 a 8 itens.

### FamilyBlock ("Está procurando para seu pai ou sua mãe?")
Bloco dedicado ao filho adulto. Texto + 3 garantias + WhatsApp e telefone.

### Footer
Logo lockup (versão transparente sobre escuro), endereço, telefone, horário, navegação (`aria-label="Rodapé"`; links de **52px**, `--calu-target` — sem exceção para rodapé; o mockup violava isso em 5 lugares), e **responsável técnica com CREFITO em 17px**.
Fundo `--calu-surface-deep`: declara `data-surface="deep"` para re-escopar o anel de foco (`tokens.css`, "foco escopado"). Sem isso, no tema claro o foco de teclado nos links e no `ContactPair` fica em 1,78:1 — invisível.

### WhatsAppFab
Pílula fixa no canto inferior direito com a **palavra** "WhatsApp", 56px, `--calu-shadow-float`. Não cobre conteúdo: o `<main>` recebe `padding-bottom` equivalente. Some quando o CTA principal está visível (opcional, via IntersectionObserver).
Nunca se esconde enquanto tem foco, e nunca sobrepõe um controle focado: o projeto mira AAA, e o critério aqui é o **2.4.12 (Foco Não Obscurecido — Aprimorado)** — nenhuma parte do elemento com foco pode ficar coberta. A pílula de 56px no canto inferior direito é candidata a cobrir um controle que pare ali durante a rolagem por teclado; o esconder-se via IntersectionObserver precisa checar isso, não só a visibilidade do CTA principal.

### EmptyState
Estado vazio genérico: símbolo de marca + frase curta explicando a situação (ex.: "Estamos organizando esta página") + CTA de contato (`ContactPair`). Usado sempre que uma lista do CMS vem vazia — índice de serviços sem itens, índice do blog sem posts — ou quando uma página inteira ainda não tem conteúdo.
**Estados**: um único estado visual; texto e destino do CTA variam por contexto via prop.
**Teste**: renderiza sem depender de nenhum item de lista/imagem; CTA sempre focável e ≥52px.

### PostCard *(blog — sem posts no lançamento)*
Data + categoria, título, resumo. Índice do blog precisa de `EmptyState` pronto.
