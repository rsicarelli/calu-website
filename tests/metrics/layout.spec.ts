/* Geometria real: alvo de toque, refluxo a 320px e ritmo vertical.
   ============================================================================================
   As três respondem a uma trava que o repositório já tinha e que NÃO media o que parecia medir —
   a família de defeito que a Fase 4.1 nomeou.

   1. ALVO DE TOQUE. `tests/system/touch-targets.test.ts` diz de si mesmo, no cabeçalho: "NÃO mede
      se o link realmente ocupa 52px/56px na tela; confirma que a classe utilitária está presente".
      E ele só olha os `<a>` dos três `<nav>` nomeados e o FAB. Aqui é o pixel, em TODO controle.

   2. REFLUXO A 320px. `PAGES.md:30` exige por extenso ("o conteúdo funciona a 320px, não 360px:
      360px é o breakpoint de design, 320px é o mínimo de refluxo que a norma exige") e NADA no
      repositório jamais verificou. O `global.css` §7 mostra alguém tendo medido "Acompanhamento" a
      322px numa caixa de 280px e somado `hyphens: auto` — medição manual, feita uma vez. Isto a
      torna permanente.

   3. RITMO VERTICAL. É o defeito literal da Fase 4.1: "o rodapé shipou com padding vertical zero em
      toda página e as 708 asserções seguiram verdes", porque não havia guarda nenhuma de
      espaçamento. A asserção é `> 0` de propósito, nunca um valor: "zero está errado" é uma
      afirmação que não consegue congelar decisão de design. Qualquer coisa mais apertada seria um
      `border-line` novo. */

import { expect, test } from '@playwright/test';

import { interactiveBoxes } from './_measure';
import { PAGE_ROUTES } from './_routes';

/* `DESIGN-SYSTEM`, invioláveis 4: 52px em qualquer controle, 56px na ação principal. */
const ALVO = 52;
const ALVO_PRIMARIO = 56;

/* Meio pixel de folga: o layout resolve em subpixel e uma altura de 51,99px é o token cumprido,
   não um controle pequeno. Sem isso a trava reprovaria por arredondamento — ruído que ensina a
   suíte a mentir. */
const TOLERANCIA = 0.5;

for (const route of PAGE_ROUTES) {
  test(`${route} — todo controle atinge o alvo de toque em pixel`, async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);

    const boxes = await interactiveBoxes(page);
    expect(boxes.length, `${route}: nenhum controle visível para medir`).toBeGreaterThan(0);

    const offenders = boxes
      /* Link corrido dentro de prosa é trecho de texto, não botão — ver `_measure.ts`. */
      .filter((b) => !b.prose)
      .filter((b) => b.height < ALVO - TOLERANCIA)
      .map((b) => `${b.where} "${b.text}" — ${b.height.toFixed(1)}px`);

    expect(
      offenders,
      `${route}: controle abaixo de ${ALVO}px:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });

  test(`${route} — a ação principal atinge ${ALVO_PRIMARIO}px`, async ({ page }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);

    /* O FAB NASCE `[hidden]` enquanto o CTA principal está na tela — é o `data-watch-target` do
       componente, que existe para não empilhar duas vezes a mesma ação. Medi-lo no topo da página
       mediria o estado em que ele não existe. Rolar até o fim é o que a pessoa faz, e é onde o
       botão de fato aparece. */
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => {
      const fab = document.querySelector('[data-whatsapp-fab]');
      return fab !== null && !fab.hasAttribute('hidden');
    });

    const fab = page.locator('[data-whatsapp-fab]');
    await expect(fab, `${route}: nenhum FAB do WhatsApp`).toHaveCount(1);

    const box = await fab.boundingBox();
    expect(box, `${route}: o FAB não tem caixa`).not.toBeNull();
    expect(
      box!.height,
      `${route}: o FAB mede ${box!.height.toFixed(1)}px, piso ${ALVO_PRIMARIO}px`,
    ).toBeGreaterThanOrEqual(ALVO_PRIMARIO - TOLERANCIA);
  });

  test(`${route} — nada estoura a horizontal`, async ({ page, viewport }) => {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);

    const largura = viewport!.width;

    const estouro = await page.evaluate((limite) => {
      const raiz = document.documentElement;
      const out: string[] = [];

      /* O documento inteiro primeiro: é o sintoma que a pessoa sente (barra horizontal). */
      if (raiz.scrollWidth > limite + 1) {
        out.push(`documento: scrollWidth ${raiz.scrollWidth}px > ${limite}px`);
      }

      /* Depois o CULPADO, que é o que torna a falha acionável em vez de um enigma. */
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') continue;
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        if (box.right > limite + 1) {
          out.push(
            `${el.tagName.toLowerCase()}[${(el.getAttribute('class') ?? '').slice(0, 40)}] ` +
              `chega a ${box.right.toFixed(0)}px`,
          );
        }
      }
      return [...new Set(out)].slice(0, 12);
    }, largura);

    expect(
      estouro,
      `${route} a ${largura}px: estouro horizontal\n  ${estouro.join('\n  ')}`,
    ).toEqual([]);
  });
}

test.describe('ritmo vertical', () => {
  /* Um viewport basta: o defeito era padding ZERO, não padding pequeno em certa largura. */
  test.skip(({ viewport }) => viewport?.width !== 1280, 'o defeito era zero, não estreito');

  for (const route of PAGE_ROUTES) {
    test(`${route} — cabeçalho e rodapé têm respiro vertical`, async ({ page }) => {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);

      const zerados = await page.evaluate(() => {
        const out: string[] = [];
        for (const seletor of ['header', 'footer']) {
          for (const el of Array.from(document.querySelectorAll(seletor))) {
            const s = getComputedStyle(el);
            const total =
              parseFloat(s.paddingBlockStart) +
              parseFloat(s.paddingBlockEnd) +
              parseFloat(s.marginBlockStart) +
              parseFloat(s.marginBlockEnd);
            /* `min-height` também é respiro: o `<header>` do site usa `min-h-header` em vez de
               padding, e reprovar isso mediria a TÉCNICA em vez do resultado. */
            const minH = parseFloat(s.minHeight) || 0;
            if (total === 0 && minH === 0) out.push(seletor);
          }
        }
        return out;
      });

      expect(zerados, `${route}: sem respiro vertical nenhum: ${zerados.join(', ')}`).toEqual([]);
    });
  }
});
