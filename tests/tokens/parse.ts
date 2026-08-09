/* Leitor do manifesto de tokens do `src/styles/global.css`.
   ============================================================================
   Zero dependência de propósito: um parser de CSS completo traria uma árvore
   que ninguém precisa aqui. O que os testes exigem é só isto — os pares
   `--token: valor` de quatro blocos, mais a cascata entre eles.

   Este arquivo NÃO altera o CSS; ele lê. Se um teste ficar vermelho, a decisão
   de qual hex trocar é humana. */

/** Fonte do CSS lida pelo Vite com `?raw`, e não por `node:fs`: o repositório não tem
 *  `@types/node` instalado e `astro check` reprovaria o import do builtin. De quebra, o `?raw`
 *  devolve o arquivo ANTES de qualquer transformação (o plugin do Tailwind não toca nele) e
 *  registra a dependência, então o watch reroda os testes quando o CSS muda. */
const RAW_CSS = import.meta.glob('../../src/styles/global.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const [source] = Object.values(RAW_CSS);
if (typeof source !== 'string' || source.length === 0) {
  // String vazia é o sintoma clássico do Vitest neutralizando CSS: ver `test.css` no
  // `vitest.config.ts`. Falhar aqui, alto, é melhor que parsear um arquivo vazio.
  throw new Error('src/styles/global.css veio vazio — o `?raw` foi neutralizado pelo Vitest');
}

/** Comentário pode conter `#hex`, `--token` e até `{`. Some com todos antes de parsear. */
const css = source.replace(/\/\*[\s\S]*?\*\//g, '');

export type TokenMap = Map<string, string>;

/** Corpo do bloco aberto pelo primeiro casamento de `opener`, achado por contagem de chaves
 *  — o arquivo tem `@media` dentro de `@utility` e dentro de `@layer`, então parar no
 *  primeiro `}` daria o bloco errado. */
function blockBody(input: string, opener: RegExp): string {
  const match = opener.exec(input);
  if (!match) throw new Error(`Bloco não encontrado no global.css: ${String(opener)}`);
  const start = input.indexOf('{', match.index) + 1;
  let depth = 1;
  let i = start;
  while (i < input.length && depth > 0) {
    if (input[i] === '{') depth += 1;
    else if (input[i] === '}') depth -= 1;
    i += 1;
  }
  if (depth !== 0) throw new Error(`Bloco sem fechamento no global.css: ${String(opener)}`);
  return input.slice(start, i - 1);
}

/** Só as declarações do próprio bloco: o que estiver dentro de uma sub-regra é descartado.
 *  Resets de namespace (`--color-*: initial`) não casam — o `*` não é nome de token. */
function ownDeclarations(body: string): TokenMap {
  let depth = 0;
  let flat = '';
  for (const ch of body) {
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (depth === 0) flat += ch;
  }
  const declarations: TokenMap = new Map();
  for (const [, name, value] of flat.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations.set(name, value.trim().replace(/\s+/g, ' '));
  }
  return declarations;
}

/** `@theme static` — o vocabulário que vira utility do Tailwind. */
export const themeTokens: TokenMap = ownDeclarations(blockBody(css, /@theme\s+static\s*\{/));

/** Blocos `:root` avulsos (paleta do logo e elevação). Ficam fora do `@theme` de propósito
 *  — ver §1 e §2 do CSS —, mas são tokens do tema claro na cascata real, e é contra eles
 *  que o invariante de órfão de tema precisa comparar. */
export const rootTokens: TokenMap = new Map(
  [...css.matchAll(/:root\s*\{/g)].flatMap((m) => [
    ...ownDeclarations(blockBody(css.slice(m.index), /:root\s*\{/)),
  ]),
);

/** `[data-theme='dark']` — o tema escuro explícito. O `@custom-variant` da linha 23 cita o
 *  mesmo seletor, mas sem `{` logo depois, então não é confundido com a regra. */
export const darkTokens: TokenMap = ownDeclarations(
  blockBody(css, /\[data-theme=['"]dark['"]\]\s*\{/),
);

/** `:root:not([data-theme])` dentro do `@media (prefers-color-scheme: dark)` — o mesmo tema
 *  escuro, duplicado para quem está sem JS. O invariante 7 é quem garante que não divergem. */
export const darkMediaTokens: TokenMap = ownDeclarations(
  blockBody(
    blockBody(css, /@media\s*\([^)]*prefers-color-scheme:\s*dark[^)]*\)\s*\{/),
    /:root:not\(\[data-theme\]\)\s*\{/,
  ),
);

/** Tema efetivo. O escuro é `{...claro, ...escuro}` porque o bloco escuro só redeclara o que
 *  muda: tudo que ele não cita continua valendo do claro. É essa herança que revelou os dois
 *  defeitos de contraste do handoff — não simplificar para "só o que está no bloco escuro". */
export function resolveTheme(theme: 'light' | 'dark'): TokenMap {
  const light: TokenMap = new Map([...rootTokens, ...themeTokens]);
  return theme === 'light' ? light : new Map([...light, ...darkTokens]);
}

/** Valor de um token no tema, com erro legível quando o token não existe. */
export function tokenValue(theme: TokenMap, name: string): string {
  const value = theme.get(name);
  if (value === undefined) throw new Error(`Token não declarado no global.css: ${name}`);
  return value;
}

type Rgb = { r: number; g: number; b: number; a: number };

/** Aceita `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`, `rgb(r g b / a)` e `rgb(r, g, b)`. */
function parseColor(value: string): Rgb {
  const raw = value.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(raw);
  if (hex) {
    const d = hex[1];
    const wide = d.length <= 4 ? [...d].map((c) => c + c).join('') : d;
    if (wide.length !== 6 && wide.length !== 8) throw new Error(`Hex inválido: ${raw}`);
    const byte = (i: number) => parseInt(wide.slice(i * 2, i * 2 + 2), 16);
    return { r: byte(0), g: byte(1), b: byte(2), a: wide.length === 8 ? byte(3) / 255 : 1 };
  }
  const fn = /^rgba?\(([^)]+)\)$/i.exec(raw);
  if (fn) {
    const [channels, alpha] = fn[1].split('/');
    const parts = channels
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const a = alpha === undefined ? (parts[3] ?? 1) : Number(alpha.trim());
    if (parts.length < 3 || [...parts.slice(0, 3), a].some(Number.isNaN)) {
      throw new Error(`rgb() inválido: ${raw}`);
    }
    return { r: parts[0], g: parts[1], b: parts[2], a };
  }
  throw new Error(`Cor não reconhecida (só hex e rgb()): ${raw}`);
}

/** Luminância relativa sRGB — WCAG 2.x, 1.4.3. */
function luminance({ r, g, b }: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Razão de contraste entre `foreground` e `background`, nesta ordem. Cor com alfa é composta
 *  sobre o fundo antes da medição; o fundo precisa ser opaco, porque o que estaria atrás dele
 *  é indeterminado a partir do CSS. */
export function contrast(foreground: string, background: string): number {
  const bg = parseColor(background);
  if (bg.a < 1) throw new Error(`Fundo precisa ser opaco para medir contraste: ${background}`);
  const fg = parseColor(foreground);
  const composed: Rgb = {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  };
  const [hi, lo] = [luminance(composed), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
