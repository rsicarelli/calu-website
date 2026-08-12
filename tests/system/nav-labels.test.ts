/* aria-label de <nav> — rede de segurança permanente em nível de SISTEMA.
   ============================================================================================
   `tests/components/BaseLayout.test.ts` já prova, no componente isolado, que os 3 `<nav>` do
   site (Header desktop "Principal", MobileNav "Menu", Footer "Rodapé") convivem sem violar
   `landmark-unique` do axe. Este arquivo reprova o mesmo tipo de regressão, mas sobre CADA
   página real que o build produzir daqui pra frente — inclusive as que a Fase 4 ainda vai
   adicionar (`/servicos`, `/equipe`, `/duvidas`, `/contato`), sem precisar de edição: a
   varredura é por todo `.html` de `dist/`, em qualquer profundidade (mesmo glob de
   `tests/system/_dom.ts`), não por um componente nomeado.

   "Distintos DENTRO DA MESMA página" — não entre páginas: duas páginas diferentes podem (e vão)
   repetir "Principal"/"Menu"/"Rodapé" cada uma, isso é esperado e correto. O que nunca pode
   acontecer é DOIS `<nav>` com o MESMO `aria-label` dentro do MESMO documento — é essa
   ambiguidade que quebra `landmark-unique` e confunde navegação por landmark de leitor de tela. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

describe('<nav aria-label> — sem repetição dentro da mesma página', () => {
  const pages = distPages();

  it('varredura não está vazia — encontrou páginas com pelo menos um <nav>', () => {
    expect(pages.length).toBeGreaterThan(0);
    const totalNavs = pages.reduce(
      (sum, { document }) => sum + document.querySelectorAll('nav').length,
      0,
    );
    expect(totalNavs).toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo <nav> tem aria-label e nenhum se repete',
    ({ file, document }) => {
      const navs = Array.from(document.querySelectorAll('nav'));
      expect(navs.length, `${file}: nenhum <nav> encontrado`).toBeGreaterThan(0);

      const labels = navs.map((nav) => nav.getAttribute('aria-label'));

      // Toda landmark <nav> precisa ser identificável — um <nav> sem aria-label (null) é, em si,
      // uma falha diferente da duplicata, mas igualmente relevante para landmark-unique: null
      // "colide" com outro null exatamente como duas strings iguais colidiriam.
      const missing = labels.filter((label) => label === null || label.trim().length === 0);
      expect(missing.length, `${file}: <nav> sem aria-label`).toBe(0);

      const unique = new Set(labels);
      expect(
        unique.size,
        `${file}: aria-label de <nav> repetido — labels encontrados: ${labels.join(', ')}`,
      ).toBe(labels.length);
    },
  );
});
