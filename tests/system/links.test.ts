/* Todo link interno aponta para uma página que existe.
   ============================================================================
   A Fase 4 entrega cinco das oito rotas que `PAGES.md` lista. `/sobre`,
   `/blog` e `/politica-de-privacidade` ficaram FORA de propósito — não foram
   desenhadas. O risco imediato disso é link morto: o handoff tem uma âncora "Sobre
   a clínica" na faixa manifesto e uma linha de privacidade no formulário, e as duas
   apontariam para o nada.

   A decisão foi renderizar as duas como TEXTO, sem link. Este teste é o que
   sustenta a decisão ao longo do tempo — e ele serve nos dois sentidos:

   · hoje, reprova se alguém transformar uma delas em `<a>` antes da página existir;
   · depois, quando `/politica-de-privacidade` for criada, o teste passa a aceitar o
     link — e o comentário em `ContactForm.astro` diz para fazer a troca.

   É um invariante permanente, não um andaime da Fase 4: qualquer rota digitada
   errado (`/servico/` no singular, `/duvida/`) morre aqui em vez de virar um 404
   que só um usuário descobre.

   Só links INTERNOS são verificados. Externo (`https://`, `tel:`, `mailto:`) exige
   rede e é escopo de outro tipo de checagem. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

const pages = distPages();

/* As rotas que o build produziu, na forma como um href as escreveria. Derivadas de
   `dist/`, não escritas à mão: uma lista manual divergiria do build no primeiro
   arquivo novo, e passaria a reprovar link legítimo. */
const builtRoutes = new Set(
  pages.map(({ file }) => {
    const semPrefixo = file.replace(/^.*\/dist/, '');
    /* `dist/servicos/index.html` → `/servicos/`; `dist/index.html` → `/`. */
    return semPrefixo.replace(/index\.html$/, '').replace(/\.html$/, '');
  }),
);

function internalTargets(document: Document): string[] {
  return Array.from(document.querySelectorAll('a[href]'))
    .map((a) => a.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/'))
    .map((href) => href.split('#')[0].split('?')[0])
    .filter((href) => href !== '');
}

describe('links internos', () => {
  it('a varredura não está vazia', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it('o reconhecedor de rotas construídas encontrou as páginas reais', () => {
    /* Guarda contra o modo de falha silencioso deste arquivo: se a derivação de
       rotas quebrasse e o Set viesse vazio, TODO link seria reportado como morto —
       ruído tão grande que a reação natural seria desligar o teste. */
    expect(builtRoutes.has('/')).toBe(true);
    expect(builtRoutes.size).toBeGreaterThan(5);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo href interno resolve para uma página construída',
    ({ file, document }) => {
      const mortos = internalTargets(document).filter((href) => {
        /* Aceita com e sem barra final: o servidor estático resolve os dois, e
           escrever `/servicos` ou `/servicos/` é escolha de quem redige o link. */
        const comBarra = href.endsWith('/') ? href : `${href}/`;
        return !builtRoutes.has(comBarra) && !builtRoutes.has(href);
      });

      expect(
        [...new Set(mortos)],
        `${file}: links internos sem página correspondente: ${[...new Set(mortos)].join(', ')}`,
      ).toEqual([]);
    },
  );

  /* As três rotas fora do escopo da Fase 4. Este teste documenta a decisão no lugar
     onde ela se quebra, e vira redundante (mas ainda verdadeiro) quando elas
     existirem. */
  it.each(['/sobre', '/blog', '/politica-de-privacidade'])(
    'nenhuma página linka para %s, que não foi construída nesta fase',
    (rota) => {
      const ofensores = pages
        .filter(({ document }) => internalTargets(document).some((href) => href.startsWith(rota)))
        .map(({ file }) => file);

      expect(ofensores, `páginas com link para ${rota}: ${ofensores.join(', ')}`).toEqual([]);
    },
  );
});
