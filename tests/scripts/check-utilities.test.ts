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
import { collectClassSpans, maskContent } from '../../scripts/lib/class-spans.mjs';

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

/* ============================================================================
   Delimitação de região — a const de classe (`*Class` / `*Classes`)
   ============================================================================
   Trava B só reprova o que a delimitação ENXERGA. Antes desta região, um
   componente com variante escondia todo o seu vocabulário do gate: as classes
   ficam num mapa, e `class:list={[MAPA[v]]}` não tem literal nenhum dentro da
   região de atributo. O Tailwind ainda gerava o CSS (ele varre o arquivo cru),
   então a classe existia e só a VERIFICAÇÃO sumia — o no-op silencioso de
   volta pela porta dos fundos.

   Os testes abaixo cobrem as duas direções, que é o que importa numa
   delimitação: o que PRECISA ser visto, e o que NÃO pode virar falso positivo.
   A segunda metade não é zelo excessivo — a primeira implementação reprovou
   `small` e `page` em ContactPair e Container, porque o operando de comparação
   (`size === 'small'`) mora dentro do mesmo ternário que as classes. */

/** Extrai o texto de cada região delimitada, que é exatamente o que o oxide
 *  tokeniza depois. Trabalha sobre a máscara para provar as duas funções
 *  juntas, do jeito que o script as usa. */
function regions(source: string): string {
  return maskContent(source, collectClassSpans(source)).replace(/\s+/g, ' ').trim();
}

describe('collectClassSpans · const de classe', () => {
  it('enxerga a string solta de uma const `*Class`', () => {
    expect(regions(`const baseClass = 'inline-flex min-h-target';`)).toBe(
      'inline-flex min-h-target',
    );
  });

  it('enxerga o array de uma const `*Class`, como em ContactPair', () => {
    const source = `const linkClass = ['inline-flex', 'min-h-target', 'font-semibold'].join(' ');`;
    expect(regions(source)).toBe('inline-flex min-h-target font-semibold');
  });

  it('enxerga o objeto de variantes de uma const `*Classes`', () => {
    const source = [
      'const VARIANT_CLASSES = {',
      "  primary: 'bg-accent text-on-accent',",
      "  secondary: 'border border-line text-brand',",
      '};',
    ].join('\n');
    expect(regions(source)).toBe('bg-accent text-on-accent border border-line text-brand');
  });

  it('enxerga os dois braços de um ternário, como em Container', () => {
    const source = `const widthClass = width === 'page' ? 'container-page' : 'container-measure';`;
    expect(regions(source)).toBe('container-page container-measure');
  });

  it('IGNORA o operando de comparação — o falso positivo que a primeira versão produziu', () => {
    const source = `const sizeClass = size === 'small' ? 'text-small' : 'text-body';`;
    const seen = regions(source);

    expect(seen).toBe('text-small text-body');
    /* Por token, não por substring: `text-small` CONTÉM `small`, então um
       `not.toContain('small')` passaria por engano — ou reprovaria por engano,
       que foi o que aconteceu ao escrever este teste na primeira vez. */
    expect(seen.split(' '), "'small' é o valor comparado, não uma classe").not.toContain('small');
  });

  it('ignora const cujo nome não declara conter classe', () => {
    expect(regions(`const rotulo = 'Fisioterapeuta · CREFITO-3/000000-F';`)).toBe('');
  });

  it('ignora prosa e dado de conteúdo fora de const de classe', () => {
    const source = [
      "const mensagem = 'Informe um telefone com DDD.';",
      "const SITE = { address: 'Vila Clementino, São Paulo' };",
    ].join('\n');
    expect(regions(source)).toBe('');
  });

  it('continua enxergando o atributo class, que é a região original', () => {
    expect(regions(`<span class="text-small text-ink-muted">x</span>`)).toBe(
      'text-small text-ink-muted',
    );
  });
});
