/* Header — axe-core (zero violações, exceto `region` — ver comentário abaixo) + as confirmações
   estruturais pedidas: dois `<nav>` com rótulos distintos, botão "Menu" com o contrato ARIA
   certo, e o medalhão decorativo (`alt=""`).

   LIMITAÇÃO CONHECIDA: `experimental_AstroContainer` renderiza só o HTML estático — ele não
   executa o `<script>` de `MobileNav.astro`. Abrir/fechar o painel, a aplicação de `inert` no
   resto da página e a devolução de foco ao botão "Menu" NÃO são cobertos por este teste
   automatizado; só por auditoria manual em `pnpm dev`.

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/ContactPair.test.ts`/`WhatsAppFab.test.ts`: Astro 7
   usa a Vite Environment API para decidir se um `.astro` compila para a factory real
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

import Header from '@/components/blocks/Header.astro';

const NAV_LINKS = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/faq', label: 'Perguntas frequentes' },
];

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

async function renderHeader(): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Header, { props: { navLinks: NAV_LINKS } });
  return domFromHtml(html);
}

describe('Header', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await renderHeader();

    const results = await axe.run(document.body, {
      rules: {
        // Mesma isenção de ContactPair.test.ts/WhatsAppFab.test.ts: fragmento isolado, sem
        // <main> ao redor. Em produção o Header sempre vive dentro de uma página completa.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('tem exatamente 2 <nav>, com aria-label "Principal" e "Menu" — nunca iguais', async () => {
    const document = await renderHeader();

    const navs = document.querySelectorAll('nav');
    expect(navs).toHaveLength(2);

    const labels = Array.from(navs).map((nav) => nav.getAttribute('aria-label'));
    expect(labels).toContain('Principal');
    expect(labels).toContain('Menu');
    // A garantia de design: os dois rótulos são DIFERENTES entre si.
    expect(labels[0]).not.toBe(labels[1]);
  });

  it('botão de menu mobile: texto "Menu", aria-expanded="false", aria-controls válido', async () => {
    const document = await renderHeader();

    const toggle = document.querySelector('#mobile-nav-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle!.textContent?.trim()).toBe('Menu');
    expect(toggle!.getAttribute('aria-expanded')).toBe('false');

    const controlsId = toggle!.getAttribute('aria-controls');
    expect(controlsId).toBe('mobile-nav-panel');
    expect(document.getElementById(controlsId!)).not.toBeNull();
  });

  it('medalhão (Image de astro:assets) tem alt=""', async () => {
    const document = await renderHeader();

    const logo = document.querySelector('a[href="/"] img');
    expect(logo).not.toBeNull();
    expect(logo!.getAttribute('alt')).toBe('');
  });
});
