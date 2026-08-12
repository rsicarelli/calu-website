/* Credential — a linha de registro profissional, isolada.
   ============================================================================
   Confirma: zero violação de axe-core (região desligada de propósito — mesma isenção de
   ContactPair.test.ts/EmptyState.test.ts, e pelo mesmo motivo); o texto do slot chega ao DOM; a
   raiz é `<p>` por padrão e vira `<dd>` com `as`; `class` do chamador é repassada; e — o ponto do
   componente — as três regras que o handoff impõe pelo nome a esta linha específica.

   As TRÊS REGRAS, e por que elas são o teste e não um comentário (`COMPONENTS.md § Credential`):
   nunca caixa-alta, nunca abaixo do piso de 17px, sempre peso 600. Enquanto isto era markup solto
   repetido sete vezes na `/lab`, a oitava ocorrência podia sair em `text-label` — 15px E
   caixa-alta, as duas violações de uma vez — sem nada ficar vermelho. É exatamente o tipo de
   regra que só sobrevive se estiver travada.

   Comparação por CONJUNTO de classes, não por string exata: o `prettier-plugin-tailwindcss`
   reordena a lista, e um teste acoplado à ordem quebraria na próxima formatação sem que nada de
   verdade tivesse mudado.

   Sem a mágica-comment de ambiente por arquivo do Vitest — mesmo motivo documentado em
   `tests/components/BaseLayout.test.ts`: Astro 7 usa a Vite Environment API para decidir se um
   `.astro` compila para a factory real (Environment "ssr") ou para um stub que só lança, e a
   diretiva de ambiente do Vitest roda o arquivo dentro do Environment "client" — o que faz
   `experimental_AstroContainer` sempre bater no stub.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha. Não escreva essa sequência literal em nenhum lugar deste arquivo. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`;
// `domFromHtml` recasta o resultado para o `Document` da lib DOM ambiente do TypeScript, então o
// `any` daqui não escapa para o resto do arquivo. Mesmo padrão dos outros testes de componente.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import Credential from '@/components/ui/Credential.astro';

const TEXTO = 'Fisioterapeuta · CREFITO-3/000000-F';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderCredential(props: Record<string, unknown> = {}): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Credential, { props, slots: { default: TEXTO } });
  return domFromHtml(html);
}

/** Lista de classes do elemento raiz, como conjunto — imune à reordenação do Prettier. */
async function rootClasses(props: Record<string, unknown> = {}): Promise<string[]> {
  const document = await renderCredential(props);
  const root = document.body.firstElementChild;
  expect(root).not.toBeNull();
  return (root!.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

describe('Credential', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await renderCredential();

    const results = await axe.run(document.body, {
      rules: {
        // "region": conteúdo de página precisa estar dentro de uma landmark. Regra de PÁGINA, não
        // de componente — aqui só existe o fragmento isolado. Em produção a credencial vive dentro
        // de uma bio, dentro do `<main>` de uma página; `tests/pages/lab.test.ts` exercita a regra
        // sem isenção nesse nível.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('renderiza o texto do slot', async () => {
    const document = await renderCredential();

    expect(document.body.textContent?.trim()).toBe(TEXTO);
  });

  it('a raiz é um <p> por padrão', async () => {
    const document = await renderCredential();

    expect(document.body.firstElementChild?.tagName.toLowerCase()).toBe('p');
  });

  it('`as="dd"` muda a tag da raiz, para uso dentro de ficha', async () => {
    const document = await renderCredential({ as: 'dd' });

    expect(document.body.firstElementChild?.tagName.toLowerCase()).toBe('dd');
  });

  it('respeita o piso tipográfico do projeto (17px, `text-small`)', async () => {
    expect(await rootClasses()).toContain('text-small');
  });

  it('sai sempre em peso 600', async () => {
    expect(await rootClasses()).toContain('font-semibold');
  });

  /* As duas proibições do handoff, escritas como negativa porque é assim que elas falham: ninguém
     escreve `uppercase` de propósito numa credencial — a regressão chega junto com `text-label`,
     que traz caixa-alta E 15px no mesmo pacote fechado (global.css §9). */
  it('nunca sai em caixa-alta nem em `text-label`', async () => {
    const classes = await rootClasses();

    expect(classes).not.toContain('uppercase');
    expect(classes).not.toContain('label');
    expect(classes).not.toContain('text-label');
  });

  it('não define margem externa própria — quem posiciona é quem consome', async () => {
    const classes = await rootClasses();

    expect(classes.filter((c) => /^m[trblxy]?-/.test(c))).toEqual([]);
  });

  it('repassa `class` do chamador, sem perder as próprias', async () => {
    const classes = await rootClasses({ class: 'mt-4' });

    expect(classes).toContain('mt-4');
    expect(classes).toContain('text-small');
  });
});
