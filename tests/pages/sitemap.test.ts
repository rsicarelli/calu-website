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

/* As páginas de serviço que o build gerou. Só as CHAVES interessam (os caminhos);
   o conteúdo vem junto porque `import.meta.glob` não tem modo "só nomes". */
const RAW_SERVICE_PAGES = import.meta.glob('../../dist/servicos/*/index.html', {
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

  /* Segunda exceção permanente, ao lado de /404: a `/lab` EXISTE em `src/pages/` e mesmo assim
     nunca entra aqui. Ela é servida com `noindex, follow` e é kitchen sink do design system, não
     página do site. O comentário de `ROUTES` em `src/pages/sitemap.xml.ts` diz a mesma coisa em
     prosa; este teste é o que impede alguém de "consertar" a ausência. */
  it('NÃO contém /lab — kitchen sink noindex, fora do índice de propósito', () => {
    const xml = readSitemap();

    expect(xml).not.toContain('/lab');
  });

  /* Até a Fase 4 este bloco afirmava a AUSÊNCIA destas quatro rotas, porque elas
     estavam em `SITE_NAV` sem ter arquivo em `src/pages/`. Agora têm, e a afirmação
     se inverte: toda rota do menu principal precisa estar no índice, ou o menu
     aponta para páginas que o Google nunca vê. */
  it.each(['/servicos/', '/equipe/', '/duvidas/', '/contato/'])(
    'contém a rota %s de SITE_NAV',
    (rota) => {
      expect(readSitemap()).toContain(`<loc>https://calupilates.com.br${rota}</loc>`);
    },
  );

  /* As páginas de serviço são GERADAS a partir da collection, e o endpoint as deriva
     da mesma fonte. Este teste é o que prova que a derivação acontece: com os slugs
     escritos à mão, publicar um serviço novo o deixaria fora do sitemap em silêncio. */
  it('contém uma entrada por página de serviço construída', () => {
    /* A lista esperada sai do próprio `dist/`, e não de `getCollection`: o content
       layer do Astro só existe dentro do build, e chamá-lo aqui devolve coleção
       vazia — o teste passaria sem verificar nada. Comparar o sitemap com os
       arquivos que o build de fato gerou é a checagem que interessa de todo jeito. */
    const paginas = Object.keys(RAW_SERVICE_PAGES).map((caminho) =>
      caminho.replace(/^.*\/dist/, '').replace(/index\.html$/, ''),
    );
    const xml = readSitemap();

    expect(
      paginas.length,
      'nenhuma página de serviço em dist/ — rode `pnpm build`',
    ).toBeGreaterThan(0);

    const ausentes = paginas.filter(
      (rota) => !xml.includes(`<loc>https://calupilates.com.br${rota}</loc>`),
    );

    expect(ausentes, `serviços fora do sitemap: ${ausentes.join(', ')}`).toEqual([]);
  });
});
