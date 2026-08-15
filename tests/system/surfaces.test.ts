/* `data-surface` em bloco escuro — o mesmo contrato de `tests/pages/lab.test.ts`, agora sobre TODA
   página construída.
   ============================================================================================
   POR QUE ELE SAIU DA `/lab`. O invariante nunca foi sobre aquela página: `data-surface` é o que
   reescopa `--color-focus-ring` dentro de fundo escuro (`global.css` §6), e sem ele o anel de foco
   cai para ~1,8:1 no tema claro. Isso vale em `/`, em `/contato` e em qualquer página futura
   exatamente como valia na `/lab` — só que era cobrado numa página só. `CLAUDE.md` nomeou a
   promoção como item da Fase 5; `tests/system/_dom.ts` já dava `distPages()`, então só faltava
   escrever.

   A cópia da `/lab` FICA, e não é redundância por descuido: ela roda sobre o Container, antes do
   build, e reprova mais cedo. É a mesma sobreposição deliberada que o cabeçalho de `lab.test.ts`
   já justifica para rótulo de `<nav>` e dimensão de `<img>` — "espelho pré-build".

   O RECORTE "que CONTÉM controle focável" veio junto, e junto com ele o motivo (que é o que o
   torna uma regra e não um ritual): `data-surface` só reescopa o anel de foco, então não tem o que
   fazer num elemento onde nada recebe foco. A primeira versão daquele teste exigia o atributo de
   QUALQUER elemento pintado e reprovou as amostras de 52px da grade de cor — `<span>` decorativo,
   sem descendente focável. Exigir o atributo ali criaria marcação que não muda nada.

   ─────────────────────────────────────────────────────────────────────────────────────────────
   "CONTÉM", E NÃO "É" — a correção que a medição de foco obrigou, e a metade que faltava.

   A versão herdada da `/lab` aceitava as duas coisas (`el.querySelector(FOCUSÁVEL) || el.matches(
   FOCUSÁVEL)`), tratando um botão que pinta o próprio fundo como se fosse um contêiner. Não é, e a
   diferença é o mecanismo: `outline-offset: 2px` põe o anel FORA da caixa do controle, sobre a
   superfície da PÁGINA. Um controle que declara `data-surface` reaponta o próprio anel para a cor
   escolhida contra um fundo que o anel nunca toca.

   Não é teoria: era o CTA principal da Home desenhando anel branco sobre creme a **1,12:1** —
   `tests/metrics/focus.spec.ts` mediu. A cláusula `|| el.matches(...)` não só deixava passar o
   defeito, ela o EXIGIA. Teste que afirma o defeito, de novo.

   Por isso os dois lados são cobrados agora: contêiner pintado PRECISA declarar, controle pintado
   NÃO PODE declarar. O segundo é o que impede o retorno por hábito.

   Ver a limitação geral em `tests/system/_dom.ts` (linkedom não computa CSS): aqui ela não morde,
   porque este teste é 100% estrutural — presença de classe e de atributo, nada de layout. O que
   ele NÃO prova é que o anel resultante de fato contrasta; isso é medição de pixel, e é o que
   `tests/metrics/` faz com um motor de navegador. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

/* Classe que pinta o fundo → valor que o `data-surface` precisa declarar. A tabela é a mesma de
   `global.css` §6 e é o único literal deste arquivo: ela É o contrato, não um detalhe de estilo
   que possa mudar sozinho (mudar a tabela é mudar a regra, e aí o teste deve mesmo ser editado). */
const EXPECTED: Record<string, string> = {
  'bg-surface-deep': 'deep',
  'bg-surface-brand': 'brand',
  'bg-accent': 'accent',
};

const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex="0"]';

/** Elementos que pintam um dos fundos e CONTÊM um controle focável — os contêineres. */
function painted(document: Document): Element[] {
  return Array.from(document.querySelectorAll('[class]'))
    .filter((el) => el.querySelector(FOCUSABLE) !== null)
    .filter((el) => Object.keys(EXPECTED).some((painted) => el.classList.contains(painted)));
}

/** Controles que pintam o próprio fundo — os que NÃO podem declarar `data-surface`. */
function paintedControls(document: Document): Element[] {
  return Array.from(document.querySelectorAll(FOCUSABLE)).filter((el) =>
    Object.keys(EXPECTED).some((painted) => el.classList.contains(painted)),
  );
}

describe('todo bloco de fundo escuro com controle focável declara `data-surface`', () => {
  const pages = distPages();

  /* GUARDA DE VARREDURA NÃO-VAZIA, e ela importa mais aqui do que na média. O teste abaixo é do
     tipo "lista de infratores vazia": sobre uma seleção vazia ele passa em silêncio e não prova
     nada. `distPages()` já falha alto quando `dist/` não tem HTML, mas nada garantia que as
     páginas construídas tivessem algum bloco escuro para inspecionar — se um refactor tirasse
     todos, o arquivo continuaria verde afirmando um contrato sobre o conjunto vazio. */
  it('varredura não está vazia — encontrou páginas e blocos escuros com controle focável', () => {
    expect(pages.length).toBeGreaterThan(0);
    const total = pages.reduce((sum, { document }) => sum + painted(document).length, 0);
    expect(total, 'nenhum bloco de fundo escuro com controle focável em dist/').toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo bloco pintado com controle focável declara o `data-surface` correspondente',
    ({ file, document }) => {
      const offenders = painted(document)
        .flatMap((el) =>
          Object.entries(EXPECTED)
            .filter(([painted]) => el.classList.contains(painted))
            .filter(([, surface]) => el.getAttribute('data-surface') !== surface)
            .map(([painted, surface]) => `${el.tagName.toLowerCase()}.${painted} (${surface})`),
        )
        .filter((entry, i, all) => all.indexOf(entry) === i);

      expect(offenders, `${file}: sem data-surface: ${offenders.join(', ')}`).toEqual([]);
    },
  );

  /* O OUTRO LADO, e o que impede a volta do defeito por hábito — ver o cabeçalho. */
  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum controle que pinta o próprio fundo declara `data-surface`',
    ({ file, document }) => {
      const offenders = paintedControls(document)
        .filter((el) => el.hasAttribute('data-surface'))
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}[data-surface="${el.getAttribute('data-surface')}"] ` +
            `"${(el.textContent ?? '').trim().slice(0, 24)}"`,
        )
        .filter((entry, i, all) => all.indexOf(entry) === i);

      expect(
        offenders,
        `${file}: controle reescopando o próprio anel de foco: ${offenders.join(', ')}`,
      ).toEqual([]);
    },
  );
});
