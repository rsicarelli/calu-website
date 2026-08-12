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
  /* Acrescentados na Fase 4, quando passou a existir corpus de verdade para varrer.
     Até aqui o denylist rodava sobre uma Home placeholder e a `/lab`, cujo texto é
     ilustrativo; os padrões abaixo são os que a copy de uma clínica de fato tenta
     usar, e que nenhum dos anteriores pegava. */
  /\bgarant(imos|e|ido|ida)\b/i, // promessa em qualquer conjugação, sem "resultado" junto
  /* Sem `\b` no fim: `ê` não é caractere de palavra para o `\b` do JS (que é ASCII),
     então `voc[êe]\b` NUNCA casa com "você" seguido de espaço. O bloco de regressão
     abaixo pegou isso — é a mesma família do regex de `aspect-ratio` da Fase 2. */
  /\bem\s+\d+\s+sess[õo]es\s+voc[êe]/i, // prazo prometido ("em 10 sessões você volta a…")
  /\bsem\s+dor\s+em\s+\d/i, // promessa com prazo ("sem dor em 3 semanas")
  /\b(fica|ficar[áa]|vai\s+ficar)\s+curad[oa]\b/i, // promessa de cura, fora do substantivo
  /\baprovad[oa]\s+por\b/i, // endosso de terceiro como prova
  /\b\d+\s+(pacientes|clientes)\s+(atendidos|satisfeitos)/i, // prova social numérica
  /\bapenas\s+R\$\s*\d/i, // preço apresentado como oferta
  /* `R$` é OBRIGATÓRIO aqui. Sem ele o padrão casava "a partir de 900px" na galeria de
     breakpoints da `/lab` — um falso positivo que teria custado a confiança no gate. */
  /\ba\s+partir\s+de\s+R\$\s*\d/i, // preço "a partir de"
  /\b(promo[çc][ãa]o|desconto|pacote\s+promocional)\b/i, // preço em destaque por outro nome
  /\bresultado\s+(r[áa]pido|imediato|comprovado)\b/i, // promessa de resultado
  /\b(100|cem)\s*%\s*(de\s+)?(sucesso|garantia)/i, // garantia absoluta
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

/* Regressão do próprio reconhecedor, sem ler `dist/`.
   ============================================================================================
   Mesma disciplina de `cls.test.ts` e `typography.test.ts`: quando um teste carrega a própria
   lógica de detecção, essa lógica é código não testado varrendo código testado. Um denylist que
   deixou de casar por um erro de escapamento continua VERDE para sempre — a varredura passa, e o
   verde significa "não encontrei", que é indistinguível de "não sei procurar".

   Foi exatamente esse o defeito do regex de `aspect-ratio` fechado na Fase 2: ele aceitava
   `aspect-video` e recusava as cinco proporções fracionárias do handoff, e nada ficou vermelho. */
describe('CFF/CREFITO — regressão do denylist', () => {
  const proibidos = [
    'Depoimento de quem já passou por aqui',
    'Veja o antes e depois da Dona Maria',
    'A melhor da cidade em fisioterapia',
    'Somos referência em reabilitação',
    'Com garantia de resultado',
    'Sessão por R$ 150',
    'O melhor pilates da região',
    'Resultado garantido em poucas semanas',
    'Elimina a dor logo na primeira sessão',
    '90% de melhora nos casos atendidos',
    'A gente garante que a dor passa',
    'Em 10 sessões você volta a caminhar',
    'Sem dor em 3 semanas',
    'Você vai ficar curado',
    'Aprovado por especialistas',
    '500 pacientes atendidos',
    'Apenas R$ 90 a sessão',
    'A partir de R$ 120',
    'Promoção de verão',
    'Resultado rápido e comprovado',
    '100% de sucesso',
  ];

  it.each(proibidos)('reconhece "%s"', (frase) => {
    expect(DENYLIST.some((pattern) => pattern.test(frase))).toBe(true);
  });

  /* O outro lado, e o que impede o denylist de estrangular a copy legítima: estas frases
     estão TODAS no site de verdade ou são a forma correta de dizer a mesma coisa dentro da
     regra. Se um padrão novo passar a acusá-las, ele é largo demais. */
  const permitidos = [
    'A indicação é definida na avaliação — esta lista é orientativa.',
    'Depende do formato e da frequência que saírem da avaliação.',
    'A gente explica tudo antes de qualquer compromisso, e o recibo é emitido normalmente.',
    'O plano é revisto ao longo do acompanhamento.',
    'Atende dor e limitação de movimento no ombro, no joelho e na coluna.',
    'A partir de 900px o layout vira duas colunas.',
    'Exercício conduzido por fisioterapeuta, em turma pequena.',
    'Quem responde é uma das profissionais da clínica.',
    'A carga e o ritmo são combinados com você.',
  ];

  it.each(permitidos)('não acusa "%s"', (frase) => {
    const acusadores = DENYLIST.filter((pattern) => pattern.test(frase)).map(String);

    expect(acusadores, `padrões largos demais: ${acusadores.join(', ')}`).toEqual([]);
  });
});
