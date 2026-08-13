/* Footer — axe-core (zero violações, exceto `region` — ver comentário abaixo) + as confirmações
   estruturais pedidas: `data-surface="deep"` no elemento raiz (o mecanismo de foco de
   `global.css` §6 depende disso), TODOS os links do nav do rodapé com `min-h-target`, o
   `aria-label` do nav distinto dos outros dois do site, e a responsável técnica no piso
   tipográfico (`text-small`, nunca abaixo dele).

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/Header.test.ts`/`ContactPair.test.ts`: Astro 7 usa a
   Vite Environment API para decidir se um `.astro` compila para a factory real (Environment
   "ssr") ou para um stub que só lança "Astro components cannot be used in the browser"
   (Environment "client"), e a diretiva de ambiente "jsdom" do Vitest roda o arquivo de teste
   dentro do Environment "client" do Vite — o que faz `experimental_AstroContainer` sempre bater
   no stub. Este arquivo roda no ambiente padrão (node → Environment "ssr") e sobe um DOM de
   verdade na mão com `new JSDOM(html)` só para o HTML já renderizado.

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

import Footer from '@/components/blocks/Footer.astro';

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

async function renderFooter(): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Footer, { props: { navLinks: NAV_LINKS } });
  return domFromHtml(html);
}

describe('Footer', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await renderFooter();

    const results = await axe.run(document.body, {
      rules: {
        // Mesma isenção de Header.test.ts/ContactPair.test.ts: fragmento isolado, sem <main>
        // ao redor. Em produção o Footer sempre vive no fim de uma página completa.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('tem data-surface="deep" no elemento raiz', async () => {
    const document = await renderFooter();

    const footer = document.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer!.getAttribute('data-surface')).toBe('deep');
  });

  /* A regressão que este teste existe para impedir JÁ ACONTECEU: o rodapé shipou com padding
     vertical zero em toda página — logo colado na borda de cima da faixa escura, responsável
     técnica colada na de baixo — e as 708 asserções da suíte seguiram verdes, porque nenhuma
     delas olhava para espaço. O `Container` só dá gutter horizontal de propósito, então o
     ritmo vertical tem de estar no `<footer>`, e ausência dele é invisível para todo o resto
     do gate: não quebra tipo, não quebra lint, não quebra `check:styles`.
     `pb-footer-bottom` especificamente, e não um `pb-*` qualquer: o WhatsAppFab é `fixed` e
     flutua sobre o rodapé, então a última linha precisa da folga que o token deriva. */
  it('declara ritmo vertical próprio — topo e piso', async () => {
    const document = await renderFooter();
    const classes = document.querySelector('footer')!.className.split(/\s+/);

    expect(classes.some((c) => /^(py|pt)-/.test(c))).toBe(true);
    expect(classes).toContain('pb-footer-bottom');
  });

  it('todos os links do nav do rodapé têm min-h-target, sem exceção', async () => {
    const document = await renderFooter();

    const nav = document.querySelector('nav[aria-label="Rodapé"]');
    expect(nav).not.toBeNull();

    const links = nav!.querySelectorAll('a');
    expect(links).toHaveLength(NAV_LINKS.length);
    for (const link of Array.from(links)) {
      expect(link.className.split(/\s+/)).toContain('min-h-target');
    }
  });

  it('o nav do rodapé tem aria-label "Rodapé", diferente de "Principal"/"Menu"', async () => {
    const document = await renderFooter();

    const nav = document.querySelector('nav');
    expect(nav).not.toBeNull();
    const label = nav!.getAttribute('aria-label');
    expect(label).toBe('Rodapé');
    expect(label).not.toBe('Principal');
    expect(label).not.toBe('Menu');
  });

  it('mostra a responsável técnica no piso tipográfico (text-small)', async () => {
    const document = await renderFooter();

    const technicalManager = Array.from(document.querySelectorAll('p')).find((p) =>
      p.textContent?.includes('CREFITO'),
    );

    expect(technicalManager).not.toBeUndefined();
    expect(technicalManager!.className.split(/\s+/)).toContain('text-small');
    // Nunca abaixo do piso: nenhuma classe de tamanho menor que o piso do projeto.
    expect(technicalManager!.className).not.toMatch(/text-(?:label)\b/);
  });
});
