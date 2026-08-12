/* Delimitação das regiões de um arquivo que podem conter classe do Tailwind.
   ============================================================================
   Mora em `scripts/lib/` pelo mesmo motivo de `arbitrary-checks.mjs`: para ser
   importável tanto pelo script (`check-utilities.mjs`, que roda `main()` no
   import e por isso não pode ser importado por teste) quanto pelo teste
   (`tests/scripts/check-utilities.test.ts`). A lógica testada é a de verdade,
   não uma cópia.

   O contrato é simples: `collectClassSpans(conteúdo)` devolve os pares
   `[início, fim)` em que um token pode legitimamente ser classe, e
   `maskContent` apaga todo o resto preservando o comprimento — é isso que faz
   o `arquivo:linha:coluna` do relatório sair correto de graça.

   Três famílias de região, documentadas em detalhe no cabeçalho de
   `check-utilities.mjs`:
     1. atributo `class` / `className` / `class:list`;
     2. argumento de `@apply` dentro de `<style>`;
     3. valor de uma declaração cujo NOME termina em `Class`/`Classes` — a
        convenção do projeto para guardar classe fora de atributo. */

/* Início de um atributo de classe: class= / className= / class:list= */
const CLASS_ATTR_START = /\b(?:class|className)\s*(?::list)?\s*=\s*/g;
/* Argumentos de @apply dentro de <style> em componentes .astro */
const APPLY = /@apply\s+([^;]+);/g;
/* Declaração cujo NOME termina em Class/Classes — a convenção para guardar
   classe fora de atributo (ver o cabeçalho, "REGIÃO EXTRA"). Cobre também a
   propriedade de objeto (`{ baseClass: '…' }`) e o campo de classe. */
const CLASS_BINDING = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
/** Nome que declara conter classe. Case-insensitive no sufixo, para aceitar
 *  tanto `linkClass` quanto `VARIANT_CLASSES`. */
const CLASS_BINDING_NAME = /class(?:es)?$/i;

/* ============================================================================
   1. Delimitação das regiões que contêm classe
   ========================================================================= */

/** Consome uma string entre aspas simples ou duplas e registra o miolo. */
function scanQuoted(src, index, spans) {
  const quote = src[index];
  let i = index + 1;
  while (i < src.length) {
    const char = src[i];
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (char === quote || char === '\n') break;
    i += 1;
  }
  spans.push([index + 1, i]);
  return i + 1;
}

/**
 * Consome um template literal. Cada trecho de texto vira região de classe; as
 * interpolações `${...}` são varridas como código — os literais de string
 * dentro delas contam (`${ativo ? 'bg-surface' : 'bg-bg'}` são classes), o
 * resto não.
 */
function scanTemplate(src, index, spans) {
  let i = index + 1;
  let segmentStart = i;
  while (i < src.length) {
    const char = src[i];
    if (char === '\\') {
      i += 2;
      continue;
    }
    if (char === '`') {
      spans.push([segmentStart, i]);
      return i + 1;
    }
    if (char === '$' && src[i + 1] === '{') {
      spans.push([segmentStart, i]);
      i = scanBraced(src, i + 1, spans);
      segmentStart = i;
      continue;
    }
    i += 1;
  }
  spans.push([segmentStart, i]);
  return i;
}

/**
 * Consome uma expressão delimitada por chaves a partir do `{` em `openIndex` e
 * devolve o índice logo depois da chave que fecha. Registra em `spans` só os
 * literais de string — identificadores como `ativo` ou `props.classe` ficam de
 * fora e por isso nunca viram falso positivo.
 */
function scanBraced(src, openIndex, spans) {
  let i = openIndex + 1;
  let depth = 1;
  while (i < src.length && depth > 0) {
    const char = src[i];
    if (char === '{') {
      depth += 1;
      i += 1;
    } else if (char === '}') {
      depth -= 1;
      i += 1;
    } else if (char === '"' || char === "'") {
      i = scanQuoted(src, i, spans);
    } else if (char === '`') {
      i = scanTemplate(src, i, spans);
    } else if (char === '/' && src[i + 1] === '/') {
      const end = src.indexOf('\n', i);
      i = end === -1 ? src.length : end;
    } else if (char === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
    } else {
      i += 1;
    }
  }
  return i;
}

/** Operador de comparação imediatamente antes/depois de uma string. */
const COMPARISON_BEFORE = /(?:===|!==|==|!=)\s*$/;
const COMPARISON_AFTER = /^\s*(?:===|!==|==|!=)/;

/**
 * `true` quando o literal entre `start` e `end` é OPERANDO DE COMPARAÇÃO, não
 * uma classe. `size === 'small' ? 'text-small' : 'text-body'` tem os três no
 * mesmo ternário: `'small'` é o valor comparado, os outros dois são classe. Sem
 * esta distinção o gate reprovava `small` e `page` como "utility morta" — os
 * dois primeiros falsos positivos que a região nova produziu, em ContactPair e
 * Container. Cobre as duas ordens (`x === 'a'` e `'a' === x`).
 */
function isComparisonOperand(src, start, end) {
  return (
    COMPARISON_BEFORE.test(src.slice(Math.max(0, start - 4), start)) ||
    COMPARISON_AFTER.test(src.slice(end, end + 4))
  );
}

/**
 * Consome o VALOR de uma declaração `const nomeClass = …`, do primeiro caractere
 * depois do `=` até o fim da expressão, registrando todo literal de string e
 * template que encontrar pelo caminho.
 *
 * Aceita as quatro formas que um mapa de variante assume na prática:
 *   'bg-accent'                                      string solta
 *   ['inline-flex', 'min-h-target'].join(' ')        array
 *   { primary: 'bg-accent', ghost: 'text-brand' }    objeto
 *   size === 'small' ? 'text-small' : 'text-body'    ternário
 *
 * O fim é o primeiro `;` ou quebra de linha em profundidade zero de `{}`, `[]` e
 * `()`. Quebra de linha conta porque o projeto roda Prettier com `semi: true`,
 * mas uma declaração multi-linha (o caso comum de um mapa) mantém profundidade
 * maior que zero até fechar — então a quebra só encerra o que já está completo.
 */
function scanDeclarationValue(src, index, spans) {
  let i = index;
  let depth = 0;
  while (i < src.length) {
    const char = src[i];
    if (char === '{' || char === '[' || char === '(') {
      depth += 1;
      i += 1;
    } else if (char === '}' || char === ']' || char === ')') {
      if (depth === 0) break;
      depth -= 1;
      i += 1;
    } else if (char === '"' || char === "'") {
      /* Registrado num rascunho primeiro: só vira região de classe se não for
         operando de comparação. */
      const scratch = [];
      const after = scanQuoted(src, i, scratch);
      if (!isComparisonOperand(src, i, after)) spans.push(...scratch);
      i = after;
    } else if (char === '`') {
      i = scanTemplate(src, i, spans);
    } else if (char === '/' && src[i + 1] === '/') {
      const end = src.indexOf('\n', i);
      i = end === -1 ? src.length : end;
    } else if (char === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
    } else if (char === ';' && depth === 0) {
      break;
    } else if (char === '\n' && depth === 0) {
      break;
    } else {
      i += 1;
    }
  }
  return i;
}

/** Todas as regiões do arquivo em que um token pode legitimamente ser classe. */
export function collectClassSpans(content) {
  const spans = [];

  CLASS_ATTR_START.lastIndex = 0;
  let match;
  while ((match = CLASS_ATTR_START.exec(content)) !== null) {
    const start = match.index + match[0].length;
    const char = content[start];
    let next;
    if (char === '"' || char === "'") {
      next = scanQuoted(content, start, spans);
    } else if (char === '{') {
      next = scanBraced(content, start, spans);
    } else if (char !== undefined && !/[\s>/]/.test(char)) {
      /* Atributo sem aspas: class=destaque */
      let end = start;
      while (end < content.length && !/[\s>/]/.test(content[end])) end += 1;
      spans.push([start, end]);
      next = end;
    } else {
      next = start + 1;
    }
    /* Evita reprocessar o que já foi consumido (e laço infinito em `class=`). */
    CLASS_ATTR_START.lastIndex = Math.max(next, match.index + match[0].length);
  }

  APPLY.lastIndex = 0;
  while ((match = APPLY.exec(content)) !== null) {
    const start = match.index + match[0].indexOf(match[1]);
    spans.push([start, start + match[1].length]);
  }

  CLASS_BINDING.lastIndex = 0;
  while ((match = CLASS_BINDING.exec(content)) !== null) {
    if (!CLASS_BINDING_NAME.test(match[1])) continue;
    const start = match.index + match[0].length;
    const next = scanDeclarationValue(content, start, spans);
    CLASS_BINDING.lastIndex = Math.max(next, start);
  }

  return spans;
}

/**
 * Devolve uma cópia do arquivo em que só as regiões de classe sobrevivem; todo
 * o resto vira espaço. Comprimento preservado ⇒ índice na máscara é índice no
 * arquivo original, e o `arquivo:linha:coluna` sai correto de graça.
 */
export function maskContent(content, spans) {
  if (spans.length === 0) return '';
  const masked = new Array(content.length).fill(' ');
  for (const [start, end] of spans) {
    for (let i = Math.max(0, start); i < Math.min(end, content.length); i += 1) {
      masked[i] = content[i];
    }
  }
  return masked.join('');
}
