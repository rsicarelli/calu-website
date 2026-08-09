/* Contraste de cada par do contrato, nos dois temas.
   ============================================================================
   O tema escuro é medido DEPOIS da cascata (`{...claro, ...escuro}`), porque o
   bloco escuro só redeclara o que muda — um par pode passar no claro e reprovar
   no escuro por causa de um token herdado que ninguém reconferiu.

   Quando algo aqui ficar vermelho: a mensagem já traz os dois hex resolvidos e o
   ratio. Trocar o hex é decisão de design, não conserto de teste. */

import { describe, expect, it } from 'vitest';
import { contrast, resolveTheme, tokenValue } from './parse.ts';
import {
  NONTEXT_MIN,
  NONTEXT_PAIRS,
  TEXT_MIN,
  TEXT_PAIRS,
  UI_TEXT_MIN,
  UI_TEXT_PAIRS,
  type ContrastPair,
} from './pairs.ts';

const THEMES = ['light', 'dark'] as const;

const RESOLVED = {
  light: resolveTheme('light'),
  dark: resolveTheme('dark'),
} as const;

/** Produto cartesiano tema × par, com o `where` junto para a mensagem de falha. */
function cases(pairs: readonly ContrastPair[]) {
  return THEMES.flatMap((theme) => pairs.map((pair) => ({ theme, ...pair })));
}

const TABLES = [
  { label: 'texto corrido — AAA, 7:1 (1.4.6)', pairs: TEXT_PAIRS, min: TEXT_MIN },
  { label: 'rótulo de botão — texto grande, 4.5:1', pairs: UI_TEXT_PAIRS, min: UI_TEXT_MIN },
  { label: 'componente de interface — 3:1 (1.4.11)', pairs: NONTEXT_PAIRS, min: NONTEXT_MIN },
] as const;

describe.each(TABLES)('$label', ({ pairs, min }) => {
  it.each(cases(pairs))('$theme · $fg sobre $bg', ({ theme, fg, bg, where }) => {
    const tokens = RESOLVED[theme];
    const fgValue = tokenValue(tokens, fg);
    const bgValue = tokenValue(tokens, bg);
    const ratio = contrast(fgValue, bgValue);

    const message = [
      `contraste insuficiente no tema ${theme} (${where})`,
      `  ${fg} = ${fgValue}`,
      `  ${bg} = ${bgValue}`,
      `  medido ${ratio.toFixed(2)}:1, mínimo ${min}:1`,
    ].join('\n');

    expect(ratio, message).toBeGreaterThanOrEqual(min);
  });
});
