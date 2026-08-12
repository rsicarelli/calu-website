/* AspectImage — a imagem de conteúdo com espaço reservado, isolada.
   ============================================================================
   Este componente é a peça de CLS zero do site, e CLS é um dos invioláveis (regra 5:
   toda imagem com dimensão E `aspect-ratio`). Os testes cobrem as duas metades:

   1. O SLOT. A proporção fica na RAIZ, não na imagem. Isso importa porque a foto real
      quase nunca tem exatamente a proporção do slot: se o `aspect-*` estivesse na
      `<img>`, o navegador reservaria a altura da FOTO e o CSS a recortaria depois —
      e a diferença entre as duas alturas é salto de layout. Com a proporção na raiz,
      o espaço é o do slot desde o primeiro frame, qualquer que seja a foto.

   2. O FALLBACK. Sem `src`, o bloco cai em `BrandPlaceholder` NA MESMA PROPORÇÃO.
      Um fallback de proporção diferente reservaria outra altura, o que é o mesmo
      salto de layout com outro nome.

   E o contrato de `alt`, que é o mais fácil de errar na pressa: imagem de conteúdo
   sem alternativa textual, e imagem decorativa anunciada como se fosse conteúdo.

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

import AspectImage from '@/components/ui/AspectImage.astro';
import logoMark from '@/assets/brand/logo-mark.png';

const RATIOS = ['3/4', '4/5', '16/9', '3/2'] as const;

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown>): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(AspectImage, { props }));
}

const classesOf = (el: Element | null): string[] => (el?.getAttribute('class') ?? '').split(/\s+/);

describe('AspectImage — com imagem', () => {
  const PROPS = { src: logoMark, alt: 'Sala de Pilates com três aparelhos', ratio: '4/5' };

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

  it('leva o alt recebido para a <img>', async () => {
    const document = await render(PROPS);

    expect(document.querySelector('img')!.getAttribute('alt')).toBe(PROPS.alt);
  });

  /* As DUAS metades do sinal de CLS, juntas. `width`/`height` vêm do `<Image>` de
     `astro:assets` a partir do ImageMetadata; a proporção vem da raiz. */
  it('emite width e height reais na <img>', async () => {
    const document = await render(PROPS);
    const img = document.querySelector('img')!;

    expect(Number(img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(img.getAttribute('height'))).toBeGreaterThan(0);
  });

  it.each(RATIOS)('põe a proporção %s na RAIZ, nunca na <img>', async (ratio) => {
    const document = await render({ ...PROPS, ratio });
    const raiz = document.body.firstElementChild;

    expect(classesOf(raiz)).toContain(`aspect-${ratio}`);
    expect(classesOf(document.querySelector('img')).filter((c) => c.startsWith('aspect-'))).toEqual(
      [],
    );
  });

  /* Sem isto a foto seria exibida na proporção dela dentro de um slot de outra
     proporção — ou distorcida, ou estourando o bloco. */
  it('a imagem preenche o slot com object-cover', async () => {
    const document = await render(PROPS);
    const classes = classesOf(document.querySelector('img'));

    expect(classes).toContain('size-full');
    expect(classes).toContain('object-cover');
  });

  it('carrega preguiçosamente por padrão', async () => {
    const document = await render(PROPS);
    const img = document.querySelector('img')!;

    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('fetchpriority')).toBeNull();
  });

  /* O herói da Home é a única imagem acima da dobra. `lazy` nela atrasaria o LCP,
     que é justamente a métrica que o projeto trata como requisito. */
  it('com `priority`, carrega cedo e com prioridade', async () => {
    const document = await render({ ...PROPS, priority: true });
    const img = document.querySelector('img')!;

    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });
});

describe('AspectImage — decorativa', () => {
  it('força alt vazio e esconde da árvore de acessibilidade', async () => {
    /* O `alt` passado é DESCARTADO de propósito: `decorative` é uma decisão
       explícita de quem chama, e obedecer ao alt junto tornaria o resultado
       ambíguo — imagem escondida com nome acessível é um estado sem sentido. */
    const document = await render({
      src: logoMark,
      alt: 'texto que deve ser descartado',
      decorative: true,
      ratio: '3/2',
    });
    const img = document.querySelector('img')!;

    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('AspectImage — sem imagem', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render({ ratio: '3/2' });

    const results = await axe.run(document.body, { rules: { region: { enabled: false } } });

    expect(results.violations).toEqual([]);
  });

  /* A razão de o fallback existir: o bloco tem a MESMA altura com e sem foto. */
  it.each(RATIOS)('cai no placeholder de marca na MESMA proporção (%s)', async (ratio) => {
    const document = await render({ ratio });
    const raiz = document.body.firstElementChild;

    expect(classesOf(raiz)).toContain(`aspect-${ratio}`);
    expect(raiz!.getAttribute('data-surface')).toBe('brand');
  });

  it('o placeholder é sempre decorativo', async () => {
    const document = await render({ ratio: '4/5' });
    const img = document.querySelector('img')!;

    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });

  it('repassa o raio ao placeholder, para o par ficar idêntico', async () => {
    const document = await render({ ratio: '4/5', radius: 'control' });

    expect(classesOf(document.body.firstElementChild)).toContain('rounded-control');
  });
});

describe('AspectImage — contratos gerais', () => {
  it.each([
    ['com imagem', { src: logoMark, alt: 'x', ratio: '3/2' }],
    ['sem imagem', { ratio: '3/2' }],
  ])('não define margem externa própria (%s)', async (_nome, props) => {
    const document = await render(props);
    const classes = classesOf(document.body.firstElementChild);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });

  it.each([
    ['com imagem', { src: logoMark, alt: 'x', ratio: '3/2' }],
    ['sem imagem', { ratio: '3/2' }],
  ])('repassa class para a raiz nos dois caminhos (%s)', async (_nome, props) => {
    const document = await render({ ...props, class: 'w-40' });

    expect(classesOf(document.body.firstElementChild)).toContain('w-40');
  });
});
