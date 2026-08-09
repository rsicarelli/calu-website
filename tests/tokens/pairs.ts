/* Contrato de contraste do design system.
   ============================================================================
   Estas tabelas são o CONTRATO revisável: cada par declara uma combinação que a
   interface realmente produz, e o `contrast.test.ts` mede todas elas nos dois
   temas. Par que não está aqui não é testado — por isso cada entrada carrega
   ONDE ela aparece, para que a revisão consiga julgar se falta alguma.

   Adicionar par é barato; remover par exige justificar que a combinação sumiu
   da interface.

   Cobertura por EIXO DE SUPERFÍCIE, não por token solto: para cada superfície
   opaca do sistema (`bg`, `surface`, `surface-alt`, `surface-brand`,
   `surface-deep`, `brand-tint`, `field-bg`, `error-bg`, `disabled-bg`) a tabela
   precisa dizer o que pode pousar em cima dela. Foi a ausência do eixo
   `surface-brand`/`surface-deep` para o anel de foco que deixou passar um anel
   de 1.01:1 no tema claro. */

export type ContrastPair = {
  /** Token da cor de frente (texto, borda, anel de foco). */
  readonly fg: string;
  /** Token da superfície atrás dela. Precisa ser opaco. */
  readonly bg: string;
  /** Onde a combinação aparece na interface. */
  readonly where: string;
};

/** Texto corrido — piso 7:1 (WCAG 2.2 AAA, 1.4.6).
 *  AAA é requisito do projeto, não meta: o público inclui a faixa 60–75 lendo no celular. */
export const TEXT_PAIRS: readonly ContrastPair[] = [
  // Títulos (h1–h6 recebem `--color-ink` no @layer base).
  { fg: '--color-ink', bg: '--color-bg', where: 'título sobre o fundo da página' },
  {
    fg: '--color-ink',
    bg: '--color-surface',
    where: 'título dentro de card (ServiceCard, FaqItem)',
  },
  {
    fg: '--color-ink',
    bg: '--color-surface-alt',
    where: 'título de bloco sobre a faixa creme (FamilyBlock, AccessList, ChooserBlock)',
  },
  {
    fg: '--color-ink',
    bg: '--color-brand-tint',
    where: 'link do MobileNav e da nav do Header em hover/foco — brand-tint é o fundo do estado',
  },
  {
    fg: '--color-ink',
    bg: '--color-field-bg',
    where: 'texto que a pessoa digita no FieldText/FieldTextarea',
  },
  {
    fg: '--color-ink',
    bg: '--color-error-bg',
    where: 'título do resumo de erros no topo do ContactForm',
  },

  // Corpo — a cor default do <body>.
  { fg: '--color-ink-body', bg: '--color-bg', where: 'texto corrido de seção' },
  { fg: '--color-ink-body', bg: '--color-surface', where: 'resposta de FAQ e corpo de card' },
  {
    fg: '--color-ink-body',
    bg: '--color-surface-alt',
    where: 'texto corrido dentro da faixa creme (FamilyBlock, AccessList)',
  },
  {
    fg: '--color-ink-body',
    bg: '--color-brand-tint',
    where: 'texto de item de lista sob hover (FaqIndex, AccessList) — fundo brand-tint',
  },
  {
    fg: '--color-ink-body',
    bg: '--color-field-bg',
    where: 'valor de FieldSelect e texto longo de FieldTextarea',
  },
  {
    fg: '--color-ink-body',
    bg: '--color-error-bg',
    where: 'corpo do resumo de erros — a lista de campos que faltaram',
  },

  // Meta: rótulo de seção, credencial CREFITO, data de post.
  {
    fg: '--color-ink-muted',
    bg: '--color-bg',
    where: 'rótulo de seção e Credential sobre o fundo',
  },
  { fg: '--color-ink-muted', bg: '--color-surface', where: 'meta dentro de card' },
  {
    fg: '--color-ink-muted',
    bg: '--color-surface-alt',
    where: 'meta sobre a faixa creme (AccessList, FamilyBlock)',
  },
  {
    fg: '--color-ink-muted',
    bg: '--color-field-bg',
    where: 'texto de ajuda e dica de formato dentro do campo (nunca placeholder como rótulo)',
  },
  {
    fg: '--color-ink-muted',
    bg: '--color-brand-tint',
    where: 'meta sobre linha em hover — brand-tint é o fundo do estado hover/foco',
  },

  // Marca: link em texto corrido e link de navegação.
  { fg: '--color-brand', bg: '--color-bg', where: 'link sublinhado em prosa' },
  { fg: '--color-brand', bg: '--color-surface', where: 'link dentro de card' },
  {
    fg: '--color-brand',
    bg: '--color-surface-alt',
    where: 'link dentro da faixa creme (AccessList, FamilyBlock)',
  },
  {
    fg: '--color-brand',
    bg: '--color-brand-tint',
    where: 'rótulo do Button secondary/ghost em hover e foco — brand-tint é a superfície do estado',
  },

  // Superfícies escuras — CtaBlock skin `brand`, CtaBlock skin `deep`, Footer, medalhão do lockup.
  //
  // `surface-brand` tem UM nível de texto e só um: nenhum tom cinza-esverdeado do sistema
  // chega a 7:1 sobre #3E4A3C (`ink-on-deep-2` dá 4.87:1; os candidatos mais claros medidos,
  // #CED2C3 e #D5D9CA, param em 6.06 e 6.49). Dentro da skin `brand` a hierarquia vem de
  // tamanho e peso — ver COMPONENTS.md § CtaBlock e o comentário do token no global.css.
  {
    fg: '--color-ink-on-brand',
    bg: '--color-surface-brand',
    where: 'CtaBlock skin brand — título, apoio e ContactPair, todos no mesmo tom',
  },
  {
    fg: '--color-ink-on-deep',
    bg: '--color-surface-deep',
    where: 'título do Footer e do CtaBlock deep',
  },
  {
    fg: '--color-ink-on-deep-2',
    bg: '--color-surface-deep',
    where: 'texto de apoio no Footer (endereço, horário)',
  },
  {
    fg: '--color-ink-on-deep-3',
    bg: '--color-surface-deep',
    where: 'meta do Footer — responsável técnica com CREFITO em 17px',
  },

  // Erro do ContactForm: mensagem abaixo do campo e resumo no topo do formulário.
  { fg: '--color-error', bg: '--color-bg', where: 'mensagem de erro sob o campo' },
  { fg: '--color-error', bg: '--color-surface', where: 'mensagem de erro dentro de card' },
  {
    fg: '--color-error',
    bg: '--color-surface-alt',
    where: 'mensagem de erro de formulário embutido na faixa creme',
  },
  { fg: '--color-error', bg: '--color-error-bg', where: 'resumo de erros no topo do formulário' },
  {
    fg: '--color-error',
    bg: '--color-brand-tint',
    where: 'mensagem de erro em campo cujo Button secondary/ghost vizinho está em hover/foco',
  },

  // Dourado do logo: só sobre superfície escura, e é fundo — o texto por cima é o quase-preto.
  {
    fg: '--color-on-accent-deep',
    bg: '--color-accent-deep',
    where: 'rótulo sobre o CTA dourado do CtaBlock deep',
  },
];

/** Rótulo de botão — piso 4.5:1 (WCAG 2.2 AA, 1.4.3).
 *
 *  Por que 4.5 e não 7: o rótulo do Button é 19px com peso 600. A WCAG classifica como
 *  "texto grande" a partir de 14pt (18.66px) em negrito, e nessa faixa o piso AA é 3:1 e o
 *  AAA é 4.5:1. Ou seja, 4.5 aqui JÁ É o nível AAA para este tamanho — não é uma exceção à
 *  regra do projeto, é a mesma regra aplicada ao degrau certo da tabela.
 *  Se algum dia o rótulo cair abaixo de 18.66px ou perder o peso 600, este piso vira 7. */
export const UI_TEXT_PAIRS: readonly ContrastPair[] = [
  {
    fg: '--color-on-accent',
    bg: '--color-accent',
    where: 'rótulo do Button primary (CTA WhatsApp)',
  },
  {
    fg: '--color-on-accent',
    bg: '--color-accent-hover',
    where: 'rótulo do Button primary em hover',
  },
];

/** Componente de interface e estado de foco — piso 3:1 (WCAG 2.2 AA, 1.4.11).
 *  Não é texto: é a borda que diz onde o campo começa e o anel que diz onde o teclado está.
 *
 *  Controle desabilitado fica de fora por decisão da própria norma — 1.4.11 isenta componente
 *  inativo —, e não por folga: no claro `disabled-bg` é o mesmo hex de `surface-alt`, no escuro
 *  o mesmo de `surface`, então os pares abaixo já cobrem o valor medido. */
export const NONTEXT_PAIRS: readonly ContrastPair[] = [
  // ---- Borda do campo: onde o campo começa. Precisa passar em toda superfície que possa
  // estar atrás de um formulário, e `brand-tint` entra porque é o fundo do estado
  // hover/foco de secondary e ghost, que convivem com os campos no ContactForm.
  {
    fg: '--color-field-border',
    bg: '--color-field-bg',
    where: 'borda do FieldText contra o preenchimento do próprio campo',
  },
  {
    fg: '--color-field-border',
    bg: '--color-surface',
    where: 'borda do FieldText contra o card que envolve o formulário',
  },
  {
    fg: '--color-field-border',
    bg: '--color-bg',
    where: 'borda do FieldText quando o formulário fica direto sobre o fundo da página',
  },
  {
    fg: '--color-field-border',
    bg: '--color-surface-alt',
    where: 'borda do FieldText dentro de bloco na faixa creme',
  },
  {
    fg: '--color-field-border',
    bg: '--color-brand-tint',
    where: 'borda de controle sobre o fundo de hover/foco de secondary e ghost',
  },
  {
    fg: '--color-field-border',
    bg: '--color-error-bg',
    where: 'borda dos campos dentro do bloco de resumo de erros',
  },

  // ---- Anel de foco. O `outline-offset: 2px` faz o anel cair na superfície ATRÁS do
  // controle, então o eixo aqui é a lista completa de superfícies opacas — é exatamente o
  // buraco por onde passou um anel de 1.01:1 sobre `surface-brand` no tema claro.
  { fg: '--color-focus-ring', bg: '--color-bg', where: 'anel de foco sobre o fundo da página' },
  { fg: '--color-focus-ring', bg: '--color-surface', where: 'anel de foco sobre card' },
  {
    fg: '--color-focus-ring',
    bg: '--color-surface-alt',
    where: 'anel de foco sobre a faixa creme (AccessList, FamilyBlock, ChooserBlock)',
  },
  {
    fg: '--color-focus-ring',
    bg: '--color-brand-tint',
    where: 'anel de foco no controle secondary/ghost já em hover — fundo brand-tint',
  },
  {
    fg: '--color-focus-ring',
    bg: '--color-field-bg',
    where: 'anel de foco encostado no preenchimento do campo',
  },
  {
    fg: '--color-focus-ring',
    bg: '--color-error-bg',
    where: 'anel de foco no resumo de erros, que recebe foco programático no submit',
  },
  {
    fg: '--color-focus-ring',
    bg: '--color-disabled-bg',
    where: 'anel de foco em controle com aria-disabled, que continua focável',
  },

  // ---- Anel de foco dentro de bloco escuro. Token separado porque o valor é trocado pelo
  // contexto (`[data-surface]`, §6 do global.css) e não pelo tema: o componente não muda de
  // marcação, o bloco que pinta o fundo é quem re-escopa a custom property.
  {
    fg: '--color-focus-ring-on-dark',
    bg: '--color-surface-brand',
    where: 'anel de foco no ContactPair e nos links do CtaBlock skin brand',
  },
  {
    fg: '--color-focus-ring-on-dark',
    bg: '--color-surface-deep',
    where: 'anel de foco nos links de 52px do Footer e no CtaBlock skin deep',
  },
];

/** Pisos por tabela, na mesma ordem em que o teste as consome. */
export const TEXT_MIN = 7;
export const UI_TEXT_MIN = 4.5;
export const NONTEXT_MIN = 3;
