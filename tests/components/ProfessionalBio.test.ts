/* ProfessionalBio — a bio de uma profissional, isolada.
   ============================================================================
   Confirma: zero violação de axe-core; nome, credencial, descrição e formação na ordem certa;
   `nameAs` padrão e sobrescrito; o retrato sempre presente na proporção 4/5; os dois extremos do
   intervalo declarado de formação (1 e 6 linhas); e os dois casos de ausência.

   OS CASOS DE AUSÊNCIA são o que o CMS produz sozinho e por isso o que mais importa: sem
   descrição, nenhum parágrafo vazio; sem formação, nem a lista NEM o rótulo "Formação" — um
   rótulo órfão sobre nada é pior que a ausência, porque parece conteúdo que não carregou.

   A credencial vem do primitivo `Credential`, que já trava as próprias regras (nunca caixa-alta,
   nunca abaixo de 17px). Aqui só se confirma que ela está presente e que este bloco não a
   contornou escrevendo um `<p>` na mão.

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

import ProfessionalBio from '@/components/blocks/ProfessionalBio.astro';

const PROPS = {
  name: '[Nome da profissional]',
  credential: 'Fisioterapeuta · CREFITO-3/000000-F',
  description: 'Atende queixa de dor e limitação de movimento.',
  education: ['Graduação em Fisioterapia'],
};

const SEIS = [
  'Graduação em Fisioterapia',
  'Formação em Pilates clínico',
  'Curso de reabilitação de coluna',
  'Curso de reabilitação de ombro e joelho',
  'Formação em exercício para idosos',
  'Atualização em avaliação funcional',
];

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
  return domFromHtml(await container.renderToString(ProfessionalBio, { props }));
}

describe('ProfessionalBio', () => {
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

  it('renderiza nome, credencial e descrição', async () => {
    const document = await render();

    expect(document.querySelector('h3')?.textContent?.trim()).toBe(PROPS.name);
    expect(document.body.textContent).toContain(PROPS.credential);
    expect(document.body.textContent).toContain(PROPS.description);
  });

  it('`nameAs` muda o nível sem mudar o tamanho', async () => {
    const document = await render({ ...PROPS, nameAs: 'h5' });
    const nome = document.querySelector('h5');

    expect(nome).not.toBeNull();
    expect(document.querySelector('h3')).toBeNull();
    expect((nome!.getAttribute('class') ?? '').split(/\s+/)).toContain('text-h3');
  });

  /* A credencial é do primitivo, que trava as próprias regras — aqui só se confirma que este
     bloco não a contornou escrevendo um `<p>` na mão. */
  it('a credencial sai pelo primitivo, com as classes dele', async () => {
    const document = await render();
    const linha = Array.from(document.querySelectorAll('p')).find((p) =>
      p.textContent?.includes('CREFITO'),
    );

    expect(linha).not.toBeUndefined();
    const classes = (linha!.getAttribute('class') ?? '').split(/\s+/);
    expect(classes).toContain('text-small');
    expect(classes).toContain('font-semibold');
  });

  it('o retrato é sempre o espaço reservado, na proporção 4/5', async () => {
    const document = await render();
    const retrato = document.querySelector('[data-brand-placeholder]');

    expect(retrato).not.toBeNull();
    expect((retrato!.getAttribute('class') ?? '').split(/\s+/)).toContain('aspect-4/5');
    expect(document.querySelector('img')).not.toBeNull();
  });

  /* Os dois extremos do intervalo declarado. Nada na forma pode depender da quantidade. */
  it.each([
    ['uma', PROPS.education],
    ['seis', SEIS],
  ])('aguenta %s linha(s) de formação', async (_nome, education) => {
    const document = await render({ ...PROPS, education });

    expect(document.querySelectorAll('ul li')).toHaveLength(education.length);
  });

  it('sem `description` nenhum parágrafo vazio é renderizado', async () => {
    const document = await render({ ...PROPS, description: undefined });

    expect(document.body.textContent).not.toContain('Atende queixa');
    const vazios = Array.from(document.querySelectorAll('p')).filter(
      (p) => (p.textContent ?? '').trim() === '',
    );
    expect(vazios).toEqual([]);
  });

  /* Rótulo órfão sobre nada parece conteúdo que não carregou. */
  it('sem formação, nem a lista nem o rótulo "Formação" aparecem', async () => {
    const document = await render({ ...PROPS, education: [] });

    expect(document.querySelector('ul')).toBeNull();
    expect(document.body.textContent).not.toContain('Formação');
  });

  it('a container query fica na raiz do bloco, não na linha do flex', async () => {
    const document = await render();
    const raiz = document.body.firstElementChild;

    expect((raiz!.getAttribute('class') ?? '').split(/\s+/)).toContain('@container');
  });

  it('não define margem externa própria', async () => {
    const document = await render();
    const classes = (document.body.firstElementChild!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
