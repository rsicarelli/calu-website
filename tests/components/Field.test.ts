/* Field — um campo de formulário, isolado.
   ============================================================================
   Confirma: zero violação de axe-core (associação rótulo↔controle é o ponto do componente, e é
   isso que o axe mede aqui); os três controles; `for`/`id` casando nos três; o repasse de
   atributos ir para o CONTROLE e não para a raiz; e as três metades do estado de erro.

   ERRO É A SOMA DE TRÊS SINAIS e o teste cobra os três porque a regressão típica acende um só:
   a mensagem sem `aria-invalid` (quem enxerga vê o erro, quem usa leitor de tela não), ou a borda
   sem a mensagem (cor sozinha, que a WCAG 1.4.1 proíbe). Passando `errorMessage` os três saem
   juntos; sem ele, nenhum sai — inclusive nenhum `aria-describedby` apontando para um id que não
   existe, que é o jeito silencioso de quebrar um leitor de tela.

   O `<textarea>` NÃO leva `min-h-target`, e isso é intencional, não esquecimento: `rows` já o
   deixa mais alto que o piso, e o `py-4` dá o respiro que os controles de uma linha ganham do
   `min-h`. Testado para que ninguém "corrija" a ausência depois.

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

import Field from '@/components/ui/Field.astro';

const PROPS = { id: 'contato-nome', label: 'Nome', name: 'nome' };

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body><form>${html}</form></body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown> = PROPS, slot?: string): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Field, {
    props,
    ...(slot ? { slots: { default: slot } } : {}),
  });
  return domFromHtml(html);
}

describe('Field', () => {
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

  it('o rótulo é sempre visível e associado ao controle', async () => {
    const document = await render();
    const label = document.querySelector('label');
    const input = document.querySelector('input');

    expect(label?.textContent?.trim()).toBe('Nome');
    expect(label?.getAttribute('for')).toBe(PROPS.id);
    expect(input?.getAttribute('id')).toBe(PROPS.id);
  });

  it.each([
    ['input', 'input'],
    ['select', 'select'],
    ['textarea', 'textarea'],
  ])('control="%s" renderiza <%s> associado ao rótulo', async (control, tag) => {
    const document = await render({ ...PROPS, control });
    const controle = document.querySelector(tag);

    expect(controle).not.toBeNull();
    expect(controle!.getAttribute('id')).toBe(PROPS.id);
    expect(document.querySelector('label')?.getAttribute('for')).toBe(PROPS.id);
  });

  it('as opções do select entram por slot', async () => {
    const document = await render(
      { ...PROPS, control: 'select' },
      '<option>Ainda não sei</option>',
    );

    expect(document.querySelectorAll('select option')).toHaveLength(1);
  });

  it('repassa atributos ao CONTROLE, não à raiz', async () => {
    const document = await render({ ...PROPS, type: 'tel', autocomplete: 'tel', required: true });
    const input = document.querySelector('input');

    expect(input?.getAttribute('type')).toBe('tel');
    expect(input?.getAttribute('autocomplete')).toBe('tel');
    expect(input?.hasAttribute('required')).toBe(true);
    expect(document.querySelector('form > div')?.hasAttribute('required')).toBe(false);
  });

  it('`rows` chega ao textarea', async () => {
    const document = await render({ ...PROPS, control: 'textarea', rows: 4 });

    expect(document.querySelector('textarea')?.getAttribute('rows')).toBe('4');
  });

  /* As três metades do erro, juntas: a regressão típica acende uma só. */
  it('`errorMessage` acende os TRÊS sinais de erro de uma vez', async () => {
    const document = await render({ ...PROPS, errorMessage: 'Informe um telefone com DDD.' });
    const input = document.querySelector('input');
    const mensagem = document.querySelector(`#${PROPS.id}-mensagem`);

    // 1. o texto, nomeando o campo
    expect(mensagem?.textContent?.trim()).toBe('Informe um telefone com DDD.');
    // 2. o sinal programático
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    // 3. a borda mais grossa — e a borda normal precisa SAIR, não somar
    const classes = (input!.getAttribute('class') ?? '').split(/\s+/);
    expect(classes).toContain('border-2');
    expect(classes).toContain('border-error');
    expect(classes).not.toContain('border-field-border');
  });

  it('o erro liga mensagem e controle por aria-describedby', async () => {
    const document = await render({ ...PROPS, errorMessage: 'Informe seu nome.' });
    const id = document.querySelector('input')?.getAttribute('aria-describedby');

    expect(id).toBe(`${PROPS.id}-mensagem`);
    expect(document.getElementById(id!)).not.toBeNull();
  });

  /* `aria-describedby` apontando para um id inexistente é o jeito silencioso de quebrar um
     leitor de tela — daí testar a ausência, e não só a presença. */
  it('sem erro, nenhum sinal de erro sobra', async () => {
    const document = await render();
    const input = document.querySelector('input');

    expect(input?.hasAttribute('aria-invalid')).toBe(false);
    expect(input?.hasAttribute('aria-describedby')).toBe(false);
    expect(document.querySelector('span')).toBeNull();
    expect((input!.getAttribute('class') ?? '').split(/\s+/)).toContain('border-field-border');
  });

  it('o controle de uma linha respeita o piso de alvo de toque', async () => {
    const classes = ((await render()).querySelector('input')!.getAttribute('class') ?? '').split(
      /\s+/,
    );

    expect(classes).toContain('min-h-target');
  });

  /* Intencional: `rows` já passa do piso, e `py-4` dá o respiro. Testado para ninguém "corrigir"
     a ausência depois. */
  it('o textarea não leva `min-h-target` — a altura vem de `rows`', async () => {
    const document = await render({ ...PROPS, control: 'textarea', rows: 4 });
    const classes = (document.querySelector('textarea')!.getAttribute('class') ?? '').split(/\s+/);

    expect(classes).not.toContain('min-h-target');
    expect(classes).toContain('py-4');
  });
});
