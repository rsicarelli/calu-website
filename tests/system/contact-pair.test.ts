/* ContactPair, em nível de sistema — a garantia estrutural do componente (WhatsApp e telefone
   com o MESMO peso visual, DESIGN-SYSTEM §7), replicada sobre o HTML FINAL construído.
   ============================================================================================
   `tests/components/ContactPair.test.ts` já prova isto no nível do componente isolado
   (`experimental_AstroContainer`, props sintéticas). Este arquivo prova a MESMA coisa onde
   importa de verdade: dentro do documento real que o build produz, onde `ContactPair` é
   consumido por Header, Footer, EmptyState etc. com props reais — se algum consumidor um dia
   passar `class` extra só para um dos dois links (o componente não expõe essa API, mas nada
   impede alguém de editar o `.astro` para isso), é aqui que a regressão aparece.

   Comparação de classe por `getAttribute('class')`, não `.className`: as duas devolvem a MESMA
   string neste caso (elemento HTML simples, sem SVG `className.baseVal`), mas `getAttribute` é o
   que o enunciado pede — "a MESMA string de class" — e evita qualquer dúvida sobre normalização
   implícita da propriedade `.className` em alguma engine.

   Ver limitação geral em `tests/system/_dom.ts` (linkedom não computa CSS) — aqui não se aplica
   diretamente: este teste é 100% estrutural (contagem de filhos, igualdade de string), não um
   proxy de layout. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

describe('[data-contact-pair] — exatamente 2 <a>, com a MESMA classe (peso visual idêntico)', () => {
  const pages = distPages();

  it('varredura não está vazia — encontrou páginas e pelo menos um [data-contact-pair]', () => {
    expect(pages.length).toBeGreaterThan(0);
    const total = pages.reduce(
      (sum, { document }) => sum + document.querySelectorAll('[data-contact-pair]').length,
      0,
    );
    expect(total).toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo [data-contact-pair] tem 2 <a> com classe idêntica',
    ({ file, document }) => {
      const pairs = Array.from(document.querySelectorAll('[data-contact-pair]'));
      expect(pairs.length, `${file}: nenhum [data-contact-pair] encontrado`).toBeGreaterThan(0);

      for (const [index, pair] of pairs.entries()) {
        // "Filhos", não "descendentes": `.children` (não `querySelectorAll('a')`) para não
        // contar um <a> aninhado dentro de outra coisa por engano — o contrato do componente é
        // que as DUAS âncoras são filhas diretas (ver `src/components/ui/ContactPair.astro`).
        const anchorChildren = Array.from(pair.children).filter(
          (child) => child.tagName.toLowerCase() === 'a',
        );

        expect(
          anchorChildren.length,
          `${file}: [data-contact-pair] #${index} tem ${anchorChildren.length} <a> filhos, esperado 2`,
        ).toBe(2);

        const [first, second] = anchorChildren;
        const firstClass = first!.getAttribute('class');
        const secondClass = second!.getAttribute('class');

        expect(
          firstClass,
          `${file}: [data-contact-pair] #${index} tem <a> sem atributo class`,
        ).not.toBeNull();
        expect(firstClass!.length).toBeGreaterThan(0);
        expect(
          secondClass,
          `${file}: [data-contact-pair] #${index} — as duas <a> não têm a mesma class (WhatsApp: "${firstClass}", telefone: "${secondClass}")`,
        ).toBe(firstClass);
      }
    },
  );
});
