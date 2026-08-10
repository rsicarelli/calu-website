/* Tipografia — "uma fonte, dois pesos" (DESIGN-SYSTEM), verificado direto no CSS de BUILD.
   ============================================================================================
   Lê `dist/_astro/*.css` como texto via `import.meta.glob(..., { query: '?raw', eager: true })`
   — mesmo padrão de `tests/pages/sitemap.test.ts`/`robots.test.ts` (artefato de build, não
   fonte) e de `tests/tokens/parse.ts` (leitura de CSS por regex, sem parser completo — "zero
   dependência de propósito"), adaptado para múltiplos arquivos porque o build pode fatiar o CSS
   em mais de um bundle no futuro (hoje é só um: `BaseLayout.<hash>.css`). O nome do arquivo leva
   um hash de conteúdo que muda a cada build — por isso o glob usa `*.css`, não um caminho fixo.

   POR QUE NÃO BASTA REGEX EM "font-family:" SOZINHO — achado ao inspecionar o CSS minificado de
   verdade, não presumido: no bundle de build, `font-family:` (a PROPRIEDADE CSS) só aparece como
   `var(--font-body)`/`var(--font-label)` nos pontos de USO (body, .label, .font-body, etc.) — o
   Tailwind emite a referência à variável, não o valor resolvido. As DUAS famílias reais do
   projeto (Source Serif 4 + fallback; sans do sistema de `font-label`) só existem como TEXTO
   LITERAL na declaração dos dois tokens, em `:root` (`@theme static` do `global.css` §3 —
   "static" força a emissão de todo token no `:root`, mesmo sem nenhuma utility consumindo o
   valor bruto). Por isso a extração busca tanto por `font-family:` (a propriedade, em qualquer
   lugar do CSS) quanto por declaração de custom property de nome relacionado a fonte dentro de
   `:root` — sem as duas frentes, a busca encontraria zero fontes literais e o teste não
   verificaria nada de verdade.

   Duas ocorrências de `font-family:` SÃO literais mas NÃO são deste projeto: o Preflight do
   Tailwind emite `var(--default-font-family, <pilha sans genérica>)` em `html`/`:host` e
   `var(--default-mono-font-family, <pilha mono genérica>)` em `code,kbd,samp,pre` — plumbing do
   FRAMEWORK, presente em qualquer projeto Tailwind v4 mesmo sem nenhuma fonte customizada, e
   nunca efetivamente aplicado aqui (body/heading/label sempre sobrescrevem via
   `var(--font-body)`/`var(--font-label)`, com maior especificidade ou ordem posterior — ver
   `global.css` §7). Excluídas explicitamente pelo nome interno do Tailwind, documentado aqui —
   não por serem "erradas", mas por não pertencerem ao vocabulário do design system. Qualquer
   OUTRA declaração `font-family:` literal (não seria Tailwind nem os tokens do projeto) continua
   contando para o total — é assim que uma terceira fonte hard-coded por engano ainda reprovaria
   este teste.

   PONTO CEGO ENCONTRADO EM AUDITORIA (e corrigido aqui) — a versão anterior buscava famílias só
   nos dois nomes EXATOS `--font-body`/`--font-label`. Uma terceira família introduzida sob um
   nome de custom property DIFERENTE (ex.: `--font-fake: 'ComicSans', sans-serif;`) passava
   despercebida: a busca por nome exato simplesmente nunca olhava para aquele token, e a
   contagem continuava em "2 famílias" mesmo com a terceira presente no CSS. A correção
   generaliza a extração em duas frentes, unidas num único Set (`extractFamilies` abaixo):

     1. Qualquer custom property cujo NOME CONTENHA "font" (não só os dois nomes exatos) dentro
        de um bloco `:root` do CSS de build — é ali que `@theme static` emite os tokens (ver
        acima). Cada valor capturado é CLASSIFICADO antes de contar como família
        (`isFamilyValue`): um inteiro puro (`400`, `600`) é peso, não família, e já é coberto
        pelo teste de peso abaixo — ignorado aqui; uma referência `var(--outra-coisa)` pura não
        conta por si (evita contar a mesma família duas vezes quando um token só aponta para
        outro); o resto — valor literal com aspas, vírgula, ou uma palavra-chave genérica de
        família (`serif`, `sans-serif`, `monospace`, `system-ui`) — conta.
     2. Qualquer uso literal de `font-family:` (a propriedade) em qualquer lugar do CSS de build
        cujo valor não seja uma referência `var(...)` pura — cobre o caso de um componente
        escrever CSS bruto no seu `<style>` com fonte hard-coded, contornando os tokens por
        completo (`check-utilities.mjs` só barra classe utilitária do Tailwind, não CSS bruto
        dentro de `<style>`; um `<style>` de componente Astro é extraído para o mesmo bundle
        `dist/_astro/*.css` que este teste já lê, então nenhuma leitura de arquivo adicional é
        necessária para cobrir esse caso).

   A extração por NOME (frente 1) reaproveita `extractDeclarations` — a mesma função usada pela
   frente da propriedade e pelo teste de peso — em vez de um regex novo, de propósito: o
   terminador de valor de `extractDeclarations` aceita tanto `;` quanto `}` (a última declaração
   de um bloco minificado não tem `;` antes do `}` de fechamento — visto no build real,
   `...--container-row:34rem}}`, sem ponto e vírgula). Um regex novo escrito só para a frente 1
   perderia justamente esse caso se o token de fonte calhasse de ser o último do bloco.

   Validado empiricamente, não só por leitura: contra o CSS de build de hoje a contagem generalizada
   continua em exatamente 2 (as duas frentes não duplicam `--font-body`/`--font-label` entre si —
   a frente da propriedade só vê `var(--font-body)`, uma referência pura, e portanto não conta). E
   contra um fixture com a mesma injeção que a auditoria fez (`--font-fake: 'ComicSans',
   sans-serif;`), a extração agora encontra 3 — ver o teste de regressão dedicado mais abaixo, que
   mantém essa prova rodando permanentemente (não só como validação pontual desta correção).

   PESO — mesma lógica de generalização por substring, já existia antes desta correção:
   `font-weight:` sozinho não pega `--font-weight-normal:400`/`--font-weight-semibold:600` (os
   dois tokens-fonte dos pesos, `global.css` §3) porque o nome da custom property tem um sufixo
   (`-normal`/`-semibold`) entre "weight" e ":". A extração usa `[\w-]*font-weight[\w-]*`
   (qualquer nome de propriedade que CONTENHA "font-weight" como substring) para alcançar
   `--font-weight-normal`, `--font-weight-semibold`, o modificador `--text-label--font-weight` E a
   própria propriedade `font-weight`. Valores literais NÃO numéricos que aparecem no build
   (`inherit`, `initial`, `bolder`) são do Preflight do Tailwind (reset de `h1..h6`, negrito de
   `b`/`strong`/`optgroup`) ou de reset interno (`--tw-font-weight: initial`) — palavras-chave CSS
   relativas/herdadas, não um "peso" numérico do vocabulário do projeto, e por isso fora do escopo
   do invariante "só 400 ou 600" (que é sobre NÚMERO). Um `font-weight: 500` ou `700` hard-coded,
   literal, em qualquer lugar do CSS de build, aparece como valor NUMÉRICO fora de {400, 600} e
   reprova — inclusive o bug histórico do projeto (`global.css` §7: `h1..h6` saindo em peso 400 por
   `:where()` perdendo a disputa de especificidade contra o `font-weight: inherit` do Preflight)
   fica coberto pelo mesmo mecanismo se a herança algum dia resolver para um número hard-coded em
   vez de `inherit`. */

import { describe, expect, it } from 'vitest';

const RAW_CSS_FILES = import.meta.glob('../../dist/_astro/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function readAllBuildCss(): string {
  const entries = Object.entries(RAW_CSS_FILES);
  if (entries.length === 0) {
    throw new Error('dist/_astro/*.css não encontrou nenhum bundle — rode `pnpm build` antes.');
  }
  const sources = entries.map(([file, source]) => {
    if (typeof source !== 'string' || source.length === 0) {
      throw new Error(`${file} existe mas veio vazio — build incompleto?`);
    }
    return source;
  });
  return sources.join('\n');
}

/** Nomes internos do Preflight do Tailwind v4 — plumbing do framework, não vocabulário deste
 *  design system. Ver comentário de topo. */
const TAILWIND_DEFAULT_FAMILY_VARS = ['--default-font-family', '--default-mono-font-family'];

/** `true` quando o valor carrega informação literal de fonte — ou seja, NÃO é uma referência
 *  pura a uma custom property (`var(--algo)`, sem mais nada). Um valor como
 *  `var(--font-source-serif), ui-serif, Georgia, "Times New Roman", serif` conta como literal:
 *  o primeiro item é uma variável (o nome gerado pela Fonts API do Astro), mas o resto da pilha
 *  — o que garante fallback sem a webfont — é texto literal de verdade. */
function isLiteralValue(value: string): boolean {
  return !/^var\(--[\w-]+\)$/.test(value);
}

function extractDeclarations(css: string, namePattern: string): { prop: string; value: string }[] {
  const re = new RegExp(`(${namePattern})\\s*:\\s*([^;}]+)[;}]`, 'g');
  const out: { prop: string; value: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    out.push({ prop: match[1]!, value: match[2]!.trim() });
  }
  return out;
}

/** Isola o conteúdo de todo bloco cujo seletor é (ou inclui) `:root` — no CSS de build é ali que
 *  `@theme static` emite os tokens (ver comentário de topo, §3 do `global.css`). Delimitação por
 *  profundidade de chaves, não por um regex guloso: o CSS minificado não tem quebra de linha para
 *  ancorar um `[^}]*` seguro (o bloco de tokens de hoje mede ~2.7KB numa linha só), e um regex
 *  não sabe parar na chave CERTA se houver mais de um bloco `:root` no arquivo — o que já
 *  acontece hoje (`:root,:host{…tokens…}` do `@theme`, e `:root:not([data-theme]){…}` do
 *  `prefers-color-scheme: dark`, ver `global.css` §5). */
function extractRootBlocks(css: string): string {
  const blocks: string[] = [];
  const re = /:root[^{]*\{/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let i = bodyStart;
    for (; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    blocks.push(css.slice(bodyStart, i));
  }
  return blocks.join('\n');
}

/** Palavras-chave CSS genéricas de família — presença de uma delas é evidência de que um valor
 *  "*font*"-nomeado é mesmo uma família, não outra coisa (peso, feature setting, keyword de
 *  reset). Ver item 1 do comentário de topo. */
const GENERIC_FAMILY_KEYWORDS = /\b(?:serif|sans-serif|monospace|system-ui)\b/;

/** Classifica o valor de um token cujo NOME contém "font" (extração generalizada, frente 1 do
 *  comentário de topo): é família só quando não for peso numérico puro nem referência pura a
 *  outro token, e carregar evidência literal de família (aspas, vírgula, ou uma das palavras-
 *  chave genéricas acima). Sem essa terceira condição, um token futuro como
 *  `--font-feature-settings: normal` ou `--font-smooth: antialiased` — nome contém "font", valor
 *  não é inteiro nem `var()` puro — contaria como família por engano. */
function isFamilyValue(value: string): boolean {
  if (/^\d+$/.test(value)) return false; // peso numérico puro — já coberto pelo teste de peso
  if (!isLiteralValue(value)) return false; // var(--x) pura — não conta aqui, ver comentário de topo
  return (
    value.includes('"') ||
    value.includes("'") ||
    value.includes(',') ||
    GENERIC_FAMILY_KEYWORDS.test(value)
  );
}

/** As duas frentes da extração de família, unidas num único Set — ver comentário de topo
 *  ("PONTO CEGO ENCONTRADO EM AUDITORIA"). Recebe uma string de CSS (não só o build real) para
 *  que a mesma lógica sirva o teste real e o teste de regressão da própria extração, logo abaixo. */
function extractFamilies(css: string): Set<string> {
  const namedFamilies = extractDeclarations(extractRootBlocks(css), '--[\\w-]*font[\\w-]*')
    .filter(({ value }) => isFamilyValue(value))
    .map(({ value }) => value);

  const literalPropertyUsages = extractDeclarations(css, 'font-family')
    .filter(({ value }) => isLiteralValue(value))
    .filter(({ value }) => !TAILWIND_DEFAULT_FAMILY_VARS.some((name) => value.includes(name)))
    .map(({ value }) => value);

  return new Set([...namedFamilies, ...literalPropertyUsages]);
}

describe('Tipografia de build — uma fonte, dois pesos (DESIGN-SYSTEM)', () => {
  it('varredura não está vazia — o CSS de build tem conteúdo para analisar', () => {
    const css = readAllBuildCss();
    expect(css.length).toBeGreaterThan(0);
  });

  it('exatamente 2 famílias de fonte literais aparecem no CSS de build inteiro', () => {
    const families = extractFamilies(readAllBuildCss());

    expect(
      [...families],
      `famílias literais encontradas: ${[...families].join(' | ')}`,
    ).toHaveLength(2);
  });

  // Teste de REGRESSÃO da própria lógica de extração — não do conteúdo do build de hoje.
  // Mantido PERMANENTE de propósito (não descartado após confirmar a correção): o build real só
  // tem 2 famílias, então ele nunca vai exercitar o caminho "uma terceira família sob nome não
  // convencional" — se algum dia alguém voltar `extractFamilies` para busca por nome exato (ex.:
  // um refactor que reintroduz `extractDeclarations(css, '--font-body')` sem perceber que está
  // desfazendo a correção), o teste "exatamente 2" acima continuaria passando, vazio de aviso.
  // Este teste é o único que reproveria nesse cenário. O fixture reproduz a forma mínima real de
  // um bundle Tailwind v4 (`@layer theme{:root,:host{…}}`, visto no build de hoje) com uma
  // terceira família (`--font-fake`) — a mesma injeção que a auditoria usou para provar o ponto
  // cego original numa cópia do CSS de build.
  it('a extração de família pega um token de fonte sob nome não convencional (regressão do ponto cego da auditoria)', () => {
    const fixtureCss =
      '@layer theme{:root,:host{' +
      '--font-body:var(--font-source-serif), ui-serif, Georgia, "Times New Roman", serif;' +
      '--font-label:-apple-system, "Segoe UI", system-ui, sans-serif;' +
      "--font-fake:'ComicSans', sans-serif;" +
      '--font-weight-normal:400;' +
      '--font-weight-semibold:600' +
      '}}';

    const families = extractFamilies(fixtureCss);

    expect(
      [...families],
      `famílias literais encontradas: ${[...families].join(' | ')}`,
    ).toHaveLength(3);
    expect([...families].some((value) => value.includes('ComicSans'))).toBe(true);
  });

  it('todo font-weight: literal numérico encontrado é 400 ou 600 — nenhum outro peso', () => {
    const css = readAllBuildCss();

    const declarations = extractDeclarations(css, '[\\w-]*font-weight[\\w-]*');

    const numericWeights = declarations
      .map(({ value }) => value)
      .filter((value) => /^\d+$/.test(value));

    expect(
      numericWeights.length,
      'nenhum font-weight numérico literal encontrado no build',
    ).toBeGreaterThan(0);

    const offenders = numericWeights.filter((value) => value !== '400' && value !== '600');

    expect(offenders, `pesos fora de {400, 600}: ${offenders.join(', ')}`).toEqual([]);
  });
});
