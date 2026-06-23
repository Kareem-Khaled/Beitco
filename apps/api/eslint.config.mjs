// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// OPS-1: ESLint 9 flat config for the NestJS API. Type-aware where it's cheap,
// pragmatic where Nest's decorator/DI patterns fight strict rules. `_unported/`
// (pre-pivot, build-excluded) and generated/dist output are ignored.
export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'src/_unported', 'prisma/migrations', 'coverage'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest },
    },
    rules: {
      // Nest DI + Prisma `Record<string, unknown>` serializers make a handful of
      // casts unavoidable; keep `any` a warning (the code already has 0 in src).
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused vars: error, but allow leading-underscore intentional ignores.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      // `!` non-null assertions are used deliberately after presence checks
      // (e.g. findRow!, validateEnv-guaranteed config).
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Empty catch blocks are used intentionally (best-effort paths).
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
);
