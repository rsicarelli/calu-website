/* LocationBlock — "Onde estamos", isolado.
   ============================================================================
   Três contratos, e nenhum deles é sobre aparência:

   1. O MAPA É IMAGEM ESTÁTICA, NUNCA EMBED. Um `<iframe>` de mapa custa centenas de
      KB de JS de terceiro, rouba o scroll no celular e reprova os Core Web Vitals
      que o projeto trata como requisito, não meta. É o tipo de regressão que entra
      "só para melhorar a experiência" e que nenhum teste de layout pegaria.
   2. ENDEREÇO E HORÁRIO VÊM DE `SITE`, não de prop. Passar por prop abriria a porta
      para duas páginas exibirem endereços diferentes — o defeito exato que a fonte
      única existe para impedir.
   3. SEM MAPA, O ESPAÇO CONTINUA RESERVADO. É a razão de `AspectImage` existir, e
      aqui é o estado real: não há mapa aprovado hoje.

   O mapa é decorativo de propósito — o endereço está escrito logo abaixo, e
   descrever a imagem repetiria a informação para quem usa leitor de tela.

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

import LocationBlock from '@/components/blocks/LocationBlock.astro';
import logoMark from '@/assets/brand/logo-mark.png';
import { SITE } from '@/lib/site';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown> = {}): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(LocationBlock, { props }));
}

describe('LocationBlock', () => {
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

  /* A regressão que este teste existe para impedir: alguém trocar a imagem por um
     mapa "de verdade" e derrubar os Core Web Vitals sem que nada mais reclame. */
  it('nunca renderiza um embed interativo', async () => {
    const document = await render({ mapa: logoMark });

    expect(document.querySelector('iframe')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
  });

  it('exibe o endereço e o horário vindos de SITE', async () => {
    const document = await render();

    expect(document.body.textContent).toContain(SITE.addressLine);
    expect(document.body.textContent).toContain(SITE.hoursLine);
  });

  /* Regra 7 dos invioláveis: telefone sempre ao lado do WhatsApp, mesmo peso. */
  it('traz o par de contato completo', async () => {
    const document = await render();
    const par = document.querySelector('[data-contact-pair]')!;
    const links = Array.from(par.children).filter((el) => el.tagName === 'A');

    expect(links).toHaveLength(2);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([SITE.whatsapp.href, SITE.phone.href]);
  });

  it('sem mapa, reserva o espaço com o placeholder de marca em 3/2', async () => {
    const document = await render();
    const slot = document.querySelector('[data-surface="brand"]')!;

    expect((slot.getAttribute('class') ?? '').split(/\s+/)).toContain('aspect-3/2');
  });

  it('com mapa, mantém a proporção 3/2 e trata a imagem como decorativa', async () => {
    const document = await render({ mapa: logoMark });
    const img = document.querySelector('img')!;

    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(
      (document.body.firstElementChild!.firstElementChild!.getAttribute('class') ?? '').split(
        /\s+/,
      ),
    ).toContain('aspect-3/2');
  });

  it('não define margem externa própria', async () => {
    const document = await render();
    const classes = (document.body.firstElementChild!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
