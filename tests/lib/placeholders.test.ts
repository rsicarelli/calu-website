/* Contrato do registro de dado pessoal ausente.
   ============================================================================
   O reconhecedor de marcador é o que `tests/system/placeholders.test.ts` usa para
   varrer o site construído. Reconhecedor com bug produz varredura que passa em
   silêncio — a mesma família de defeito do regex de `aspect-ratio` corrigido na
   Fase 2, que aceitava `aspect-video` e recusava `aspect-3/4`. Por isso ele tem
   teste próprio, com casos que não dependem do conteúdo do site. */

import { describe, expect, it } from 'vitest';

import { findPlaceholders, isPlaceholder, PLACEHOLDER } from '@/lib/placeholders';

describe('PLACEHOLDER — o registro', () => {
  it('não está vazio', () => {
    expect(Object.keys(PLACEHOLDER).length).toBeGreaterThan(0);
  });

  it('todo marcador registrado é reconhecido pelo próprio reconhecedor', () => {
    const offenders = Object.entries(PLACEHOLDER).filter(([, value]) => !isPlaceholder(value));
    expect(
      offenders.map(([key]) => key),
      'marcadores que o reconhecedor não pega',
    ).toEqual([]);
  });

  it('o marcador de CREFITO mantém a forma real do registro', () => {
    /* A forma importa: quem for trocar precisa ver onde o número entra. Um
       "[CREFITO a confirmar]" genérico esconderia o formato e daria margem a
       preencher errado. */
    expect(PLACEHOLDER.crefito).toMatch(/^CREFITO-\d\/\[.+\]$/);
  });
});

describe('isPlaceholder', () => {
  it('reconhece texto entre colchetes', () => {
    expect(isPlaceholder('[Nome da profissional]')).toBe(true);
  });

  it('reconhece marcador no meio de uma frase', () => {
    expect(isPlaceholder('Atendimento com [Nome da profissional], fisioterapeuta')).toBe(true);
  });

  it('não acusa prosa comum', () => {
    expect(isPlaceholder('Fisioterapeuta · CREFITO-3/123456-F')).toBe(false);
  });

  it('não acusa colchete vazio', () => {
    /* `[]` não é marcador — é pontuação. Aceitá-lo faria a varredura acusar
       qualquer notação matemática ou trecho de código na copy. */
    expect(isPlaceholder('um par de colchetes [] no texto')).toBe(false);
  });

  it('não guarda estado entre chamadas', () => {
    /* Regex de módulo com a flag `g` mantém `lastIndex` mutável e alterna
       verdadeiro/falso para a MESMA entrada. Este teste falha se alguém acrescentar
       o `g` ao padrão compartilhado. */
    const value = '[Nome da profissional]';
    expect(isPlaceholder(value)).toBe(true);
    expect(isPlaceholder(value)).toBe(true);
    expect(isPlaceholder(value)).toBe(true);
  });
});

describe('findPlaceholders', () => {
  it('devolve lista vazia quando não há marcador', () => {
    expect(findPlaceholders('texto sem marcador nenhum')).toEqual([]);
  });

  it('devolve todos os marcadores, na ordem', () => {
    /* Só a parte entre colchetes é o marcador — o prefixo `CREFITO-3/` é forma
       real e fica de fora, que é o que permite reportar o inventário sem ruído. */
    expect(findPlaceholders('[Nome da profissional] — CREFITO-3/[número]')).toEqual([
      '[Nome da profissional]',
      '[número]',
    ]);
  });

  it('não colapsa dois marcadores adjacentes num só', () => {
    /* `[^\]]+` é não-guloso por construção; um `.+` guloso engoliria de `[` até o
       ÚLTIMO `]` e reportaria um marcador onde há dois. */
    expect(findPlaceholders('[um][dois]')).toEqual(['[um]', '[dois]']);
  });
});
