/* Invariantes do design system — as regras que não têm exceção.
   ============================================================================
   Contraste tem tabela própria (`contrast.test.ts`). Aqui ficam as regras que
   nenhum par de cores expressa: piso tipográfico, número de pesos, alvo de
   toque, integridade dos blocos de tema e cobertura do próprio contrato.

   Cada uma existe porque já foi violada — no handoff original ou no caminho
   até aqui. Afrouxar qualquer uma delas é decisão de design, não de teste. */

import { describe, expect, it } from 'vitest';
import { darkMediaTokens, darkTokens, resolveTheme, themeTokens, tokenValue } from './parse.ts';
import { TEXT_PAIRS } from './pairs.ts';

const light = resolveTheme('light');

/** Piso absoluto de texto: 17px = 1.0625rem. */
const FLOOR_REM = 1.0625;

/** Primeiro argumento do `clamp()` — o tamanho no mobile, que é onde o piso importa.
 *  Valor que não é clamp volta cru. */
function clampArgs(value: string): string[] {
  const clamp = /^clamp\((.+)\)$/.exec(value.trim());
  return (clamp ? clamp[1].split(',') : [value]).map((part) => part.trim());
}

function toRem(value: string): number {
  const rem = /^(-?[\d.]+)rem$/.exec(value.trim());
  if (!rem) throw new Error(`Esperado um valor em rem, veio: ${value}`);
  return Number(rem[1]);
}

/** Só os tamanhos: `--text-h1` sim, `--text-h1--line-height` não. */
const sizeTokens = [...light.keys()].filter(
  (key) => key.startsWith('--text-') && !key.slice('--text-'.length).includes('--'),
);

describe('sanidade do parser', () => {
  it('leu os quatro blocos do global.css', () => {
    expect(themeTokens.size).toBeGreaterThan(50);
    expect(darkTokens.size).toBeGreaterThan(20);
    expect(darkMediaTokens.size).toBeGreaterThan(20);
    expect(sizeTokens.length).toBeGreaterThan(5);
  });
});

describe('1. piso tipográfico de 17px', () => {
  it.each(sizeTokens.filter((token) => token !== '--text-label'))(
    '%s começa em 17px ou mais',
    (token) => {
      const value = tokenValue(light, token);
      const floor = toRem(clampArgs(value)[0]);
      const message = `${token} = ${value} → começa em ${floor}rem (${floor * 16}px), abaixo do piso de 17px`;
      expect(floor, message).toBeGreaterThanOrEqual(FLOOR_REM);
    },
  );

  /* A exceção é uma só e não pode crescer: rótulo em caixa-alta de até 3 palavras.
     Igualdade exata, não `>=` — se alguém quiser um segundo tamanho pequeno,
     que seja com uma decisão explícita, não por deriva. */
  it('--text-label é a única exceção, travada em 15px', () => {
    expect(tokenValue(light, '--text-label')).toBe('0.9375rem');
  });
});

describe('2. corpo de texto entre 19px e 20px', () => {
  it('--text-body vai de 1.1875rem a 1.25rem', () => {
    const args = clampArgs(tokenValue(light, '--text-body'));
    expect(args).toHaveLength(3);
    expect(args[0]).toBe('1.1875rem'); // 19px no mobile
    expect(args[2]).toBe('1.25rem'); // 20px no desktop
  });
});

describe('3. dois pesos, e só dois', () => {
  it('--font-weight-* é exatamente {normal: 400, semibold: 600}', () => {
    const weights = Object.fromEntries(
      [...light].filter(([key]) => key.startsWith('--font-weight-')),
    );
    expect(weights).toEqual({
      '--font-weight-normal': '400',
      '--font-weight-semibold': '600',
    });
  });
});

describe('4. alvo de toque', () => {
  it('qualquer controle tem no mínimo 52px e a ação principal 56px', () => {
    expect(toRem(tokenValue(light, '--spacing-target'))).toBeGreaterThanOrEqual(3.25);
    expect(toRem(tokenValue(light, '--spacing-target-primary'))).toBeGreaterThanOrEqual(3.5);
  });
});

describe('5. sem órfão de tema', () => {
  /* Token que só existe no escuro não tem valor no claro e cai em `unset` — foi assim que o
     `--calu-control-border` do handoff original desapareceu no tema claro sem ninguém ver. */
  it('todo token do bloco escuro também é declarado no claro', () => {
    const orphans = [...darkTokens.keys()].filter((token) => !light.has(token));
    expect(orphans, `declarados só no tema escuro: ${orphans.join(', ')}`).toEqual([]);
  });
});

describe('6. cobertura do contrato de contraste', () => {
  /* Impede que um token de texto entre no sistema sem teste. Se este falhar, a correção é
     adicionar o par em `pairs.ts` — não renomear o token para escapar do filtro. */
  it('todo --color-ink* aparece em pelo menos um par de TEXT_PAIRS', () => {
    const paired = new Set(TEXT_PAIRS.flatMap((pair) => [pair.fg, pair.bg]));
    const uncovered = [...light.keys()].filter(
      (token) => token.startsWith('--color-ink') && !paired.has(token),
    );
    expect(uncovered, `tokens de texto sem par de contraste: ${uncovered.join(', ')}`).toEqual([]);
  });
});

describe('7. os dois blocos de tema escuro não se desencontram', () => {
  /* `[data-theme='dark']` e `:root:not([data-theme])` do media query são duplicados de
     propósito — `light-dark()` foi descartado porque num navegador antigo a função inválida
     derruba a propriedade inteira, quebrando a cor em vez de degradar. O preço da duplicação
     é este teste. */
  it('declaram exatamente os mesmos pares chave/valor', () => {
    expect(Object.fromEntries(darkMediaTokens)).toEqual(Object.fromEntries(darkTokens));
  });
});
