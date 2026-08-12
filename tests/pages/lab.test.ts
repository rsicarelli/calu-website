/* /lab — a página inteira (BaseLayout + casca real + as seções de `_sections/`), renderizada de
   ponta a ponta, com axe-core sobre o DOCUMENTO INTEIRO. Mesmo padrão de `404.test.ts`: a casca
   real está toda presente (3 <nav> nomeados, <main>, <footer>, <aside> do FAB), então nenhuma
   regra do axe é desabilitada aqui — se reprovar, é achado real.

   POR QUE ESTE ARQUIVO EXISTE, dado que `tests/system/` já varre todo HTML de `dist/` (o glob
   por extenso não cabe DENTRO de um comentário de bloco — asterisco-asterisco-barra-asterisco
   fecha o próprio comentário; ver a mesma ressalva em `tests/system/_dom.ts`): a varredura de
   sistema roda depois do build e cobre TODA página com o mesmo conjunto de regras; este arquivo
   roda antes, cobre o que é específico DESTA página, e reprova mais cedo — sem esperar um build.
   As duas checagens que se sobrepõem de propósito (rótulo de <nav> e dimensão de <img>) estão
   aqui como espelho pré-build: uma delas, a de imagem, é imune ao ponto cego de classe fracionária
   que `tests/system/cls.test.ts` já teve, porque exige `width`/`height` de verdade.

   ESCOPO, e por que ele cresce junto com a página: `/lab` chega por partes, uma seção por commit.
   Os contratos estruturais (axe, um <h1>, `noindex`, `id` único, âncora do sumário, <nav>, <img>)
   valem desde a primeira seção e travam todas as seguintes. Os contratos de COMPORTAMENTO de um
   componente específico — honeypot do formulário, botão "Enviando…", `<details>` do FAQ, resumo de
   erro — entram no MESMO commit que traz a seção correspondente. Teste que roda sobre uma seleção
   vazia passa em silêncio e não prova nada; melhor ele nascer junto com o que ele mede.

   Sem a mágica-comment de ambiente por arquivo do Vitest — mesmo motivo documentado em
   `tests/components/BaseLayout.test.ts` e em `404.test.ts`: a diretiva rodaria este arquivo no
   Environment "client" do Vite, onde todo `.astro` compila para um stub que só lança.

   NOTA PARA QUEM EDITAR ESTE COMENTÁRIO: o parser do Vitest escaneia o CONTEÚDO INTEIRO do
   arquivo à procura de arroba + "vitest-environment" + espaço + palavra — não só a primeira
   linha. Não escreva essa sequência literal em nenhum lugar deste arquivo. */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import axe from 'axe-core';
// @ts-expect-error -- `jsdom` não publica tipos próprios e o projeto não tem `@types/jsdom`.
// `domFromHtml` recasta o resultado para o `Document` da lib DOM ambiente do TypeScript, então o
// `any` daqui não escapa para o resto do arquivo. Mesmo padrão de `404.test.ts`.
import { JSDOM, VirtualConsole } from 'jsdom';
import { beforeAll, describe, expect, it } from 'vitest';

import LabPage from '@/pages/lab/index.astro';

function domFromHtml(html: string): Document {
  const virtualConsole = new VirtualConsole().forwardTo(console, { jsdomErrors: 'none' });
  return new JSDOM(html, { pretendToBeVisual: true, virtualConsole }).window.document as Document;
}

/* Renderizada UMA vez para o arquivo inteiro, diferente de `404.test.ts`, que re-renderiza por
   teste. A `/lab` é a maior página do projeto por uma ordem de grandeza e vai crescer mais; pagar
   o render por teste multiplicaria o custo da suíte sem ganhar isolamento — nenhum teste daqui
   muta o documento. */
let document: Document;

beforeAll(async () => {
  const container = await AstroContainer.create();
  document = domFromHtml(await container.renderToString(LabPage, {}));
});

describe('/lab — contratos estruturais', () => {
  it('não produz violações de acessibilidade (axe-core) no documento inteiro', async () => {
    const results = await axe.run(document.documentElement);

    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`),
    ).toEqual([]);
  });

  it('tem exatamente 1 <h1> na página inteira', () => {
    expect(document.querySelectorAll('h1')).toHaveLength(1);
  });

  it('emite <meta name="robots" content="noindex, follow">', () => {
    const robots = document.querySelector('meta[name="robots"]');

    expect(robots).not.toBeNull();
    expect(robots!.getAttribute('content')).toMatch(/noindex/);
  });

  /* O axe aposentou a regra `duplicate-id` (deixou de ser violação de WCAG por si só), e esta é
     exatamente a página que precisa dela de volta: ela renderiza o mesmo campo de formulário e o
     mesmo card várias vezes, em estados diferentes. `id` repetido quebra `aria-labelledby`,
     `aria-describedby`, `<label for>` e âncora — tudo em silêncio. */
  it('não repete nenhum `id`', () => {
    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id);
    const duplicated = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];

    expect(duplicated, `ids repetidos: ${duplicated.join(', ')}`).toEqual([]);
  });

  /* Cobre o sumário E o resto: qualquer link interno que aponte para um `id` inexistente é um
     link morto. O array `SECTIONS` de `index.astro` já alimenta sumário e seções pela mesma
     fonte; este teste protege contra alguém abandonar o array e escrever a âncora à mão. */
  it('toda âncora interna aponta para um `id` que existe', () => {
    const broken = Array.from(document.querySelectorAll('a[href^="#"]'))
      .map((a) => a.getAttribute('href')!)
      .filter((href) => href.length > 1)
      .filter((href) => document.getElementById(decodeURIComponent(href.slice(1))) === null);

    expect(broken, `âncoras sem alvo: ${broken.join(', ')}`).toEqual([]);
  });

  it('todo <nav> tem `aria-label` e nenhum se repete no documento', () => {
    const navs = Array.from(document.querySelectorAll('nav'));
    expect(navs.length).toBeGreaterThan(0);

    const labels = navs.map((nav) => nav.getAttribute('aria-label')?.trim() ?? '');
    expect(
      labels.filter((label) => label === ''),
      '<nav> sem aria-label',
    ).toEqual([]);
    expect(new Set(labels).size, `aria-label repetido: ${labels.join(', ')}`).toBe(labels.length);
  });

  /* `width` + `height` de verdade, não classe de proporção: é o sinal que o algoritmo de
     aspect-ratio intrínseco do CSSWG usa, e o único imune ao ponto cego de classe fracionária que
     `tests/system/cls.test.ts` carregou até ser corrigido. Toda imagem desta página nasce de
     `<Image>` do `astro:assets`, que emite os dois atributos sozinho. */
  it('toda <img> carrega `width` e `height`', () => {
    const offenders = Array.from(document.querySelectorAll('img'))
      .filter((img) => !img.hasAttribute('width') || !img.hasAttribute('height'))
      .map((img) => img.getAttribute('src') ?? '(sem src)');

    expect(offenders, `<img> sem width/height: ${offenders.join(', ')}`).toEqual([]);
  });

  /* Bloco de fundo escuro QUE CONTÉM CONTROLE FOCÁVEL precisa declarar `data-surface`, senão o
     anel de foco não é reescopado e cai para ~1,8:1 no tema claro (global.css §6). É a regra que
     a `/lab` mais exercita e a mais fácil de esquecer ao colar um bloco novo.

     O recorte "que contém controle focável" não é frouxidão, é a regra de verdade: `data-surface`
     só reescopa `--color-focus-ring`, então ele não tem o que fazer num elemento onde nada recebe
     foco. A primeira versão deste teste exigia o atributo de QUALQUER elemento pintado e reprovou
     as amostras de 52px da grade de cor — `<span>` decorativo, sem descendente focável, sem anel
     de foco possível. Exigir o atributo ali seria ritual: passaria a existir marcação que não
     muda nada, e a regra perderia o significado que a torna verificável. */
  it('todo bloco de fundo escuro com controle focável declara `data-surface`', () => {
    const EXPECTED: Record<string, string> = {
      'bg-surface-deep': 'deep',
      'bg-surface-brand': 'brand',
      'bg-accent': 'accent',
    };
    const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex="0"]';

    const offenders = Array.from(document.querySelectorAll('[class]'))
      .filter((el) => el.querySelector(FOCUSABLE) !== null || el.matches(FOCUSABLE))
      .flatMap((el) =>
        Object.entries(EXPECTED)
          .filter(([painted]) => el.classList.contains(painted))
          .filter(([, surface]) => el.getAttribute('data-surface') !== surface)
          .map(([painted]) => `${el.tagName.toLowerCase()}.${painted}`),
      )
      .filter((entry, i, all) => all.indexOf(entry) === i);

    expect(offenders, `sem data-surface: ${offenders.join(', ')}`).toEqual([]);
  });
});

/* Contratos de COMPORTAMENTO do formulário de contato. Chegam junto da seção que os torna
   mensuráveis (`_sections/ScreenContact.astro`), não antes: teste sobre seleção vazia passa em
   silêncio. Cada um trava uma decisão que `COMPONENTS.md` marca como "não reintroduzir". */
describe('/lab — contratos do formulário de contato', () => {
  it('o botão "Enviando…" usa aria-disabled/aria-busy e NUNCA o atributo `disabled`', () => {
    const enviando = Array.from(document.querySelectorAll('button[aria-busy="true"]'));
    expect(enviando.length, 'nenhum botão em estado "enviando" na página').toBeGreaterThan(0);

    for (const botao of enviando) {
      expect(botao.getAttribute('aria-disabled')).toBe('true');
      // `disabled` tiraria o botão da ordem de foco no meio do envio, e a pessoa perderia o lugar.
      expect(botao.hasAttribute('disabled'), 'botão "enviando" com atributo disabled').toBe(false);
    }
  });

  /* O honeypot precisa ficar fora da árvore de acessibilidade DE VERDADE. `sr-only`/`clip-path`
     escondem só visualmente: quem usa leitor de tela encontra o campo, preenche, e é barrado como
     spam. `hidden` (que é `display: none`) é o único esconderijo que vale aqui. */
  it('o honeypot está escondido de fato, não só visualmente', () => {
    const honeypots = Array.from(document.querySelectorAll('input[aria-hidden="true"]'));
    expect(honeypots.length, 'nenhum honeypot encontrado').toBeGreaterThan(0);

    for (const campo of honeypots) {
      const escondidoDeFato =
        campo.hasAttribute('hidden') || /display:\s*none/i.test(campo.getAttribute('style') ?? '');

      expect(escondidoDeFato, 'honeypot sem display:none — sr-only não serve').toBe(true);
      expect(campo.getAttribute('tabindex')).toBe('-1');
      expect(campo.getAttribute('autocomplete')).toBe('off');
      expect(campo.className, 'honeypot escondido por classe visual').not.toMatch(/sr-only/);
    }
  });

  /* No Chrome, um contêiner com `tabindex="-1"` focado por script NÃO casa `:focus-visible` — o
     resumo de erro ficaria sem anel nenhum justamente no momento em que recebe o foco. Por isso o
     estilo precisa vir de `focus:`, não de `focus-visible:`. */
  it('o resumo de erro é focável por script e tem estilo em :focus, não só :focus-visible', () => {
    const resumo = document.querySelector('[tabindex="-1"].border-error');
    expect(resumo, 'resumo de erro não encontrado').not.toBeNull();

    const classes = resumo!.getAttribute('class') ?? '';
    expect(classes).toMatch(/(^|\s)focus:outline-3(\s|$)/);
    expect(classes).toMatch(/(^|\s)focus:outline-focus-ring(\s|$)/);
  });

  /* "Campo obrigatório" não diz QUAL campo. Quem navega por leitor de tela ouve a mensagem fora do
     contexto visual, então ela precisa nomear o campo (WCAG 3.3.1). */
  it('toda mensagem de erro de campo nomeia o campo', () => {
    const invalidos = Array.from(document.querySelectorAll('[aria-invalid="true"]'));
    expect(invalidos.length, 'nenhum campo em erro na página').toBeGreaterThan(0);

    for (const campo of invalidos) {
      const id = campo.getAttribute('aria-describedby');
      expect(id, `campo ${campo.id} sem aria-describedby`).not.toBeNull();

      const mensagem = document.getElementById(id!);
      expect(mensagem, `aria-describedby aponta para id inexistente: ${id}`).not.toBeNull();

      const texto = mensagem!.textContent?.trim() ?? '';
      expect(texto.length).toBeGreaterThan(0);
      expect(texto, 'mensagem genérica — precisa nomear o campo').not.toMatch(
        /^campo obrigat[óo]rio\.?$/i,
      );
    }
  });
});

/* Contratos do accordion. Chegam junto de `_sections/ScreenFaq.astro`, pelo mesmo motivo dos
   contratos do formulário. */
describe('/lab — contratos do accordion', () => {
  const detalhes = (): HTMLDetailsElement[] =>
    Array.from(document.querySelectorAll('details')) as HTMLDetailsElement[];

  /* O defeito que motivou a correção do handoff: `<details><h3><summary>` deixa o `<details>` sem
     `summary` NENHUM (o modelo de conteúdo exige o `<summary>` como primeiro filho). O navegador
     sintetiza o próprio marcador, e o texto da pergunta some junto com a resposta quando o item
     está fechado. Sem este teste, o erro é invisível no HTML e só aparece no navegador. */
  it('todo <summary> é o primeiro filho do seu <details>', () => {
    const todos = detalhes();
    expect(todos.length, 'nenhum <details> na página').toBeGreaterThan(0);

    const offenders = todos
      .filter((d) => d.firstElementChild?.tagName.toLowerCase() !== 'summary')
      .map((d) => d.textContent?.trim().slice(0, 40) ?? '(vazio)');

    expect(offenders, `<details> sem <summary> como primeiro filho: ${offenders}`).toEqual([]);
  });

  /* Sem `name` compartilhado, abrir um item não fecha os outros — quem chega com duas dúvidas quer
     ler as duas. É o oposto do accordion exclusivo, e a diferença é um atributo só. */
  it('nenhum <details> é exclusivo (sem atributo `name`)', () => {
    const offenders = detalhes()
      .filter((d) => d.hasAttribute('name'))
      .map((d) => d.getAttribute('name')!);

    expect(offenders, `<details> exclusivo: ${offenders.join(', ')}`).toEqual([]);
  });

  it('cada pergunta é um cabeçalho dentro do <summary>', () => {
    const offenders = detalhes()
      .map((d) => d.querySelector('summary'))
      .filter((s) => s !== null && s.querySelector('h2, h3, h4, h5, h6') === null)
      .map((s) => s!.textContent?.trim().slice(0, 40) ?? '(vazio)');

    expect(offenders, `<summary> sem cabeçalho: ${offenders.join(' | ')}`).toEqual([]);
  });

  /* Um item aberto por grupo, e não zero: a página não deve abrir vazia, com todas as respostas
     escondidas. O primeiro de cada grupo nasce `open`.

     Os grupos são selecionados por `data-faq-group`, não por prefixo de `id`. A primeira versão
     usava `[id^="lab-faq-"]` e pescava junto o `lab-faq-titulo` que a casca de `index.astro` gera
     para o `aria-labelledby` da seção — um elemento que nunca teve `<details>` dentro e sempre
     falharia. Prefixo de `id` é convenção; atributo é contrato. */
  it('há exatamente um <details> aberto por grupo de perguntas', () => {
    const grupos = Array.from(document.querySelectorAll('[data-faq-group]'));
    expect(grupos.length, 'nenhum grupo de FAQ encontrado').toBeGreaterThan(0);

    for (const grupo of grupos) {
      const abertos = grupo.querySelectorAll('details[open]');
      expect(abertos.length, `grupo ${grupo.id} sem nenhum item aberto`).toBe(1);
    }
  });
});
