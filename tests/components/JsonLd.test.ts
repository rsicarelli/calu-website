/* JsonLd — teste de regressão do escape anti-breakout de `</script>`.
   ============================================================================
   Auditoria da Fase 1.7 comprovou ad-hoc que `JsonLd.astro` escapa `<` (via
   `.replace(/</g, '<')`) antes de injetar o JSON com `set:html`, mas isso não tinha teste
   permanente — este arquivo fecha essa lacuna. O caso importante (`</script>` embutido no
   próprio `schema`) é verificado sobre o HTML BRUTO devolvido por `renderToString`, ANTES de
   qualquer parse de DOM: um parser (jsdom incluso) normaliza a árvore por trás e esconderia se
   o byte stream chegou a conter a sequência perigosa. Só depois de contar as ocorrências no
   texto bruto é que os testes sobem um DOM para ler o `<script>` e confirmar, via `JSON.parse`,
   que o dado original volta intacto.

   Sem a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — mesmo
   motivo documentado em `tests/components/BaseLayout.test.ts`/`Header.test.ts`: Astro 7 usa a
   Vite Environment API para decidir se um `.astro` compila para a factory real (Environment
   "ssr") ou para um stub que só lança "Astro components cannot be used in the browser"
   (Environment "client"), e a diretiva de ambiente "jsdom" do Vitest roda o arquivo de teste
   dentro do Environment "client" do Vite — o que faz `experimental_AstroContainer` sempre bater
   no stub. Este arquivo roda no ambiente padrão (node → Environment "ssr") e sobe um DOM de
   verdade na mão com `new JSDOM(html)` só para o HTML já renderizado.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha. Não escreva essa sequência literal em nenhum lugar deste arquivo. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`;
// instalar uma dependência nova está fora do escopo desta tarefa. `domFromHtml`, logo abaixo,
// recasta o resultado para o `Document` da lib DOM ambiente do próprio TypeScript — então o
// `any` daqui não escapa para o resto do arquivo.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import JsonLd from '@/components/content/JsonLd.astro';
import type { JsonLdNode } from '@/lib/jsonld';

/** Sobe um DOM real (jsdom) a partir do HTML renderizado pelo Container e devolve o `document`
 *  já tipado como `Document`. `JsonLd` renderiza só um `<script>`, sem `<html>`/`<body>` ao
 *  redor — mesmo motivo de `Header.test.ts`/`WhatsAppFab.test.ts`: envolve o fragmento antes de
 *  subir o DOM. */
function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderJsonLd(schema: JsonLdNode | JsonLdNode[]): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(JsonLd, { props: { schema } });
}

describe('JsonLd', () => {
  it('renderiza exatamente 1 <script type="application/ld+json"> com o schema sob @graph', async () => {
    const html = await renderJsonLd({ '@type': 'Physiotherapy', name: 'Fixture' });
    const document = domFromHtml(html);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const parsed = JSON.parse(scripts[0]!.textContent ?? '');
    expect(parsed).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'Physiotherapy', name: 'Fixture' }],
    });
  });

  it('aceita `schema` como array e continua gerando 1 único <script>, com os 2 nodes em @graph', async () => {
    const nodes: JsonLdNode[] = [
      { '@type': 'Physiotherapy', name: 'Fixture A' },
      { '@type': 'MedicalBusiness', name: 'Fixture B' },
    ];
    const html = await renderJsonLd(nodes);
    const document = domFromHtml(html);

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const parsed = JSON.parse(scripts[0]!.textContent ?? '');
    expect(parsed['@graph']).toEqual(nodes);
  });

  it('escapa `</script>` embutido no schema: a sequência nunca aparece 2x no HTML bruto, e o JSON.parse recupera a string original', async () => {
    const malicious = '</script><script>alert(1)</script>';
    const schema: JsonLdNode = {
      '@type': 'Physiotherapy',
      name: `Título malicioso ${malicious}`,
    };
    const html = await renderJsonLd(schema);

    // Sobre o HTML BRUTO — string, antes de qualquer parse de DOM — de propósito: um parser já
    // teria "corrigido" a árvore por trás, escondendo se o byte stream realmente contém a
    // sequência perigosa. `</script>` deve aparecer EXATAMENTE 1 vez: só a tag de fechamento
    // real do <script> que o componente gera. 2+ ocorrências significaria que o conteúdo do
    // schema escapou e fechou a tag prematuramente, abrindo espaço para o `<script>` injetado
    // rodar de verdade no navegador.
    const occurrences = html.split('</script>').length - 1;
    expect(occurrences).toBe(1);

    const document = domFromHtml(html);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    // O escape precisa ser reversível: neutraliza o breakout na camada de serialização HTML sem
    // corromper o dado. `JSON.parse` do texto do <script> deve devolver a string original —
    // com o `</script>` real de volta, agora inofensivo dentro de um valor JSON comum.
    const parsed = JSON.parse(scripts[0]!.textContent ?? '');
    expect(parsed['@graph'][0].name).toBe(`Título malicioso ${malicious}`);
  });
});
