/* Trava A — as duas checagens de arbitrary value do gate, isoladas num módulo
   importável tanto pelo script (`check-utilities.mjs`) quanto pelo teste
   (`tests/scripts/check-utilities.test.ts`).
   ============================================================================
   `isArbitraryUtility` olha a UTILITY e o MODIFICADOR — nunca `candidate.variants`
   sozinha, porque arbitrary em variante é legítimo e usado no projeto:
   `aria-[current=page]:`, `[&_summary]:`, `has-[>svg]:`, `supports-[display:grid]:`.

   `hasArbitraryBreakpointVariant` cobre exatamente o buraco que isso deixava: uma
   variante arbitrária de media/container query (`@min-[30rem]:`, `min-[30rem]:`,
   `max-[30rem]:`, `@[30rem]:`) passava batida, porque é arbitrary em VARIANTE, não
   em utility — e é exatamente o tipo de coisa que a Trava A deveria pegar, já que
   o vocabulário de container query do projeto vive em tokens nomeados
   (`--container-thumb`, `--container-row`, ver §3.6 do global.css), não em valor cru.

   A distinção entre os dois casos NÃO é de forma — verificado empiricamente com o
   parser real (`designSystem.parseCandidate`): tanto os legítimos quanto os de
   breakpoint chegam como `kind: 'functional'` com `value.kind: 'arbitrary'`.
   `aria-[current=page]:` e `supports-[display:grid]:` são estruturalmente
   IDÊNTICOS a `min-[30rem]:` e `@min-[30rem]:` — a única diferença é o `root`.
   Por isso a lista de roots de breakpoint abaixo é o que faz a distinção, não o
   formato do nó. `has-[>svg]:` chega como `kind: 'compound'` (root `has`, com um
   `.variant` aninhado de `kind: 'arbitrary'` e `selector`), e `[&_summary]:` chega
   como `kind: 'arbitrary'` puro (sem `root`) — nenhum dos dois tem `root` num dos
   nomes de breakpoint, então a recursão do compound e o `kind` do arbitrary puro
   já bastam para não confundir os dois grupos. */

/**
 * TRAVA A. Olha a utility e o modificador; NUNCA `candidate.variants` sozinha —
 * arbitrary em variante É legítimo quando o `root` não é de breakpoint (ver
 * `hasArbitraryBreakpointVariant`, que cobre esse outro caso).
 */
export function isArbitraryUtility(candidate) {
  if (candidate.kind === 'arbitrary') return true; // [color:red]
  if (candidate.kind === 'functional' && candidate.value?.kind === 'arbitrary') return true; // p-[13px], bg-(--x)
  if (candidate.modifier?.kind === 'arbitrary') return true; // text-body/[1.9]
  return false;
}

/** Roots de breakpoint arbitrário — medidos, não supostos. Todos chegam como
 *  `kind: 'functional'` com `value.kind: 'arbitrary'`, mesma forma de
 *  `aria-[…]:`/`supports-[…]:`; só o `root` os separa dos legítimos. */
const ARBITRARY_BREAKPOINT_ROOTS = new Set(['min', 'max', '@min', '@max', '@']);

/** Verdadeiro se `variant` (nó de `candidate.variants`) é uma variante arbitrária
 *  de media/container query — direta ou aninhada dentro de um `compound`
 *  (`has-[…]:`, `not-[…]:` etc., que carregam `.variant` internamente). */
function isArbitraryBreakpointVariantNode(variant) {
  if (!variant) return false;
  if (
    variant.kind === 'functional' &&
    variant.value?.kind === 'arbitrary' &&
    ARBITRARY_BREAKPOINT_ROOTS.has(variant.root)
  ) {
    return true;
  }
  if (variant.kind === 'compound') return isArbitraryBreakpointVariantNode(variant.variant);
  return false;
}

/**
 * TRAVA A, parte 2. Percorre `candidate.variants` (array; cada item pode ser
 * `functional`, `arbitrary` ou `compound` com `.variant` aninhado) procurando uma
 * variante arbitrária de breakpoint (`@min-[…]:`, `min-[…]:`, `max-[…]:`,
 * `@[…]:`). Não confunde com as variantes arbitrárias legítimas do projeto
 * (`aria-[…]:`, `[&_…]:`, `has-[…]:`, `supports-[…]:`), que têm `root` fora de
 * `ARBITRARY_BREAKPOINT_ROOTS` ou não têm `root` nenhum.
 */
export function hasArbitraryBreakpointVariant(candidate) {
  const variants = candidate.variants ?? [];
  return variants.some((variant) => isArbitraryBreakpointVariantNode(variant));
}

/* ----------------------------------------------------------------------------
   Bootstrap do design system — reexportado para o teste.

   `tests/scripts/check-utilities.test.ts` precisa do MESMO `designSystem` que
   o script usa (a raiz de `parseCandidate`), mas é um `.ts` verificado por
   `astro check`, e o repositório não tem `@types/node` instalado — `node:fs`,
   `node:path` e `node:url` reprovam ali com TS2591 (o mesmo motivo, documentado
   em `tests/tokens/parse.ts`, que fez o parser de tokens ler CSS via
   `import.meta.glob` em vez de `readFileSync`). Este módulo é `.mjs`, fora do
   `checkJs`, então pode importar os builtins do Node livremente — por isso o
   bootstrap mora aqui, e o teste só importa a função pronta.
---------------------------------------------------------------------------- */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { __unstable__loadDesignSystem } from 'tailwindcss';

const THEME_CSS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/styles/global.css',
);

/** Mesmo bootstrap de `scripts/check-utilities.mjs` § 4 — o design system real
 *  do projeto, carregado a partir do próprio `global.css`. */
export async function loadDesignSystem() {
  const css = readFileSync(THEME_CSS, 'utf8');
  return __unstable__loadDesignSystem(css, {
    base: path.dirname(THEME_CSS),
    loadStylesheet: async (id, base) => {
      const resolved = id.startsWith('.')
        ? path.resolve(base, id)
        : fileURLToPath(import.meta.resolve(id.endsWith('.css') ? id : `${id}/index.css`));
      return {
        path: resolved,
        base: path.dirname(resolved),
        content: readFileSync(resolved, 'utf8'),
      };
    },
  });
}
