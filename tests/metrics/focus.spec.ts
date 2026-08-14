/* O anel de foco, medido — o defeito de assinatura deste projeto.
   ============================================================================================
   O HISTÓRICO, do próprio `CLAUDE.md`: `--color-focus-ring` chegou a **1,01:1** sobre
   `surface-brand` no tema claro e SHIPOU, "sem teste vermelho". A Fase 1 chamou a lacuna de
   "checagem que parece cobertura e não é" e generalizou o contrato de contraste dos tokens. Mas
   nem isso mede o anel RENDERIZADO: mede o par declarado.

   E o mecanismo que corrige o anel dentro de fundo escuro — `data-surface` reescopando
   `--color-focus-ring` (`global.css` §6) — é hoje cobrado por PRESENÇA DE ATRIBUTO
   (`tests/system/surfaces.test.ts`, promovido da `/lab` nesta mesma fase). Presença de atributo
   não é contraste: um `data-surface` escrito no elemento errado, ou um token reescopado para o
   valor errado, passa naquele teste e continua invisível na tela.

   Aqui o foco vai de verdade em cada controle e o anel é medido: existe? tem espessura? contrasta
   com o que está ATRÁS dele? É a única checagem do repositório que fecha o laço.

   O SKIP LINK entra por um segundo motivo: `_measure.ts` o dispensa do alvo de 52px porque ele mede
   1px enquanto ninguém o focou. A dispensa só é honesta se alguém cobrar o tamanho no estado em que
   ele aparece — e é este arquivo.

   ─────────────────────────────────────────────────────────────────────────────────────────────
   TAB DE VERDADE, e não `element.focus()` — a primeira versão disto usava foco programático e
   relatou "sem anel de foco" em TODO controle do site, o que era mentira. O anel está em
   `:focus-visible` (`global.css` §6), e essa pseudoclasse existe justamente para separar foco de
   TECLADO de foco de mouse ou de script: `.focus()` chamado por JS não a satisfaz para botão nem
   para link. O teste teria "achado" um defeito universal inexistente e, pior, teria sido
   silenciado por alguém trocando o seletor do CSS para `:focus` — piorando o site para agradar o
   teste.

   Percorrer com `Tab` é o que a pessoa faz, é o que aciona `:focus-visible`, e de quebra mede a
   ORDEM DE FOCO real em vez da ordem do documento. */

import { expect, test } from '@playwright/test';

import { contrast } from './_measure';
import { PAGE_ROUTES } from './_routes';

/* WCAG 2.4.11/1.4.11: indicador de foco precisa de 3:1 contra o que ele separa. O projeto declara
   3px de anel sólido (`global.css` §6, `outline: 3px solid`). */
const CONTRASTE_MINIMO = 3;
const ESPESSURA_MINIMA = 3;

/* Um viewport basta: anel de foco é cor e espessura, nenhum dos dois muda com a largura. */
test.describe('anel de foco', () => {
  test.skip(({ viewport }) => viewport?.width !== 1280, 'anel não depende de largura');

  for (const route of PAGE_ROUTES) {
    test(`${route} — todo controle recebe um anel de foco visível e contrastante`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);

      type Medida = {
        where: string;
        text: string;
        style: string;
        width: number;
        color: string;
        behind: string;
      };

      const medidas: Medida[] = [];
      const vistos = new Set<string>();

      /* Teto de segurança: a `/lab` tem muito controle, e um `Tab` que nunca sai do lugar (armadilha
         de foco) travaria o teste em vez de reprová-lo. */
      for (let i = 0; i < 400; i += 1) {
        await page.keyboard.press('Tab');

        const m = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;

          const backdrop = (node: Element | null): string => {
            let n = node;
            while (n) {
              const bg = getComputedStyle(n).backgroundColor;
              const alpha = bg.startsWith('rgba') ? Number(bg.match(/[\d.]+/g)?.[3] ?? 1) : 1;
              if (bg !== 'transparent' && alpha > 0.99) return bg;
              n = n.parentElement;
            }
            return getComputedStyle(document.body).backgroundColor;
          };

          const cs = getComputedStyle(el);
          return {
            where: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
            text: (el.textContent ?? '').trim().slice(0, 30),
            style: cs.outlineStyle,
            width: parseFloat(cs.outlineWidth) || 0,
            color: cs.outlineColor,
            /* O fundo atrás do anel é o do ANCESTRAL: o anel é desenhado FORA da caixa do
               controle (`outline`, não `border`), então é contra o que está em volta que ele
               precisa contrastar — e é exatamente por isso que `data-surface` existe. */
            behind: backdrop(el.parentElement),
          };
        });

        /* Voltou para o navegador (fim do ciclo) ou repetiu um controle já medido: acabou. */
        if (m === null) break;
        const chave = `${m.where}|${m.text}`;
        if (vistos.has(chave)) break;
        vistos.add(chave);
        medidas.push(m);
      }

      expect(medidas.length, `${route}: o Tab não alcançou controle nenhum`).toBeGreaterThan(0);

      const offenders: string[] = [];
      for (const m of medidas) {
        if (m.style === 'none' || m.width === 0) {
          offenders.push(`${m.where} "${m.text}" — sem anel de foco`);
          continue;
        }
        if (m.width < ESPESSURA_MINIMA) {
          offenders.push(
            `${m.where} "${m.text}" — anel de ${m.width}px, mínimo ${ESPESSURA_MINIMA}`,
          );
          continue;
        }
        const razao = contrast(m.color, m.behind);
        if (razao < CONTRASTE_MINIMO) {
          offenders.push(
            `${m.where} "${m.text}" — anel a ${razao.toFixed(2)}:1 ` +
              `(${m.color} sobre ${m.behind}), mínimo ${CONTRASTE_MINIMO}:1`,
          );
        }
      }

      const unicos = [...new Set(offenders)];
      expect(unicos, `${route}: anel de foco\n  ${unicos.join('\n  ')}`).toEqual([]);
    });
  }
});

test.describe('skip link', () => {
  test.skip(({ viewport }) => viewport?.width !== 1280, 'o link é o mesmo em toda largura');

  for (const route of PAGE_ROUTES) {
    test(`${route} — o skip link aparece no foco, com alvo cheio, e leva ao <main>`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);

      /* Primeiro Tab da página: é essa a promessa do padrão — antes de qualquer outra coisa. */
      await page.keyboard.press('Tab');

      const foco = page.locator('.skip-link');
      await expect(foco, `${route}: o skip link não é o primeiro alvo do Tab`).toBeFocused();

      const box = await foco.boundingBox();
      expect(box, `${route}: o skip link não tem caixa quando focado`).not.toBeNull();
      /* 52px é a régua do projeto e vale aqui pela mesma razão que vale em qualquer controle: no
         foco ele é um controle de verdade. É a metade que `_measure.ts` não pode medir. */
      expect(
        box!.height,
        `${route}: o skip link focado mede ${box!.height.toFixed(1)}px, piso 52px`,
      ).toBeGreaterThanOrEqual(51.5);

      /* E ele precisa LEVAR a algum lugar: um skip link que aponta para um id inexistente é pior
         que nenhum, porque consome o primeiro Tab e não entrega nada. */
      const destino = await foco.getAttribute('href');
      expect(destino, `${route}: skip link sem href`).toMatch(/^#./);
      const alvo = page.locator(destino!);
      await expect(
        alvo,
        `${route}: o skip link aponta para ${destino}, que não existe`,
      ).toHaveCount(1);
    });
  }
});
