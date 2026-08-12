/* CtaBlock — o convite a falar com a clínica, isolado.
   ============================================================================
   Confirma: zero violação de axe-core; título, apoio e o par de contato na ordem certa;
   `headingAs` padrão e sobrescrito; e — a regra do projeto que este bloco carrega — que os DOIS
   canais estão sempre lá, com o mesmo peso visual.

   O PAR É A REGRA. `DESIGN-SYSTEM §7`: telefone sempre ao lado do WhatsApp, nenhum dos dois só
   ícone, mesmo peso. Parte do público liga em vez de escrever, e um CTA que oferecesse só um dos
   dois deixaria essas pessoas sem saída. Por isso o `ContactPair` entra por construção e não por
   slot — não há como chamar este bloco com um canal só —, e por isso o teste cobra os dois links
   e o alvo de toque de cada um.

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

import CtaBlock from '@/components/blocks/CtaBlock.astro';

const PROPS = {
  heading: 'Sua dúvida não estava aqui?',
  message: 'Escreva ou ligue. Quem responde é uma das profissionais da clínica.',
  whatsappHref: 'https://wa.me/5511999999999',
  phoneHref: 'tel:+5511999999999',
  phoneLabel: '(11) 99999-9999',
};

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown> = PROPS): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(CtaBlock, { props }));
}

describe('CtaBlock', () => {
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

  it('renderiza título e apoio', async () => {
    const document = await render();

    expect(document.querySelector('h2')?.textContent?.trim()).toBe(PROPS.heading);
    expect(document.querySelector('p')?.textContent?.trim()).toBe(PROPS.message);
  });

  it('`headingAs` muda o nível sem mudar o tamanho', async () => {
    const document = await render({ ...PROPS, headingAs: 'h4' });
    const titulo = document.querySelector('h4');

    expect(titulo).not.toBeNull();
    expect(document.querySelector('h2')).toBeNull();
    expect((titulo!.getAttribute('class') ?? '').split(/\s+/)).toContain('text-h3');
  });

  /* A regra do projeto que este bloco existe para carregar. */
  it('sempre traz os DOIS canais, com o mesmo peso visual', async () => {
    const document = await render();
    const par = document.querySelector('[data-contact-pair]');

    expect(par).not.toBeNull();

    const links = Array.from(par!.querySelectorAll('a'));
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe(PROPS.whatsappHref);
    expect(links[1].getAttribute('href')).toBe(PROPS.phoneHref);
    // Peso idêntico é garantido pelo ContactPair; aqui só se confirma que ele não foi contornado.
    expect(links[0].getAttribute('class')).toBe(links[1].getAttribute('class'));
  });

  it('os dois links respeitam o piso de alvo de toque', async () => {
    const document = await render();

    for (const link of Array.from(document.querySelectorAll('[data-contact-pair] a'))) {
      expect((link.getAttribute('class') ?? '').split(/\s+/)).toContain('min-h-target');
    }
  });

  it('não define margem externa própria', async () => {
    const document = await render();
    const classes = (document.body.firstElementChild!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });

  it('repassa `class` do chamador sem perder as próprias', async () => {
    const document = await render({ ...PROPS, class: 'mt-8' });
    const classes = (document.body.firstElementChild!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes).toContain('mt-8');
    expect(classes).toContain('bg-surface-alt');
  });
});
