/* EmptyState — fragmento isolado (símbolo de marca + heading + mensagem opcional + ContactPair).
   ============================================================================
   Confirma: sem `message` não quebra e nenhum `<p>` vazio é renderizado; com `message` o `<p>`
   aparece; zero violação de axe-core (região desligada de propósito — ver comentário abaixo,
   mesma isenção de ContactPair.test.ts/Footer.test.ts); o CTA (`ContactPair`) sempre presente,
   com os dois links em `min-h-target`; `headingAs` default `'h2'`, e `headingAs="h1"` realmente
   produz um `<h1>` (a página 404 depende disso para ter um único `<h1>` na árvore).

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/Header.test.ts`/`Footer.test.ts`/`ContactPair.test.ts`:
   Astro 7 usa a Vite Environment API para decidir se um `.astro` compila para a factory real
   (Environment "ssr") ou para um stub que só lança "Astro components cannot be used in the
   browser" (Environment "client"), e a diretiva de ambiente "jsdom" do Vitest roda o arquivo de
   teste dentro do Environment "client" do Vite — o que faz `experimental_AstroContainer` sempre
   bater no stub. Este arquivo roda no ambiente padrão (node → Environment "ssr") e sobe um DOM
   de verdade na mão com `new JSDOM(html)` só para o HTML já renderizado.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha. Não escreva essa sequência literal em nenhum lugar deste arquivo. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`;
// instalar uma dependência nova está fora do escopo desta tarefa. `domFromHtml`, logo abaixo,
// recasta o resultado para o `Document` da lib DOM ambiente do próprio TypeScript — então o
// `any` daqui não escapa para o resto do arquivo.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import EmptyState from '@/components/blocks/EmptyState.astro';

const PROPS = {
  heading: 'Ainda não temos itens aqui',
  whatsappHref: 'https://wa.me/5511999999999',
  phoneHref: 'tel:+5511999999999',
  phoneLabel: '(11) 99999-9999',
};

/** Sobe um DOM real (jsdom) a partir do HTML renderizado pelo Container e devolve o `document`
 *  já tipado como `Document`. `jsdomErrors: 'none'` silencia só os avisos INTERNOS do jsdom
 *  (ex.: "HTMLCanvasElement.getContext não implementado", disparado pela checagem de contraste
 *  do axe); `console.log`/`.error` de verdade continuam encaminhados normalmente. */
function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderEmptyState(props: Record<string, unknown> = PROPS): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(EmptyState, { props });
  return domFromHtml(html);
}

describe('EmptyState', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await renderEmptyState();

    const results = await axe.run(document.body, {
      rules: {
        // "region": conteúdo de página precisa estar dentro de uma landmark (main/nav/etc).
        // Regra de PÁGINA, não de componente — aqui só existe o fragmento isolado, sem <main>
        // ao redor. Em produção o EmptyState sempre vive dentro de uma landmark real (o <main>
        // de uma página, como em `404.astro`); a regra volta a valer nesse nível, e
        // `tests/pages/404.test.ts` a exercita sem essa isenção.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('sem `message`, não quebra e não renderiza nenhum <p>', async () => {
    const document = await renderEmptyState(PROPS);

    expect(document.querySelector('p')).toBeNull();
  });

  it('com `message`, renderiza um <p> com o texto', async () => {
    const document = await renderEmptyState({ ...PROPS, message: 'Volte mais tarde.' });

    const paragraph = document.querySelector('p');
    expect(paragraph).not.toBeNull();
    expect(paragraph!.textContent?.trim()).toBe('Volte mais tarde.');
  });

  it('o CTA (ContactPair) está sempre presente, com os dois links em min-h-target', async () => {
    const document = await renderEmptyState();

    const contactPair = document.querySelector('[data-contact-pair]');
    expect(contactPair).not.toBeNull();

    const links = contactPair!.querySelectorAll('a');
    expect(links).toHaveLength(2);
    for (const link of Array.from(links)) {
      expect(link.className.split(/\s+/)).toContain('min-h-target');
    }
  });

  it('`headingAs` tem padrão `h2`', async () => {
    const document = await renderEmptyState();

    expect(document.querySelector('h2')?.textContent?.trim()).toBe(PROPS.heading);
    expect(document.querySelector('h1')).toBeNull();
  });

  it('`headingAs="h1"` renderiza um <h1> de verdade', async () => {
    const document = await renderEmptyState({ ...PROPS, headingAs: 'h1' });

    expect(document.querySelector('h1')?.textContent?.trim()).toBe(PROPS.heading);
    expect(document.querySelector('h2')).toBeNull();
  });
});
