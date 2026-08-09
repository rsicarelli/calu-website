/* Trava A do gate de utilities — ponto cego de variante arbitrária de breakpoint.
   ============================================================================
   `scripts/check-utilities.mjs` reprova arbitrary value usando o PARSER real do
   Tailwind, não regex — porque arbitrary em variante é legítimo em quatro casos
   que o projeto usa (`aria-[current=page]:`, `[&_summary]:`, `has-[>svg]:`,
   `supports-[display:grid]:`) e ilegítimo num quinto, estruturalmente idêntico
   aos quatro primeiros: variante arbitrária de media/container query
   (`@min-[…]:`, `min-[…]:`, `max-[…]:`, `@[…]:`).

   Este teste usa o MESMO bootstrap de `__unstable__loadDesignSystem` que o
   script usa (não um mock) para confirmar, com o parser de verdade, que
   `hasArbitraryBreakpointVariant` separa os dois grupos pelo `root` da
   variante — a única coisa que os distingue, verificado empiricamente antes de
   implementar (ver o comentário de `scripts/lib/arbitrary-checks.mjs`).

   `loadDesignSystem` mora em `arbitrary-checks.mjs`, não aqui: este é um `.ts`
   verificado por `astro check`, e o repositório não tem `@types/node` instalado
   — `node:fs`/`node:path`/`node:url` reprovariam com TS2591 (mesmo motivo
   documentado em `tests/tokens/parse.ts`, que evita `readFileSync` pelo mesmo
   problema). O módulo `.mjs` fica fora do `checkJs` e pode importá-los livre. */

import { describe, expect, it } from 'vitest';

import {
  hasArbitraryBreakpointVariant,
  isArbitraryUtility,
  loadDesignSystem,
} from '../../scripts/lib/arbitrary-checks.mjs';

const designSystem = await loadDesignSystem();

/** Parseia um candidato como o script faz: pega o primeiro resultado de
 *  `parseCandidate` (pode devolver mais de uma leitura para candidatos
 *  ambíguos; nenhum dos oito abaixo é). */
function parseOne(candidate: string) {
  const [parsed] = [...designSystem.parseCandidate(candidate)];
  if (!parsed) throw new Error(`candidato não parseou: ${candidate}`);
  return parsed;
}

describe('hasArbitraryBreakpointVariant', () => {
  it.each([
    'aria-[current=page]:underline',
    '[&_summary]:hidden',
    'has-[>svg]:pl-0',
    'supports-[display:grid]:grid',
  ])('%s — variante arbitrária LEGÍTIMA, não é breakpoint', (candidate) => {
    expect(hasArbitraryBreakpointVariant(parseOne(candidate))).toBe(false);
  });

  it.each(['@min-[30rem]:grid', 'min-[30rem]:grid', 'max-[30rem]:grid', '@[30rem]:grid'])(
    '%s — variante arbitrária de BREAKPOINT, o ponto cego que a trava passou a cobrir',
    (candidate) => {
      expect(hasArbitraryBreakpointVariant(parseOne(candidate))).toBe(true);
    },
  );
});

describe('isArbitraryUtility · não regride com os mesmos oito candidatos', () => {
  /* Nenhum dos oito é arbitrary na UTILITY — todos arbitrary só na variante —,
   * então `isArbitraryUtility` sozinha precisa continuar dizendo `false` para
   * todos. Quem barra os quatro de breakpoint é `hasArbitraryBreakpointVariant`. */
  it.each([
    'aria-[current=page]:underline',
    '[&_summary]:hidden',
    'has-[>svg]:pl-0',
    'supports-[display:grid]:grid',
    '@min-[30rem]:grid',
    'min-[30rem]:grid',
    'max-[30rem]:grid',
    '@[30rem]:grid',
  ])('%s', (candidate) => {
    expect(isArbitraryUtility(parseOne(candidate))).toBe(false);
  });
});
