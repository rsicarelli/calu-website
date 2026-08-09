/* ContactPair — dois testes.
   ============================================================================
   1. axe-core sobre o HTML renderizado: zero violações de acessibilidade (exceto a regra
      `region`, desligada de propósito — ver comentário abaixo).
   2. A garantia estrutural do componente — WhatsApp e telefone precisam sair com a MESMA
      lista de classes computada. Isso é o que torna "peso visual idêntico" (DESIGN-SYSTEM §7,
      COMPONENTS.md § ContactPair) verificável, não apenas alegado no comentário do componente.

   SEM a mágica-comment de ambiente por arquivo do Vitest (a que aponta para "jsdom") — DE
   PROPÓSITO, achado empírico documentado aqui porque contradiz a expectativa inicial (jsdom por
   arquivo, como o resto da tarefa pedia). NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: não escreva a
   diretiva de verdade (arroba + "vitest-environment" + espaço + nome do ambiente) em nenhum
   lugar deste arquivo, nem em prosa — o parser do Vitest escaneia o CONTEÚDO INTEIRO do arquivo
   com `/@(?:vitest|jest)-environment\s+([\w-]+)\b/` (`vitest/dist/chunks/cli-api.*.js`), não só
   a primeira linha. Foi assim que a primeira versão deste comentário, EXPLICANDO por que a
   diretiva não é usada, reintroduziu a própria diretiva que estava descrevendo — auto-inflingido.

   Astro 7 usa a Vite Environment API para decidir o que compilar um `.astro` PARA: dentro do
   Environment chamado "ssr" ele entrega a factory real; dentro do Environment chamado "client"
   ele entrega deliberadamente um stub que só lança "Astro components cannot be used in the
   browser" (`vite-plugin-astro/index.js`, checa `this.environment.name === 'client'`) — proteção
   contra hidratar um `.astro` no navegador. O Vitest, ao aplicar a diretiva de ambiente "jsdom"
   a um arquivo, roda esse arquivo dentro do Environment "client" do Vite (é assim que ele simula
   "parece browser"). Resultado: `experimental_AstroContainer` dentro de um arquivo jsdom sempre
   recebe o stub e falha com `NoMatchingRenderer` para QUALQUER componente — não é um defeito de
   ContactPair, WhatsAppFab ou Container (confirmado isolando com ThemeToggle.astro, que nem tem
   `<Tag>` dinâmico). Verificado direto no código-fonte instalado
   (`node_modules/astro/dist/vite-plugin-astro/index.js`), não por suposição.

   A saída não pede mudança em `vitest.config.ts`: `jsdom` (o pacote, não o ambiente do Vitest)
   já é devDependency do projeto. Este arquivo roda no ambiente padrão (`node`, que o Vite
   resolve como Environment `ssr` — o Container recebe a factory real) e instancia o DOM na mão
   com `new JSDOM(html)`, só para o HTML já renderizado — o axe-core roda sobre esse DOM real,
   sem nunca precisar que o PRÓPRIO ARQUIVO DE TESTE rode sob o Environment `client`. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`;
// instalar uma dependência nova está fora do escopo desta tarefa. `domFromHtml`, logo abaixo,
// recasta o resultado para o `Document` da lib DOM ambiente do próprio TypeScript (a mesma que
// `ThemeToggle.astro` já usa em `document.querySelectorAll<HTMLButtonElement>` sem nenhum
// import) — então o `any` daqui não escapa para o resto do arquivo.
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';

import ContactPair from '@/components/ui/ContactPair.astro';

const PROPS = {
  whatsappHref: 'https://wa.me/5511999999999',
  phoneHref: 'tel:+5511999999999',
  phoneLabel: '(11) 99999-9999',
};

/** Sobe um DOM real (jsdom) a partir do HTML renderizado pelo Container e devolve o `document`
 *  já tipado como `Document` (ver nota no import acima). `jsdomErrors: 'none'` silencia só os
 *  avisos INTERNOS do jsdom (ex.: "HTMLCanvasElement.getContext não implementado", disparado
 *  pela checagem de contraste do axe — o pacote `canvas` não está instalado e não faz falta
 *  aqui, o teste não depende de rasterização real); `console.log`/`.error` de verdade, se algum
 *  dia entrar em cena, continuam encaminhados normalmente. */
function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    pretendToBeVisual: true,
    virtualConsole,
  });
  return dom.window.document as Document;
}

async function renderContactPair(): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(ContactPair, { props: PROPS });
  return domFromHtml(html);
}

describe('ContactPair', () => {
  it('não produz violações de acessibilidade (axe-core)', async () => {
    const document = await renderContactPair();

    const results = await axe.run(document.body, {
      rules: {
        // "region": conteúdo de página precisa estar dentro de uma landmark (main/nav/etc).
        // Regra de PÁGINA, não de componente — aqui só existe o fragmento isolado, sem
        // Header/main ao redor. Em produção o ContactPair sempre vive dentro de uma landmark
        // real (CtaBlock, Footer, ContactForm); a regra volta a valer nesse nível.
        region: { enabled: false },
      },
    });

    expect(results.violations).toEqual([]);
  });

  it('WhatsApp e telefone têm a MESMA lista de classes — peso visual idêntico por construção', async () => {
    const document = await renderContactPair();

    const root = document.querySelector('[data-contact-pair]');
    expect(root).not.toBeNull();

    const links = root!.querySelectorAll('a');
    expect(links).toHaveLength(2);

    const [whatsapp, phone] = Array.from(links);

    // Ordem exigida por COMPONENTS.md § ContactPair: WhatsApp primeiro, telefone depois.
    expect(whatsapp.textContent?.trim()).toBe('WhatsApp');
    expect(phone.textContent?.trim()).toBe(PROPS.phoneLabel);
    expect(whatsapp.getAttribute('href')).toBe(PROPS.whatsappHref);
    expect(phone.getAttribute('href')).toBe(PROPS.phoneHref);

    // A garantia estrutural: nenhuma prop do componente permite estilizar um diferente do
    // outro, então as duas classes computadas precisam ser LITERALMENTE a mesma string.
    expect(whatsapp.className).toBe(phone.className);
    expect(whatsapp.className.length).toBeGreaterThan(0);
  });
});
