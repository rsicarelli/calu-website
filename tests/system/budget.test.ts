/* Orçamento do build — o que o navegador precisa baixar antes de a página existir.
   ============================================================================================
   "Core Web Vitals verdes são REQUISITO, não meta" é restrição firme do `CLAUDE.md`, com o motivo
   escrito: público majoritariamente mobile, provavelmente em rede móvel. Até a Fase 5 nada media o
   peso do que é servido.

   POR QUE AQUI E NÃO EM `tests/metrics/`: nenhuma destas perguntas precisa de navegador. São
   arquivos em `dist/`, e Vitest responde em milissegundos — subir Chromium para pesar um `.css`
   seria custo sem informação. `tests/system/typography.test.ts` já lê o CSS construído por este
   mesmo caminho.

   E POR QUE NÃO LIGHTHOUSE, que é a resposta óbvia: pontuação de Lighthouse é não-determinística
   num runner compartilhado. Uma trava que muda de resposta sem o site mudar acaba ignorada, ou
   ajustada até não significar nada — e este repositório já foi mordido três vezes por checagem
   que parecia cobertura e não era. Byte é byte.

   ─────────────────────────────────────────────────────────────────────────────────────────────
   OS TETOS DE BYTE SÃO GENEROSOS DE PROPÓSITO, e isso é uma decisão, não descuido. Nenhum defeito
   conhecido motiva um número apertado, e um teto justo demais viraria ruído a cada token novo —
   outra forma de `border-line`. O que eles pegam é a CLASSE de acidente que dobra o peso sem
   ninguém notar: uma fonte a mais, um bundle de framework, um CSS que descolou. */

import { describe, expect, it } from 'vitest';

/* `?raw` (Vite) e não `node:fs` — o projeto não tem `@types/node` e o `astro check` reprovaria o
   import do builtin. Mesmo padrão de `tests/system/_dom.ts` e `tests/tokens/parse.ts`. */
const CSS = import.meta.glob('../../dist/**/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const JS = import.meta.glob('../../dist/**/*.js', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const FONTS = import.meta.glob('../../dist/**/*.woff2', {
  query: '?url',
  import: 'default',
  eager: true,
});
const PAGES = import.meta.glob('../../dist/**/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/* Teto do CSS somado do site. Hoje ele tem ~27KB numa folha só; 80KB dá espaço de sobra para a
   paleta e os componentes crescerem, e ainda reprova se alguém plugar um framework de CSS. */
const TETO_CSS = 80 * 1024;

/* Zero bundle de framework. O projeto é "zero JS de framework" por decisão registrada; o JS que
   existe (tema, menu, accordion) é `<script>` inline, hospedado pelo Astro. Um `.js` em `dist/`
   pesando de verdade significa que algo entrou sem passar pela decisão. */
const TETO_JS = 16 * 1024;

const bytes = (s: unknown): number =>
  typeof s === 'string' ? new TextEncoder().encode(s).length : 0;

describe('orçamento do build', () => {
  it('varredura não está vazia — o build produziu CSS e páginas', () => {
    expect(Object.keys(CSS).length, 'nenhum .css em dist/ — rode `pnpm build`').toBeGreaterThan(0);
    expect(Object.keys(PAGES).length, 'nenhum .html em dist/').toBeGreaterThan(0);
  });

  it(`o CSS somado cabe em ${TETO_CSS / 1024}KB`, () => {
    const total = Object.values(CSS).reduce<number>((sum, src) => sum + bytes(src), 0);
    const detalhe = Object.entries(CSS)
      .map(([f, src]) => `${f}: ${(bytes(src) / 1024).toFixed(1)}KB`)
      .join(', ');

    expect(total, `CSS total ${(total / 1024).toFixed(1)}KB — ${detalhe}`).toBeLessThanOrEqual(
      TETO_CSS,
    );
  });

  it(`o JS somado cabe em ${TETO_JS / 1024}KB — zero framework`, () => {
    const total = Object.values(JS).reduce<number>((sum, src) => sum + bytes(src), 0);

    expect(
      total,
      `JS total ${(total / 1024).toFixed(1)}KB em ${Object.keys(JS).length} arquivo(s) — ` +
        'o projeto é zero-JS de framework por decisão registrada',
    ).toBeLessThanOrEqual(TETO_JS);
  });

  /* EXATAMENTE DUAS FONTES, e este é o teste que mais se paga do arquivo.
     O `README.md` ensina a conferir isto NA MÃO ("ls .astro/fonts/ — devem existir exatamente 2
     arquivos"), e a receita manual existe por causa do bug mais caro da história do projeto: por
     meses, atrás do proxy, três dos quatro woff2 serviam 0 byte e o site renderizava em Times New
     Roman sem erro visível. Receita manual só roda quando alguém lembra. Esta roda sempre.

     Duas, porque `astro.config.mjs` declara UMA família com os subsets `latin` e `latin-ext`, um
     estilo (`normal`) e um intervalo de peso variável (`400 600`). Uma terceira significa peso ou
     estilo novo entrando de contrabando — e cada uma é um download a mais numa rede móvel. */
  it('o build serve exatamente 2 arquivos de fonte', () => {
    const arquivos = Object.keys(FONTS);

    expect(
      arquivos.length,
      `esperado 2 woff2 (latin + latin-ext de uma família só), encontrado ${arquivos.length}: ` +
        arquivos.join(', '),
    ).toBe(2);
  });

  /* Nenhuma origem externa no `<head>`: CDN de fonte, script de analytics ou folha remota são
     requisição bloqueante numa rede móvel, e a fonte é auto-hospedada justamente para não haver
     nenhuma. Link de conteúdo (`wa.me`, o canonical) está no corpo ou é `<link rel=canonical>`, e
     nenhum dos dois baixa nada. */
  it('nenhuma página carrega recurso de origem externa', () => {
    const CARREGA = /<(?:script|link)\b[^>]*?(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/gi;

    const offenders: string[] = [];
    for (const [file, src] of Object.entries(PAGES)) {
      if (typeof src !== 'string') continue;
      const head = src.slice(0, src.indexOf('</head>'));
      for (const m of head.matchAll(CARREGA)) {
        const tag = m[0];
        /* `rel="canonical"`/`alternate` apontam para o próprio site e não baixam nada. */
        if (/rel=["'](?:canonical|alternate)["']/i.test(tag)) continue;
        offenders.push(`${file}: ${m[1]}`);
      }
    }

    expect(offenders, `recurso externo no <head>: ${offenders.join(', ')}`).toEqual([]);
  });
});
