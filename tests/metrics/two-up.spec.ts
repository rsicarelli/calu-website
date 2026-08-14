/* O 2-up de desktop da Home, medido em geometria.
   ============================================================================================
   `PAGES.md:42` é a única linha de layout de desktop da Home, e duas das quatro coisas que ela pede
   ficaram sem construir até a Fase 5: "Para a família" e "Estrutura e acesso" lado a lado, e FAQ e
   mapa dividindo a linha.

   POR QUE UM TESTE DE MEDIÇÃO, E NÃO UM DE STRING. O caminho barato seria varrer o HTML atrás de
   `md:grid-cols-2`. Isso provaria que a CLASSE está escrita — a mesma família de prova que
   `tests/system/touch-targets.test.ts` faz e admite fazer, e que a Fase 4.1 mostrou não bastar: a
   classe presente com o gutter duplicado, ou dentro de um contêiner que não é grade, continua
   "passando" enquanto a tela mostra outra coisa.

   Aqui a pergunta é geométrica e não tem como ser respondida por engano: no desktop as duas seções
   COMPARTILHAM a mesma linha (mesmo topo, `left` diferente); no celular elas EMPILHAM (topos
   diferentes, mesmo `left`). É o resultado, não a técnica — trocar grade por flex, ou os nomes das
   utilities, não quebra nada disto, e é assim que deve ser. */

import { expect, test } from '@playwright/test';

/* Os dois pares de `PAGES.md:42`. `id` porque é o que `PageSection` garante e o que sobrevive a
   qualquer mudança de estilo. */
const PARES = [
  { nome: 'família + acesso', a: '#familia', b: '#acesso' },
  { nome: 'FAQ + mapa', a: '#duvidas', b: '#onde-estamos' },
] as const;

/* Um par de caixas encostado no mesmo topo. Tolerância de 2px: `align-items: start` alinha o topo
   da caixa, e subpixel de layout não é desalinhamento. */
const TOLERANCIA = 2;

for (const par of PARES) {
  test(`${par.nome} — dividem a linha no desktop e empilham no estreito`, async ({
    page,
    viewport,
  }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const a = await page.locator(par.a).boundingBox();
    const b = await page.locator(par.b).boundingBox();

    expect(a, `${par.a} não existe na Home`).not.toBeNull();
    expect(b, `${par.b} não existe na Home`).not.toBeNull();

    const largura = viewport!.width;

    if (largura >= 900) {
      /* 900px é o breakpoint `md` do projeto (`--breakpoint-md`, global.css). */
      expect(
        Math.abs(a!.y - b!.y),
        `${par.nome} a ${largura}px: deviam dividir a linha, mas os topos são ${a!.y} e ${b!.y}`,
      ).toBeLessThanOrEqual(TOLERANCIA);

      expect(
        a!.x,
        `${par.nome} a ${largura}px: dividem a linha mas começam na mesma coluna`,
      ).toBeLessThan(b!.x);
    } else {
      expect(
        a!.x,
        `${par.nome} a ${largura}px: deviam empilhar, mas começam em colunas diferentes`,
      ).toBeCloseTo(b!.x, 0);

      expect(
        b!.y,
        `${par.nome} a ${largura}px: deviam empilhar, mas dividem a linha`,
      ).toBeGreaterThan(a!.y);
    }
  });
}

/* O GUTTER APLICADO UMA VEZ, que é a razão de `width="none"` existir. Duas seções normais dentro de
   uma grade externa aplicariam `padding-inline` em CADA coluna, e o conteúdo encolheria sem motivo
   aparente. Medindo: a coluna esquerda começa exatamente onde o trilho começa. */
test('o 2-up não duplica o gutter', async ({ page, viewport }) => {
  test.skip(viewport!.width < 900, 'só há duas colunas a partir do breakpoint md');

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  for (const par of PARES) {
    const inicio = await page.evaluate((sel) => {
      const secao = document.querySelector(sel);
      if (!secao) return null;
      /* O trilho é o ancestral que carrega a utility de largura. */
      const trilho = secao.closest('.container-page, .container-measure');
      if (!trilho) return null;

      /* O CABEÇALHO, e não a caixa da `<section>`. A `<section>` é a raiz e ocupa a coluna inteira
         com ou sem gutter duplicado — medi-la não detectaria nada (verificado: a primeira versão
         deste teste media a `<section>` e passava mesmo com o gutter duplicado de verdade). O que
         se desloca quando um `Container` extra entra no meio é o CONTEÚDO. */
      const cabecalho = secao.querySelector('h2, h3, h4');
      if (!cabecalho) return null;

      const t = trilho.getBoundingClientRect();
      const cs = getComputedStyle(trilho);
      return {
        conteudo: t.left + parseFloat(cs.paddingLeft),
        texto: cabecalho.getBoundingClientRect().left,
      };
    }, par.a);

    expect(inicio, `${par.a}: sem trilho ancestral ou sem cabeçalho`).not.toBeNull();
    expect(
      inicio!.texto,
      `${par.nome}: o conteúdo da coluna começa em ${inicio!.texto}px, mas o trilho abre em ` +
        `${inicio!.conteudo}px — gutter aplicado duas vezes?`,
    ).toBeCloseTo(inicio!.conteudo, 0);
  }
});
