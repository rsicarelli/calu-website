/* Hierarquia de cabeçalhos em todas as páginas construídas.
   ============================================================================
   Regra transversal de `PAGES.md`, e até a Fase 4 sem cobertura nenhuma:

     "Um `<h1>` por página, descrevendo a página."
     "Hierarquia de cabeçalhos sem pular nível: h1 → h2 → h3, nunca h1 → h3 direto
      porque o h2 'ficou feio'."

   Por que isso precisa de teste de SISTEMA e não de componente: nenhum componente
   sozinho pode errar. O `PageHeader` emite um `h1`; o `PageSection` emite um `h2`;
   o `FaqItem` emite um `h3`. O pulo de nível nasce da COMPOSIÇÃO — uma seção que
   entra na página sem cabeçalho e cujos filhos são `h3`, ou um bloco reaproveitado
   num contexto um nível mais fundo do que o previsto. Só a página montada mostra.

   A varredura é recursiva sobre todo HTML de `dist`, então página nova entra
   sozinha, sem editar este arquivo.

   `/404` e `/lab` NÃO são exceção aqui. A `/lab` é o caso mais exigente do
   projeto — doze seções, cabeçalhos deslocados um nível — e é justamente por isso
   que vale medi-la: se a regra vale lá, vale em qualquer página real. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

const pages = distPages();

describe('hierarquia de cabeçalhos', () => {
  it('a varredura não está vazia', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, existe exatamente um <h1>',
    ({ file, document }) => {
      const h1s = Array.from(document.querySelectorAll('h1')).map(
        (h) => h.textContent?.trim() ?? '',
      );

      expect(
        h1s,
        `${file}: esperado 1 <h1>, encontrados ${h1s.length} — ${h1s.join(' | ')}`,
      ).toHaveLength(1);
    },
  );

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, o <h1> não está vazio',
    ({ file, document }) => {
      const h1 = document.querySelector('h1');

      expect(h1?.textContent?.trim() ?? '', `${file}: <h1> sem texto`).not.toBe('');
    },
  );

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum cabeçalho pula nível',
    ({ file, document }) => {
      const niveis = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
        nivel: Number(h.tagName.slice(1)),
        texto: h.textContent?.trim().slice(0, 40) ?? '',
      }));

      /* Descer mais de um nível de uma vez é o defeito; SUBIR qualquer número de
         níveis é normal (fim de uma subárvore e começo de outra). */
      const pulos: string[] = [];
      for (let i = 1; i < niveis.length; i += 1) {
        const anterior = niveis[i - 1];
        const atual = niveis[i];
        if (atual.nivel > anterior.nivel + 1) {
          pulos.push(`h${anterior.nivel} "${anterior.texto}" → h${atual.nivel} "${atual.texto}"`);
        }
      }

      expect(pulos, `${file}: pulos de nível — ${pulos.join(' ; ')}`).toEqual([]);
    },
  );

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, o primeiro cabeçalho do documento é o <h1>',
    ({ file, document }) => {
      const primeiro = document.querySelector('h1, h2, h3, h4, h5, h6');

      expect(primeiro?.tagName, `${file}: o documento começa com ${primeiro?.tagName}`).toBe('H1');
    },
  );
});
