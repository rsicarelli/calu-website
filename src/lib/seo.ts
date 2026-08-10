/* SEO — canonical URL e meta tags Open Graph/Twitter.
   ============================================================================
   Site pt-BR único, sem i18n (CLAUDE.md restrição nº 2): diferente de um projeto multi-idioma,
   não existe `locale`, `hreflang` nem `og:locale:alternate` aqui — de propósito, não por
   esquecimento. Não reintroduzir por analogia com outro projeto.

   `buildSeoMeta` omite condicionalmente as tags cujo dado de origem (`description`/`image`)
   não existe, em vez de emitir a tag com conteúdo vazio — ainda não há OG image (1200×630)
   pronta, e várias páginas futuras podem não ter description aprovada. */

export interface MetaTag {
  property?: string;
  name?: string;
  content: string;
}

export interface SeoInput {
  title: string;
  description?: string;
  canonical: string;
  /** URL absoluta de uma imagem 1200×630. Opcional — ainda não há OG image pronta. */
  image?: string;
  type?: 'website' | 'article';
  siteName: string;
}

/** Resolve um pathname relativo em URL absoluta contra `site` (de `astro.config.mjs` via
 *  `Astro.site`, ou `context.site` num endpoint). */
export function canonicalUrl(pathname: string, site: string | URL | undefined): string {
  return new URL(pathname, site).href;
}

export function buildSeoMeta(input: SeoInput): MetaTag[] {
  const { title, description, canonical, image, type = 'website', siteName } = input;

  const tags: MetaTag[] = [
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: title },
  ];

  if (description) {
    tags.push({ property: 'og:description', content: description });
  }

  tags.push({ property: 'og:url', content: canonical });

  if (image) {
    tags.push({ property: 'og:image', content: image });
  }

  tags.push(
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
  );

  if (description) {
    tags.push({ name: 'twitter:description', content: description });
  }

  if (image) {
    tags.push({ name: 'twitter:image', content: image });
  }

  return tags;
}
