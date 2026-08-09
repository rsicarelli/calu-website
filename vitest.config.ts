/// <reference types="vitest/config" />

/* Configuração do Vitest.
   ============================================================================
   `getViteConfig` do Astro, e não um config plano do Vitest: ele devolve o Vite
   já resolvido pelo Astro — com o plugin do compilador, os aliases do
   `tsconfig.json` e o que as integrations adicionarem. Sem isso, o primeiro
   `import Componente from '@/components/X.astro'` num teste estoura no parse,
   porque `.astro` não é um formato que o Vite entenda sozinho.

   Um config só, sem `projects`: o ambiente default é `node` (os testes de token
   leem CSS, não precisam de DOM), e o arquivo que precisar de DOM declara
   `// @vitest-environment jsdom` na primeira linha. */

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
  },
});
