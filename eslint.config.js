// ESLint flat config. `flat/jsx-a11y-recommended` registra as regras de acessibilidade do
// jsx-a11y para os templates `.astro` — daí `eslint-plugin-jsx-a11y` ser peer dependency
// obrigatória, mesmo sem React no projeto.
import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig([
  { ignores: ['dist/', '.astro/', 'node_modules/'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  { files: ['**/*.d.ts'], rules: { '@typescript-eslint/triple-slash-reference': 'off' } },
  prettier, // manter por último: desliga as regras que conflitam com o Prettier
]);
