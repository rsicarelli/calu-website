/* Content collections — o modelo de conteúdo do site.
   ============================================================================
   Espelha as tabelas de campo de `design_handoff_calu/PAGES.md`, campo a campo e
   cardinalidade a cardinalidade. O que está aqui é contrato com quem vai editar o
   site: um CMS visual Git-based (Sveltia/Decap, restrição nº 1 do projeto) lê
   estes schemas para desenhar os formulários, então um campo mal nomeado aqui
   vira um rótulo confuso para quem não é técnico.

   POR QUE TODO OBJETO É `.strict()`
   ---------------------------------------------------------------------------
   Verificado empiricamente com o `astro/zod` instalado: sem `.strict()`, uma
   chave desconhecida é SILENCIOSAMENTE REMOVIDA — `z.object({a}).parse({a, preco})`
   devolve `{a}` sem erro nenhum. Com `.strict()`, o parse falha com
   `unrecognized_keys`.

   Isso é o que transforma a trava CFF/CREFITO de convenção em erro de build. O
   `DESIGN-SYSTEM.md` §3 proíbe preço, depoimento, antes/depois e promessa de
   resultado "inclusive como campo opcional de CMS". Sem `.strict()`, alguém que
   acrescentasse `preco:` numa entrada não veria erro algum — o campo sumiria em
   silêncio, e a única pista de que a regra foi testada seria nenhuma. Com
   `.strict()`, o build para e diz o nome da chave.

   A `ficha` do serviço é o caso mais afiado: seis chaves FECHADAS, nunca par
   chave/valor livre. Chave livre é a porta por onde "Valor da sessão" entra sem
   que ninguém precise editar schema nenhum.

   RICH TEXT NÃO É CAMPO
   ---------------------------------------------------------------------------
   `oQueE` (serviço) e `resposta` (dúvida) vivem no CORPO markdown da entrada, não
   numa string de frontmatter. Duas razões: é o que dá `<p>`, lista e ênfase reais
   sob `data-prose`, e é o que um CMS visual sabe editar com preview. Por isso
   nenhum dos dois aparece nos schemas abaixo — a ausência é o desenho. */

import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ── Vocabulário fechado ───────────────────────────────────────────────────── */

/** Grupos da página de dúvidas, na ordem de exibição (PAGES.md § FAQ). */
export const FAQ_GROUPS = [
  { slug: 'antes-de-comecar', nome: 'Antes de começar' },
  { slug: 'no-dia-a-dia', nome: 'No dia a dia do tratamento' },
  { slug: 'pagamento-e-recibo', nome: 'Pagamento e recibo' },
] as const;

export type FaqGroupSlug = (typeof FAQ_GROUPS)[number]['slug'];

const faqGroupSlugs = FAQ_GROUPS.map((group) => group.slug) as [FaqGroupSlug, ...FaqGroupSlug[]];

/* ── Peças reutilizadas entre coleções ─────────────────────────────────────── */

/** Rótulo de seção: no máximo 3 palavras, guardado em caixa NORMAL.
    A caixa-alta é apresentação (a utility `label` do `global.css`). Guardada no
    conteúdo, o VoiceOver soletra letra por letra — COMPONENTS.md § Label. */
const sectionLabel = z
  .string()
  .refine((value) => value.trim().split(/\s+/).length <= 3, {
    message: 'rótulo de seção tem no máximo 3 palavras',
  })
  .refine((value) => value !== value.toUpperCase(), {
    message: 'rótulo de seção é guardado em caixa normal — a caixa-alta é do CSS',
  });

/** Passo numerado: título curto + explicação. */
const passo = z.object({ titulo: z.string(), texto: z.string() }).strict();

/* ── Coleções ──────────────────────────────────────────────────────────────── */

/* Singleton em coleção de UM arquivo, e não um módulo TS: é a forma que um CMS
   visual Git-based mapeia direto como "file collection", com formulário e preview.
   Um `export const HOME = {...}` em `src/lib/` seria mais curto de escrever e
   impossível de editar para quem não abre terminal — restrição nº 1 do projeto. */
const home = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/home' }),
  schema: ({ image }) =>
    z
      .object({
        seo: z.object({ title: z.string(), description: z.string() }).strict(),
        hero: z
          .object({
            eyebrow: z.string().optional(),
            /** Aguenta 3× o tamanho sem quebrar o layout (regra 9 do handoff). */
            titulo: z.string(),
            lead: z.string(),
            imagem: image().optional(),
            acaoSecundaria: z.string(),
          })
          .strict(),
        manifesto: z.object({ texto: z.string() }).strict(),
        servicos: z
          .object({
            label: sectionLabel,
            titulo: z.string(),
            /** 0–6. Vazio ⇒ a seção não renderiza (PAGES.md). */
            destaque: z.array(reference('servicos')).max(6),
            linkLabel: z.string(),
          })
          .strict(),
        equipe: z
          .object({
            label: sectionLabel,
            titulo: z.string(),
            intro: z.string(),
            destaque: z.array(reference('equipe')).max(2),
            linkLabel: z.string(),
          })
          .strict(),
        familia: z
          .object({
            label: sectionLabel,
            titulo: z.string(),
            texto: z.string(),
            itens: z.array(z.string()).min(2).max(8),
          })
          .strict(),
        acesso: z
          .object({
            label: sectionLabel,
            titulo: z.string(),
            itens: z.array(z.string()).min(2).max(8),
            fecho: z.string(),
          })
          .strict(),
        /* Nome qualificado no handoff justamente para não colidir com
           `servico.passos`, que tem cardinalidade diferente: aqui são SEMPRE 3
           (Contato / Avaliação / Plano), lá são 1–5. */
        comoFunciona: z
          .object({
            label: sectionLabel,
            titulo: z.string(),
            passos: z.array(passo).length(3),
          })
          .strict(),
        cta: z.object({ label: sectionLabel, titulo: z.string(), texto: z.string() }).strict(),
        faq: z
          .object({
            titulo: z.string(),
            destaque: z.array(reference('duvidas')).max(4),
            linkLabel: z.string(),
          })
          .strict(),
        local: z.object({ titulo: z.string() }).strict(),
      })
      .strict(),
});

const servicos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servicos' }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string(),
        /** "Estou com dor em algum lugar" — vem ANTES do nome técnico no índice. */
        frasePopular: z.string(),
        resumo: z.string(),
        /** Ordem no índice. Explícita: ordem alfabética não é decisão editorial. */
        ordem: z.number().int().nonnegative(),
        seoDescription: z.string(),
        imagem: image().optional(),
        /** 2–8, sempre seguidas da ressalva "a indicação é definida na avaliação". */
        indicacoes: z.array(z.string()).min(2).max(8),
        /** 1–5 (≠ dos 3 fixos de `home.comoFunciona.passos`). */
        passos: z.array(passo).min(1).max(5),
        /* SEIS CHAVES FECHADAS. Não é `z.record()` nem lista de pares chave/valor —
           chave livre é porta aberta para "Valor da sessão", e o handoff proíbe
           preço em destaque inclusive como campo opcional de CMS. Chave ausente não
           renderiza linha vazia; ela simplesmente não existe na ficha. */
        ficha: z
          .object({
            duracao: z.string().optional(),
            turma: z.string().optional(),
            roupa: z.string().optional(),
            pedidoMedico: z.string().optional(),
            local: z.string().optional(),
            frequencia: z.string().optional(),
          })
          .strict()
          .optional(),
        profissional: reference('equipe').optional(),
        relacionados: z.array(reference('servicos')).min(2).max(3).optional(),
      })
      .strict(),
});

const equipe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/equipe' }),
  schema: ({ image }) =>
    z
      .object({
        /* Nome e registro ficam como marcador de `src/lib/placeholders.ts` até a
           cliente aprovar. São campos de verdade, com valor declaradamente ausente
           — não campos que faltam. */
        nome: z.string(),
        credencial: z.string(),
        ordem: z.number().int().nonnegative(),
        retrato: image().optional(),
        /** O que ela atende, em português comum. */
        atende: z.string(),
        /** 1–6 linhas (PAGES.md § Equipe). */
        formacao: z.array(z.string()).min(1).max(6),
      })
      .strict(),
});

/* Uma entrada por PERGUNTA, não por grupo: é o que permite a resposta ser o corpo
   markdown (rich text de verdade) em vez de string de frontmatter. O grupo é uma
   chave do vocabulário fechado acima — três grupos, definidos uma vez, com nome e
   ordem fora do alcance de quem edita conteúdo. */
const duvidas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/duvidas' }),
  schema: z
    .object({
      pergunta: z.string(),
      grupo: z.enum(faqGroupSlugs),
      ordem: z.number().int().nonnegative(),
    })
    .strict(),
});

const contato = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/contato' }),
  schema: z
    .object({
      seo: z.object({ title: z.string(), description: z.string() }).strict(),
      titulo: z.string(),
      lead: z.string(),
      /** "Respondemos no próximo horário de atendimento" — ninguém espera retorno às 23h. */
      prazoResposta: z.string(),
      formulario: z
        .object({
          titulo: z.string(),
          nota: z.string(),
          /** Texto da linha de privacidade. Sem link: a página legal não existe ainda. */
          privacidade: z.string(),
          enviar: z.string(),
          /** Opções do radio "Para quem é o atendimento". */
          paraQuem: z.array(z.string()).min(2).max(4),
          /** Opções do select "Interesse". */
          interesses: z.array(z.string()).min(2).max(8),
        })
        .strict(),
      local: z.object({ titulo: z.string() }).strict(),
      acesso: z
        .object({ titulo: z.string(), itens: z.array(z.string()).min(2).max(8), fecho: z.string() })
        .strict(),
    })
    .strict(),
});

export const collections = { home, servicos, equipe, duvidas, contato };
