/* JSON-LD — `localBusinessLd()`.
   ============================================================================
   Fixture inteiramente fictícia: endereço/telefone claramente inventados ("Rua Exemplo, 123"),
   nunca dado real da clínica (guardrail do projeto — CLAUDE.md "Guardrails"). A trava extra
   (`'priceRange' in node`) prova em RUNTIME que o campo proibido não vaza, além da proteção de
   tipo do TypeScript em `LocalBusinessLdInput` (que nem declara `priceRange`). */

import { describe, expect, it } from 'vitest';

import { localBusinessLd } from '@/lib/jsonld';

const fixture = {
  name: 'Estúdio Exemplo de Pilates',
  url: 'https://calupilates.com.br/',
  telephone: '+55 11 0000-0000',
  address: {
    streetAddress: 'Rua Exemplo, 123',
    addressLocality: 'São Paulo',
    addressRegion: 'SP',
    postalCode: '00000-000',
    addressCountry: 'BR',
  },
  openingHours: ['Mo-Fr 07:00-20:00'],
  areaServed: 'Vila Clementino, São Paulo',
};

describe('localBusinessLd', () => {
  it('define @type como "Physiotherapy"', () => {
    const node = localBusinessLd(fixture);

    expect(node['@type']).toBe('Physiotherapy');
  });

  it('aninha o endereço com @type "PostalAddress"', () => {
    const node = localBusinessLd(fixture);

    expect(node.address).toEqual({ '@type': 'PostalAddress', ...fixture.address });
  });

  it('copia name/url/telephone/openingHours/areaServed do input', () => {
    const node = localBusinessLd(fixture);

    expect(node.name).toBe(fixture.name);
    expect(node.url).toBe(fixture.url);
    expect(node.telephone).toBe(fixture.telephone);
    expect(node.openingHours).toEqual(['Mo-Fr 07:00-20:00']);
    expect(node.areaServed).toBe(fixture.areaServed);
  });

  it('omite `image` quando não informado', () => {
    const node = localBusinessLd(fixture);

    expect('image' in node).toBe(false);
  });

  it('inclui `image` quando informado', () => {
    const node = localBusinessLd({ ...fixture, image: 'https://calupilates.com.br/foto.jpg' });

    expect(node.image).toBe('https://calupilates.com.br/foto.jpg');
  });

  it('NUNCA inclui `priceRange` — proibido em destaque, inclusive como campo opcional de CMS', () => {
    const node = localBusinessLd(fixture);

    expect('priceRange' in node).toBe(false);
  });
});
