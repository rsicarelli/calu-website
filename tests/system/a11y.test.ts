/* axe-core sobre TODA página construída.
   ============================================================================
   Até a Fase 4 o axe rodava em dois lugares: sobre componentes isolados
   (`tests/components/*`) e sobre a `/lab` renderizada pelo Container
   (`tests/pages/lab.test.ts`). Nenhum dos dois vê o que este arquivo vê.

   O componente isolado desliga a regra `region` — legítimo, porque num fragmento
   não existe página para ter marcos. A `/lab` renderizada pelo Container é o HTML
   ANTES do build. O que chega ao navegador é `dist/`, depois de tudo: hidratação de
   `astro:assets`, scripts inline, ordem final dos atributos.

   Aqui roda o documento inteiro, sem nenhuma regra desligada, sobre o artefato que
   de fato é servido. É a checagem mais próxima do usuário que a suíte tem.

   Por que `jsdom` e não o `linkedom` do resto de `tests/system/`: o axe precisa de
   um DOM com layout e computação de estilo mínimos, e `linkedom` é só parser (o
   cabeçalho de `_dom.ts` diz isso por extenso). Então este arquivo lê o mesmo
   `dist/` via `?raw` e monta o documento com `jsdom`.

   LIMITE CONHECIDO, e o mesmo dos outros varredores de sistema: sem CSS aplicado, o
   axe não avalia contraste real (`color-contrast` precisa de estilo computado). O
   contraste é coberto por outro caminho, direto nos tokens
   (`tests/tokens/contrast.test.ts`), que mede os pares declarados nos dois temas. */

// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`.
import { JSDOM, VirtualConsole } from 'jsdom';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

const RAW_PAGES = import.meta.glob('../../dist/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const pages = Object.entries(RAW_PAGES).map(([file, source]) => {
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error(`${file} existe mas veio vazio — rode \`pnpm build\` antes.`);
  }
  return { file, html: source };
});

function documentFrom(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  return new JSDOM(html, { pretendToBeVisual: true, virtualConsole }).window.document as Document;
}

describe('acessibilidade das páginas construídas', () => {
  it('a varredura não está vazia', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)('$file não produz violações de axe-core', async ({ file, html }) => {
    const document = documentFrom(html);

    const results = await axe.run(document.documentElement);

    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
      `${file}: violações de acessibilidade`,
    ).toEqual([]);
  });
});
