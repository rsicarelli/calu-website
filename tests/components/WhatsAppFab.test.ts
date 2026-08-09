/* WhatsAppFab — axe-core (zero violações, exceto `region` — ver comentário abaixo) + as
   confirmações estruturais pedidas: alvo de 56px na classe, texto renderizado literal, e o
   atributo `data-whatsapp-fab` presente no elemento raiz.

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/ContactPair.test.ts`: Astro 7 usa a Vite Environment
   API para decidir se um `.astro` compila para a factory real (Environment "ssr") ou para um
   stub que só lança "Astro components cannot be used in the browser" (Environment "client",
   `vite-plugin-astro/index.js`), e a diretiva de ambiente "jsdom" do Vitest roda o arquivo de
   teste dentro do Environment "client" do Vite — o que faz `experimental_AstroContainer` sempre
   bater no stub, para qualquer componente, não só WhatsAppFab. Este arquivo roda no ambiente
   padrão (node → Environment "ssr") e sobe um DOM de verdade na mão com `new JSDOM(html)` só
   para o HTML já renderizado, sem pedir nenhuma mudança em `vitest.config.ts`.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha (`vitest/dist/chunks/cli-api.*.js`). Não escreva essa sequência literal em nenhum lugar
   deste arquivo, nem em prosa explicando por que ela não é usada. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`;
// instalar uma dependência nova está fora do escopo desta tarefa. `domFromHtml`, logo abaixo,
// recasta o resultado para o `Document` da lib DOM ambiente do próprio TypeScript (a mesma que
// `ThemeToggle.astro` já usa em `document.querySelectorAll<HTMLButtonElement>` sem nenhum
// import) — então o `any` daqui não escapa para o resto do arquivo.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import WhatsAppFab from '@/components/blocks/WhatsAppFab.astro';

/** Sobe um DOM real (jsdom) a partir do HTML renderizado pelo Container e devolve o `document`
 *  já tipado como `Document` (ver nota no import acima). `jsdomErrors: 'none'` silencia só os
 *  avisos INTERNOS do jsdom (ex.: "HTMLCanvasElement.getContext não implementado", disparado
 *  pela checagem de contraste do axe — o pacote `canvas` não está instalado e não faz falta
 *  aqui); `console.log`/`.error` de verdade continuam encaminhados normalmente. */
function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderFab(
  props: Record<string, unknown> = { href: 'https://wa.me/5511999999999' },
): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(WhatsAppFab, { props });
  return domFromHtml(html);
}

describe('WhatsAppFab', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await renderFab();

    const results = await axe.run(document.body, {
      rules: {
        // Mesma isenção de ContactPair.test.ts: fragmento isolado, sem landmarks ao redor.
        // Em produção o FAB é `position: fixed` sobre uma página com Header/main reais.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('tem alvo de 56px (min-h-target-primary) na classe computada', async () => {
    const document = await renderFab();
    const fab = document.querySelector('[data-whatsapp-fab]');

    expect(fab).not.toBeNull();
    expect(fab!.className.split(/\s+/)).toContain('min-h-target-primary');
  });

  it('renderiza a palavra "WhatsApp" por padrão — nunca só ícone', async () => {
    const document = await renderFab();
    const fab = document.querySelector('[data-whatsapp-fab]');

    expect(fab!.textContent?.trim()).toBe('WhatsApp');
  });

  it('aceita label customizado, sempre como palavra visível', async () => {
    const document = await renderFab({
      href: 'https://wa.me/5511999999999',
      label: 'Fale no WhatsApp',
    });
    const fab = document.querySelector('[data-whatsapp-fab]');

    expect(fab!.textContent?.trim()).toBe('Fale no WhatsApp');
  });

  it('marca o elemento raiz com data-whatsapp-fab e o href correto', async () => {
    const document = await renderFab({ href: 'https://wa.me/5511999999999' });
    const fab = document.querySelector('a[data-whatsapp-fab]');

    expect(fab).not.toBeNull();
    expect(fab!.getAttribute('href')).toBe('https://wa.me/5511999999999');
  });
});
