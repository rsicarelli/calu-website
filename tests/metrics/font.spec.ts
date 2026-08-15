/* A fonte de verdade carregou? — provavelmente a medição de maior retorno da Fase 5.
   ============================================================================================
   ISTO NÃO É PRECAUÇÃO, É REGRESSÃO. `CLAUDE.md`, Fase 4.1: "A fonte nunca tinha carregado, em
   máquina nenhuma atrás do proxy... três dos quatro woff2 serviam HTTP 500 com 0 byte e o navegador
   caía no fallback `Times New Roman` com `size-adjust: 142%` — de forma PERMANENTE, não como flash
   de swap." Meses assim, sem nenhum teste vermelho, porque nada no repositório era capaz de
   observar o que o navegador realmente pinta.

   E o estrago não parava na tipografia: "isto contaminava todo julgamento visual — uma fonte com
   contraste de traço e altura-x erradas faz cada decisão de espaço parecer errada junto". Foi o
   defeito que fez os outros seis parecerem outra coisa.

   ─────────────────────────────────────────────────────────────────────────────────────────────
   DUAS ARMADILHAS, as duas verificadas empiricamente contra o build real servindo woff2 de 0 byte
   — e as duas são o caminho ÓBVIO, que é por que valem estar escritas:

   1. `document.fonts.check('1em "Source Serif 4"')` devolve **true nos dois estados**. A Fonts API
      do Astro não registra a família com o nome humano: ela registra um nome COM HASH
      (`Source Serif 4-2fc36ccb90f50b86`) mais uma face `... fallback: Times New Roman` com
      `size-adjust`. Como nenhuma face se chama literalmente "Source Serif 4", o `check` cai no
      "essa família resolve para alguma coisa?" e responde sim sempre.

   2. `getComputedStyle(el).fontFamily` devolve a PILHA DECLARADA, nunca a face escolhida. Ela é
      idêntica com a fonte carregada e com a fonte quebrada — ler dali qual fonte está em uso é
      impossível por construção.

   O que DE FATO distingue os dois estados, medido:
     · `FontFace.status` — `loaded` com o arquivo bom, `error` com o arquivo quebrado.
     · A LARGURA do texto renderizado — 490px com a fonte real, 423,26px sem ela, que é exatamente
       a largura da família inexistente. Essa é a verdade de solo: se o texto mede o mesmo que
       mediria com uma família que não existe, então nenhuma face própria está desenhando nada.

   Os dois entram. O primeiro dá o DIAGNÓSTICO (qual arquivo falhou); o segundo dá a PROVA (o que
   a pessoa vê na tela). Sozinho, o primeiro passaria numa página que carregou a fonte e não a
   aplica; sozinho, o segundo diria "está errado" sem dizer o quê.

   ─────────────────────────────────────────────────────────────────────────────────────────────
   AS FACES `fallback:` FICAM DE FORA DO DIAGNÓSTICO, e isto foi descoberto medindo. Ao lado da
   face do webfont, a Fonts API do Astro gera faces de AJUSTE DE MÉTRICA que apontam para fontes do
   SISTEMA (`local("Times New Roman")`), com `size-adjust` — é o mecanismo que segura o CLS
   enquanto o woff2 não chega, e é o mesmo "size-adjust: 142%" citado na Fase 4.1.

   Em Linux headless, Times New Roman simplesmente não existe, então essas faces reportam `error`
   — e reportam de forma NÃO DETERMINÍSTICA, porque só são resolvidas quando alguém precisa delas.
   Cobrá-las mediria qual fonte está instalada na máquina que roda o teste, não o que o site
   publica; e uma trava que muda de resposta conforme o runner é a definição de teste que ensina a
   suíte a mentir. Cair para o `local()` do sistema é o COMPORTAMENTO PRETENDIDO de um fallback.

   O que o site controla é a face do webfont, e é ela que é cobrada. */

import { expect, test } from '@playwright/test';

import { PAGE_ROUTES } from './_routes';

/* O nome humano de `astro.config.mjs`. A família REAL no navegador tem hash e muda a cada build —
   por isso ela é sempre derivada da página, nunca escrita aqui. */
const FAMILY = 'Source Serif';

/* Uma família que garantidamente não existe: tudo que for medido com ela cai na fonte padrão do
   navegador, e é essa a largura de referência do "nada carregou". */
const ABSENT = '"__familia_que_nao_existe__"';

const PROBE = 'Fisioterapia e Pilates 1234';

for (const route of PAGE_ROUTES) {
  test(`${route} — a fonte do projeto carregou e está desenhando o texto`, async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);

    const medida = await page.evaluate(
      ([family, absent, probe]) => {
        /* Só as faces do WEBFONT: as `... fallback: <fonte do sistema>` do Astro são ajuste de
           métrica sobre `local()` e dependem da máquina — ver o cabeçalho. */
        const faces = [...document.fonts].filter(
          (f) => f.family.includes(family as string) && !f.family.includes('fallback:'),
        );

        const h1 = document.querySelector('h1');
        const pilha = h1 ? getComputedStyle(h1).fontFamily : null;

        let real: number | null = null;
        let ausente: number | null = null;
        if (pilha) {
          const ctx = document.createElement('canvas').getContext('2d')!;
          ctx.font = `40px ${pilha}`;
          real = ctx.measureText(probe as string).width;
          ctx.font = `40px ${absent}`;
          ausente = ctx.measureText(probe as string).width;
        }

        return {
          erro: faces.filter((f) => f.status === 'error').map((f) => f.family),
          carregadas: faces.filter((f) => f.status === 'loaded').map((f) => f.family),
          total: faces.length,
          pilha,
          real,
          ausente,
        };
      },
      [FAMILY, ABSENT, PROBE] as const,
    );

    /* DIAGNÓSTICO — qual arquivo falhou. É esta lista que teria nomeado os três woff2 quebrados da
       Fase 4.1 em vez de deixar o time procurando no escuro. */
    expect(medida.total, `${route}: nenhuma @font-face de "${FAMILY}" registrada`).toBeGreaterThan(
      0,
    );
    expect(
      medida.erro,
      `${route}: @font-face que falhou ao carregar: ${medida.erro.join(', ')}`,
    ).toEqual([]);
    expect(
      medida.carregadas.length,
      `${route}: nenhuma face de "${FAMILY}" chegou ao estado "loaded"`,
    ).toBeGreaterThan(0);

    /* PROVA — o texto na tela é desenhado por uma face própria, e não pela fonte padrão. */
    expect(medida.pilha, `${route}: nenhum <h1> para medir`).not.toBeNull();
    expect(
      medida.real,
      `${route}: o texto mede o mesmo que mediria sem fonte nenhuma (${medida.real}px) — ` +
        `a pilha declarada é "${medida.pilha}", mas nada dela está desenhando`,
    ).not.toBe(medida.ausente);
  });
}
