/* Dado pessoal ainda não aprovado — registro central.
   ============================================================================
   O guardrail do projeto (CLAUDE.md) diz duas coisas que parecem brigar entre si:
   "nenhum conteúdo real da clínica antes de aprovado" e "não inventar placeholder
   que pareça real". A Fase 4 precisa das duas valendo ao mesmo tempo, porque é a
   fase em que a copy de verdade é escrita.

   A saída é separar as duas coisas por natureza:

   - **Prosa** (o que a clínica faz, como funciona, o que esperar) é escrita de
     verdade agora. Não afirma nada verificável, então não depende de aprovação.
   - **Identidade** (nome de quem atende, número de registro) NÃO é escrita. Fica
     como marcador declaradamente ausente, aqui, num lugar só.

   Um marcador é reconhecível por construção: começa com `[` e termina com `]`.
   Isso não é estilo — é o que torna a checagem automática possível, e é o que
   `tests/system/placeholders.test.ts` usa para varrer o site construído e imprimir
   o inventário do que ainda falta. Esse inventário É a checklist da troca.

   Quando o dado real chegar, troca-se aqui e o inventário esvazia. */

/** Marcadores canônicos. Quem precisar de um novo, acrescenta AQUI — nunca inline. */
export const PLACEHOLDER = {
  /** Nome de profissional. A `/lab` já usava esta grafia; ela vira a oficial. */
  professionalName: '[Nome da profissional]',
  /** Registro profissional. Mantém a forma real (CREFITO-3/NNNNNN-F) com o número ausente. */
  crefito: 'CREFITO-3/[número]',
  /** Formação de profissional, quando nem a instituição está confirmada. */
  education: '[Formação a confirmar]',
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDER;

/* Um marcador é qualquer trecho entre colchetes. O regex é deliberadamente mais
   largo que a lista acima: um marcador escrito à mão que escapou do registro ainda
   é pego pela varredura, que é o comportamento seguro. Sem `g` — o `lastIndex` de
   um regex global é estado mutável, e um regex de módulo compartilhado com estado
   dá falso negativo alternado entre chamadas. */
const PLACEHOLDER_PATTERN = /\[[^\]]+\]/;

/** `true` se o texto contém marcador de dado ausente. */
export function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERN.test(value);
}

/** Todos os marcadores encontrados no texto, na ordem de aparição. */
export function findPlaceholders(value: string): string[] {
  return value.match(new RegExp(PLACEHOLDER_PATTERN, 'g')) ?? [];
}
