/* AccessList — a lista de acesso com sua frase de fechamento, isolada.
   ============================================================================
   O que este componente adiciona ao `RuledList` é UMA coisa, e é justamente a que
   foi esquecida quando as duas partes viviam separadas: o fecho.

   O `RuledList` diz no próprio cabeçalho que a frase de fechamento "fica com quem
   chama: é copy, e copy não entra em componente antes da Fase 4". Esta é a Fase 4, e
   o que as quatro ocorrências mostraram é que lista e fecho não são duas decisões —
   são uma. A lista de acesso sem o convite a avisar sobre adaptação é uma lista de
   requisitos; com ele, é um convite.

   O FECHO É `<p>` DEPOIS DA LISTA, nunca um nono `<li>`: ele não é um item de
   acesso, é uma instrução sobre o que fazer com a lista. Como `<li>` seria anunciado
   como "item 9 de 9" e entraria na contagem que o schema limita a 8.

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

import AccessList from '@/components/blocks/AccessList.astro';

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
const FECHO = 'Precisa de alguma adaptação? Avise antes, a gente organiza.';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown>): Promise<Document> {
  const container = await AstroContainer.create();
  return domFromHtml(await container.renderToString(AccessList, { props }));
}

describe('AccessList', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await render({ itens: DOIS, fecho: FECHO });

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('renderiza um <li> por item, na ordem dada', async () => {
    const document = await render({ itens: DOIS, fecho: FECHO });
    const textos = Array.from(document.querySelectorAll('li')).map((li) => li.textContent?.trim());

    expect(textos).toEqual(DOIS);
  });

  /* O ponto central: o fecho fica FORA da lista. Dentro, ele seria contado como
     item e anunciado como "item N de N". */
  it('o fecho é <p> depois da lista, nunca um <li>', async () => {
    const document = await render({ itens: DOIS, fecho: FECHO });

    expect(document.querySelectorAll('li')).toHaveLength(DOIS.length);
    const p = document.querySelector('p')!;
    expect(p.textContent?.trim()).toBe(FECHO);
    expect(p.closest('ul')).toBeNull();
  });

  it('sem fecho, nenhum <p> é renderizado', async () => {
    const document = await render({ itens: DOIS });

    expect(document.querySelector('p')).toBeNull();
    expect(document.querySelectorAll('li')).toHaveLength(DOIS.length);
  });

  /* Os dois extremos do intervalo declarado no schema. */
  it.each([
    ['dois', DOIS],
    ['oito', OITO],
  ])('aguenta %s itens sem mudar de forma', async (_nome, itens) => {
    const document = await render({ itens, fecho: FECHO });

    expect(document.querySelectorAll('li')).toHaveLength(itens.length);
  });

  /* Vindo do CMS, "vazia" não é hipótese — e um fecho solto, sem a lista que ele
     comenta, seria uma frase órfã pior que a ausência do bloco inteiro. */
  it('lista vazia não renderiza nada, nem o fecho', async () => {
    const document = await render({ itens: [], fecho: FECHO });

    expect(document.querySelector('ul')).toBeNull();
    expect(document.body.textContent?.trim()).toBe('');
  });

  it('não define margem externa própria', async () => {
    const document = await render({ itens: DOIS, fecho: FECHO });
    const classes = (document.body.firstElementChild!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });
});
