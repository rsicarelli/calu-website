/* CLS (Cumulative Layout Shift) — proxy sobre o HTML construído, não medição de pixel.
   ============================================================================================
   LIMITAÇÃO (ver `tests/system/_dom.ts`): `linkedom` faz *parsing* de HTML, não computa CSS —
   não há `getComputedStyle` de verdade aqui. Este teste NÃO mede se a página realmente evita
   layout shift; ele confirma que todo `<img>` carrega o SINAL que o navegador precisa para
   reservar o espaço da imagem antes de baixá-la — `width`+`height` (atributos HTML reais, que o
   algoritmo de "aspect ratio intrínseco" do CSSWG usa para calcular a proporção antes do
   download) OU uma declaração de `aspect-ratio` reconhecível (classe utilitária ou `style`
   inline). Medição real de CLS exigiria um motor de browser (Lighthouse/Playwright), fora de
   escopo enquanto não houver CI (CLAUDE.md, Fase 4).

   `width`/`height` são checados como ATRIBUTOS HTML (`getAttribute`/`hasAttribute`), não como a
   propriedade JS `.width`/`.height` do elemento — em um `<img>` sem esses atributos, um DOM real
   devolveria 0 para a propriedade (não `undefined`), o que mascararia a ausência.

   `document.querySelectorAll('img')`, não `document.images`: confirmado direto contra o pacote
   instalado (`linkedom` 0.18.13) que a coleção viva `HTMLDocument.images` do DOM padrão não está
   implementada — acessá-la devolve `undefined`, e `Array.from(undefined)` estoura. `images` não
   aparece em `node_modules/linkedom/types/html/document.d.ts`; `querySelectorAll` é herdado da
   interface `Element`/`Document` (`Node.js` genérica) e funciona normalmente. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

/** `aspect-ratio` pode chegar por classe utilitária (`aspect-*`, se o projeto vier a ter uma —
 *  hoje `global.css` não declara nenhuma) ou por `style` inline. Regex, não string exata: o
 *  projeto usa `class:list`, então a classe pode aparecer em qualquer posição da lista. */
const ASPECT_RATIO_CLASS = /(?:^|\s)aspect-[\w-]+(?:\s|$)/;
const ASPECT_RATIO_STYLE = /aspect-ratio\s*:/i;

function hasSizingSignal(img: Element): boolean {
  const hasWidthHeight = img.hasAttribute('width') && img.hasAttribute('height');
  const className = img.getAttribute('class') ?? '';
  const style = img.getAttribute('style') ?? '';
  const hasAspectRatio = ASPECT_RATIO_CLASS.test(className) || ASPECT_RATIO_STYLE.test(style);
  return hasWidthHeight || hasAspectRatio;
}

describe('CLS — <img> sem width/height nem aspect-ratio (proxy, não medição de pixel)', () => {
  const pages = distPages();

  it('varredura não está vazia — encontrou páginas e pelo menos uma <img> para checar', () => {
    expect(pages.length).toBeGreaterThan(0);
    const totalImages = pages.reduce(
      (sum, { document }) => sum + document.querySelectorAll('img').length,
      0,
    );
    expect(totalImages).toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'todo <img> de $file reserva espaço (width+height OU aspect-ratio)',
    ({ file, document }) => {
      const offenders: string[] = [];

      for (const img of Array.from(document.querySelectorAll('img'))) {
        if (!hasSizingSignal(img)) {
          const src = img.getAttribute('src') ?? '(sem src)';
          const alt = img.getAttribute('alt') ?? '(sem alt)';
          offenders.push(`${src} (alt="${alt}")`);
        }
      }

      expect(
        offenders,
        `${file}: <img> sem width/height nem aspect-ratio: ${offenders.join(', ')}`,
      ).toEqual([]);
    },
  );
});
