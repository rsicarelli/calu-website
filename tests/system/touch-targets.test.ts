/* Alvo de toque (público 60+) — proxy sobre o HTML construído, não medição de pixel.
   ============================================================================================
   LIMITAÇÃO (ver `tests/system/_dom.ts`): `linkedom` não computa CSS. Este teste NÃO mede se o
   link realmente ocupa 52px/56px na tela; confirma que a classe utilitária que EMITE
   `min-height` (`--spacing-target`/`--spacing-target-primary`, `global.css` §3) está presente no
   `class` do elemento certo. Se o valor do token mudar, este teste continua verde — quem garante
   o VALOR são `tests/tokens/`.

   `classList.contains(...)`, não regex/substring cru: `min-h-target-primary` CONTÉM
   `min-h-target` como prefixo textual — uma checagem por `String.includes`/regex ingênua faria
   `min-h-target-primary` "passar" por engano num teste que pedia especificamente `min-h-target`
   (falso positivo). `classList` tokeniza a lista de classes pelo espaço, então os dois nomes só
   colidem se forem EXATAMENTE iguais — o mesmo resultado que substring/regex bem escrita
   daria, só que sem o risco de escrever a regex errada. Confirmado que `linkedom` implementa
   `classList` de verdade (não é DOMTokenList stub) contra o pacote instalado. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

const NAV_SELECTORS = [
  'nav[aria-label="Principal"]',
  'nav[aria-label="Menu"]',
  'nav[aria-label="Rodapé"]',
] as const;

describe('Alvo de toque — min-h-target nos <nav> nomeados, min-h-target-primary no FAB', () => {
  const pages = distPages();

  it('varredura não está vazia — encontrou páginas, navs nomeados e o FAB do WhatsApp', () => {
    expect(pages.length).toBeGreaterThan(0);

    let totalNavLinks = 0;
    let totalFabs = 0;
    for (const { document } of pages) {
      for (const selector of NAV_SELECTORS) {
        for (const nav of Array.from(document.querySelectorAll(selector))) {
          totalNavLinks += nav.querySelectorAll('a').length;
        }
      }
      totalFabs += document.querySelectorAll('[data-whatsapp-fab]').length;
    }
    expect(totalNavLinks).toBeGreaterThan(0);
    expect(totalFabs).toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo <a> dos 3 <nav> nomeados carrega min-h-target',
    ({ file, document }) => {
      const offenders: string[] = [];

      for (const selector of NAV_SELECTORS) {
        const navs = document.querySelectorAll(selector);
        for (const nav of Array.from(navs)) {
          for (const link of Array.from(nav.querySelectorAll('a'))) {
            if (!link.classList.contains('min-h-target')) {
              const label = link.textContent?.trim() || link.getAttribute('href') || '(sem texto)';
              offenders.push(`${selector} > a "${label}"`);
            }
          }
        }
      }

      expect(offenders, `${file}: <a> sem min-h-target: ${offenders.join(', ')}`).toEqual([]);
    },
  );

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo [data-whatsapp-fab] carrega min-h-target-primary',
    ({ file, document }) => {
      const fabs = Array.from(document.querySelectorAll('[data-whatsapp-fab]'));
      expect(fabs.length, `${file}: nenhum [data-whatsapp-fab] encontrado`).toBeGreaterThan(0);

      const offenders = fabs
        .filter((fab) => !fab.classList.contains('min-h-target-primary'))
        .map((fab) => fab.getAttribute('href') ?? '(sem href)');

      expect(
        offenders,
        `${file}: [data-whatsapp-fab] sem min-h-target-primary: ${offenders.join(', ')}`,
      ).toEqual([]);
    },
  );
});
