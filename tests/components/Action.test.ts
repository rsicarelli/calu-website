/* Action — a ação da tela, isolada.
   ============================================================================
   Confirma: zero violação de axe-core; a raiz é `<button>` por padrão e `<a href>` com `as="a"`;
   o texto do slot chega ao DOM; cada tamanho emite o piso de toque certo; cada variante emite
   EXATAMENTE um fundo; `primary` declara `data-surface="accent"` e vence o do chamador; e as duas
   metades da regra de "enviando".

   A REGRA QUE ESTE ARQUIVO EXISTE PARA TRAVAR — `COMPONENTS.md § ContactForm` marca como "não
   reintroduzir": o botão em envio usa `aria-disabled` + `aria-busy` e NUNCA o atributo `disabled`,
   porque `disabled` tira o botão da ordem de foco no meio da ação e quem navega por teclado perde
   o lugar. Uma regra escrita em prosa num handoff sobrevive até a próxima pessoa que achar que
   `disabled` é "mais semântico"; um teste sobrevive mais. As duas metades são testadas separadas
   de propósito — emitir os ARIA e não emitir o atributo são duas formas diferentes de errar.

   `min-h-target` é checado por `classList.contains`, nunca por substring: `min-h-target-primary`
   CONTÉM `min-h-target` como prefixo, e uma checagem ingênua daria o tamanho errado por aprovado
   (o mesmo cuidado documentado em `tests/system/touch-targets.test.ts`).

   Comparação por CONJUNTO de classes, não por string exata: o `prettier-plugin-tailwindcss`
   reordena a lista e um teste acoplado à ordem quebraria à toa.

   LIMITAÇÃO CONHECIDA: `experimental_AstroContainer` renderiza HTML estático. Hover e foco reais
   não são exercitados aqui — o que se testa é a CLASSE que os produz. Medir o estado pintado
   exigiria um motor de browser (Fase 5, junto com CI).

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

import Action from '@/components/ui/Action.astro';

const TEXTO = 'Falar no WhatsApp';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function render(props: Record<string, unknown> = {}): Promise<Element> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Action, { props, slots: { default: TEXTO } });
  const root = domFromHtml(html).body.firstElementChild;
  expect(root).not.toBeNull();
  return root!;
}

async function classesOf(props: Record<string, unknown> = {}): Promise<string[]> {
  const root = await render(props);
  return (root.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

/** Todos os fundos que o componente sabe pintar. Serve para provar exclusão mútua. */
const BACKGROUNDS = ['bg-accent', 'bg-accent-hover', 'bg-disabled-bg'];

describe('Action', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Action, { slots: { default: TEXTO } });
    const document = domFromHtml(html);

    const results = await axe.run(document.body, {
      rules: {
        // "region": regra de PÁGINA, não de componente — aqui só existe o fragmento isolado.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('renderiza o texto do slot — não existe ação só-ícone', async () => {
    const root = await render();

    expect(root.textContent?.trim()).toBe(TEXTO);
  });

  it('a raiz é <button> por padrão', async () => {
    const root = await render();

    expect(root.tagName.toLowerCase()).toBe('button');
  });

  it('`as="a"` renderiza uma âncora com href', async () => {
    const root = await render({ as: 'a', href: '/servicos' });

    expect(root.tagName.toLowerCase()).toBe('a');
    expect(root.getAttribute('href')).toBe('/servicos');
  });

  it('repassa `type` para o botão', async () => {
    const root = await render({ type: 'submit' });

    expect(root.getAttribute('type')).toBe('submit');
  });

  it('size padrão é `md` — 52px, o mínimo de qualquer controle', async () => {
    const classes = await classesOf();

    expect(classes).toContain('min-h-target');
    expect(classes).not.toContain('min-h-target-primary');
  });

  it('size="lg" é 56px — a ação principal', async () => {
    const classes = await classesOf({ size: 'lg' });

    expect(classes).toContain('min-h-target-primary');
    expect(classes).not.toContain('min-h-target');
  });

  it('variant padrão é `secondary` — borda, sem fundo', async () => {
    const classes = await classesOf();

    /* `border-brand`, não `border-line`: borda e texto do secundário são a MESMA cor
       (COMPONENTS.md § Button, e é o que o mockup desenha). Esta asserção pedia `border-line` e
       foi ela que congelou o vazamento — um marrom quente saturado ao lado de um texto verde. */
    expect(classes).toContain('border-brand');
    expect(classes).toContain('text-brand');
    expect(classes).toContain('text-brand');
    expect(classes.filter((c) => BACKGROUNDS.includes(c))).toEqual([]);
  });

  it('variant="primary" pinta exatamente um fundo', async () => {
    const classes = await classesOf({ variant: 'primary' });

    expect(classes.filter((c) => BACKGROUNDS.includes(c))).toEqual(['bg-accent']);
    expect(classes).toContain('text-on-accent');
  });

  it('variant="primary" declara `data-surface="accent"`, que reescopa o anel de foco', async () => {
    const root = await render({ variant: 'primary' });

    expect(root.getAttribute('data-surface')).toBe('accent');
  });

  it('o `data-surface` do componente vence um passado pelo chamador', async () => {
    const root = await render({ variant: 'primary', 'data-surface': 'deep' });

    expect(root.getAttribute('data-surface')).toBe('accent');
  });

  it('`secondary` não declara `data-surface` — não pinta fundo escuro', async () => {
    const root = await render();

    expect(root.hasAttribute('data-surface')).toBe(false);
  });

  /* Primeira metade da regra: os sinais que o leitor de tela usa precisam estar lá. */
  it('`loading` emite aria-disabled e aria-busy', async () => {
    const root = await render({ loading: true });

    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(root.getAttribute('aria-busy')).toBe('true');
  });

  /* Segunda metade, e a que de fato regride: `disabled` tiraria o botão da ordem de foco no meio
     do envio. Testada separada porque emitir os ARIA e evitar o atributo são erros diferentes. */
  it('`loading` NUNCA emite o atributo `disabled`', async () => {
    const root = await render({ loading: true });

    expect(root.hasAttribute('disabled')).toBe(false);
  });

  it('`loading` suspende a variante e não deixa dois fundos ao mesmo tempo', async () => {
    const classes = await classesOf({ loading: true, variant: 'primary' });

    expect(classes.filter((c) => BACKGROUNDS.includes(c))).toEqual(['bg-disabled-bg']);
  });

  it('`disabled` de verdade continua possível por repasse, para o caso legítimo', async () => {
    const root = await render({ disabled: true });

    expect(root.hasAttribute('disabled')).toBe(true);
    expect((root.getAttribute('class') ?? '').split(/\s+/)).toContain('disabled:bg-disabled-bg');
  });

  /* O Preflight do Tailwind 4.3.3 não declara `cursor` nenhum: `<a href>` já recebe `pointer` da
     folha do navegador, `<button>` não. Daí a assimetria — e daí ela merecer teste. */
  it('`cursor-pointer` só no botão; a âncora já o recebe do navegador', async () => {
    expect(await classesOf()).toContain('cursor-pointer');
    expect(await classesOf({ as: 'a', href: '/x' })).not.toContain('cursor-pointer');
  });

  it('não define margem externa própria', async () => {
    const classes = await classesOf();

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });

  it('repassa `class` do chamador sem perder as próprias', async () => {
    const classes = await classesOf({ class: 'mt-8' });

    expect(classes).toContain('mt-8');
    expect(classes).toContain('rounded-control');
  });
});
