/* Contraste REAL, renderizado, nos dois temas.
   ============================================================================================
   O BURACO QUE ESTE ARQUIVO FECHA está escrito, em duas mãos diferentes, dentro do próprio
   repositório:

     `tests/system/a11y.test.ts` — "LIMITE CONHECIDO... sem CSS aplicado, o axe não avalia
     contraste real (`color-contrast` precisa de estilo computado)."

     `tests/system/_dom.ts` — "linkedom faz parsing de HTML, não computa CSS."

   Então "contraste AAA 7:1 nos dois temas", que está na lista de INVIOLÁVEIS do handoff, nunca foi
   verificado como renderizado. Nem uma vez.

   E `tests/tokens/contrast.test.ts` não substitui isto, apesar do nome: ele mede os pares
   DECLARADOS em `tests/tokens/pairs.ts` — uma lista que alguém mantém à mão. Este arquivo mede os
   pares que OCORREM. A diferença não é acadêmica: a Fase 1 registra três bugs de contraste reais
   descobertos só quando a cobertura foi generalizada, e a Fase 0 registra o anel de foco que
   chegou a 1,01:1 sem teste vermelho. Toda vez que a lista foi ampliada, ela estava incompleta.

   ─────────────────────────────────────────────────────────────────────────────────────────────
   OS PISOS são os da WCAG, e a escolha de qual aplicar não é arbitrária:
     · 7:1  (AAA) para texto corrido — é o piso que o handoff declara inviolável.
     · 4,5:1 (AAA para texto grande) a partir de 24px, ou 18,66px em semibold. É a MESMA norma:
       traço maior precisa de menos contraste para a mesma legibilidade.

   O fundo é o do primeiro ancestral OPACO, não o do próprio elemento — ver `_measure.ts`. Medir
   contra `transparent` é como um teste de contraste passa sem medir nada.

   Um viewport basta (o `1280`): cor não depende de largura, e rodar os três multiplicaria por três
   um custo que não compra informação nova. Os DOIS TEMAS, sim, são obrigatórios — a Fase 1 achou
   bug que existia só no escuro. */

import { expect, test } from '@playwright/test';

import { contrast, gotoWithTheme, textSamples } from './_measure';
import { PAGE_ROUTES, THEMES } from './_routes';

const AAA_CORRIDO = 7;
const AAA_GRANDE = 4.5;

/** WCAG: "texto grande" é ≥24px, ou ≥18,66px quando o peso é bold/semibold. */
function pisoDe(fontSize: number, fontWeight: number): number {
  const grande = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 600);
  return grande ? AAA_GRANDE : AAA_CORRIDO;
}

test.describe('contraste renderizado', () => {
  /* Só o viewport largo — ver o cabeçalho. */
  test.skip(({ viewport }) => viewport?.width !== 1280, 'cor não depende de largura');

  for (const route of PAGE_ROUTES) {
    test(`${route} — todo texto atinge o piso da WCAG nos dois temas`, async ({ page }) => {
      const offenders: string[] = [];

      for (const theme of THEMES) {
        /* Uma carga por tema, com o tema semeado antes do primeiro pixel — ver `gotoWithTheme`. */
        await gotoWithTheme(page, route, theme);

        const samples = await textSamples(page);
        expect(samples.length, `${route}: nenhuma folha de texto para medir`).toBeGreaterThan(0);

        for (const s of samples) {
          const piso = pisoDe(s.fontSize, s.fontWeight);
          const razao = contrast(s.color, s.background);
          if (razao < piso) {
            offenders.push(
              `[${theme}] ${s.where} "${s.text}" — ${razao.toFixed(2)}:1, piso ${piso}:1 ` +
                `(${s.color} sobre ${s.background}, ${s.fontSize}px/${s.fontWeight})`,
            );
          }
        }
      }

      /* Deduplicado: o mesmo par de tokens costuma aparecer dezenas de vezes na página, e uma lista
         com trinta cópias da mesma linha esconde o segundo defeito atrás do primeiro. */
      const unicos = [...new Set(offenders)];
      expect(unicos, `${route}: contraste abaixo do piso\n  ${unicos.join('\n  ')}`).toEqual([]);
    });
  }
});
