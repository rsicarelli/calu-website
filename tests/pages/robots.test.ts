/* robots.txt — testa o ARTEFATO CONSTRUÍDO (`dist/robots.txt`), não uma `GET()` mockada.
   ============================================================================
   Mesmo raciocínio de `sitemap.test.ts`: `pnpm build` executa o endpoint de verdade contra o
   `site` real de `astro.config.mjs`. Lido via Vite `?raw`, não `node:fs` — mesmo motivo (sem
   `@types/node`, `astro check` reprovaria). */

import { describe, expect, it } from 'vitest';

const RAW_ROBOTS = import.meta.glob('../../dist/robots.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function readRobots(): string {
  const [source] = Object.values(RAW_ROBOTS);
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error('dist/robots.txt não existe ou veio vazio — rode `pnpm build` antes.');
  }
  return source;
}

describe('dist/robots.txt', () => {
  it('permite todos os agentes', () => {
    const body = readRobots();

    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
  });

  it('aponta Sitemap: para a URL absoluta correta do sitemap', () => {
    const body = readRobots();

    expect(body).toContain('Sitemap: https://calupilates.com.br/sitemap.xml');
  });
});
