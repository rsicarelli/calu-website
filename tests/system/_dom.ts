/* Helper compartilhado dos testes de sistema — NÃO é um arquivo de teste (`.test.ts`), é módulo
   utilitário importado pelos outros.
   ============================================================================================
   LIMITAÇÃO DESTE DIRETÓRIO INTEIRO — leia antes de adicionar um teste novo aqui: `linkedom` faz
   *parsing* de HTML, não computa CSS. `getComputedStyle` não existe/não reflete classes
   utilitárias reais neste ambiente (não há motor de layout). "Alvo de toque" e "CLS", testados
   nos arquivos deste diretório, são PROXIES: confirmam que a classe utilitária ou o atributo
   esperado está presente no HTML construído — não que o pixel renderizado meça X de verdade.
   Medição real de layout exigiria um motor de browser (Playwright/Puppeteer), fora de escopo
   enquanto não houver CI (CLAUDE.md, Fase 4 — endurecimento).

   Cada teste de `tests/system/` precisa da mesma coisa: o HTML de CADA página do build — todo
   arquivo `.html` dentro de `dist/`, em qualquer profundidade (o glob exato está no código
   abaixo, dentro de uma string; escrevê-lo por extenso aqui, dentro deste comentário de bloco,
   fecharia o próprio comentário — dois asteriscos seguidos de barra-asterisco formam a mesma
   sequência de dois caracteres, asterisco-barra, que fecha um comentário de bloco em JS) — já
   parseado em algo percorrível por `querySelector`/`querySelectorAll`. Lido via Vite `?raw`
   (`import.meta.glob`), não `node:fs`/`node:path`: o repositório não tem `@types/node`
   instalado e `astro check` reprovaria o import do builtin — o MESMO padrão (e o mesmo motivo)
   de `tests/pages/sitemap.test.ts`, `tests/pages/robots.test.ts` e `tests/tokens/parse.ts`. A
   única adaptação é o glob: um caminho fixo lá, recursivo com curinga de arquivo aqui, para
   pegar TODA página que o build produzir (hoje só `index.html`/`404.html`, mas o helper não
   deve precisar de edição quando a Fase 3 adicionar páginas novas).

   `parseHTML` é a API real de `linkedom` 0.18.13 — confirmada em
   `node_modules/linkedom/types/index.d.ts` (`export function parseHTML(html: any): Window &
   typeof globalThis`), não presumida por analogia com outro parser. A interseção com
   `typeof globalThis` é o que permite devolver `.document` já tipado como o `Document` ambiente
   da lib DOM do TypeScript (a mesma que `ThemeToggle.astro` e os testes de componente usam), sem
   nenhum cast — diferente do padrão jsdom do projeto (`tests/components/*.test.ts`), que precisa
   de `@ts-expect-error` porque `jsdom` não publica tipos próprios. */

import { parseHTML } from 'linkedom';

const RAW_PAGES = import.meta.glob('../../dist/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export type PageDocument = {
  /** Caminho do módulo devolvido pelo glob (ex. `../../dist/index.html`) — usado nas mensagens
   *  de falha dos testes para apontar QUAL página quebrou. */
  file: string;
  document: Document;
};

/** Uma entrada por página HTML do build. Falha alto — em vez de devolver uma lista vazia em
 *  silêncio — se `dist/` não tiver nenhum `.html`: sintoma de esquecer `pnpm build` antes, o
 *  mesmo cuidado de `tests/pages/sitemap.test.ts`. Uma lista vazia aqui faria TODO teste deste
 *  diretório passar trivialmente (nenhuma página para reprovar), o que é pior que um erro. */
export function distPages(): PageDocument[] {
  const entries = Object.entries(RAW_PAGES);
  if (entries.length === 0) {
    throw new Error('dist/**/*.html não encontrou nenhuma página — rode `pnpm build` antes.');
  }

  return entries.map(([file, source]) => {
    if (typeof source !== 'string' || source.length === 0) {
      throw new Error(`${file} existe mas veio vazio — build incompleto?`);
    }
    const { document } = parseHTML(source);
    return { file, document };
  });
}
