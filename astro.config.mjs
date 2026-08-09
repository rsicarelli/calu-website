// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Site estático, sem integrations. Domínio registrado no Registro.br em 2026-08-09; DNS e
// hospedagem ainda em aberto — `site` alimenta URLs canônicas e sitemap quando o SEO for
// configurado.
export default defineConfig({
  site: 'https://calupilates.com.br',

  vite: {
    // Tailwind CSS v4 é conectado via o plugin de Vite (CSS-first, sem arquivo de config).
    plugins: [tailwindcss()],
  },

  // Fonte self-hosted (Fonts API nativa do Astro): o woff2 é baixado no build via o provider do
  // Google e servido pela própria origem (sem CDN de fonte em runtime), com @font-face,
  // fallback com métricas otimizadas (reduz CLS) e os preload links emitidos pelo componente
  // <Font>. Uma família só: Source Serif 4, fonte variável, com subsets latin + latin-ext para
  // cobrir os diacríticos do pt-BR (ã õ á é ç …).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Source Serif 4',
      cssVariable: '--font-source-serif',
      weights: ['200 900'],
      subsets: ['latin', 'latin-ext'],
      display: 'swap',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
  ],
});
