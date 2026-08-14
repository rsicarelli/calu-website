/* Helpers da medição — NÃO é um spec, é módulo importado pelos outros.
   ============================================================================================
   Tudo aqui roda DENTRO do navegador, via `page.evaluate`, porque é lá que existe layout e
   `getComputedStyle` resolvendo `var()`. As funções exportadas são as que o spec chama de fora; as
   que aparecem como string dentro de `evaluate` vivem no escopo do documento e não têm acesso a
   nada deste módulo — daí a duplicação aparente de `ratio`/`parseColor` entre os dois lados.

   AS TRÊS DECISÕES QUE VALEM PARA QUEM EDITAR:

   1. `getComputedStyle` sempre; nunca leitura de `class`. A suíte inteira do repositório já faz
      proxy de classe (`touch-targets`, `cls`), e o ponto deste diretório é NÃO fazer. Uma medida
      que possa ficar verde com o CSS quebrado não vale o custo do navegador.

   2. Fundo por CAMINHO ATÉ A RAIZ. `background-color` de um elemento costuma ser `transparent`; a
      cor que a pessoa enxerga atrás do texto é a do primeiro ancestral opaco. Medir contra
      `transparent` é como testes de contraste falham silenciosamente para cima.

   3. Cor sempre por `getComputedStyle`, que devolve `rgb()`/`rgba()` resolvido — nunca o token. É
      exatamente o que jsdom não faz, e é o motivo de este diretório existir. */

import type { Page } from '@playwright/test';

/** Luminância relativa WCAG de um `rgb`/`rgba` já resolvido pelo navegador. */
export function luminance(color: string): number {
  const [r, g, b] = parseRgb(color);
  const channel = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Razão de contraste WCAG entre duas cores resolvidas. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

function parseRgb(color: string): [number, number, number] {
  const nums = color.match(/[\d.]+/g);
  if (!nums || nums.length < 3) throw new Error(`cor não reconhecida: ${color}`);
  return [Number(nums[0]), Number(nums[1]), Number(nums[2])];
}

/**
 * Abre uma rota JÁ no tema pedido, do jeito que uma pessoa real a recebe.
 *
 * POR QUE NÃO TROCAR O TEMA COM JAVASCRIPT depois de carregar, que era a primeira versão disto: o
 * `ThemeToggle` anima cor (`transition-colors duration-150`), então medir logo após a troca pegava
 * o botão NO MEIO da transição — e a MESMA página devolvia razões de contraste diferentes a cada
 * rodada (1,51:1, depois 2,44:1, depois verde). Uma trava que muda de resposta sem o site mudar é
 * pior que trava nenhuma: ela ensina quem lê a ignorá-la.
 *
 * Semear `localStorage` ANTES da primeira carga elimina a transição na origem, porque nunca há
 * troca: o script inline do `<head>` (`BaseLayout.astro`) lê a chave `calu-theme` antes do CSS e a
 * página nasce no tema certo. É também o caminho REAL do produto — exatamente o que acontece com
 * quem já escolheu um tema e volta ao site — em vez de um estado que só existe em teste.
 */
export async function gotoWithTheme(
  page: Page,
  route: string,
  theme: 'light' | 'dark',
): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('calu-theme', value);
  }, theme);
  await page.goto(route);
  await page.evaluate(() => document.fonts.ready);
}

export type TextSample = {
  /** Seletor legível o bastante para achar o elemento na página. */
  where: string;
  color: string;
  background: string;
  fontSize: number;
  fontWeight: number;
  text: string;
};

/**
 * Toda folha de texto VISÍVEL da página, com a cor do texto e a cor do fundo que de fato está
 * atrás dele.
 *
 * "Folha": elemento cujo texto direto é não-vazio. Medir um ancestral mediria a cor herdada por um
 * bloco que talvez nem pinte texto próprio, e produziria par duplicado por nível de aninhamento.
 */
export async function textSamples(page: Page): Promise<TextSample[]> {
  return page.evaluate(() => {
    const visible = (el: Element): boolean => {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      if (Number(style.opacity) === 0) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0;
    };

    /* Primeiro ancestral com fundo opaco — ver a decisão 2 no cabeçalho. */
    const backdrop = (el: Element): string => {
      let node: Element | null = el;
      while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        const alpha = bg.startsWith('rgba') ? Number(bg.match(/[\d.]+/g)?.[3] ?? 1) : 1;
        if (bg !== 'transparent' && alpha > 0.99) return bg;
        node = node.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };

    /* Um caminho curto até a raiz, para a mensagem de falha ser acionável. */
    const describe = (el: Element): string => {
      const parts: string[] = [];
      let node: Element | null = el;
      for (let i = 0; node && i < 3; i += 1) {
        const id = node.id ? `#${node.id}` : '';
        parts.unshift(node.tagName.toLowerCase() + id);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };

    const out: TextSample[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent ?? '')
        .join('')
        .trim();
      if (own.length === 0) continue;
      /* `aria-hidden` é decoração (os glifos +/− do accordion): ninguém lê, ninguém precisa
         enxergar. Excluí-los é o mesmo recorte que o axe faz. */
      if (el.closest('[aria-hidden="true"]')) continue;
      /* CONTROLE INATIVO é isento por decisão da NORMA, não por folga do projeto: a WCAG 1.4.3
         exclui "inactive user interface components" do contraste mínimo. E a decisão já estava
         tomada aqui dentro — `tests/tokens/pairs.ts` isenta `--color-disabled-ink` com essa mesma
         justificativa escrita. Medir o desabilitado com a régua do ativo faria a medição
         contradizer a tabela de tokens do próprio repositório.

         Os dois sinais entram porque o projeto usa os dois, e de propósito (ver o texto da própria
         `/lab`): `disabled` para o controle que ainda não faz sentido, `aria-disabled` para o
         "enviando", que não pode sair da ordem de foco no meio do envio. */
      if (el.closest('[disabled], [aria-disabled="true"]')) continue;
      if (!visible(el)) continue;

      const style = getComputedStyle(el);
      out.push({
        where: describe(el),
        color: style.color,
        background: backdrop(el),
        fontSize: parseFloat(style.fontSize),
        fontWeight: Number(style.fontWeight) || 400,
        text: own.slice(0, 40),
      });
    }
    return out;
  });
}

export type Box = { where: string; height: number; width: number; text: string; prose: boolean };

/** Todo controle interativo visível, com a caixa que ele de fato ocupa. */
export async function interactiveBoxes(page: Page): Promise<Box[]> {
  return page.evaluate(() => {
    const SELECTOR = 'a[href], button, summary, input:not([type="hidden"]), select, textarea';
    const out: Box[] = [];

    for (const el of Array.from(document.querySelectorAll(SELECTOR))) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      /* ESCONDIDO ATÉ RECEBER FOCO — o skip link (`global.css` §9: `width:1px; height:1px;
         clip-path: inset(50%)`). Ele MEDE 1px de propósito enquanto ninguém o focou; cobrar 52px
         aqui mediria o estado em que o controle não existe para ninguém. O alvo dele é cobrado
         onde ele de fato aparece, em `focus.spec.ts`, com o foco em cima.

         Reconhecido pelo `clip-path`, que é o MECANISMO do padrão, e não pelo nome da classe:
         nome é convenção, mecanismo é contrato — a mesma escolha que `tests/system/faq.test.ts`
         faz ao selecionar por `data-faq-group` em vez de prefixo de `id`. */
      if (style.clipPath.startsWith('inset(') && box.height <= 1) continue;

      /* O ALVO DE UM CAMPO É O CAMPO MAIS O RÓTULO ASSOCIADO, não a caixinha desenhada. Um
         `<input type="radio">` mede ~13px em qualquer navegador, e sempre vai medir: quem clica
         acerta o rótulo, porque `<label for>` torna a linha inteira ativável. É por isso que
         `Field.astro` põe `min-h-target` no `<label>` e não no `input`.

         Medir o `input` sozinho reprovaria todo formulário do mundo e obrigaria a inventar uma
         exceção — e regra que precisa de exceção em todo lugar vira ritual (mesmo argumento do
         recorte "contém controle focável" em `tests/system/surfaces.test.ts`). Medir a REGIÃO
         ATIVÁVEL é o que a WCAG 2.5.5 de fato define. */
      let alvo = box;
      const rotulo =
        el.closest('label') ??
        (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
      if (rotulo) {
        const rb = rotulo.getBoundingClientRect();
        if (rb.height > alvo.height) alvo = rb;
      }

      out.push({
        where: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : ''),
        height: alvo.height,
        width: alvo.width,
        text: (el.textContent ?? '').trim().slice(0, 40),
        /* Link CORRIDO dentro de prosa é um trecho de texto, não um botão: ele não tem como medir
           52px de altura sem quebrar a linha em que vive. `[data-prose]` é o marcador que o
           `global.css` §7 já usa para sublinhar esses links, então o recorte reusa um contrato que
           existe, em vez de inventar um. Mesma disciplina do recorte "contém controle focável" em
           `tests/system/surfaces.test.ts`: regra que precisa ser burlada em todo lugar não é
           regra. */
        prose: el.closest('[data-prose]') !== null,
      });
    }
    return out;
  });
}
