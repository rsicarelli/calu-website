import type { APIContext } from 'astro';

/* Mais simples que um robots.txt multi-idioma de referência: sem taxonomia de bots de IA — não
   é relevante para uma clínica de bairro. `Sitemap:` sempre derivado de `context.site`, nunca
   hardcoded. */
export function GET(context: APIContext): Response {
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('/sitemap.xml', context.site).href}`,
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
