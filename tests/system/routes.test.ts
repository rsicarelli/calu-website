/* Guarda de deriva entre a lista de rotas da medição e o que o build de fato publica.
   ============================================================================================
   `tests/metrics/_routes.ts` é LITERAL por necessidade (o cabeçalho dele explica: sem
   `@types/node`, um spec do Playwright não enumera `dist/`). Lista literal deriva, e lista que
   deriva em silêncio é como um varredor de sistema começa a mentir — a Fase 4.1 registrou três
   travas que pareciam cobertura e não eram.

   Este arquivo é o antídoto, e ele cobra os DOIS lados: rota publicada que a medição não visita, e
   rota listada que o build não publica mais. O primeiro é o modo de falha perigoso (uma página
   nova nunca medida); o segundo é o barulhento (o Playwright falharia com 404, mas aqui a mensagem
   diz o que houve).

   Mora em `tests/system/` e não em `tests/metrics/` de propósito: aqui há `import.meta.glob`, o
   Vitest roda em segundos e a reprovação chega ANTES de subir navegador nenhum. */

import { describe, expect, it } from 'vitest';

import { ROUTES } from '../metrics/_routes';

const RAW_PAGES = import.meta.glob('../../dist/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** `../../dist/servicos/index.html` → `/servicos/`; `../../dist/404.html` → `/404.html`. */
function routeOf(file: string): string {
  const path = file.replace(/^\.\.\/\.\.\/dist/, '');
  return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
}

describe('a lista de rotas da medição acompanha o build', () => {
  const publicadas = Object.keys(RAW_PAGES).map(routeOf).sort();

  it('varredura não está vazia — o build produziu páginas', () => {
    expect(publicadas.length, 'dist/**/*.html vazio — rode `pnpm build` antes.').toBeGreaterThan(0);
  });

  it('toda rota publicada está na lista que a medição percorre', () => {
    const listadas = new Set<string>(ROUTES);
    const esquecidas = publicadas.filter((route) => !listadas.has(route));

    expect(
      esquecidas,
      `rota publicada e nunca medida — some em tests/metrics/_routes.ts: ${esquecidas.join(', ')}`,
    ).toEqual([]);
  });

  it('toda rota listada continua sendo publicada', () => {
    const existentes = new Set(publicadas);
    const fantasmas = ROUTES.filter((route) => !existentes.has(route));

    expect(fantasmas, `rota listada que o build não publica mais: ${fantasmas.join(', ')}`).toEqual(
      [],
    );
  });
});
