/* Identidade de componente entre páginas — a generalização do padrão que o repositório inventou na
   Fase 1 e nunca reusou.
   ============================================================================================
   `tests/system/contact-pair.test.ts` é o molde: marcador `data-*` estável no componente, teste de
   sistema varrendo `dist/**`, invariante cobrado em toda página. `CLAUDE.md` registrou na Fase 4.1
   que ele "nunca foi aplicado a mais nada" e nomeou a generalização como item da Fase 5. Isto é
   ela.

   O QUE ESTE ARQUIVO NÃO PODE SER, e por quê. A Fase 4.1 tem um defeito exemplar:
   `Action.test.ts` exigia a classe `border-line` e foi ISSO que congelou o vazamento de cor no
   lugar — o teste transformou o defeito do dia em contrato, e o registro diz por extenso que
   "teste que afirma o defeito é pior que teste ausente". Um teste de identidade escrito como "a
   classe do card é X" repetiria o erro em escala.

   A SAÍDA JÁ ESTAVA ESCRITA EM `contact-pair.test.ts`, e ninguém tinha reparado: aquele teste não
   diz QUAL classe as duas âncoras têm — diz que elas têm a MESMA. Não existe literal, então não
   existe defeito a congelar; ele só enxerga DIVERGÊNCIA. Os dois invariantes abaixo são essa ideia
   generalizada, e nenhum dos dois escreve um nome de classe do design.

   O QUE ELE NÃO PEGA, e é melhor estar escrito do que ser presumido: uma página que remonta À MÃO
   um bloco que já tem componente. A cópia remontada não carrega marcador, então nenhum teste
   baseado em marcador consegue vê-la — e essa foi exatamente a família de defeito da Fase 4.1 (a
   Home remontou o CTA escuro, a `/lab` remontou o herói). Contra ela vale a cláusula companheira
   da regra de extração, que é revisão humana, e a medição de layout em `tests/metrics/`. */

import { describe, expect, it } from 'vitest';

import { distPages } from './_dom';

/* A `/lab` é o kitchen sink: a página que deve demonstrar TODA variante que o site usa. */
const LAB = 'lab/index.html';

type Marker = {
  /** Atributo de identidade emitido pelo componente. */
  attr: string;
  /** Nome legível para as mensagens de falha. */
  nome: string;
  /**
   * O valor do marcador cobre TODO eixo que altera a classe da raiz?
   *
   * Só quando isto é verdade o invariante de skin (2) pode agrupar por `marcador=valor` e exigir
   * acordo: se o componente tem um eixo FORA do valor, duas instâncias legitimamente diferentes
   * cairiam no mesmo grupo e a diferença legítima viraria infração.
   *
   * Dois componentes falham o critério HOJE, e os dois por motivo estrutural, não por descuido:
   *
   *   · `BrandPlaceholder` — o valor carrega só `variant` (brand/quiet), mas `ratio` e `radius`
   *     também escrevem na raiz (`aspect-3/4`, `rounded-card`).
   *   · `ContactPair` — o marcador não tem valor nenhum, e a raiz recebe do CHAMADOR a tinta da
   *     superfície onde o par pousa: `text-ink` no Header, `text-ink-on-deep` no Footer,
   *     `p-gutter text-ink` no MobileNav. É o invariante 2 que descobriu isso ao ser escrito, e a
   *     leitura honesta é que "qual tinta para esta superfície" é um eixo real do componente que
   *     ele não modela em prop nenhuma. Modelar (uma prop `tone`) é decisão de design, não de
   *     endurecimento — fica registrado aqui, fora do escopo da Fase 5.
   *
   * Encaixar esses eixos no valor resolveria o teste e poluiria o marcador — o `CLAUDE.md` já
   * avisa que marcador não é lugar de despejar eixo. Então os dois participam só do invariante de
   * cobertura (1), que independe de classe.
   */
  eixoCompleto: boolean;
};

const MARKERS: Marker[] = [
  { attr: 'data-service-card', nome: 'ServiceCard', eixoCompleto: true },
  { attr: 'data-cta-block', nome: 'CtaBlock', eixoCompleto: true },
  { attr: 'data-faq-item', nome: 'FaqItem', eixoCompleto: true },
  { attr: 'data-contact-pair', nome: 'ContactPair', eixoCompleto: false },
  { attr: 'data-brand-placeholder', nome: 'BrandPlaceholder', eixoCompleto: false },
];

/* CLASSES DE PELE — as famílias de utility que descrevem a APARÊNCIA de um bloco: cor, tipografia,
   borda, raio, sombra, anel e o padding interno.

   Este é o único literal do arquivo, e ele é de CATEGORIA, nunca de valor: a lista diz "`bg-*` é
   pele", jamais "o fundo é `bg-surface-alt`". Reestilizar um componente move todas as instâncias
   juntas, a intersecção move junto, e o teste segue verde. Ele só dispara quando UMA página dá a um
   componente uma pele diferente da que as outras têm.

   A lista enumera o PROIBIDO e libera o resto, e não o contrário. O enunciado é "página não
   reestiliza componente"; enumerar o permitido faria a primeira utility de layout nova reprovar sem
   nenhum defeito atrás — atrito puro. Padding entra como pele de propósito: borda, fundo, raio E
   padding foram exatamente o conjunto que a Fase 4.1 removeu do `ServiceCard` chamando de "a pele
   que o mockup nunca desenha". */
const SKIN =
  /^-?(bg|text|border|rounded|shadow|ring|opacity|font|outline|decoration|divide|fill|stroke|backdrop|leading|tracking)(-|$)|^-?p[trblxyse]?-/;

/** Remove a variante (`md:`, `hover:`, `@row:`) para classificar a utility de baixo. */
function base(token: string): string {
  const i = token.lastIndexOf(':');
  return i === -1 ? token : token.slice(i + 1);
}

type Occurrence = { file: string; classes: Set<string> };

/** Todas as ocorrências de um marcador em `dist/**`, agrupadas por `marcador=valor`. */
function collect(attr: string): Map<string, Occurrence[]> {
  const groups = new Map<string, Occurrence[]>();

  for (const { file, document } of distPages()) {
    for (const el of Array.from(document.querySelectorAll(`[${attr}]`))) {
      const key = `${attr}="${el.getAttribute(attr) ?? ''}"`;
      const classes = new Set(
        (el.getAttribute('class') ?? '').split(/\s+/).filter((t) => t.length > 0),
      );
      const list = groups.get(key);
      if (list) list.push({ file, classes });
      else groups.set(key, [{ file, classes }]);
    }
  }

  return groups;
}

const isLab = (file: string): boolean => file.endsWith(LAB);

describe('identidade de componente entre páginas', () => {
  /* GUARDA DE VARREDURA NÃO-VAZIA — os dois invariantes abaixo são do tipo "lista de infratores
     vazia" e passariam em silêncio sobre uma seleção vazia. E há um segundo risco, específico
     daqui: um marcador com typo (`data-servicecard`) não encontra nada e o teste fica verde
     afirmando o contrato sobre o vazio. Cada marcador declarado precisa existir de fato. */
  it.each(MARKERS)('$nome — o marcador $attr existe no site construído', ({ attr }) => {
    const groups = collect(attr);
    const total = [...groups.values()].reduce((sum, list) => sum + list.length, 0);

    expect(
      total,
      `nenhum [${attr}] em dist/ — marcador com typo ou componente sem uso?`,
    ).toBeGreaterThan(0);
  });

  /* INVARIANTE 1 — COBERTURA. É este que transforma "a /lab é página viva de regressão" de promessa
     em checagem.

     `CLAUDE.md` (Fase 4.1) diz o problema com todas as letras: "a /lab não é página de regressão, é
     uma SEGUNDA IMPLEMENTAÇÃO. Ela renderiza os mesmos componentes mas remonta o markup de página
     por conta própria, e nada compara as duas." Agora alguma coisa compara: embarcar numa rota de
     produção uma variante que a /lab não demonstra reprova o build.

     Ele tem dentes hoje — `ServiceCard` embarca `stack` em `/` e nos serviços e `row` em
     `/servicos`, e a /lab demonstra as duas. A primeira variante nova que esquecer a vitrine
     aparece aqui. */
  it.each(MARKERS)(
    '$nome — a /lab demonstra toda variante que o site embarca',
    ({ attr, nome }) => {
      const groups = collect(attr);

      const noLab = new Set(
        [...groups.entries()]
          .filter(([, list]) => list.some(({ file }) => isLab(file)))
          .map(([key]) => key),
      );
      const emProducao = [...groups.entries()]
        .filter(([, list]) => list.some(({ file }) => !isLab(file)))
        .map(([key]) => key);

      const ausentes = emProducao.filter((key) => !noLab.has(key));

      expect(
        ausentes,
        `${nome}: variante embarcada sem vitrine na /lab — ${ausentes.join(', ')}`,
      ).toEqual([]);
    },
  );

  /* INVARIANTE 2 — ACORDO. Uma página pode POSICIONAR um componente; não pode reestilizá-lo.

     A linha de base é CALCULADA, nunca escrita: a intersecção das classes de todas as instâncias do
     grupo é o que o componente possui. O que sobra numa instância é o que a página somou — e isso
     precisa ser posicionamento, jamais pele.

     É a cláusula companheira da regra de extração, da Fase 4.1, tornada mecânica: "se já existe
     componente para o bloco, a página não pode remontá-lo à mão... a variação entra NO componente,
     com nome e teste. Nunca uma segunda cópia."

     Não é uma checagem de subconjunto: as classes vêm do componente, então uma página não consegue
     causar OMISSÃO. O risco real é adição, e é adição que ele restringe. */
  it.each(MARKERS.filter((m) => m.eixoCompleto))(
    '$nome — nenhuma página reestiliza o componente, só o posiciona',
    ({ attr, nome }) => {
      const offenders: string[] = [];

      for (const [key, list] of collect(attr)) {
        const baseline = [...list[0]!.classes].filter((token) =>
          list.every(({ classes }) => classes.has(token)),
        );

        for (const { file, classes } of list) {
          const skin = [...classes]
            .filter((token) => !baseline.includes(token))
            .filter((token) => SKIN.test(base(token)));

          if (skin.length > 0) offenders.push(`${file} ${key}: ${skin.join(' ')}`);
        }
      }

      expect(
        offenders,
        `${nome}: página aplicando pele própria — ${offenders.join(' | ')}`,
      ).toEqual([]);
    },
  );

  /* INVARIANTE DE COMPOSIÇÃO. `CtaBlock.astro` declara no cabeçalho que o par de contato entra POR
     CONSTRUÇÃO — telefone sempre ao lado do WhatsApp (DESIGN-SYSTEM §7), porque parte do público
     liga em vez de escrever. A afirmação existia desde a Fase 3 e nada a media; com marcador, mede.
     `tests/components/CtaBlock.test.ts` prova o mesmo no componente isolado; aqui vale no HTML que
     de fato é servido, com os chamadores reais. */
  it('todo [data-cta-block] contém exatamente um par de contato', () => {
    const offenders: string[] = [];

    for (const { file, document } of distPages()) {
      for (const bloco of Array.from(document.querySelectorAll('[data-cta-block]'))) {
        const pares = bloco.querySelectorAll('[data-contact-pair]').length;
        if (pares !== 1) offenders.push(`${file}: ${pares} par(es)`);
      }
    }

    expect(offenders, `CtaBlock sem exatamente 1 par de contato: ${offenders.join(', ')}`).toEqual(
      [],
    );
  });
});
