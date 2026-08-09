/* BaseLayout — a casca inteira da página (skip link + Header + main + Footer + WhatsAppFab)
   renderizada de ponta a ponta, com axe-core rodando sobre o DOCUMENTO INTEIRO — não um
   fragmento como em Header.test.ts/Footer.test.ts. É a primeira vez que os 3 `<nav>` do site
   (Header desktop "Principal", MobileNav "Menu", Footer "Rodapé") existem juntos na mesma
   árvore, o que também é a primeira checagem real de `landmark-unique` do axe (os testes de
   fragmento desabilitam `region`, mas nunca exercitaram `landmark-unique` com os 3 juntos).

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/Header.test.ts`/`Footer.test.ts`: Astro 7 usa a Vite
   Environment API para decidir se um `.astro` compila para a factory real (Environment "ssr")
   ou para um stub que só lança "Astro components cannot be used in the browser" (Environment
   "client"), e a diretiva de ambiente "jsdom" do Vitest roda o arquivo de teste dentro do
   Environment "client" do Vite — o que faz `experimental_AstroContainer` sempre bater no stub.
   Este arquivo roda no ambiente padrão (node → Environment "ssr") e sobe um DOM de verdade na
   mão com `new JSDOM(html)` só para o HTML já renderizado.

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

import BaseLayout from '@/layouts/BaseLayout.astro';

/** Sobe um DOM real (jsdom) a partir do HTML renderizado pelo Container e devolve o `document`
 *  já tipado como `Document`. Diferente de Header.test.ts/Footer.test.ts, o HTML aqui já é o
 *  DOCUMENTO INTEIRO (`<!doctype html><html>…</html>`, porque `BaseLayout` é dono do `<html>`)
 *  — não um fragmento — então não há por que envolvê-lo de novo em `<html><body>`.
 *  `jsdomErrors: 'none'` silencia só os avisos INTERNOS do jsdom (ex.: "HTMLCanvasElement.
 *  getContext não implementado", disparado pela checagem de contraste do axe); `console.log`/
 *  `.error` de verdade continuam encaminhados normalmente. */
function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderLayout(): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(BaseLayout, {
    props: { title: 'Teste' },
    slots: { default: '<p>Conteúdo</p>' },
  });
  return domFromHtml(html);
}

describe('BaseLayout', () => {
  it('não produz violações de acessibilidade (axe-core) no documento inteiro', async () => {
    const document = await renderLayout();

    // Documento completo, de propósito: diferente dos testes de fragmento (Header/Footer/
    // WhatsAppFab), aqui existe um <main> real ao redor e os 3 <nav> do site convivem na
    // mesma árvore — nenhuma regra é desabilitada, incluindo `landmark-unique`.
    const results = await axe.run(document.documentElement);

    expect(results.violations).toEqual([]);
  });

  it('tem exatamente 1 <header>', async () => {
    const document = await renderLayout();

    expect(document.querySelectorAll('header')).toHaveLength(1);
  });

  it('tem exatamente 1 <footer>, com data-surface="deep"', async () => {
    const document = await renderLayout();

    const footers = document.querySelectorAll('footer');
    expect(footers).toHaveLength(1);
    expect(footers[0]!.getAttribute('data-surface')).toBe('deep');
  });

  it('tem exatamente 1 elemento com data-whatsapp-fab', async () => {
    const document = await renderLayout();

    expect(document.querySelectorAll('[data-whatsapp-fab]')).toHaveLength(1);
  });

  it('o data-whatsapp-fab está dentro de exatamente 1 <aside aria-label="Contato rápido pelo WhatsApp">', async () => {
    const document = await renderLayout();

    const asides = document.querySelectorAll('aside');
    expect(asides).toHaveLength(1);

    const aside = asides[0]!;
    // Texto exato, não só "não vazio", de propósito: é esse aria-label que faz o <aside>
    // satisfazer a regra `region` do axe como landmark nomeado (ver teste acima). Um teste
    // "não vazio" continuaria verde se alguém trocasse o wrapper por um <aside aria-label="x">
    // genérico — passaria no axe, mas deixaria de identificar o que o FAB é para tecnologia
    // assistiva. Se esse texto mudar de verdade (é cópia do handoff, não decoração), atualizar
    // esta constante junto é o comportamento correto — não sinal de teste frágil.
    expect(aside.getAttribute('aria-label')).toBe('Contato rápido pelo WhatsApp');

    // A garantia que faltava: hoje `region` só passa "por tabela" porque o FAB calha de estar
    // dentro do único <aside> do documento. Sem isto, trocar o wrapper por outro landmark
    // nomeado (que também silenciaria `region`) não quebraria nada aqui.
    expect(aside.querySelector('[data-whatsapp-fab]')).not.toBeNull();
  });

  it('<main id="conteudo"> reserva o espaço do FAB com pb-fab-offset', async () => {
    const document = await renderLayout();

    const main = document.querySelector('main#conteudo');
    expect(main).not.toBeNull();
    expect(main!.className.split(/\s+/)).toContain('pb-fab-offset');
  });

  it('renderiza o slot dentro do <main>', async () => {
    const document = await renderLayout();

    const main = document.querySelector('main#conteudo');
    expect(main!.innerHTML).toContain('Conteúdo');
  });
});
