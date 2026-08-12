/* PageSection — a seção de página nomeada como marco, isolada.
   ============================================================================
   O contrato que este componente existe para garantir é o da regra transversal de
   `PAGES.md`: "todo `<section>` que funciona como marco leva `aria-labelledby`
   apontando para o `id` do cabeçalho que a introduz". Uma seção é usada ~30 vezes
   nas seis páginas reais — cumprir a regra 29 vezes e esquecer na trigésima é o
   modo de falha realista, e é por isso que o par id↔aria-labelledby é DERIVADO
   aqui em vez de digitado em cada uso.

   O contrapositivo tem peso igual e é menos óbvio: seção SEM cabeçalho não pode
   receber `aria-labelledby`, porque apontar para um id inexistente deixa o marco
   com nome vazio e reprova o axe em `aria-valid-attr-value`. Um componente que
   sempre emitisse o atributo pareceria mais correto e seria menos.

   O rótulo em `<p>` e em caixa normal fecha a pendência que o `CLAUDE.md` registrou
   na Fase 3 (`SectionLabel` adiado): caixa-alta guardada no conteúdo faz o VoiceOver
   soletrar letra por letra, e um rótulo em `<h_>` inverteria a hierarquia que
   `PAGES.md` exige sem pular nível.

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

import PageSection from '@/components/blocks/PageSection.astro';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body><main>${html}</main></body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown>, slot = '<p>conteúdo</p>'): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(
    await container.renderToString(PageSection, { props, slots: { default: slot } }),
  );
}

describe('PageSection — marco nomeado', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render({ id: 'servicos', titulo: 'O que a gente atende' });

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  /* O invariante central: o atributo aponta para um id que EXISTE no documento e
     tem texto. É a checagem que o axe faz em `aria-valid-attr-value`, feita aqui
     no isolamento em que o erro é barato de encontrar. */
  it('o aria-labelledby resolve para o cabeçalho da própria seção', async () => {
    const document = await render({ id: 'servicos', titulo: 'O que a gente atende' });
    const section = document.querySelector('section')!;
    const alvo = document.getElementById(section.getAttribute('aria-labelledby')!);

    expect(alvo).not.toBeNull();
    expect(alvo!.textContent?.trim()).toBe('O que a gente atende');
  });

  it('o cabeçalho é o `h2` por padrão', async () => {
    const document = await render({ id: 'servicos', titulo: 'O que a gente atende' });

    expect(document.querySelector('h2')).not.toBeNull();
  });

  it('respeita o nível pedido em `tituloAs`', async () => {
    /* A `/lab` desce tudo um nível, porque lá a página já gastou o `h1` e o `h2`
       no sumário. Sem esta prop, cada tela da `/lab` pularia nível. */
    const document = await render({ id: 'x', titulo: 'Título', tituloAs: 'h3' });

    expect(document.querySelector('h3')).not.toBeNull();
    expect(document.querySelector('h2')).toBeNull();
  });

  it('o id da seção é o que foi pedido — é âncora de navegação', async () => {
    const document = await render({ id: 'onde-estamos', titulo: 'Onde estamos' });

    expect(document.querySelector('section')!.getAttribute('id')).toBe('onde-estamos');
  });
});

describe('PageSection — sem cabeçalho', () => {
  /* Apontar para id inexistente é PIOR que não apontar: o marco fica com nome
     vazio e o axe reprova. Este é o lado do contrato que um componente ingênuo
     erraria emitindo o atributo sempre. */
  it('não emite aria-labelledby quando não há título', async () => {
    const document = await render({ id: 'faixa' });

    expect(document.querySelector('section')!.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('não renderiza cabeçalho nenhum', async () => {
    const document = await render({ id: 'faixa' });

    expect(document.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render({ id: 'faixa' });

    const results = await axe.run(document.body, { rules: { region: { enabled: false } } });

    expect(results.violations).toEqual([]);
  });
});

describe('PageSection — rótulo', () => {
  it('sai em <p>, nunca em cabeçalho', async () => {
    /* Um `<h3>` decorativo acima do `<h2>` inverteria a hierarquia que `PAGES.md`
       exige sem pular nível — e o rótulo não é um nível do documento. */
    const document = await render({ id: 'x', titulo: 'Título', label: 'Serviços' });
    const rotulo = document.querySelector('p.label')!;

    expect(rotulo.tagName).toBe('P');
    expect(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(1);
  });

  it('preserva a caixa do conteúdo — a caixa-alta é do CSS', async () => {
    /* Guardada em maiúsculas, a string é soletrada letra por letra pelo VoiceOver
       (COMPONENTS.md § Label). A utility `label` faz o `text-transform`. */
    const document = await render({ id: 'x', titulo: 'T', label: 'Para a família' });

    expect(document.querySelector('p.label')!.textContent).toBe('Para a família');
  });

  it('sem rótulo, nenhum <p class="label"> é renderizado', async () => {
    const document = await render({ id: 'x', titulo: 'T' });

    expect(document.querySelector('p.label')).toBeNull();
  });
});

describe('PageSection — contratos gerais', () => {
  it('renderiza o slot', async () => {
    const document = await render({ id: 'x', titulo: 'T' }, '<p>conteúdo do slot</p>');

    expect(document.body.textContent).toContain('conteúdo do slot');
  });

  it('repassa data-surface para a raiz', async () => {
    /* É o contrato que reescopa o anel de foco em superfície escura (`global.css`
       §6). Engoli-lo deixaria todo controle focado ali dentro com anel ilegível. */
    const document = await render({ id: 'x', 'data-surface': 'brand' });

    expect(document.querySelector('section')!.getAttribute('data-surface')).toBe('brand');
  });

  it('não define margem externa própria', async () => {
    const document = await render({ id: 'x', titulo: 'T' });
    const classes = (document.querySelector('section')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });

  it('compensa o header fixo na rolagem até a âncora', async () => {
    /* Sem `scroll-mt-header`, a âncora pousa ATRÁS do header sticky de 88px e o
       cabeçalho da seção fica invisível para quem chegou por link interno. */
    const document = await render({ id: 'x', titulo: 'T' });
    const classes = (document.querySelector('section')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes).toContain('scroll-mt-header');
  });
});
