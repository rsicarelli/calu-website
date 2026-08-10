/* 404 — a página inteira (BaseLayout + Header/MobileNav/Footer/WhatsAppFab reais + EmptyState),
   renderizada de ponta a ponta, com axe-core rodando sobre o DOCUMENTO INTEIRO — não um
   fragmento como em EmptyState.test.ts. Mesmo padrão de `tests/components/BaseLayout.test.ts`:
   a casca real está toda presente (3 <nav>, <main>, <footer>, <aside> do FAB), então nenhuma
   regra do axe é desabilitada aqui, incluindo `region` — se ela reprovar, é achado real.

   Confirma também: exatamente 1 <h1> na página inteira (o heading do EmptyState, passado como
   `headingAs="h1"` — o Header não tem h1 próprio); o texto do <h1> não usa "404" nem "Erro" cru,
   por causa do público de 60–75 anos; existe um link explícito de volta para "/"; e
   `noindex` produziu o `<meta name="robots">` esperado.

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/BaseLayout.test.ts`: Astro 7 usa a Vite Environment
   API para decidir se um `.astro` compila para a factory real (Environment "ssr") ou para um
   stub que só lança "Astro components cannot be used in the browser" (Environment "client"), e
   a diretiva de ambiente "jsdom" do Vitest roda o arquivo de teste dentro do Environment
   "client" do Vite — o que faz `experimental_AstroContainer` sempre bater no stub. Este arquivo
   roda no ambiente padrão (node → Environment "ssr") e sobe um DOM de verdade na mão com
   `new JSDOM(html)` só para o HTML já renderizado.

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

import Page404 from '@/pages/404.astro';

/** Sobe um DOM real (jsdom) a partir do HTML renderizado pelo Container e devolve o `document`
 *  já tipado como `Document`. O HTML aqui já é o DOCUMENTO INTEIRO (`<!doctype html><html>…
 *  </html>`, porque `404.astro` monta `BaseLayout`, dono do `<html>`) — não um fragmento —
 *  então não há por que envolvê-lo de novo em `<html><body>`. `jsdomErrors: 'none'` silencia só
 *  os avisos INTERNOS do jsdom (ex.: "HTMLCanvasElement.getContext não implementado", disparado
 *  pela checagem de contraste do axe); `console.log`/`.error` de verdade continuam encaminhados
 *  normalmente. */
function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderPage(): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Page404, {});
  return domFromHtml(html);
}

describe('404', () => {
  it('não produz violações de acessibilidade (axe-core) no documento inteiro', async () => {
    const document = await renderPage();

    // Documento completo, de propósito: a casca real (Header/MobileNav/Footer/aside do FAB) já
    // garante landmarks completos — nenhuma regra é desabilitada, incluindo `region`.
    const results = await axe.run(document.documentElement);

    expect(results.violations).toEqual([]);
  });

  it('tem exatamente 1 <h1> na página inteira', async () => {
    const document = await renderPage();

    expect(document.querySelectorAll('h1')).toHaveLength(1);
  });

  it('o <h1> tem uma frase legível por humano, sem "404" nem "Erro" cru', async () => {
    const document = await renderPage();

    const heading = document.querySelector('h1');
    expect(heading).not.toBeNull();

    const text = heading!.textContent?.trim() ?? '';
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/404/);
    expect(text).not.toMatch(/erro/i);
  });

  it('tem um link explícito de volta para o início ("/")', async () => {
    const document = await renderPage();

    const links = Array.from(document.querySelectorAll('a[href="/"]'));
    const backLink = links.find((link) => /voltar para o in[íi]cio/i.test(link.textContent ?? ''));

    expect(backLink).not.toBeUndefined();
  });

  it('emite <meta name="robots" content="noindex, follow"> (confirma `noindex`)', async () => {
    const document = await renderPage();

    const robots = document.querySelector('meta[name="robots"]');
    expect(robots).not.toBeNull();
    expect(robots!.getAttribute('content')).toMatch(/noindex/);
  });
});
