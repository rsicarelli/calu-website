# Páginas e modelo de conteúdo

Referência visual: `Calu - Direcao de Marca.dc.html` (abra no navegador). As seções numeradas do arquivo correspondem ao que está abaixo.

Rotas Astro sugeridas:

```
/                     Home
/servicos             Índice de serviços
/servicos/[slug]      Serviço (template)
/equipe               Equipe
/sobre                Sobre            (não desenhada ainda)
/duvidas              FAQ
/contato              Contato
/blog                 Blog índice      (não desenhada — sem posts no lançamento)
/blog/[slug]          Post             (não desenhada)
/politica-de-privacidade  Legal        (não desenhada)
```

---

## Acessibilidade transversal

Vale para todas as páginas abaixo, não é regra de uma seção só:

- **Um `<h1>` por página, descrevendo a página** — "Fisioterapia para dor e lesão", não "Calu Pilates e Fisioterapia" repetido em todo lugar.
- Hierarquia de cabeçalhos sem pular nível: h1 → h2 → h3, nunca h1 → h3 direto porque o h2 "ficou feio".
- Cada `<nav>` da página com `aria-label` distinto do outro (ver `Header + MobileNav` em `COMPONENTS.md`) — landmark sem rótulo próprio, com mais de um `<nav>` na página, reprova a regra `landmark-unique` do axe.
- Todo `<section>` que funciona como landmark leva `aria-labelledby` apontando para o `id` do cabeçalho que a introduz — landmark sem nome é só uma `<div>` disfarçada pra quem navega por landmarks.
- O conteúdo funciona a **320px** de largura (WCAG 1.4.10), não 360px: 360px é o breakpoint de design, 320px é o mínimo de reflow/zoom que a norma exige, e é mais estreito do que qualquer tela do mockup.

## Home  — seções 03 (360px) e 05 (1280px) do arquivo

Ordem: Header → Hero → Manifesto (faixa verde) → Serviços → Equipe → **Para a família** → **Estrutura e acesso** → Como funciona → CTA escuro → FAQ resumido → Onde estamos → Footer → FAB WhatsApp.

> **Divergência resolvida (Fase 4).** O mockup (`Calu - Direcao de Marca.dc.html`, seção 03)
> renderiza "Estrutura e acesso" DEPOIS do FAQ resumido, não entre "Para a família" e "Como
> funciona". A implementação segue a ordem escrita ACIMA, que é a spec — o mockup é a referência
> visual, não a normativa. Registrado aqui para a próxima pessoa não "corrigir" o código pelo
> mockup: se a ordem do mockup for a desejada, muda-se esta linha primeiro.

Desktop muda: hero vira 2 colunas (texto / imagem 4/5), serviços viram 3 colunas, "Para a família" e "Estrutura e acesso" ficam lado a lado, FAQ e mapa dividem a linha.

**Conteúdo (CMS)**
| campo | tipo | obrigatório | nota |
|---|---|---|---|
| hero.eyebrow | texto curto | não | "Vila Clementino · SP" |
| hero.title | texto | sim | aguenta 3× o tamanho |
| hero.lead | texto | sim | |
| hero.image | imagem 3/4 e 4/5 | não | sem imagem → placeholder de marca |
| manifesto.text | texto longo | sim | |
| servicos.destaque | ref → serviço | 0–6 | vazio ⇒ seção não renderiza |
| equipe.destaque | ref → profissional | 0–2 | |
| familia.itens | lista | 2–8 | |
| acesso.itens | lista | 2–8 | |
| home.comoFunciona.passos | lista (título+texto) | 3 fixos | nome qualificado para não colidir com `servico.passos`, que tem cardinalidade diferente |
| faq.destaque | ref → pergunta | 0–4 | |
| endereco, telefone, horario | texto | sim | vêm de `site` global |

## Serviço (template) — seção 06

Estrutura fixa, e **essa ordem é decisão regulatória**: o que é → para quem costuma ser indicado → como acontece na prática → quem conduz. Nenhum campo aceita resultado prometido.

Desktop: coluna principal + `<aside>` sticky com Resumo (duração, turma, pedido médico), Quem conduz e CTA.

| campo | tipo | obrigatório | nota |
|---|---|---|---|
| titulo | texto | sim | |
| frasePopular | texto curto | sim | "Estou com dor em algum lugar" — aparece antes do nome técnico no índice |
| resumo | texto | sim | |
| imagem | 16/9 e 4/3 | não | fallback de marca |
| oQueE | rich text | sim | |
| indicacoes | lista | 2–8 | sempre seguida da ressalva "a indicação é definida na avaliação" |
| servico.passos | lista (1–5) | sim | nome qualificado para não colidir com `home.comoFunciona.passos`, que é sempre 3 |
| ficha | enum fixo de 6 chaves | 0–6 | `duracao`, `turma`, `roupa`, `pedidoMedico`, `local`, `frequencia` — chaves fechadas, não pares chave/valor livres. Chave livre é porta aberta para algo como "Valor da sessão", e o `DESIGN-SYSTEM.md` proíbe preço em destaque inclusive como campo opcional de CMS |
| profissional | ref | não | |
| relacionados | ref × 2–3 | não | |

⚠️ **Nunca** criar campos: preço em destaque, depoimento, antes/depois, taxa de sucesso.

## Índice de serviços — seção 09
Bloco "Não sabe qual escolher?" antes da lista. Lista em **coluna única** (mobile) / linha com imagem à esquerda (desktop). Estado vazio pronto: símbolo, "Estamos organizando esta página", WhatsApp + telefone.

## Equipe — seção 08
Duas sócias. Cada bio: retrato 4/5, nome, `Credential`, o que atende, formação (1–6 linhas). Bloco "O que isso muda pra você" + CTA.
Suporta 1 a 4 profissionais sem alteração de layout (o grid é `auto-fit`), mas hoje são 2.

## FAQ — seção 10
Três grupos: Antes de começar / No dia a dia do tratamento / Pagamento e recibo. Índice lateral sticky no desktop. Primeiro item de cada grupo aberto. "Quanto custa?" responde sem colocar preço em destaque.
Modelo: `grupo` (nome, ordem) → `pergunta` (texto, resposta rich text, ordem).

## Contato — seção 07
WhatsApp e telefone **antes** do formulário. Depois: formulário, "Onde estamos" (mapa estático 3/2 + endereço), "Como é chegar aqui". Estados de erro e sucesso desenhados.
O texto diz o horário de resposta — ninguém deve esperar retorno às 23h.

⚠️ O campo **e-mail** aparece no mockup mobile e some no desktop — divergência do próprio arquivo de referência. A versão mobile é a correta: o campo existe nos dois breakpoints e é **opcional** em ambos (ver `ContactForm` em `COMPONENTS.md`).

## Ainda não desenhadas
**Sobre**, **Blog índice + Post**, **Página legal**. Implemente as rotas com o layout base e os componentes existentes; o desenho chega depois. O blog não terá posts no lançamento — o índice precisa do estado vazio, e vale decidir com o cliente se entra no menu já.
