/* Contrato da fonte única de dados da clínica.
   ============================================================================
   `src/lib/site.ts` guarda cada fato UMA vez, na forma estruturada, e deriva toda
   apresentação dele. Esses testes existem para provar que a derivação é de fato
   uma derivação — porque a alternativa (duas digitações do mesmo fato que se
   espera iguais) passa despercebida até o dia em que divergem, e aí o site mostra
   um telefone e disca outro.

   O que NÃO é testado aqui, de propósito: os VALORES. Todos são placeholder até a
   cliente aprovar, e travar valor de placeholder em teste transformaria a troca
   pelo dado real numa falha de suíte. O que se trava é a FORMA e a COERÊNCIA
   interna — as duas coisas que precisam continuar valendo depois da troca. */

import { describe, expect, it } from 'vitest';

import { SITE, SITE_NAV } from '@/lib/site';

describe('SITE — telefone e WhatsApp saem dos mesmos dígitos', () => {
  /* Os três derivam de PHONE_DIGITS, que é privado do módulo. Em vez de exportar o
     interno só para o teste, a checagem reduz cada forma a dígitos e compara: é o
     mesmo invariante, e sobrevive a uma mudança de formatação. */
  const digitsOf = (value: string): string => value.replace(/\D/g, '');

  it('o `tel:` e o `wa.me/` apontam para o mesmo número', () => {
    expect(digitsOf(SITE.phone.href)).toBe(digitsOf(SITE.whatsapp.href));
  });

  it('o rótulo exibido é o mesmo número que o `tel:` disca', () => {
    /* O rótulo é nacional (sem o 55 do DDI); o href é E.164. Compara pelo sufixo. */
    expect(digitsOf(SITE.phone.href).endsWith(digitsOf(SITE.phone.label))).toBe(true);
  });

  it('o `tel:` está em E.164 e o `wa.me/` sem o `+`', () => {
    expect(SITE.phone.href).toMatch(/^tel:\+\d{12,13}$/);
    expect(SITE.whatsapp.href).toMatch(/^https:\/\/wa\.me\/\d{12,13}$/);
  });

  it('o rótulo do WhatsApp é a palavra, nunca o número', () => {
    /* Regra 7 do handoff: telefone ao lado do WhatsApp. Se os dois exibissem o
       número, o par viraria dois números iguais em sequência e a pessoa não saberia
       qual faz o quê. */
    expect(digitsOf(SITE.whatsapp.label)).toBe('');
  });
});

describe('SITE — endereço legível deriva do estruturado', () => {
  it('a linha legível contém cada parte do endereço estruturado', () => {
    const parts = [
      SITE.address.addressLocality,
      SITE.address.addressRegion,
      SITE.address.streetAddress.split(' — ')[0],
    ];
    const missing = parts.filter((part) => !SITE.addressLine.includes(part));
    expect(missing, `partes ausentes na linha legível: ${missing.join(', ')}`).toEqual([]);
  });

  it('o endereço estruturado tem todos os campos que `localBusinessLd` exige', () => {
    const required = [
      'streetAddress',
      'addressLocality',
      'addressRegion',
      'postalCode',
      'addressCountry',
    ] as const;
    const missing = required.filter((key) => !SITE.address[key]);
    expect(missing, `campos de PostalAddress ausentes: ${missing.join(', ')}`).toEqual([]);
  });

  it('o bairro sobrevive à derivação — some do campo, não do endereço', () => {
    /* `neighborhood` não é campo de PostalAddress, então é dobrado no
       `streetAddress`. Se a dobra sumir, o JSON-LD perde o bairro em silêncio. */
    expect(SITE.address.streetAddress).toContain('—');
    expect(SITE.addressLine).toContain(SITE.address.streetAddress.split(' — ')[1]);
  });
});

describe('SITE — horário legível deriva do estruturado', () => {
  it('há uma faixa legível para cada faixa estruturada', () => {
    expect(SITE.hoursLine.split(' · ')).toHaveLength(SITE.openingHours.length);
  });

  it('cada faixa estruturada está no formato schema.org', () => {
    /* 'Mo-Fr 07:00-20:00' — é o que o Google consome. Um formato livre aqui não
       quebra o build nem o teste de JSON-LD, só é ignorado em silêncio. */
    const offenders = SITE.openingHours.filter(
      (range) =>
        !/^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))? \d{2}:\d{2}-\d{2}:\d{2}$/.test(range),
    );
    expect(offenders, `faixas fora do formato schema.org: ${offenders.join(', ')}`).toEqual([]);
  });

  it('a hora legível não tem zero à esquerda', () => {
    /* "das 07h" se lê "zero sete horas" em leitor de tela. O público vai até 75
       anos e parte dele usa leitor — a forma falada é a forma certa. */
    expect(SITE.hoursLine).not.toMatch(/\b0\d h|das 0\d/);
  });
});

describe('SITE_NAV', () => {
  it('não está vazio', () => {
    expect(SITE_NAV.length).toBeGreaterThan(0);
  });

  it('todo href é uma rota interna absoluta', () => {
    const offenders = SITE_NAV.filter((link) => !link.href.startsWith('/'));
    expect(
      offenders.map((l) => l.href),
      'hrefs que não são rota interna',
    ).toEqual([]);
  });

  it('nenhum rótulo se repete', () => {
    const labels = SITE_NAV.map((link) => link.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
