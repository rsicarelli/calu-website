import type { APIContext } from 'astro';

/* Endpoint custom, não a integration `@astrojs/sitemap` — decisão deliberada (guardrail do
   projeto exige justificar qualquer integration `@astrojs/*` nova; um endpoint manual evita a
   dependência).

   `ROUTES` tem só `/` — a única página que existe de verdade em `src/pages/` até agora. NÃO
   inclui `/servicos`, `/equipe`, `/duvidas`, `/contato` (que estão em `SITE_NAV` como links de
   menu, mas não têm arquivo em `src/pages/` ainda) nem `/404` (nunca deve entrar em sitemap).
   Cada página real futura soma sua própria rota aqui no mesmo commit que cria o arquivo dela. */
const ROUTES = ['/'];

export function GET(context: APIContext): Response {
  const urls = ROUTES.map(
    (path) => `<url><loc>${new URL(path, context.site).href}</loc></url>`,
  ).join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
