// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Site estático, sem integrations. O domínio é um placeholder até o DNS ser decidido —
// `site` alimenta URLs canônicas e sitemap quando o SEO for configurado.
export default defineConfig({
  site: 'https://calupilates.com.br',
});
