/* Contratos do accordion — os mesmos de `tests/pages/lab.test.ts`, agora sobre TODA página
   construída.
   ============================================================================================
   POR QUE ELES SAÍRAM DA `/lab`. Os quatro são invariantes do COMPONENTE (`FaqItem`/`FaqGroup`),
   não daquela página: valem onde quer que um `<details>` apareça, e hoje ele aparece em `/` (FAQ
   resumido) e em `/duvidas` (os três grupos). Ficavam cobrados numa página só porque nasceram
   junto da seção que os tornou mensuráveis; `CLAUDE.md` nomeou a promoção como item da Fase 5.

   A cópia da `/lab` FICA — espelho pré-build, mesma justificativa escrita no cabeçalho de
   `lab.test.ts` para rótulo de `<nav>` e dimensão de `<img>`.

   O PRIMEIRO CONTRATO É O QUE MOTIVOU UMA CORREÇÃO NO HANDOFF (Fase 2): `<details><h3><summary>`
   deixa o `<details>` sem `summary` NENHUM — o modelo de conteúdo exige o `<summary>` como
   primeiro filho. O navegador sintetiza o próprio marcador e o texto da pergunta some junto com a
   resposta quando o item está fechado. Invisível no HTML, visível só no navegador; por isso vale
   um teste, e por isso vale que ele rode em toda página.

   Ver a limitação geral em `tests/system/_dom.ts`: aqui não morde, os quatro são estruturais. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

const detalhes = (document: Document): Element[] =>
  Array.from(document.querySelectorAll('details'));

describe('accordion — contratos de `FaqItem`/`FaqGroup` em toda página construída', () => {
  const pages = distPages();

  /* GUARDA DE VARREDURA NÃO-VAZIA. Três dos quatro testes abaixo são do tipo "lista de infratores
     vazia" e passariam em silêncio sobre uma seleção vazia — e diferente do contrato de superfície,
     aqui o alvo é MESMO ausente na maioria das páginas (`/contato`, `/equipe`, `/404` não têm FAQ).
     A guarda por isso é GLOBAL, somando as ocorrências do site inteiro, e não por página: exigir um
     `<details>` em cada página seria falso. `lab.test.ts:253` nunca teve guarda nenhuma; o porte é
     a hora de somá-la. */
  it('varredura não está vazia — encontrou páginas, <details> e grupos de FAQ', () => {
    expect(pages.length).toBeGreaterThan(0);

    const totalDetalhes = pages.reduce((sum, { document }) => sum + detalhes(document).length, 0);
    expect(totalDetalhes, 'nenhum <details> em dist/').toBeGreaterThan(0);

    const totalGrupos = pages.reduce(
      (sum, { document }) => sum + document.querySelectorAll('[data-faq-group]').length,
      0,
    );
    expect(totalGrupos, 'nenhum [data-faq-group] em dist/').toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, todo <summary> é o primeiro filho do seu <details>',
    ({ file, document }) => {
      const offenders = detalhes(document)
        .filter((d) => d.firstElementChild?.tagName.toLowerCase() !== 'summary')
        .map((d) => d.textContent?.trim().slice(0, 40) ?? '(vazio)');

      expect(offenders, `${file}: <details> sem <summary> como primeiro filho`).toEqual([]);
    },
  );

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, cada pergunta é um cabeçalho dentro do <summary>',
    ({ file, document }) => {
      const offenders = detalhes(document)
        .map((d) => d.querySelector('summary'))
        .filter((s) => s !== null && s.querySelector('h2, h3, h4, h5, h6') === null)
        .map((s) => s!.textContent?.trim().slice(0, 40) ?? '(vazio)');

      expect(offenders, `${file}: <summary> sem cabeçalho: ${offenders.join(' | ')}`).toEqual([]);
    },
  );

  /* Sem `name` compartilhado, abrir um item não fecha os outros — quem chega com duas dúvidas quer
     ler as duas. É o oposto do accordion exclusivo, e a diferença é um atributo só. */
  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum <details> é exclusivo (sem atributo `name`)',
    ({ file, document }) => {
      const offenders = detalhes(document)
        .filter((d) => d.hasAttribute('name'))
        .map((d) => d.getAttribute('name')!);

      expect(offenders, `${file}: <details> exclusivo: ${offenders.join(', ')}`).toEqual([]);
    },
  );

  /* Um item aberto por grupo, e não zero: a página não deve abrir vazia, com todas as respostas
     escondidas. O primeiro de cada grupo nasce `open`.

     Seleção por `data-faq-group`, não por prefixo de `id` — prefixo é convenção, atributo é
     contrato. A primeira versão deste teste, na `/lab`, usava `[id^="lab-faq-"]` e pescava junto o
     `-titulo` que o `PageSection` gera para o `aria-labelledby`. */
  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, há exatamente um <details> aberto por grupo de perguntas',
    ({ file, document }) => {
      const offenders = Array.from(document.querySelectorAll('[data-faq-group]'))
        .map((grupo) => ({ grupo, abertos: grupo.querySelectorAll('details[open]').length }))
        .filter(({ abertos }) => abertos !== 1)
        .map(({ grupo, abertos }) => `${grupo.id || '(sem id)'}: ${abertos} aberto(s)`);

      expect(offenders, `${file}: grupo sem exatamente 1 item aberto`).toEqual([]);
    },
  );
});
