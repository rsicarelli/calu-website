/* PageHeader — o cabeçalho de página interna, isolado.
   ============================================================================
   Garante a ESTRUTURA que a regra transversal de `PAGES.md` exige: um `<h1>` só,
   primeiro cabeçalho da página, com o lead como `<p>` e não como um `<h2>` que
   inventaria um nível na hierarquia.

   O componente não julga o TEXTO recebido — se o `h1` diz "Calu Pilates e
   Fisioterapia" em vez de descrever a página, isso é trabalho do `copywriter` e do
   `cohesion-reviewer`. O que se trava aqui é o que dá para travar em código.

   A raiz é `<header>` e NÃO `<section>` por um motivo de marcos: `<section>`
   nomeado viraria um marco que duplica o `<main>` que já o contém. `<header>`
   dentro de `<main>` não é marco de banner, então não polui a navegação por marcos.

   Sem a mágica-comment de ambiente por arquivo do Vitest — mesmo motivo documentado em
   `tests/components/BaseLayout.test.ts`.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha. Não escreva essa sequência literal em nenhum lugar deste arquivo. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import PageHeader from '@/components/blocks/PageHeader.astro';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body><main>${html}</main></body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown>): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(PageHeader, { props }));
}

describe('PageHeader', () => {
  const PROPS = { titulo: 'Quem vai te atender', lead: 'Duas fisioterapeutas atendem aqui.' };

  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render(PROPS);

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('renderiza exatamente um <h1>, com o título recebido', async () => {
    const document = await render(PROPS);
    const h1s = document.querySelectorAll('h1');

    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent?.trim()).toBe(PROPS.titulo);
  });

  it('o lead sai em <p>, nunca num cabeçalho', async () => {
    /* Um `<h2>` aqui inventaria um nível que a página não tem, e faria o lead
       aparecer no sumário de cabeçalhos de quem navega por eles. */
    const document = await render(PROPS);

    expect(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1);
    expect(document.querySelector('p')!.textContent?.trim()).toBe(PROPS.lead);
  });

  it('sem lead, nenhum <p> de apoio é renderizado', async () => {
    const document = await render({ titulo: 'Só o título' });

    expect(document.querySelector('p')).toBeNull();
  });

  it('a raiz é <header>, não <section>', async () => {
    /* `<section>` nomeado aqui criaria um marco que duplica o `<main>` que o
       contém. `<header>` dentro de `<main>` não vira marco de banner. */
    const document = await render(PROPS);

    expect(document.querySelector('main')!.firstElementChild!.tagName).toBe('HEADER');
    expect(document.querySelector('section')).toBeNull();
  });

  it('o eyebrow sai como rótulo em <p>, em caixa normal', async () => {
    const document = await render({ ...PROPS, eyebrow: 'Vila Clementino' });
    const rotulo = document.querySelector('p.label')!;

    expect(rotulo.tagName).toBe('P');
    expect(rotulo.textContent).toBe('Vila Clementino');
  });

  it('sem eyebrow, nenhum rótulo é renderizado', async () => {
    const document = await render(PROPS);

    expect(document.querySelector('p.label')).toBeNull();
  });

  it('não define margem externa própria', async () => {
    const document = await render(PROPS);
    const classes = (document.querySelector('header')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
