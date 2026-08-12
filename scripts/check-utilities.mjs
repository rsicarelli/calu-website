#!/usr/bin/env node
/* Calu — gate de utilities do Tailwind
   ============================================================================
   Duas travas, um script só. Roda em `pnpm check:styles` / `task check:styles`.

   TRAVA A — arbitrary value é proibido.
   `p-[13px]`, `text-[#8F5E23]`, `[color:red]`, `bg-(--x)`, `text-body/[1.9]`.
   Se falta um valor, ele vira token nomeado no @theme de src/styles/global.css.
   A checagem usa o PARSER do Tailwind (`parseCandidate`), não regex, por um
   motivo específico: arbitrary em VARIANTE é legítimo e usado no projeto —
   `aria-[current=page]:underline`, `[&_summary]:hidden`, `has-[>svg]:pl-0`,
   `supports-[display:grid]:grid`. Um `grep -- -\[` não separa os dois casos;
   o parser separa de graça, porque as variantes vivem em `candidate.variants`.

   A trava OLHA para `candidate.variants`, sim — via `hasArbitraryBreakpointVariant`
   em `./lib/arbitrary-checks.mjs` —, mas só para reprovar variante arbitrária de
   media/container query (`@min-[30rem]:`, `min-[30rem]:`, `max-[30rem]:`,
   `@[30rem]:`), que é exatamente o tipo de coisa que esta trava deveria pegar e
   antes escapava por inteiro. Verificado empiricamente com `designSystem.
   parseCandidate`: essas variantes chegam na MESMA forma que as legítimas acima
   (`kind: 'functional'`, `value.kind: 'arbitrary'`) — só o `root` as separa
   (`min`/`max`/`@min`/`@max`/`@` vs. `aria`/`has`/`supports`). Ver o módulo para
   os detalhes e para o caso `compound` (`has-[…]:`), tratado recursivamente.

   TRAVA B — utility morta (a razão de o script existir).
   No Tailwind v4 uma utility inexistente NÃO quebra o build: vira no-op
   silencioso. Como `src/styles/global.css` zera os namespaces default
   (`--color-*: initial`, `--text-*: initial`, ...), `text-sm` compila para
   nada, o texto herda o tamanho do pai e o piso de 17px é violado sem que
   ninguém perceba. `candidatesToCss()` devolve `null` no índice da classe que
   não gera CSS — é isso que pega `text-sm`, `font-medium`, `max-w-3xl`,
   `bg-white`, `2xl:flex` e qualquer typo (`bg-surfce`).

   ---------------------------------------------------------------------------
   EXTRAÇÃO — por que NÃO é o Scanner do oxide sozinho.

   `new Scanner().getCandidatesWithPositions()` funciona e devolve posição, mas
   o extractor do oxide é deliberadamente permissivo: sobre o arquivo inteiro
   ele emite `const`, `posts`, `lang`, `pt-BR`, `charset`, `utf-8`, `class`,
   `href` — tudo o que parece um identificador. Isso é inofensivo para gerar
   CSS (o Tailwind simplesmente descarta), mas é veneno para a TRAVA B: cada um
   desses tokens devolve `null` em `candidatesToCss` e viraria falso positivo.
   `pt-BR`, aliás, chega a parsear como utility funcional (`pt` com valor `BR`).

   Caminho adotado — híbrido:
     1. um scanner próprio delimita as regiões que de fato contêm classe
        (atributos `class` / `className` / `class:list` e argumentos de
        `@apply`), respeitando aspas, template literals, comentários e chaves
        aninhadas em expressões Astro/JSX;
     2. o arquivo é MASCARADO: tudo fora dessas regiões vira espaço, com o
        mesmo comprimento, de modo que todo índice continua valendo para o
        arquivo original;
     3. o `Scanner` do oxide tokeniza a máscara. Ganhamos a tokenização real do
        Tailwind (brackets, `/` de modificador, `!`, `[&_p]:`) e a posição para
        reportar `arquivo:linha:coluna`, sem o ruído do arquivo inteiro.

   ---------------------------------------------------------------------------
   REGIÃO EXTRA — a const de classe (`*Class` / `*Classes`).

   Um componente com variante não escreve a classe no atributo: ele monta um
   mapa ou um ternário e passa a variável adiante. Isso passava INTEIRO pelas
   duas travas — `class:list={[VARIANT[v]]}` não tem literal nenhum dentro da
   região de classe, e os literais do mapa ficam fora dela. Como o Tailwind varre
   o arquivo CRU para gerar CSS, a classe até saía no bundle; só a VERIFICAÇÃO
   sumia. Ou seja: exatamente o no-op silencioso que a trava B existe para pegar,
   de volta pela porta dos fundos. Confirmado empiricamente antes da correção.

   A regra adotada é a convenção que o projeto já seguia sem precisar dela:
   classe fora de atributo mora numa ligação cujo nome termina em `Class` ou
   `Classes` (`widthClass` em Container.astro, `sizeClass` e `linkClass` em
   ContactPair.astro). O valor inteiro dessa declaração vira região de classe —
   string, array, objeto de variantes, ternário, template literal.

   Por que pelo NOME e não por "todo literal de string do arquivo": prosa em
   pt-BR e dado de conteúdo produzem tokens que o extractor do oxide aceita e
   `candidatesToCss` reprova. `CREFITO-3/000000-F` é o exemplo pronto — vira
   candidato, não gera CSS, e viraria falso positivo. Restringir ao nome mantém
   zero ruído e torna a regra greppável.

   O preço: classe guardada numa const com outro nome continua invisível. É uma
   convenção, não uma prova — mas agora é uma convenção COM gate, e o nome certo
   é o caminho mais curto.

   Limitação conhecida e aceita: `class={estilos.card}` não tem literal de
   string, então não há o que verificar. Classe montada fora de literal escapa
   das duas travas — é o preço de não inventar análise de fluxo.
   ============================================================================ */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { __unstable__loadDesignSystem } from 'tailwindcss';
import { Scanner } from '@tailwindcss/oxide';

import { hasArbitraryBreakpointVariant, isArbitraryUtility } from './lib/arbitrary-checks.mjs';
import { collectClassSpans, maskContent } from './lib/class-spans.mjs';

/* ----------------------------------------------------------------------------
   Allowlist — VAZIA, e é para continuar assim.
   Toda entrada aqui é uma utility que o gate deixa passar sem verificar, ou
   seja, um buraco permanente no piso tipográfico e no vocabulário da marca.
   Qualquer entrada futura exige justificativa ESCRITA ao lado dela: por que o
   valor não pode virar token nomeado no @theme. "Foi mais rápido assim" não é
   justificativa. Na dúvida, o token entra em src/styles/global.css.
---------------------------------------------------------------------------- */
const ALLOWLIST = new Set([]);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEME_CSS = path.join(ROOT, 'src/styles/global.css');
const SCAN_DIR = path.join(ROOT, 'src');
const SCAN_EXTENSIONS = new Set(['.astro', '.ts', '.js', '.md', '.mdx']);

/* `design_handoff_calu` é material de referência do handoff, não código. */
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.astro', '.git', 'design_handoff_calu']);

/* ============================================================================
   1. Delimitação das regiões que contêm classe

   Vive em `./lib/class-spans.mjs` — importável por teste, ao contrário deste
   arquivo, que roda `main()` no import. As três famílias de região estão
   detalhadas no cabeçalho acima.
   ========================================================================= */

/* ============================================================================
   2. Posição → linha:coluna
   ========================================================================= */

function buildLineIndex(content) {
  const starts = [0];
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function locate(lineStarts, position) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (lineStarts[mid] <= position) low = mid;
    else high = mid - 1;
  }
  return { line: low + 1, column: position - lineStarts[low] + 1 };
}

/* ============================================================================
   3. Varredura de arquivos
   ========================================================================= */

function listFiles(dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.gitkeep') continue;
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFiles(full));
    else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) found.push(full);
  }
  return found;
}

/* ============================================================================
   4. Design system
   ========================================================================= */

async function loadDesignSystem() {
  let css;
  try {
    css = readFileSync(THEME_CSS, 'utf8');
  } catch {
    throw new Error(`não consegui ler o design system em ${path.relative(ROOT, THEME_CSS)}`);
  }

  return __unstable__loadDesignSystem(css, {
    base: path.dirname(THEME_CSS),
    loadStylesheet: async (id, base) => {
      /* `@import 'tailwindcss'` resolve pelo export map do pacote; o resto é
         relativo ao arquivo que importou. */
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

/* ============================================================================
   5. As duas travas
   `isArbitraryUtility` e `hasArbitraryBreakpointVariant` vêm de
   `./lib/arbitrary-checks.mjs` — extraídas para lá para serem importáveis pelo
   teste em `tests/scripts/check-utilities.test.ts` também.
   ========================================================================= */

const HINTS = {
  A: 'adicione um token nomeado no @theme de src/styles/global.css e use a utility gerada',
  B: 'esta classe não gera CSS — o namespace foi zerado (ou o nome não existe); use um token da marca de src/styles/global.css',
};

const LABELS = {
  A: 'trava A · arbitrary value',
  B: 'trava B · utility morta',
};

/* ============================================================================
   6. Execução
   ========================================================================= */

async function main() {
  const designSystem = await loadDesignSystem();
  const scanner = new Scanner({ sources: [] });
  const files = listFiles(SCAN_DIR);

  /* Ocorrências: { file, candidate, line, column } */
  const occurrences = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const masked = maskContent(content, collectClassSpans(content));
    if (masked.trim() === '') continue;

    /* A máscara é um saco de classes separadas por espaço; qualquer extractor
       do oxide a tokeniza igual, então a extensão declarada é indiferente. */
    const tokens = scanner.getCandidatesWithPositions({
      file,
      content: masked,
      extension: 'html',
    });
    if (tokens.length === 0) continue;

    const lineStarts = buildLineIndex(content);
    for (const { candidate, position } of tokens) {
      if (ALLOWLIST.has(candidate)) continue;
      const { line, column } = locate(lineStarts, position);
      occurrences.push({ file, candidate, line, column });
    }
  }

  /* Uma única compilação para todos os nomes distintos. */
  const unique = [...new Set(occurrences.map((o) => o.candidate))];
  const compiled = designSystem.candidatesToCss(unique);
  const generatesCss = new Map(unique.map((name, i) => [name, compiled[i] !== null]));

  const findings = [];
  for (const occurrence of occurrences) {
    const parsed = designSystem.parseCandidate(occurrence.candidate);
    if (parsed.some((c) => isArbitraryUtility(c) || hasArbitraryBreakpointVariant(c))) {
      findings.push({ ...occurrence, trava: 'A' });
      continue;
    }
    if (!generatesCss.get(occurrence.candidate)) {
      findings.push({ ...occurrence, trava: 'B' });
    }
  }

  if (findings.length === 0) {
    const plural = occurrences.length === 1 ? 'utility verificada' : 'utilities verificadas';
    const arquivos = files.length === 1 ? 'arquivo' : 'arquivos';
    console.log(`✓ ${occurrences.length} ${plural} em ${files.length} ${arquivos}`);
    return 0;
  }

  const byFile = new Map();
  for (const finding of findings) {
    const relative = path.relative(ROOT, finding.file);
    if (!byFile.has(relative)) byFile.set(relative, []);
    byFile.get(relative).push(finding);
  }

  const problemas = findings.length === 1 ? 'problema' : 'problemas';
  const arquivos = byFile.size === 1 ? 'arquivo' : 'arquivos';
  console.error(`✗ ${findings.length} ${problemas} em ${byFile.size} ${arquivos}\n`);

  for (const [relative, list] of [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(relative);
    list.sort((a, b) => a.line - b.line || a.column - b.column);
    for (const finding of list) {
      console.error(
        `  ${relative}:${finding.line}:${finding.column}  ${finding.candidate}  [${LABELS[finding.trava]}]`,
      );
      console.error(`      → ${HINTS[finding.trava]}`);
    }
    console.error('');
  }

  console.error('Regra do projeto: arbitrary value é proibido e toda classe precisa gerar CSS.');
  console.error('O vocabulário da marca está em src/styles/global.css.');
  return 1;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`✗ check-utilities falhou: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
