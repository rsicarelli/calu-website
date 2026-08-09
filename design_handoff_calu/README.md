# Handoff: site institucional Calu Pilates e Fisioterapia

## Visão geral
Site institucional de uma clínica de fisioterapia com studio de Pilates na Vila Clementino, São Paulo, tocada por **duas fisioterapeutas sócias**. Objetivo único do site: **gerar contato** (WhatsApp e formulário) e transmitir credibilidade clínica. Não é e-commerce e não tem agendamento nativo.

## Sobre os arquivos de design
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar esses designs no ambiente do projeto** (Astro estático), seguindo os padrões do próprio codebase.

## Fidelidade
**Alta (hi-fi).** Cores, tipografia, espaçamento, estados e conteúdo são finais. Recrie fielmente, usando `tokens.css` como fonte de verdade — os hexadecimais do HTML e os tokens são os mesmos valores.

## Por onde começar
1. `PROMPT.md` — prompt pronto para colar em uma sessão do Claude Code. **É o ponto de partida.**
2. `DESIGN-SYSTEM.md` — regras invioláveis: origem da paleta, público, restrição regulatória, tipografia, layout, temas.
3. `COMPONENTS.md` — inventário de componentes com estados e critérios de teste.
4. `PAGES.md` — páginas, rotas e modelo de conteúdo do CMS.
5. `tokens.css` + `theme-init.js` — para copiar direto no projeto.
6. `CLAUDE.md` — copiar para a raiz do repositório.
7. `Calu - Direcao de Marca.dc.html` — abrir no navegador; é o design completo.

## Contexto que explica as decisões
- **Público**: 25–55 **e 60–75 anos**, além do filho adulto pesquisando pelo pai/mãe. Decide no celular. Daí o piso de 17px, o corpo em 19–20px, o contraste AAA, o alvo de 52px e o telefone sempre visível.
- **Regulação (CFF/CREFITO)**: publicidade em fisioterapia proíbe depoimento de paciente, foto antes/depois, promessa de resultado, superlativo e preço em destaque. A credibilidade é construída por formação, registro ativo e estrutura — **isso é requisito, não preferência**.
- **Identidade**: derivada do logo da cliente. O sálvia do arquivo reprova em contraste, então virou superfície escurecida; o dourado vira bronze no tema claro e volta a ser dourado no escuro.

## Telas incluídas (todas em 360px e desktop, tema claro e escuro)
Home · Serviço (template) · Índice de serviços · Equipe · FAQ · Contato — com estados de erro, sucesso, imagem ausente e página vazia.
**Ainda não desenhadas**: Sobre, Blog (índice e post), Página legal.

## Assets
`assets/logo-original.png` (arquivo da cliente, fundo sálvia), `assets/logo-lockup-alpha.png` (lockup com fundo removido, para fundos escuros), `assets/logo-mark-alpha.png` (símbolo, para o medalhão do header e placeholders).
O original é um JPG com compressão visível nas serifas — **peça o vetor à designer antes de produção**.

## Pendências para o cliente
- Confirmar os itens de acessibilidade (elevador, banheiro adaptado, estacionamento) — hoje são placeholder plausível.
- Nomes, formação e registros CREFITO das duas sócias.
- Fotos do ensaio (existem, mas não foram fornecidas).
- Endereço, telefone e horário reais.
- Se o blog entra no menu no lançamento, já que não terá posts.
