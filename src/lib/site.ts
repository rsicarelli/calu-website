/* Dados da clínica — fonte única, fortemente tipada.
   ============================================================================
   Único lugar de código de produção com telefone/WhatsApp/endereço/horário.
   Guardrail do projeto (CLAUDE.md "Guardrails"): nenhum dado real da clínica
   antes de ser levantado com a cliente e aprovado — e todo placeholder abaixo é
   deliberadamente reconhecível COMO placeholder (DDD fictício 000, número zerado,
   "a confirmar"), nunca algo que passe por dado real.

   O QUE MUDOU NA FASE 4, e por quê
   ---------------------------------------------------------------------------
   Antes `address` e `hours` eram string solta. Isso servia enquanto só o Header e
   o Footer liam daqui, mas a Fase 4 acrescenta um segundo consumidor com forma
   PRÓPRIA: `localBusinessLd` (src/lib/jsonld.ts) exige `address` decomposto em
   campos de `PostalAddress` e `openingHours` no formato schema.org
   ('Mo-Fr 07:00-20:00'). Com string solta, a única saída seria digitar o mesmo
   fato duas vezes, em dois formatos, e torcer para que não divergissem — que é
   exatamente o defeito que uma "fonte única" existe para impedir.

   A regra aqui é: **o fato é digitado uma vez, na forma estruturada; toda
   apresentação é DERIVADA dela por função pura.** `tests/lib/site.test.ts` prova
   que a derivada bate com a estrutura, então uma troca de endereço que esqueça de
   atualizar a string legível não existe como estado possível — não há string
   legível para esquecer.

   Mesma lógica no telefone: os dígitos são digitados uma vez e `tel:`, `wa.me/` e
   o rótulo formatado saem dos mesmos dígitos. Um telefone que discasse diferente
   do que a página mostra era possível na versão anterior; agora não é.

   Quando o dado real chegar, troca-se VALOR aqui — nunca forma, e nunca
   componente: nada hard-coda telefone, WhatsApp, endereço ou horário. */

import type { NavLink } from '@/components/blocks/Header.astro';

/* ── Fatos estruturados — a única digitação de cada um ─────────────────────── */

/** Dígitos no formato E.164 sem o `+`, que é o que o `wa.me/` aceita na URL. */
const PHONE_DIGITS = '5511000000000';

const ADDRESS = {
  /** Número + complemento entram aqui: não há campo `PostalAddress` próprio para sala/andar,
      mesmo raciocínio do bairro logo abaixo — o dado mora onde é lido, não onde o vocabulário
      schema.org tem uma gaveta pronta. */
  streetAddress: 'Av. Onze de Junho, 1070, Sala 710',
  /** Bairro. Não é campo de `PostalAddress`; entra no `streetAddress` do JSON-LD. */
  neighborhood: 'Vila Clementino',
  addressLocality: 'São Paulo',
  addressRegion: 'SP',
  postalCode: '04041-004',
  addressCountry: 'BR',
} as const;

/** Faixas de atendimento. `days` no vocabulário schema.org; `label` é como se fala. */
const HOURS = [
  { days: 'Mo-Fr', opens: '07:00', closes: '20:00', label: 'Segunda a sexta' },
  { days: 'Sa', opens: '08:00', closes: '12:00', label: 'Sábado' },
] as const;

/* ── Derivações puras ──────────────────────────────────────────────────────── */

/** `5511987654321` → `(11) 98765-4321`. Assume número brasileiro com DDI 55. */
function formatBrazilianPhone(digits: string): string {
  const national = digits.startsWith('55') ? digits.slice(2) : digits;
  const ddd = national.slice(0, 2);
  const subscriber = national.slice(2);
  /* Celular tem 9 dígitos e quebra em 5+4; fixo tem 8 e quebra em 4+4. */
  const split = subscriber.length === 9 ? 5 : 4;
  return `(${ddd}) ${subscriber.slice(0, split)}-${subscriber.slice(split)}`;
}

/** `'07:00'` → `'7h'`; `'14:30'` → `'14h30'`. Como se lê em voz alta, sem zero à esquerda. */
function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const h = String(Number(hour));
  return minute === '00' ? `${h}h` : `${h}h${minute}`;
}

function formatAddress(address: typeof ADDRESS): string {
  return `${address.streetAddress} — ${address.neighborhood}, ${address.addressLocality}, ${address.addressRegion}`;
}

/** Deep link do Google Maps — sem chave de API, é só uma URL. Funciona igual em qualquer
    plataforma: abre o app nativo no celular, o Maps web no desktop. */
function buildMapsUrl(address: typeof ADDRESS): string {
  const query = `${address.streetAddress}, ${address.neighborhood}, ${address.addressLocality} - ${address.addressRegion}, ${address.postalCode}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function formatHours(hours: typeof HOURS): string {
  return hours
    .map((range) => `${range.label}, das ${formatTime(range.opens)} às ${formatTime(range.closes)}`)
    .join(' · ');
}

/* ── A fonte única ─────────────────────────────────────────────────────────── */

export const SITE = {
  name: 'Calu Pilates e Fisioterapia',
  phone: {
    href: `tel:+${PHONE_DIGITS}`,
    label: formatBrazilianPhone(PHONE_DIGITS),
  },
  whatsapp: {
    href: `https://wa.me/${PHONE_DIGITS}`,
    /* Nunca o número: o rótulo do WhatsApp é a palavra, para o par com o telefone
       ao lado não virar dois números iguais em sequência. */
    label: 'WhatsApp',
  },
  /** Legível — Header, Footer, LocationBlock. Derivado de `address`. */
  addressLine: formatAddress(ADDRESS),
  /** Deep link "Abrir no mapa" — LocationBlock. Derivado de `address`. */
  mapsUrl: buildMapsUrl(ADDRESS),
  /** Legível — Footer, LocationBlock. Derivado de `hours`. */
  hoursLine: formatHours(HOURS),
  /** Estruturado — `localBusinessLd`. Mesmo fato, forma schema.org. */
  address: {
    streetAddress: `${ADDRESS.streetAddress} — ${ADDRESS.neighborhood}`,
    addressLocality: ADDRESS.addressLocality,
    addressRegion: ADDRESS.addressRegion,
    postalCode: ADDRESS.postalCode,
    addressCountry: ADDRESS.addressCountry,
  },
  /** Estruturado — `localBusinessLd`. Formato schema.org: `'Mo-Fr 07:00-20:00'`. */
  openingHours: HOURS.map((range) => `${range.days} ${range.opens}-${range.closes}`),
  areaServed: 'São Paulo',
  technicalManager: {
    name: 'Responsável técnica a confirmar',
    crefito: 'CREFITO-3/000000-F',
  },
} as const;

/* Itens do nav principal (Header + MobileNav + Footer), na ordem em que aparecem — fonte
   única para os três, que repetem o mesmo menu (design_handoff_calu/PAGES.md "Rotas Astro
   sugeridas"). */
export const SITE_NAV: NavLink[] = [
  { href: '/servicos', label: 'Serviços' },
  { href: '/equipe', label: 'Equipe' },
  { href: '/duvidas', label: 'Dúvidas' },
  { href: '/contato', label: 'Contato' },
];
