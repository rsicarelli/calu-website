/* ServiceCard — o card de um atendimento, isolado.
   ============================================================================
   Confirma: zero violação de axe-core; a ORDEM obrigatória dos quatro elementos; o link estendido
   e o `relative` de que ele depende; o nome acessível da ação; descrição e imagem opcionais; e os
   dois layouts.

   A ORDEM É A REGRA CENTRAL (`PAGES.md` § ServiceCard): frase em português comum → nome técnico →
   descrição → ação. A frase popular vem primeiro porque é ela que a pessoa reconhece: quem chega
   com dor no ombro não procura "traumato-ortopedia". Enquanto era markup solto em onze lugares,
   nada impedia o décimo segundo de começar pelo nome técnico. Aqui a ordem é estrutura, e o teste
   confirma no DOM, não no arquivo.

   O NOME ACESSÍVEL DA AÇÃO é a segunda regra, e a que falha em silêncio: envolver o card num `<a>`
   dá ao link um nome formado por frase + nome técnico + descrição lidos de uma vez só. Quem navega
   por lista de links ouve um parágrafo inteiro no lugar de "Ver detalhes". O padrão correto é o
   link estendido — `::after` sobre um ancestral `relative` —, e as duas metades são testadas:
   nenhum `<a>` envolve o card, e a raiz carrega `relative`.

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

import ServiceCard from '@/components/blocks/ServiceCard.astro';

const PROPS = {
  eyebrow: 'Estou com dor em algum lugar',
  title: 'Fisioterapia',
  description: 'Avaliação, plano e acompanhamento.',
  href: '/servicos',
};

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body><ul>${html}</ul></body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown> = PROPS): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(ServiceCard, { props }));
}

describe('ServiceCard', () => {
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

  /* A ordem é decisão de produto, não de layout: a frase popular precede o nome técnico. */
  it('respeita a ordem obrigatória: frase comum → nome técnico → descrição → ação', async () => {
    const document = await render();
    const card = document.querySelector('li');
    const textos = Array.from(card!.querySelectorAll('p, h3, a')).map((el) =>
      el.textContent?.trim(),
    );

    expect(textos).toEqual([PROPS.eyebrow, PROPS.title, PROPS.description, 'Ver detalhes']);
  });

  it('o título sai no nível pedido, com o tamanho do design', async () => {
    const document = await render({ ...PROPS, titleAs: 'h4' });
    const titulo = document.querySelector('h4');

    expect(titulo?.textContent?.trim()).toBe(PROPS.title);
    expect((titulo!.getAttribute('class') ?? '').split(/\s+/)).toContain('text-h3');
  });

  /* As duas metades do link estendido. Falham em silêncio se separadas. */
  it('a ação é o link estendido, e a raiz é `relative` para ele funcionar', async () => {
    const document = await render();
    const card = document.querySelector('li');
    const acao = card!.querySelector('a');

    expect((card!.getAttribute('class') ?? '').split(/\s+/)).toContain('relative');
    expect((acao!.getAttribute('class') ?? '').split(/\s+/)).toContain('after:absolute');
    expect(acao!.getAttribute('href')).toBe(PROPS.href);
  });

  it('o nome acessível da ação é só o texto dela — nenhum <a> envolve o card', async () => {
    const document = await render();
    const card = document.querySelector('li');

    expect(card!.querySelectorAll('a')).toHaveLength(1);
    expect(card!.querySelector('a')!.textContent?.trim()).toBe('Ver detalhes');
    // O card não é filho de uma âncora: o `<a>` está DENTRO dele, não em volta.
    expect(card!.closest('a')).toBeNull();
  });

  it('`actionLabel` troca o texto da ação', async () => {
    const document = await render({ ...PROPS, actionLabel: 'Conhecer o serviço' });

    expect(document.querySelector('a')!.textContent?.trim()).toBe('Conhecer o serviço');
  });

  it('sem `description` nenhum parágrafo vazio é renderizado', async () => {
    const document = await render({ ...PROPS, description: undefined });
    const paragrafos = Array.from(document.querySelectorAll('p'));

    expect(paragrafos).toHaveLength(1);
    expect(paragrafos[0].textContent?.trim()).toBe(PROPS.eyebrow);
  });

  it('`media={false}` não reserva espaço de imagem', async () => {
    const comImagem = await render();
    expect(comImagem.querySelector('img')).not.toBeNull();

    const semImagem = await render({ ...PROPS, media: false });
    expect(semImagem.querySelector('img')).toBeNull();
  });

  it('`layout="row"` liga a container query; `stack` não', async () => {
    const row = await render({ ...PROPS, layout: 'row' });
    const rowClasses = (row.querySelector('li')!.getAttribute('class') ?? '').split(/\s+/);
    expect(rowClasses).toContain('@container');
    expect(rowClasses).toContain('@row:flex-row');

    const stack = await render();
    expect((stack.querySelector('li')!.getAttribute('class') ?? '').split(/\s+/)).not.toContain(
      '@container',
    );
  });

  it('`as="div"` muda a tag da raiz, para o card fora de lista', async () => {
    const document = await render({ ...PROPS, as: 'div' });

    expect(document.querySelector('li')).toBeNull();
    expect(document.querySelector('div.relative')).not.toBeNull();
  });

  /* Caso-limite declarado: título de três linhas não pode mudar a forma do card. */
  it('título de três linhas não muda a marcação', async () => {
    const longo = 'Acompanhamento no pós-operatório de ombro, joelho e coluna vertebral';
    const document = await render({ ...PROPS, title: longo });

    expect(document.querySelector('h3')?.textContent?.trim()).toBe(longo);
    expect(document.querySelectorAll('li')).toHaveLength(1);
  });

  /* O reconhecedor era `/^m[trblxy]?-/`, ancorado — e portanto CEGO para toda margem negativa:
     `-m-4` não casa, `-mt-10` não casa. Mesma família do ponto cego de `aspect-3/4` registrado
     nos defeitos da Fase 2: checagem que parece cobertura e não é. Corrigido para aceitar o
     hífen inicial, com bloco de regressão do próprio reconhecedor abaixo.

     `-m-4` é a ÚNICA margem tolerada, e só porque ela não é margem externa no sentido que o
     teste guarda: ela cancela exatamente o `p-4` do mesmo elemento, para a superfície de hover
     crescer 16px sem deslocar a grade (o `padding:16px; margin:-16px` do mockup). Margem que
     empurrasse o vizinho continua proibida — espaçamento entre itens é do contêiner. */
  const MARGIN = /^-?m[trblxy]?-/;
  const MARGENS_PERMITIDAS = ['-m-4'];

  it('reconhece margem negativa (regressão do próprio reconhecedor)', () => {
    expect(['-m-4', '-mt-10', '-mx-gutter', 'm-4', 'mt-8'].filter((c) => MARGIN.test(c))).toEqual([
      '-m-4',
      '-mt-10',
      '-mx-gutter',
      'm-4',
      'mt-8',
    ]);
  });

  it('não define margem externa própria', async () => {
    const document = await render();
    const classes = (document.querySelector('li')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => MARGIN.test(c) && !MARGENS_PERMITIDAS.includes(c))).toEqual([]);
  });

  /* A margem tolerada só é tolerável enquanto o padding que ela cancela existir. */
  it('a margem negativa vem sempre acompanhada do padding que ela cancela', async () => {
    const document = await render();
    const classes = (document.querySelector('li')!.getAttribute('class') ?? '').split(/\s+/);

    if (classes.includes('-m-4')) expect(classes).toContain('p-4');
  });
});
