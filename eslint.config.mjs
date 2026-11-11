import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'docs/**',
      'specs/**',
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/generated/**',
      '.local/**',
      'packages/api-client/src/schema.d.ts',
      'apps/web/next-env.d.ts',
      'scripts/validate-*.mjs',
      'scripts/check-spec-coverage.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['@apnatown/*/src/*', '**/packages/*/src/*'] },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@apnatown/ui',
            '@apnatown/ui/*',
            '@apnatown/api-client',
            '@apnatown/api-client/*',
            '@apnatown/*/src/*',
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/src/**/*.ts'],
    ignores: [
      'apps/api/src/**/infrastructure/**',
      'apps/api/src/shared/persistence/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@prisma/*',
            '**/generated/prisma/*',
            '@apnatown/ui',
            '@apnatown/ui/*',
            '@apnatown/api-client',
            '@apnatown/api-client/*',
            '@apnatown/*/src/*',
          ],
        },
      ],
    },
  },
  {
    files: ['packages/shared/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['@nestjs/*', '@prisma/*', 'node:*', '@apnatown/ui*'] },
      ],
    },
  },
  prettier,
);
