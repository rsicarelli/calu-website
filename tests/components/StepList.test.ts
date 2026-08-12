/* StepList — os passos numerados, isolado.
   ============================================================================
   Duas coisas travadas aqui, e as duas são sobre a NUMERAÇÃO ser informação e não
   enfeite:

   1. `<ol>`, não `<ul>`. "Contato → Avaliação → Plano" lido fora de ordem é outra
      coisa, e é o `<ol>` que faz o leitor de tela anunciar "item 2 de 3".
   2. O número visível vem de contador CSS, não do texto. Se estivesse escrito no
      conteúdo, quem edita renumeraria a lista à mão a cada passo inserido no meio,
      e o leitor de tela leria o número duas vezes — uma do `<ol>`, outra do texto.

   A CARDINALIDADE VARIÁVEL é a variação de estado que justificou extrair o
   componente: a Home trava 3 passos no schema, o serviço aceita 1 a 5. Um layout de
   três colunas fixas serviria à Home e quebraria no serviço com 4 — daí o teste nos
   três pontos (1, 3, 5), que é o intervalo declarado.

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

import StepList from '@/components/blocks/StepList.astro';

const passosDe = (n: number): { titulo: string; texto: string }[] =>
  Array.from({ length: n }, (_, i) => ({
    titulo: `Passo ${i + 1}`,
    texto: `O que acontece no passo ${i + 1}.`,
  }));

const TRES = [
  { titulo: 'Contato', texto: 'Você fala com a gente pelo WhatsApp ou por telefone.' },
  { titulo: 'Avaliação', texto: 'A primeira sessão é para entender seu caso.' },
  { titulo: 'Plano', texto: 'A partir daí vocês combinam o que faz sentido.' },
];

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
  return domFromHtml(await container.renderToString(StepList, { props }));
}

describe('StepList', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render({ passos: TRES });

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('a raiz é <ol> — a ordem dos passos é informação', async () => {
    const document = await render({ passos: TRES });

    expect(document.querySelector('ol')).not.toBeNull();
    expect(document.querySelector('ul')).toBeNull();
  });

  it('renderiza um <li> por passo, na ordem dada', async () => {
    const document = await render({ passos: TRES });
    const titulos = Array.from(document.querySelectorAll('li h3')).map((h) =>
      h.textContent?.trim(),
    );

    expect(titulos).toEqual(TRES.map((p) => p.titulo));
  });

  /* O número NÃO pode estar no texto: quem edita não deve renumerar à mão, e o
     leitor de tela não deve anunciar a posição duas vezes. */
  it('nenhum número aparece no texto — a numeração é do CSS', async () => {
    const document = await render({ passos: TRES });
    const comNumero = Array.from(document.querySelectorAll('li h3'))
      .map((h) => h.textContent?.trim() ?? '')
      .filter((texto) => /^\s*\d+[.)\s]/.test(texto));

    expect(comNumero, `títulos com número escrito no texto: ${comNumero.join(', ')}`).toEqual([]);
  });

  it('a raiz e o item carregam as utilities do contador', async () => {
    /* `step-list` reseta o contador e `step-item` o incrementa. As duas precisam
       existir juntas: sem uma delas a lista numera tudo como "1" em silêncio. */
    const document = await render({ passos: TRES });
    const ol = (document.querySelector('ol')!.getAttribute('class') ?? '').split(/\s+/);
    const li = (document.querySelector('li')!.getAttribute('class') ?? '').split(/\s+/);

    expect(ol).toContain('step-list');
    expect(li).toContain('step-item');
  });

  /* Os três pontos do intervalo declarado: 3 fixos na Home, 1 a 5 no serviço. */
  it.each([1, 3, 5])('aguenta %i passos sem mudar de forma', async (n) => {
    const document = await render({ passos: passosDe(n) });

    expect(document.querySelectorAll('li')).toHaveLength(n);
    expect((document.querySelector('ol')!.getAttribute('class') ?? '').split(/\s+/)).toContain(
      'flex-col',
    );
  });

  it('respeita o nível pedido em `tituloAs`', async () => {
    const document = await render({ passos: TRES, tituloAs: 'h4' });

    expect(document.querySelectorAll('h4')).toHaveLength(3);
    expect(document.querySelector('h3')).toBeNull();
  });

  it('lista vazia não renderiza <ol> nenhum', async () => {
    const document = await render({ passos: [] });

    expect(document.querySelector('ol')).toBeNull();
    expect(document.body.textContent?.trim()).toBe('');
  });

  it('não define margem externa própria', async () => {
    const document = await render({ passos: TRES });
    const classes = (document.querySelector('ol')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
