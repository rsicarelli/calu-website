/* BrandPlaceholder — o espaço de imagem sem imagem, isolado.
   ============================================================================
   Confirma: zero violação de axe-core (região desligada — mesma isenção dos outros testes de
   fragmento); a `<img>` sai SEMPRE com `width` e `height`; ela é sempre decorativa; a raiz carrega
   `data-surface="brand"` nas quatro proporções QUANDO a variante é `brand`, e NÃO o carrega na
   variante creme; que o chamador não consegue nem sobrescrever nem injetar essa superfície; cada
   proporção emite exatamente uma classe `aspect-*`; os dois raios; e `class` do chamador é
   repassada sem apagar as próprias.

   `data-surface` NÃO É O IDENTIFICADOR DO COMPONENTE, e confundir os dois já custou 14 asserções
   de uma vez: quando a variante padrão deixou de ser verde escura, todo teste que achava o
   placeholder procurando por `[data-surface="brand"]` parou de achá-lo. Um atributo diz "o fundo
   aqui é escuro, reescope o anel de foco"; o outro, `data-brand-placeholder`, diz "isto é um
   espaço à espera de foto". Use o segundo para localizar o componente.

   POR QUE `width`/`height` SÃO TESTADOS AQUI e não só na página: `tests/system/cls.test.ts` varre
   `dist/` e aceita DOIS sinais — os atributos OU uma classe de proporção. Este componente emite os
   dois, e o teste de página exige os atributos; travar isso no nível do componente significa que a
   regressão aparece no arquivo que a causou, não numa varredura de página três commits depois.

   POR QUE O `data-surface` DO COMPONENTE PRECISA VENCER: ele não é estilo, é o contrato que
   reescopa o anel de foco dentro de superfície escura (`global.css` §6). O componente é quem pinta
   o fundo, então é quem sabe qual superfície é. Um chamador que passasse `data-surface="deep"` por
   engano deixaria todo controle focado ali dentro com anel medindo menos de 2:1 no tema claro — em
   silêncio. Daí o atributo sair DEPOIS de `{...rest}` no template, e daí este teste.

   Comparação por CONJUNTO de classes, não por string exata: o `prettier-plugin-tailwindcss`
   reordena a lista, e um teste acoplado à ordem quebraria na próxima formatação à toa.

   Sem a mágica-comment de ambiente por arquivo do Vitest — mesmo motivo documentado em
   `tests/components/BaseLayout.test.ts`.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha. Não escreva essa sequência literal em nenhum lugar deste arquivo. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`;
// `domFromHtml` recasta o resultado para o `Document` da lib DOM ambiente do TypeScript.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import BrandPlaceholder from '@/components/ui/BrandPlaceholder.astro';

const RATIOS = ['3/4', '4/5', '16/9', '3/2'] as const;

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown> = { ratio: '16/9' }): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(BrandPlaceholder, { props }));
}

async function rootClasses(props: Record<string, unknown> = { ratio: '16/9' }): Promise<string[]> {
  const document = await render(props);
  const root = document.body.firstElementChild;
  expect(root).not.toBeNull();
  return (root!.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

describe('BrandPlaceholder', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render();

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('a imagem sai sempre com `width` e `height` — o sinal que zera o CLS', async () => {
    const document = await render();
    const img = document.querySelector('img');

    expect(img).not.toBeNull();
    expect(img!.hasAttribute('width')).toBe(true);
    expect(img!.hasAttribute('height')).toBe(true);
  });

  it('a imagem é sempre decorativa — representa ausência de foto, não informação', async () => {
    const document = await render();
    const img = document.querySelector('img');

    expect(img!.getAttribute('alt')).toBe('');
    expect(img!.getAttribute('aria-hidden')).toBe('true');
  });

  it.each(RATIOS)('ratio="%s" emite exatamente uma classe de proporção', async (ratio) => {
    const classes = await rootClasses({ ratio });
    const aspects = classes.filter((c) => c.startsWith('aspect-'));

    expect(aspects).toEqual([`aspect-${ratio}`]);
  });

  /* `data-surface` acompanha a SUPERFÍCIE, não o componente: ele existe para reescopar o anel de
     foco dentro de fundo escuro (global.css §6). A variante `quiet` é creme, então declará-lo ali
     deixaria todo controle focado com anel claro sobre claro — o mesmo invariante quebrado, só
     que na direção oposta. Quem identifica o slot é `data-brand-placeholder`. */
  it.each(RATIOS)('ratio="%s", variante `brand`, declara `data-surface="brand"`', async (ratio) => {
    const document = await render({ ratio, variant: 'brand' });

    expect(document.body.firstElementChild?.getAttribute('data-surface')).toBe('brand');
  });

  it.each(RATIOS)(
    'ratio="%s", variante padrão (creme), NÃO declara `data-surface`',
    async (ratio) => {
      const document = await render({ ratio });

      expect(document.body.firstElementChild?.getAttribute('data-surface')).toBeNull();
    },
  );

  it('as duas variantes são identificáveis pelo marcador estável', async () => {
    const quiet = await render({ ratio: '16/9' });
    const brand = await render({ ratio: '16/9', variant: 'brand' });

    expect(quiet.body.firstElementChild?.getAttribute('data-brand-placeholder')).toBe('quiet');
    expect(brand.body.firstElementChild?.getAttribute('data-brand-placeholder')).toBe('brand');
  });

  /* Quem sabe qual superfície é, é o componente. Um `data-surface` do chamador seria um
     invariante de foco quebrado em silêncio. */
  it('o `data-surface` do componente vence um passado pelo chamador', async () => {
    const document = await render({ ratio: '16/9', variant: 'brand', 'data-surface': 'deep' });

    expect(document.body.firstElementChild?.getAttribute('data-surface')).toBe('brand');
  });

  it('o chamador também não consegue INJETAR superfície escura na variante creme', async () => {
    const document = await render({ ratio: '16/9', 'data-surface': 'deep' });

    expect(document.body.firstElementChild?.getAttribute('data-surface')).toBeNull();
  });

  it('radius padrão é `card`; `control` troca só o raio', async () => {
    expect(await rootClasses({ ratio: '16/9' })).toContain('rounded-card');

    const control = await rootClasses({ ratio: '16/9', radius: 'control' });
    expect(control).toContain('rounded-control');
    expect(control).not.toContain('rounded-card');
  });

  it('repassa `class` do chamador sem perder as próprias', async () => {
    const classes = await rootClasses({ ratio: '4/5', class: 'w-40 shrink-0' });

    expect(classes).toContain('w-40');
    expect(classes).toContain('shrink-0');
    expect(classes).toContain('bg-surface-alt');
    expect(classes).toContain('aspect-4/5');
  });

  it('não define margem externa própria', async () => {
    const classes = await rootClasses();

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
