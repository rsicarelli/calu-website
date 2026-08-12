/// <reference types="vitest/config" />

/* Configuração do Vitest.
   ============================================================================
   `getViteConfig` do Astro, e não um config plano do Vitest: ele devolve o Vite
   já resolvido pelo Astro — com o plugin do compilador, os aliases do
   `tsconfig.json` e o que as integrations adicionarem. Sem isso, o primeiro
   `import Componente from '@/components/X.astro'` num teste estoura no parse,
   porque `.astro` não é um formato que o Vite entenda sozinho.

   Um config só, sem `projects`: o ambiente é `node` para TODOS os arquivos, e é
   assim de propósito. O arquivo que precisa de DOM constrói o seu à mão, com
   `new JSDOM(...)` sobre o HTML que o `experimental_AstroContainer` renderizou —
   nunca pela diretiva de ambiente por arquivo do Vitest. O motivo está escrito
   por extenso em cada teste de componente: essa diretiva roda o arquivo dentro do
   Environment "client" do Vite, onde o Astro entrega deliberadamente um stub no
   lugar da factory do componente, e o Container falha com `NoMatchingRenderer`
   para QUALQUER componente. */

import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Sem globals: `describe`/`it`/`expect` são importados de 'vitest' em cada arquivo,
    // o que mantém o `astro check` honesto sem precisar de tipos ambientes.
    globals: false,
    // Por padrão o Vitest devolve string vazia para QUALQUER id que case com `.css`, e o
    // `?raw` do parser de tokens cai nessa rede — o teste passaria a ler "" em silêncio.
    // A exceção é só para o `?raw`: import de CSS de verdade continua neutralizado, que é o
    // comportamento certo em teste (e evita compilar o Tailwind inteiro a cada suíte).
    css: { include: [/\.css\?raw/] },
    // O default do Vitest é 5s, e o axe-core sobre um documento INTEIRO passa perto
    // disso: a `/lab` sozinha leva ~4s quando roda isolada, e estoura quando os 31
    // arquivos da suíte disputam CPU. O sintoma é uma falha por timeout que não
    // corresponde a violação nenhuma — ruído que ensina a suíte a mentir. A Fase 4
    // multiplica esses varredores (uma por página real), então o teto sobe aqui, uma
    // vez, em vez de virar argumento de `it` espalhado por arquivo.
    testTimeout: 30_000,
  },
});
