import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

/* Endpoint custom, não a integration `@astrojs/sitemap` — decisão deliberada (guardrail do
   projeto exige justificar qualquer integration `@astrojs/*` nova; um endpoint manual evita a
   dependência).

   `STATIC_ROUTES` são as páginas de arquivo fixo em `src/pages/`. As páginas de serviço NÃO
   estão aqui: elas são geradas por `src/pages/servicos/[slug].astro` a partir da collection, e
   por isso saem DA MESMA FONTE que as gera. Escrever os cinco slugs à mão significaria que
   publicar um serviço novo no CMS o deixaria fora do sitemap em silêncio — o tipo de defeito
   que ninguém percebe até reparar que a página nunca foi indexada.

   Cada página real futura de arquivo fixo soma sua própria rota aqui no mesmo commit que cria o
   arquivo dela.

   DUAS EXCEÇÕES PERMANENTES, que existem em `src/pages/` e mesmo assim nunca entram aqui:
   `/404` (página de erro nunca vai a sitemap) e `/lab` (kitchen sink do design system, servida
   com `noindex, follow` — ver `src/pages/lab/index.astro`). As duas são de propósito; não
   "corrigir" adicionando-as. `tests/pages/sitemap.test.ts` trava as duas ausências. */
const STATIC_ROUTES = ['/', '/servicos/', '/equipe/', '/duvidas/', '/contato/'];

export async function GET(context: APIContext): Promise<Response> {
  const servicos = await getCollection('servicos');
  const routes = [...STATIC_ROUTES, ...servicos.map((servico) => `/servicos/${servico.id}/`)];

  const urls = routes
    .map((path) => `<url><loc>${new URL(path, context.site).href}</loc></url>`)
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
