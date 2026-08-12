/* JSON-LD no site construído.
   ============================================================================
   `localBusinessLd` foi escrito na Fase 1 e ficou sem chamador até agora — o teste
   de `tests/lib/jsonld.test.ts` cobre a FUNÇÃO, com fixture. Este arquivo cobre o
   que aquele não pode: o que de fato saiu no HTML.

   Três coisas que só o artefato construído mostra:

   1. O bloco faz PARSE. `JsonLd.astro` serializa e escapa `<`; um erro de
      serialização produz um `<script>` que o Google descarta em silêncio, e nada
      no build reclama.
   2. Os dados batem com `SITE`. Se alguém copiar o telefone para a página em vez de
      lê-lo da fonte única, este teste é onde a divergência aparece.
   3. `priceRange` NÃO existe. O tipo `LocalBusinessLdInput` já o omite, então a
      função não consegue emiti-lo — mas nada impede uma página futura de montar o
      nó à mão e acrescentá-lo. Preço em destaque é proibido pelo `DESIGN-SYSTEM.md`
      §3, e a checagem vale no artefato, não só no tipo.

   O nó aparece UMA vez no site, na Home: `Physiotherapy` descreve a organização,
   não o documento. Repeti-lo em seis páginas não melhora indexação e multiplica a
   chance de as cópias divergirem. */

import { describe, expect, it } from 'vitest';

import { SITE } from '@/lib/site';

import { distPages } from './_dom';

const pages = distPages();

type LdNode = Record<string, unknown>;

function ldNodes(document: Document): LdNode[] {
  return Array.from(document.querySelectorAll('script[type="application/ld+json"]')).flatMap(
    (script) => {
      const parsed = JSON.parse(script.textContent ?? '') as LdNode;
      const graph = parsed['@graph'];
      return Array.isArray(graph) ? (graph as LdNode[]) : [parsed];
    },
  );
}

const paginasComLd = pages.filter(
  ({ document }) => document.querySelector('script[type="application/ld+json"]') !== null,
);

describe('JSON-LD', () => {
  it('a varredura não está vazia', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it('exatamente uma página emite o nó do negócio', () => {
    /* Nem zero (o nó existiria só no código, sem chegar ao HTML) nem várias (cópias
       que divergem). Uma. */
    expect(
      paginasComLd.map((p) => p.file),
      `páginas com JSON-LD: ${paginasComLd.map((p) => p.file).join(', ')}`,
    ).toHaveLength(1);
  });

  it.each(paginasComLd.map(({ file, document }) => ({ file, document })))(
    'em $file, o bloco JSON-LD faz parse',
    ({ file, document }) => {
      expect(() => ldNodes(document), `${file}: JSON-LD inválido`).not.toThrow();
    },
  );

  it('o nó do negócio é do tipo Physiotherapy', () => {
    const nodes = ldNodes(paginasComLd[0].document);

    expect(nodes.map((n) => n['@type'])).toContain('Physiotherapy');
  });

  it('telefone, endereço e horário vêm de SITE', () => {
    const negocio = ldNodes(paginasComLd[0].document).find((n) => n['@type'] === 'Physiotherapy')!;
    const address = negocio.address as Record<string, unknown>;

    expect(negocio.name).toBe(SITE.name);
    expect(negocio.telephone).toBe(SITE.phone.href.replace('tel:', ''));
    expect(address.streetAddress).toBe(SITE.address.streetAddress);
    expect(address.postalCode).toBe(SITE.address.postalCode);
    expect(negocio.openingHours).toEqual([...SITE.openingHours]);
  });

  it('o endereço é um PostalAddress completo', () => {
    const negocio = ldNodes(paginasComLd[0].document).find((n) => n['@type'] === 'Physiotherapy')!;
    const address = negocio.address as Record<string, unknown>;

    expect(address['@type']).toBe('PostalAddress');
    const ausentes = [
      'streetAddress',
      'addressLocality',
      'addressRegion',
      'postalCode',
      'addressCountry',
    ].filter((campo) => !address[campo]);

    expect(ausentes, `campos ausentes no PostalAddress: ${ausentes.join(', ')}`).toEqual([]);
  });

  /* A trava regulatória, medida no artefato e não só no tipo. */
  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum nó declara priceRange',
    ({ file, document }) => {
      const comPreco = ldNodes(document).filter(
        (n) => 'priceRange' in n || 'priceSpecification' in n,
      );

      expect(comPreco, `${file}: nó com preço no JSON-LD`).toEqual([]);
    },
  );
});
