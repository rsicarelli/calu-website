/* Marcos de página nomeados, em todas as páginas construídas.
   ============================================================================
   `PAGES.md`, regra transversal: "Todo `<section>` que funciona como landmark leva
   `aria-labelledby` apontando para o `id` do cabeçalho que a introduz — landmark
   sem nome é só uma `<div>` disfarçada pra quem navega por landmarks."

   `PageSection` garante isso por construção, e `tests/components/PageSection.test.ts`
   trava o componente. Este arquivo cobre o que o componente NÃO alcança: um
   `<section>` escrito à mão numa página, ou um `aria-labelledby` que aponta para um
   id que existia e sumiu numa refatoração. O alvo do atributo é a parte que só o
   documento montado pode verificar.

   `<section>` SEM nome acessível não é erro por si só — o HTML permite, e ele
   simplesmente deixa de ser marco. O que é erro é o meio-termo: apontar para um id
   inexistente ou vazio, que produz um marco com nome em branco. É esse o caso que
   o axe reprova em `aria-valid-attr-value`, e é o que se mede aqui. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

const pages = distPages();

describe('marcos nomeados', () => {
  it('a varredura não está vazia', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo aria-labelledby aponta para um elemento existente',
    ({ file, document }) => {
      const quebrados = Array.from(document.querySelectorAll('[aria-labelledby]'))
        .map((el) => ({ el, id: el.getAttribute('aria-labelledby') ?? '' }))
        /* O atributo aceita lista de ids separados por espaço. */
        .flatMap(({ el, id }) =>
          id
            .split(/\s+/)
            .filter(Boolean)
            .map((um) => ({ el, id: um })),
        )
        .filter(({ id }) => document.getElementById(id) === null)
        .map(({ el, id }) => `<${el.tagName.toLowerCase()}> → #${id}`);

      expect(quebrados, `${file}: aria-labelledby órfão: ${quebrados.join(', ')}`).toEqual([]);
    },
  );

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum nome acessível de marco está vazio',
    ({ file, document }) => {
      const vazios = Array.from(document.querySelectorAll('[aria-labelledby]'))
        .map((el) => {
          const ids = (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
          const texto = ids
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
            .join(' ')
            .trim();
          return { tag: el.tagName.toLowerCase(), ids: ids.join(' '), texto };
        })
        .filter(({ texto }) => texto === '')
        .map(({ tag, ids }) => `<${tag}> → #${ids}`);

      expect(vazios, `${file}: marco com nome vazio: ${vazios.join(', ')}`).toEqual([]);
    },
  );

  /* O contrapositivo, e o erro mais fácil de cometer ao escrever `<section>` à mão:
     uma seção com cabeçalho que não se nomeia por ele. Não é violação de WCAG, mas é
     desperdício — o cabeçalho está ali, o marco fica anônimo, e quem navega por
     marcos ouve "região" sem saber qual. */
  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, toda <section> com cabeçalho próprio se nomeia por ele',
    ({ file, document }) => {
      const anonimas = Array.from(document.querySelectorAll('section'))
        .filter((section) => !section.hasAttribute('aria-labelledby'))
        .filter((section) => !section.hasAttribute('aria-label'))
        .filter((section) => section.querySelector('h1, h2, h3, h4, h5, h6') !== null)
        .map((section) => {
          const h = section.querySelector('h1, h2, h3, h4, h5, h6');
          return `<section id="${section.getAttribute('id') ?? '?'}"> com ${h?.tagName} "${h?.textContent?.trim().slice(0, 30)}"`;
        });

      expect(anonimas, `${file}: seções com cabeçalho e sem nome: ${anonimas.join(' ; ')}`).toEqual(
        [],
      );
    },
  );
});
