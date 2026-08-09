/* Dados de contato da clínica — fonte única.
   ============================================================================
   Único lugar de código de produção com telefone/WhatsApp/endereço/horário.
   Guardrail do projeto (CLAUDE.md "Guardrails"): nenhum dado real da clínica
   antes de ser levantado com a cliente e aprovado — e o placeholder abaixo é
   deliberadamente reconhecível COMO placeholder ("a confirmar", DDD fictício
   000), nunca algo que passe por dado real.

   Quando o dado real chegar, troca aqui — nenhum componente hard-coda
   telefone, WhatsApp, endereço ou horário; todos importam daqui. */

import type { NavLink } from '@/components/blocks/Header.astro';

export const SITE = {
  name: 'Calu Pilates e Fisioterapia',
  phone: { href: 'tel:+5511000000000', label: 'Telefone (a confirmar)' },
  whatsapp: { href: 'https://wa.me/5511000000000', label: 'WhatsApp' },
  address: 'Endereço a confirmar — Vila Clementino, São Paulo, SP',
  hours: 'Horário a confirmar',
  technicalManager: { name: 'Responsável técnica a confirmar', crefito: 'CREFITO a confirmar' },
} as const;

/* Itens do nav principal (Header + MobileNav + Footer), na ordem em que aparecem — fonte
   única para os três, que repetem o mesmo menu (design_handoff_calu/PAGES.md "Rotas Astro
   sugeridas"). Nenhuma dessas rotas existe em `src/pages/` ainda; são as páginas previstas
   para as fases seguintes (Fase 3), não um erro de link. */
export const SITE_NAV: NavLink[] = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/equipe', label: 'Equipe' },
  { href: '/duvidas', label: 'Dúvidas' },
  { href: '/contato', label: 'Contato' },
];
