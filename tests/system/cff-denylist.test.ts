/* CFF/CREFITO — denylist heurística sobre o texto final construído.
   ============================================================================================
   Regra do projeto (CLAUDE.md "Guardrails", do handoff): proibido depoimento de paciente, foto
   antes/depois, promessa de resultado, superlativo e preço em destaque — inclusive como campo
   opcional de CMS. Conselho de Fisioterapia e Terapia Ocupacional (CFF) e o CREFITO regional
   restringem propaganda de serviço de saúde nesses termos.

   HEURÍSTICA, NÃO SUBSTITUI REVISÃO HUMANA — mesma ressalva já usada no projeto para outras
   checagens por regex (`scripts/check-utilities.mjs`, os testes de contraste em
   `tests/tokens/`): um regex sobre texto corrido pega o padrão ÓBVIO ("R$ 100", "cura garantida")
   e não entende contexto, sinônimo nem paráfrase. Não dispensa quem revisa o conteúdo real da
   clínica antes de publicar (guardrail: "nenhum conteúdo real antes de aprovado com a cliente").

   `document.body.textContent`, não `innerHTML`: o denylist é sobre o que a PESSOA lê, não sobre
   marcação — um atributo `alt`/`title` com a mesma palavra também é conteúdo visível a tecnologia
   assistiva e deveria acionar o mesmo alarme, mas `textContent` já cobre o caso comum (texto
   visível) sem falso positivo de classe/atributo técnico que `innerHTML` traria (ex.: um nome de
   classe CSS que contivesse a palavra "cura" por coincidência). */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

const DENYLIST: RegExp[] = [
  /depoimento/i,
  /antes\s*e?\s*depois/i,
  /melhor\s+da\s+cidade/i,
  /refer[êe]ncia\s+em/i,
  /garantia\s+de\s+(cura|resultado)/i,
  /\bcura\b(?!dor)/i,
  /especialista\s+n[úu]mero\s+1/i,
  /R\$\s*\d/, // preço em destaque
  // Complementos ao conjunto do enunciado — mesmos quatro eixos (depoimento, antes/depois,
  // promessa de resultado, superlativo/preço), padrões óbvios que faltavam:
  /\bo\s+melhor\b/i, // "o melhor pilates", "a melhor fisioterapia" — superlativo genérico
  /\bn[úu]mero\s+1\b/i, // superlativo fora do template "especialista número 1"
  /resultado\s+garantido/i, // promessa de resultado, ordem inversa de "garantia de resultado"
  /elimina\s+(a\s+)?dor/i, // promessa de resultado ("elimina a dor", "elimina dor")
  /\d+%\s+de\s+(melhora|resultado|efic[áa]cia)/i, // estatística de resultado como prova
];

describe('CFF/CREFITO — denylist heurística sobre o texto visível de cada página', () => {
  const pages = distPages();

  it('varredura não está vazia — encontrou páginas com texto para checar', () => {
    expect(pages.length).toBeGreaterThan(0);
    for (const { document } of pages) {
      expect(document.body?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it.each(pages.map(({ file, document }) => ({ file, document })))(
    '$file não contém nenhum padrão do denylist CFF/CREFITO',
    ({ file, document }) => {
      const text = document.body?.textContent ?? '';
      const matches = DENYLIST.map((pattern) => ({ pattern, hit: pattern.exec(text) })).filter(
        (result) => result.hit !== null,
      );

      expect(
        matches,
        `${file}: texto casou com padrão(ões) proibido(s) — ${matches
          .map((m) => `${m.pattern} → "${m.hit?.[0]}"`)
          .join('; ')}`,
      ).toEqual([]);
    },
  );
});
