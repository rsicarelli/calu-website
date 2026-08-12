/* CLS (Cumulative Layout Shift) — proxy sobre o HTML construído, não medição de pixel.
   ============================================================================================
   LIMITAÇÃO (ver `tests/system/_dom.ts`): `linkedom` faz *parsing* de HTML, não computa CSS —
   não há `getComputedStyle` de verdade aqui. Este teste NÃO mede se a página realmente evita
   layout shift; ele confirma que todo `<img>` carrega o SINAL que o navegador precisa para
   reservar o espaço da imagem antes de baixá-la — `width`+`height` (atributos HTML reais, que o
   algoritmo de "aspect ratio intrínseco" do CSSWG usa para calcular a proporção antes do
   download) OU uma declaração de `aspect-ratio` reconhecível (classe utilitária ou `style`
   inline). Medição real de CLS exigiria um motor de browser (Lighthouse/Playwright), fora de
   escopo enquanto não houver CI (CLAUDE.md, Fase 5 — endurecimento).

   `width`/`height` são checados como ATRIBUTOS HTML (`getAttribute`/`hasAttribute`), não como a
   propriedade JS `.width`/`.height` do elemento — em um `<img>` sem esses atributos, um DOM real
   devolveria 0 para a propriedade (não `undefined`), o que mascararia a ausência.

   `document.querySelectorAll('img')`, não `document.images`: confirmado direto contra o pacote
   instalado (`linkedom` 0.18.13) que a coleção viva `HTMLDocument.images` do DOM padrão não está
   implementada — acessá-la devolve `undefined`, e `Array.from(undefined)` estoura. `images` não
   aparece em `node_modules/linkedom/types/html/document.d.ts`; `querySelectorAll` é herdado da
   interface `Element`/`Document` (`Node.js` genérica) e funciona normalmente. */

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

/** `aspect-ratio` pode chegar por classe utilitária (`aspect-*` — nomeada, como `aspect-video`,
 *  ou FRACIONÁRIA, como `aspect-16/9`) ou por `style` inline. Regex, não string exata: o projeto
 *  usa `class:list`, então a classe pode aparecer em qualquer posição da lista.
 *
 *  O `(?:\/\d+)?` não é decoração. No Tailwind v4 a proporção arbitrária-sem-ser-arbitrary-value
 *  se escreve como fração (`aspect-3/4`, `aspect-16/9`), e a barra NÃO pertence a `[\w-]`: sem
 *  esse grupo, `[\w-]+` casava só até o `16` e depois exigia espaço ou fim de string, encontrava
 *  a barra e falhava. Resultado: `aspect-video` passava, `aspect-16/9` não — a classe emitia
 *  `aspect-ratio` de verdade no CSS e mesmo assim contava como "sem sinal de dimensão", e a
 *  varredura reprovaria uma imagem correta (ou, pior, a hipótese inversa: alguém confiaria na
 *  classe fracionária como sinal e ela nunca seria reconhecida aqui). Verificado contra as cinco
 *  proporções canônicas do handoff — 3/4, 4/5, 16/9, 3/2 e `video`. */
const ASPECT_RATIO_CLASS = /(?:^|\s)aspect-[\w-]+(?:\/\d+)?(?:\s|$)/;
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

/* Regressão PERMANENTE do reconhecedor, não do build — mesmo padrão que `typography.test.ts` usa
   pra travar sua própria extração de família. A varredura acima só reprova o que ela CONSEGUE
   ver; se `ASPECT_RATIO_CLASS` voltar a não entender fração, ela passa a aceitar em silêncio uma
   imagem sem sinal nenhum de dimensão, e nenhum teste fica vermelho. Este bloco não lê `dist/`:
   exercita o reconhecedor direto, com as proporções canônicas do handoff (hero 3/4 e 4/5, card
   16/9, retrato 4/5, mapa 3/2) e com os contra-exemplos que ele NÃO pode aceitar. */
describe('CLS — reconhecedor de aspect-ratio (regressão da própria checagem)', () => {
  const withClass = (className: string): boolean =>
    hasSizingSignal(parseHTML(`<img class="${className}">`).document.querySelector('img')!);

  it.each([
    'aspect-3/4',
    'aspect-4/5',
    'aspect-16/9',
    'aspect-3/2',
    'aspect-video',
    'aspect-square',
    'w-full aspect-16/9 rounded-card',
  ])('reconhece "%s" como sinal de dimensão', (className) => {
    expect(withClass(className)).toBe(true);
  });

  it.each(['rounded-card', 'aspect', 'not-aspect-16/9', 'bg-surface'])(
    'não confunde "%s" com sinal de dimensão',
    (className) => {
      expect(withClass(className)).toBe(false);
    },
  );

  it('aceita aspect-ratio declarado por style inline', () => {
    const img = parseHTML('<img style="aspect-ratio: 16 / 9">').document.querySelector('img')!;
    expect(hasSizingSignal(img)).toBe(true);
  });

  it('aceita width+height sem nenhuma classe', () => {
    const img = parseHTML('<img width="52" height="52">').document.querySelector('img')!;
    expect(hasSizingSignal(img)).toBe(true);
  });

  it('reprova <img> sem classe, sem style e sem width/height', () => {
    const img = parseHTML('<img src="/x.webp" alt="x">').document.querySelector('img')!;
    expect(hasSizingSignal(img)).toBe(false);
  });
});
