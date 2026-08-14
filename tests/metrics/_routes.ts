/* A lista de rotas que a medição percorre.
   ============================================================================
   POR QUE ELA É LITERAL, e não derivada de `dist/`. Um spec do Playwright não consegue enumerar o
   build: o `tsconfig.json` inclui o repositório inteiro (o glob recursivo por extenso não cabe
   DENTRO de um comentário de bloco — dois asteriscos seguidos de barra fecham o próprio comentário;
   é a mesma ressalva que `tests/system/_dom.ts` já carrega), então o `astro check` typechecka este
   diretório, e o projeto não instala `@types/node` — um `import fs from 'node:fs'` reprovaria o
   gate. É a MESMA restrição, pelo MESMO motivo, que faz `_dom.ts` ler `dist/` por
   `import.meta.glob` com `?raw`; só que `import.meta.glob` é do Vite, e o Playwright não roda
   dentro dele.

   O CUSTO DE UMA LISTA LITERAL É DERIVA, e por isso ela não fica sozinha: `tests/system/routes.test.ts`
   compara esta lista com o que o build de fato produz, dos dois lados. Adicione uma rota e esqueça
   de listá-la aqui, ou remova uma e deixe a linha para trás, e a suíte do Vitest fica vermelha
   antes de a medição sequer rodar. Lista congelada que ninguém cobra é como um varredor de sistema
   nasce mentindo — a Fase 4.1 tem três exemplos disso. */

/** Toda rota que o build publica. Espelhada por `tests/system/routes.test.ts`. */
export const ROUTES = [
  '/',
  '/contato/',
  '/duvidas/',
  '/equipe/',
  '/servicos/',
  '/servicos/fisioterapia-ortopedica/',
  '/servicos/fisioterapia-pelvica/',
  '/servicos/pilates-clinico/',
  '/servicos/pilates-solo/',
  '/servicos/reabilitacao-pos-operatoria/',
  '/lab/',
  '/404.html',
] as const;

/** As seis rotas reais mais a `/lab` — tudo menos a página de erro, que não é navegada. */
export const PAGE_ROUTES = ROUTES.filter((route) => route !== '/404.html');

/** Os dois temas. O tema é `data-theme` no `<html>`; ver `BaseLayout.astro`. */
export const THEMES = ['light', 'dark'] as const;
