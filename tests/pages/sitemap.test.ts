/* sitemap.xml — testa o ARTEFATO CONSTRUÍDO (`dist/sitemap.xml`), não uma `GET()` mockada.
   ============================================================================
   Requer `pnpm build` rodado antes (mesmo padrão do projeto de referência): `astro build`
   executa o endpoint de verdade contra o `site` real de `astro.config.mjs` e grava o XML em
   `dist/`, o que pega qualquer divergência entre o que o endpoint faz e o que o build final
   serve — algo que uma `GET()` chamada direto do teste, com um `APIContext` fabricado à mão,
   não garantiria.

   Lido via Vite `?raw` (`import.meta.glob`), não `node:fs`: o repositório não tem `@types/node`
   instalado e `astro check` reprovaria o import do builtin — mesmo motivo documentado em
   `tests/tokens/parse.ts`. */

import { describe, expect, it } from 'vitest';

const RAW_SITEMAP = import.meta.glob('../../dist/sitemap.xml', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function readSitemap(): string {
  const [source] = Object.values(RAW_SITEMAP);
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error('dist/sitemap.xml não existe ou veio vazio — rode `pnpm build` antes.');
  }
  return source;
}

describe('dist/sitemap.xml', () => {
  it('é um urlset válido com o namespace correto', () => {
    const xml = readSitemap();

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('contém a URL absoluta da home', () => {
    const xml = readSitemap();

    expect(xml).toContain('<loc>https://calupilates.com.br/</loc>');
  });

  it('NÃO contém /404 — a página de erro nunca deve entrar em sitemap', () => {
    const xml = readSitemap();

    expect(xml).not.toContain('404');
  });

  it('NÃO contém rotas de SITE_NAV que ainda não têm arquivo em src/pages/ (/servicos, /equipe, /duvidas, /contato)', () => {
    const xml = readSitemap();

    expect(xml).not.toContain('/servicos');
    expect(xml).not.toContain('/equipe');
    expect(xml).not.toContain('/duvidas');
    expect(xml).not.toContain('/contato');
  });
});
