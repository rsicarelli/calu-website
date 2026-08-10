/* SEO — canonical URL e meta tags.
   ============================================================================
   `buildSeoMeta` prova duas coisas: omissão condicional (nenhuma tag vazia quando
   `description`/`image` não existem) e a ausência TOTAL de qualquer coisa relacionada a
   locale/hreflang — a simplificação exigida pelo projeto (pt-BR único, CLAUDE.md restrição
   nº 2), não copiada de um projeto de referência multi-idioma. */

import { describe, expect, it } from 'vitest';

import { buildSeoMeta, canonicalUrl } from '@/lib/seo';

describe('canonicalUrl', () => {
  it('resolve um pathname relativo em URL absoluta a partir de `site`', () => {
    expect(canonicalUrl('/servicos', 'https://calupilates.com.br')).toBe(
      'https://calupilates.com.br/servicos',
    );
  });

  it('resolve a raiz corretamente', () => {
    expect(canonicalUrl('/', 'https://calupilates.com.br')).toBe('https://calupilates.com.br/');
  });

  it('aceita `site` como instância de URL', () => {
    expect(canonicalUrl('/contato', new URL('https://calupilates.com.br'))).toBe(
      'https://calupilates.com.br/contato',
    );
  });
});

describe('buildSeoMeta', () => {
  it('emite as tags base sempre presentes (og:type, og:site_name, og:title, og:url, twitter:card, twitter:title)', () => {
    const tags = buildSeoMeta({
      title: 'Fisioterapia · Calu',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
    });

    expect(tags).toEqual([
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Calu Pilates e Fisioterapia' },
      { property: 'og:title', content: 'Fisioterapia · Calu' },
      { property: 'og:url', content: 'https://calupilates.com.br/' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Fisioterapia · Calu' },
    ]);
  });

  it('usa `type` explícito quando informado', () => {
    const tags = buildSeoMeta({
      title: 'Título',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
      type: 'article',
    });

    expect(tags.find((tag) => tag.property === 'og:type')).toEqual({
      property: 'og:type',
      content: 'article',
    });
  });

  it('omite og:description e twitter:description quando `description` não é passada', () => {
    const tags = buildSeoMeta({
      title: 'Título',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
    });

    expect(tags.some((tag) => tag.property === 'og:description')).toBe(false);
    expect(tags.some((tag) => tag.name === 'twitter:description')).toBe(false);
  });

  it('inclui og:description e twitter:description quando `description` é passada', () => {
    const tags = buildSeoMeta({
      title: 'Título',
      description: 'Pilates e fisioterapia na Vila Clementino.',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
    });

    expect(tags).toContainEqual({
      property: 'og:description',
      content: 'Pilates e fisioterapia na Vila Clementino.',
    });
    expect(tags).toContainEqual({
      name: 'twitter:description',
      content: 'Pilates e fisioterapia na Vila Clementino.',
    });
  });

  it('omite og:image e twitter:image quando `image` não é passada', () => {
    const tags = buildSeoMeta({
      title: 'Título',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
    });

    expect(tags.some((tag) => tag.property === 'og:image')).toBe(false);
    expect(tags.some((tag) => tag.name === 'twitter:image')).toBe(false);
  });

  it('inclui og:image e twitter:image quando `image` é passada', () => {
    const tags = buildSeoMeta({
      title: 'Título',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
      image: 'https://calupilates.com.br/og.png',
    });

    expect(tags).toContainEqual({
      property: 'og:image',
      content: 'https://calupilates.com.br/og.png',
    });
    expect(tags).toContainEqual({
      name: 'twitter:image',
      content: 'https://calupilates.com.br/og.png',
    });
  });

  it('nunca emite og:locale, og:locale:alternate nem qualquer coisa com "locale"/"hreflang" no nome — site é pt-BR único, sem i18n', () => {
    const tags = buildSeoMeta({
      title: 'Título',
      description: 'Descrição.',
      canonical: 'https://calupilates.com.br/',
      siteName: 'Calu Pilates e Fisioterapia',
      image: 'https://calupilates.com.br/og.png',
    });

    for (const tag of tags) {
      const key = tag.property ?? tag.name ?? '';
      expect(key).not.toMatch(/locale/i);
      expect(key).not.toMatch(/hreflang/i);
    }
  });
});
