/* RuledList — a lista de linhas curtas separadas por régua, isolada.
   ============================================================================
   Confirma: zero violação de axe-core; N itens viram N `<li>` na ordem dada; a régua está no
   ITEM e não no `<ul>`; o intervalo declarado de 2 a 8 itens não muda a forma da lista; e lista
   vazia não renderiza `<ul>` nenhum.

   O CASO VAZIO é o que mais importa aqui, e é o mesmo cuidado do `message` opcional em
   `EmptyState`: uma moldura sem conteúdo dentro é pior que nada, porque parece conteúdo que não
   carregou. A lista vem do CMS, então "vazia" não é hipótese — é o estado do primeiro dia.

   A régua no item, e não `divide-y` no `<ul>`, é o que dá a linha DE CIMA ao primeiro item, que é
   o que separa a lista do cabeçalho acima dela. Trocar por `divide-y` pareceria equivalente e
   comeria essa linha em silêncio — daí o teste.

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

import RuledList from '@/components/ui/RuledList.astro';

const DOIS = ['Entrada sem degrau', 'Elevador no prédio'];
const OITO = [
  'Entrada sem degrau',
  'Elevador no prédio',
  'Banheiro adaptado',
  'Estacionamento nas proximidades',
  'Estação de metrô a curta caminhada',
  'Acompanhante pode entrar junto',
  'Corrimão nos dois lados da escada',
  'Cadeira para esperar sentado na recepção',
];

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(items: string[]): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(RuledList, { props: { items } }));
}

describe('RuledList', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render(DOIS);

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('renderiza um <li> por item, na ordem dada', async () => {
    const document = await render(DOIS);
    const textos = Array.from(document.querySelectorAll('li')).map((li) => li.textContent?.trim());

    expect(textos).toEqual(DOIS);
  });

  /* Os dois extremos do intervalo declarado no modelo de conteúdo. Nada na forma pode depender do
     número de itens — é por isso que a lista é `flex flex-col` e não uma grade de três colunas,
     que quebraria com qualquer número que não fosse múltiplo dela. */
  it.each([
    ['dois', DOIS],
    ['oito', OITO],
  ])('aguenta %s itens sem mudar de forma', async (_nome, items) => {
    const document = await render(items);
    const lista = document.querySelector('ul');

    expect(document.querySelectorAll('li')).toHaveLength(items.length);
    expect((lista!.getAttribute('class') ?? '').split(/\s+/)).toContain('flex-col');
  });

  it('a régua vive no item, não no <ul> — é o que dá a linha de cima ao primeiro', async () => {
    const document = await render(DOIS);
    const primeiro = document.querySelector('li');
    const lista = document.querySelector('ul');

    expect((primeiro!.getAttribute('class') ?? '').split(/\s+/)).toContain('border-t');
    expect((lista!.getAttribute('class') ?? '').split(/\s+/)).not.toContain('divide-y');
  });

  /* Vindo do CMS, "vazia" não é hipótese: é o estado do primeiro dia. */
  it('lista vazia não renderiza <ul> nenhum', async () => {
    const document = await render([]);

    expect(document.querySelector('ul')).toBeNull();
    expect(document.body.textContent?.trim()).toBe('');
  });

  it('não define margem externa própria', async () => {
    const document = await render(DOIS);
    const classes = (document.querySelector('ul')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
