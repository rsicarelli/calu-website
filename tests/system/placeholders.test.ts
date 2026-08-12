/* Inventário do dado pessoal ainda ausente, no site construído.
   ============================================================================
   A Fase 4 escreve prosa de verdade e deixa a IDENTIDADE (nome de quem atende,
   número CREFITO) como marcador declarado. Este teste existe para que essa escolha
   continue visível em vez de virar hábito.

   Ele faz duas coisas, e a segunda é a mais importante:

   1. TRAVA o que não pode acontecer — marcador vazando para onde deveria haver
      prosa, ou aparecendo em `<title>`, `description` e JSON-LD, que é onde ele
      sairia do site para o Google.
   2. IMPRIME o inventário do que ainda é marcador. Não falha por isso: é relatório,
      e é a checklist da troca pelo dado real. Um teste que reprovasse enquanto
      houvesse marcador deixaria a suíte vermelha por meses e ensinaria a ignorá-la.

   Quando a cliente aprovar os dados, a troca acontece em `src/lib/placeholders.ts` e
   este inventário esvazia sozinho. */

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { findPlaceholders, PLACEHOLDER } from '@/lib/placeholders';

import { distPages } from './_dom';

const pages = distPages();

/* O texto que uma PESSOA lê, sem `<script>` nem `<style>`.
   `document.body.textContent` inclui o corpo dos scripts inline, e o site tem
   vários (tema, menu, accordion, formulário). O código deles é cheio de seletor
   entre colchetes — `[data-theme-toggle]`, `[name="site"]` —, que o reconhecedor de
   marcador lê como dado ausente. Sem esta limpeza a varredura reporta treze
   marcadores falsos e o inventário, que é o produto do teste, vira ruído. */
function readableText(document: Document): string {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style, template').forEach((el) => el.remove());
  return clone.textContent ?? '';
}

describe('marcadores de dado ausente', () => {
  /* O reconhecedor tem regressão própria, pelo mesmo motivo que `cls.test.ts` e
     `typography.test.ts` têm: lógica de extração dentro de um teste é código não
     testado varrendo código testado, e quando erra, erra em silêncio. */
  it('a limpeza remove script e style, e preserva o texto visível', () => {
    const { document } = parseHTML(
      '<html><body><p>Atende com [Nome da profissional]</p>' +
        '<script>document.querySelector("[data-theme-toggle]")</script>' +
        '<style>[hidden]{display:none}</style></body></html>',
    );

    const texto = readableText(document as unknown as Document);

    expect(texto).toContain('[Nome da profissional]');
    expect(texto).not.toContain('data-theme-toggle');
    expect(texto).not.toContain('hidden');
  });

  it('a varredura não está vazia', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  /* Relatório, não trava. Roda sempre e escreve o que falta. */
  it('inventário do que ainda é marcador', () => {
    const inventario = pages
      .map(({ file, document }) => ({
        file,
        marcadores: [...new Set(findPlaceholders(readableText(document)))],
      }))
      .filter(({ marcadores }) => marcadores.length > 0);

    const linhas = inventario.map(({ file, marcadores }) => `  ${file}: ${marcadores.join(', ')}`);
    console.info(
      linhas.length > 0
        ? `Dado pessoal ainda ausente (troque em src/lib/placeholders.ts):\n${linhas.join('\n')}`
        : 'Nenhum marcador restante — todo dado pessoal foi preenchido.',
    );

    expect(Array.isArray(inventario)).toBe(true);
  });

  /* Se o marcador aparece no `<title>` ou na meta description, ele sai do site: vai
     para a aba do navegador, para o resultado de busca e para o card de
     compartilhamento. É o único lugar onde marcador é defeito, não pendência. */
  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum marcador vaza para title ou description',
    ({ file, document }) => {
      const title = document.querySelector('title')?.textContent ?? '';
      const description =
        document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
      const og = Array.from(
        document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]'),
      )
        .map((m) => m.getAttribute('content') ?? '')
        .join(' ');

      const vazamentos = findPlaceholders(`${title} ${description} ${og}`);

      expect(vazamentos, `${file}: marcador em metadado: ${vazamentos.join(', ')}`).toEqual([]);
    },
  );

  /* A varredura aqui é sobre os VALORES do JSON, não sobre o texto serializado.
     Serializado, um array vira `["Mo-Fr 07:00-20:00","Sa 08:00-12:00"]` — e os
     colchetes da própria sintaxe do JSON casam com o padrão de marcador. Medir o
     texto cru reportaria `openingHours` como dado ausente em toda build. */
  function stringValues(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(stringValues);
    if (value && typeof value === 'object') return Object.values(value).flatMap(stringValues);
    return [];
  }

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    'em $file, nenhum marcador vaza para o JSON-LD',
    ({ file, document }) => {
      const valores = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).flatMap((s) => stringValues(JSON.parse(s.textContent ?? '{}')));

      const vazamentos = valores.flatMap(findPlaceholders);

      expect(vazamentos, `${file}: marcador no JSON-LD: ${vazamentos.join(', ')}`).toEqual([]);
    },
  );

  /* Todo marcador encontrado tem de ser um dos REGISTRADOS. Um marcador escrito à
     mão numa entrada de conteúdo — `[preencher depois]`, `[TODO]` — passaria pela
     varredura acima como se fosse deliberado. */
  it('todo marcador no site está registrado em PLACEHOLDER', () => {
    const registrados = new Set(Object.values(PLACEHOLDER).flatMap((v) => findPlaceholders(v)));

    const desconhecidos = [
      ...new Set(pages.flatMap(({ document }) => findPlaceholders(readableText(document)))),
    ].filter((marcador) => !registrados.has(marcador));

    expect(
      desconhecidos,
      `marcadores não registrados em src/lib/placeholders.ts: ${desconhecidos.join(', ')}`,
    ).toEqual([]);
  });
});
