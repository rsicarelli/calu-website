/* Herói da Home — a ordem do fonte, que é o que decide o que o celular mostra primeiro.
   ============================================================================================
   POR QUE ESTE ARQUIVO EXISTE: a sobreposição do herói (`COMPONENTS.md` § Hero — "Mobile: imagem
   3/4 no topo, painel de texto sobrepondo −40px") nunca tinha sido construída, nem na Home nem
   na `/lab`. A grade de duas colunas que existia colapsava na ORDEM DO FONTE no celular, então o
   texto vinha antes da foto — o inverso do mockup — e a `/lab`, que deveria ser a página viva de
   regressão, trazia exatamente o mesmo defeito. Duas implementações erradas do mesmo jeito não
   se contradizem, e por isso nada acusou.

   O contrato aqui é DE ORDEM, não de pixel: `linkedom` não computa CSS (ver `_dom.ts`), então
   medir a sobreposição de 40px é impossível neste nível. Mas a ordem do fonte é justamente o que
   a media query NÃO pode consertar sozinha — `md:order-*` reordena no desktop, e no mobile vale
   o fonte. É a metade do contrato que dá para travar aqui, e é a metade que quebrou. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

/** A Home construída. Caminho do glob de `_dom.ts`, não do sistema de arquivos. */
const HOME = '../../dist/index.html';

describe('herói da Home — imagem antes do painel de texto no fonte', () => {
  const home = distPages().find(({ file }) => file === HOME);

  it('a varredura encontrou a Home', () => {
    expect(home, `${HOME} não encontrada — rodou o build antes?`).toBeDefined();
  });

  it('o <h1> vem DEPOIS do slot de imagem dentro do <header>', () => {
    const header = home!.document.querySelector('header:has(h1)');
    expect(header, 'nenhum <header> com <h1> na Home').not.toBeNull();

    /* `compareDocumentPosition` em vez de comparar índices: é a pergunta exata que o teste faz
       ("A vem antes de B no documento?") e não depende de os dois serem irmãos diretos. */
    const media = header!.querySelector('img, [data-surface="brand"]');
    const h1 = header!.querySelector('h1');

    expect(media, 'herói sem slot de imagem nenhum').not.toBeNull();
    expect(h1).not.toBeNull();

    const posicao = media!.compareDocumentPosition(h1!);
    expect(
      Boolean(posicao & 4 /* DOCUMENT_POSITION_FOLLOWING */),
      'o <h1> do herói precede a imagem no fonte — no celular o texto aparece ANTES da foto, que é o inverso do mockup',
    ).toBe(true);
  });

  it('o painel de texto declara a sobreposição e a aposenta no desktop', () => {
    const painel = home!.document.querySelector('header:has(h1) .-mt-hero-overlap');
    expect(
      painel,
      'painel de texto do herói sem `-mt-hero-overlap` — a sobreposição de −40px do handoff sumiu',
    ).not.toBeNull();

    const classes = (painel!.getAttribute('class') ?? '').split(/\s+/);
    /* Sem `md:mt-0` a sobreposição vazaria para o desktop, onde o mockup põe os dois lado a
       lado sem sobrepor nada. */
    expect(classes).toContain('md:mt-0');
    /* O canto arredondado só faz sentido enquanto o painel sangra até a borda. */
    expect(classes).toContain('-mx-gutter');
    expect(classes).toContain('px-gutter');
  });
});
