/* Playwright — a camada de MEDIÇÃO do projeto.
   ============================================================================
   POR QUE ELE EXISTE. Até a Fase 5 toda trava do repositório era proxy de string sobre HTML
   parseado. `tests/system/_dom.ts` diz isso por extenso ("linkedom não computa CSS... medição real
   de layout exigiria um motor de browser, fora de escopo enquanto não houver CI") e
   `tests/system/a11y.test.ts` diz o mesmo do axe ("sem CSS aplicado, o axe não avalia contraste
   real"). Este arquivo é a redenção dos dois comentários.

   jsdom, que o projeto já tem, não serve aqui — e por dois motivos independentes, cada um fatal
   sozinho: `getBoundingClientRect()` devolve tudo zero (sem layout), e `getComputedStyle` não
   resolve `var()`. O segundo é decisivo neste projeto especificamente, porque TODA cor sai de custom
   property do `@theme`: jsdom devolveria a string `var(--color-ink)`, não uma cor.

   O QUE ELE NÃO É: uma suíte de screenshot. Não há baseline binária, e a decisão não é estética.
   A Fase 4.1 registra que, por meses e em toda máquina atrás do proxy, três dos quatro `woff2`
   serviam HTTP 500 e o site renderizava em Times New Roman. Uma baseline capturada naquele estado
   seria um registro verde e autoritativo do defeito — a mesma família de `Action.test.ts` exigindo
   `border-line`. Métrica não tem esse modo de falha: "altura ≥ 52px" é verdade ou mentira
   independentemente da fonte que carregou.

   SEM `webServer`, e isto foi verificado e não presumido: `astro preview` DAEMONIZA — o comando
   imprime "Preview server running (pid N)" e RETORNA, com o servidor no ar (existe um
   `astro preview stop`). O `webServer` do Playwright interpreta um comando que retorna como
   servidor que morreu. Então o ciclo de vida fica no `Taskfile.yml` (`task test:metrics`), que já
   tinha `preview:stop` para isto.

   SEM `process.env` NESTE ARQUIVO. O `tsconfig.json` inclui o repositório inteiro (o glob por
   extenso não cabe DENTRO de um comentário de bloco: dois asteriscos seguidos de barra fecham o
   próprio comentário — ver a mesma ressalva em `tests/system/_dom.ts`), então o `astro check`
   typechecka este arquivo, e o projeto não instala `@types/node` — é a mesma restrição que faz
   `tests/system/_dom.ts` ler `dist/` por `import.meta.glob` em vez de `node:fs`. É por isso que a
   lista de rotas é literal em `tests/metrics/_routes.ts`, com um teste de deriva
   (`tests/system/routes.test.ts`) cobrando que ela continue igual ao que o build produz. */

import { defineConfig, devices } from '@playwright/test';

/* Três viewports, cada um com um porquê — não "alguns tamanhos".
     320  o piso de reflow que a WCAG 1.4.10 exige, e que `PAGES.md:30` nomeia por extenso.
          Nunca foi verificado no projeto.
     360  o breakpoint de DESENHO do handoff — a largura em que o mockup foi desenhado.
     1280 o desktop do handoff (`--container-page`), onde mora o 2-up de `PAGES.md:42`. */
export default defineConfig({
  testDir: './tests/metrics',
  // `.spec.ts`, não `.test.ts`: o `include` do Vitest cobre `tests/**/*.test.ts`, então o sufixo
  // mantém os dois runners disjuntos sem tocar em `vitest.config.ts`.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    /* O `dist/` servido é estático e local; um traço por falha basta e nada precisa de vídeo. */
    trace: 'retain-on-failure',
    /* SEM `reducedMotion: 'reduce'` AQUI, e a ausência custou uma investigação — vale registrar
       para ninguém "melhorar" o config de volta.

       A ideia parecia boa: acionar a regra de `prefers-reduced-motion` que o `global.css` §7 já
       declara, para medir estado assentado sem injetar CSS que o site não conhece. O efeito foi o
       INVERSO. Aquela regra é a receita padrão, que zera animação com
       `transition-duration: 0.01ms !important` — 0,01ms, não `0s`. Numa propriedade que por padrão
       NÃO transiciona, isso CRIA uma transição onde não havia, e ler o estilo computado no mesmo
       quadro pega o valor INICIAL dela.

       Medido: o anel de foco do CTA principal saía `rgb(255,255,255)` (o `currentColor` do botão)
       na leitura imediata e `rgb(65,74,56)` 600ms depois — com `no-preference`, `transition: all 0s`
       e o valor certo já na primeira leitura. A opção que existia para dar determinismo era a
       ÚNICA fonte de indeterminismo restante, e teria feito a suíte acusar um defeito inexistente
       de anel de foco. (O defeito de anel que a Fase 5 encontrou de verdade é outro, permanente e
       independente de tempo — `data-surface` no próprio controle; ver `Action.astro`.)

       O determinismo de que a medição precisa já vem da raiz certa: `_measure.ts` semeia o tema
       ANTES da primeira pintura, então não existe transição de tema para pegar no meio. */
  },
  projects: [
    {
      name: '320',
      use: { ...devices['Desktop Chrome'], viewport: { width: 320, height: 640 } },
    },
    {
      name: '360',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } },
    },
    {
      name: '1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
});
