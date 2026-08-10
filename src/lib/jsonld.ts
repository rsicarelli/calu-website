/* JSON-LD — construtores de nós schema.org.
   ============================================================================
   Nenhuma página chama `localBusinessLd` ainda (guardrail do projeto — CLAUDE.md "Guardrails":
   nenhum dado real da clínica antes de ser levantado com a cliente e aprovado). Esta função
   existe pronta, sem chamador, para uma fase futura popular com dado real.

   `LocalBusinessLdInput` NÃO tem `priceRange` — DESIGN-SYSTEM.md/CLAUDE.md proíbem preço em
   destaque, inclusive como campo opcional de CMS. Omitir do TIPO (não só por convenção) torna
   impossível popular por acidente, mesmo que alguém tente no futuro. */

export type JsonLdNode = Record<string, unknown>;

export interface LocalBusinessLdInput {
  name: string;
  url: string;
  telephone: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  /** Formato schema.org, ex.: `'Mo-Fr 07:00-20:00'`. */
  openingHours: readonly string[];
  areaServed: string;
  image?: string;
}

export function localBusinessLd(input: LocalBusinessLdInput): JsonLdNode {
  return {
    '@type': 'Physiotherapy', // subtipo de MedicalBusiness/LocalBusiness em schema.org
    name: input.name,
    url: input.url,
    telephone: input.telephone,
    address: { '@type': 'PostalAddress', ...input.address },
    openingHours: [...input.openingHours],
    areaServed: input.areaServed,
    ...(input.image ? { image: input.image } : {}),
  };
}
