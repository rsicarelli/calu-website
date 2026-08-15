/* FaqItem — uma pergunta do accordion, isolada.
   ============================================================================
   Confirma: zero violação de axe-core; pergunta e resposta chegam ao DOM; `open` só aparece
   quando pedido; `questionAs` muda o nível do cabeçalho; e as três regras estruturais que o
   componente existe para tornar impossíveis de errar.

   A PRIMEIRA REGRA É O MOTIVO DO COMPONENTE. `<summary>` precisa ser o PRIMEIRO FILHO de
   `<details>` — é o modelo de conteúdo do elemento. O handoff pedia o inverso (`<h3><summary>`), e
   com um cabeçalho no meio o `<details>` fica sem summary nenhum: o navegador sintetiza o próprio
   marcador e o texto da pergunta some junto com a resposta quando o item está fechado. O defeito é
   INVISÍVEL no HTML — só aparece no navegador —, que é exatamente por que ele precisa de teste e
   não de comentário. A Fase 2 corrigiu o handoff; aqui a correção vira estrutura.

   A segunda: nenhum `name`, então abrir uma pergunta não fecha as outras. A terceira: o cabeçalho
   vive DENTRO do summary, que é o que mantém a navegação por cabeçalhos do leitor de tela
   alcançando cada pergunta sem quebrar o elemento.

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

import FaqItem from '@/components/blocks/FaqItem.astro';

const PROPS = {
  question: 'Preciso de pedido médico?',
  answer: 'Não é obrigatório para começar.',
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
  return domFromHtml(await container.renderToString(FaqItem, { props }));
}

describe('FaqItem', () => {
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

  /* O defeito que motivou a correção do handoff na Fase 2, agora impossível por construção. */
  it('o <summary> é o PRIMEIRO FILHO do <details>', async () => {
    const document = await render();
    const details = document.querySelector('details');

    expect(details).not.toBeNull();
    expect(details!.firstElementChild?.tagName.toLowerCase()).toBe('summary');
  });

  it('o cabeçalho da pergunta vive DENTRO do <summary>', async () => {
    const document = await render();
    const heading = document.querySelector('summary h3');

    expect(heading).not.toBeNull();
    expect(heading!.textContent?.trim()).toBe(PROPS.question);
  });

  /* O sinal +/− que `COMPONENTS.md § FaqAccordion` pede e que faltava: sem ele a pergunta lia
     como texto estático, sem nenhuma pista de que abre. Os DOIS nós existem sempre no HTML e o
     CSS escolhe qual aparece — é por isso que o teste conta dois, e não um. */
  it('o <summary> traz os dois sinais, ambos escondidos do leitor de tela', async () => {
    const document = await render();
    const sinais = document.querySelectorAll('summary [aria-hidden="true"]');

    expect(sinais).toHaveLength(2);
    expect(Array.from(sinais).map((s) => s.textContent?.trim())).toEqual(['+', '−']);
  });

  /* O sinal é decoração: quem usa leitor de tela recebe o estado pelo próprio `<details>`, e
     ouvir "mais" antes de cada pergunta seria ruído. */
  it('o texto acessível da pergunta não inclui o sinal', async () => {
    const document = await render();

    expect(document.querySelector('summary h3')!.textContent?.trim()).toBe(PROPS.question);
  });

  /* Sem `name` compartilhado o accordion não é exclusivo — abrir uma pergunta não fecha as
     outras. É a diferença entre "li as duas dúvidas" e "perdi a primeira". */
  it('nunca emite `name` — o accordion não é exclusivo', async () => {
    const document = await render();

    expect(document.querySelector('details')!.hasAttribute('name')).toBe(false);
  });

  it('renderiza a resposta', async () => {
    const document = await render();
    const answer = document.querySelector('details > p');

    expect(answer?.textContent?.trim()).toBe(PROPS.answer);
  });

  it('fechado por padrão', async () => {
    const document = await render();

    expect(document.querySelector('details')!.hasAttribute('open')).toBe(false);
  });

  it('`open` abre o item — o primeiro de cada grupo', async () => {
    const document = await render({ ...PROPS, open: true });

    expect(document.querySelector('details')!.hasAttribute('open')).toBe(true);
  });

  it('`questionAs` muda o nível do cabeçalho sem mudar o tamanho', async () => {
    const document = await render({ ...PROPS, questionAs: 'h5' });
    const heading = document.querySelector('summary h5');

    expect(heading).not.toBeNull();
    expect(document.querySelector('summary h3')).toBeNull();
    expect((heading!.getAttribute('class') ?? '').split(/\s+/)).toContain('text-question');
  });

  it('o alvo de toque do <summary> respeita o piso do projeto', async () => {
    const document = await render();
    const summary = document.querySelector('summary');

    expect((summary!.getAttribute('class') ?? '').split(/\s+/)).toContain('min-h-target');
  });

  /* IDENTIDADE — o marcador que `tests/system/component-identity.test.ts` usa para achar o item no
     HTML construído. Sem valor: estado visual único, e `open` é runtime, não identidade. Ele fica
     na RAIZ; os `data-faq-sign-*` são gancho de CSS nos glifos e não servem para isto. */
  it('declara `data-faq-item` na raiz <details>', async () => {
    const document = await render();
    const raiz = document.querySelector('details');

    expect(raiz!.hasAttribute('data-faq-item')).toBe(true);
  });

  it('o chamador não consegue sobrescrever o marcador de identidade', async () => {
    const document = await render({ ...PROPS, 'data-faq-item': 'outra-coisa' });

    expect(document.querySelector('details')!.getAttribute('data-faq-item')).toBe('');
  });
});
