import js from '@eslint/js';
import tseslint from 'angular-eslint';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'docs/**', 'node_modules/**', 'out-tsc/**', 'src/app/**/*.spec.ts', 'check_rules.js'],
  },
  // Apply standard JS recommended rules with browser and node globals
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-undef': 'error',
      'no-unused-vars': 'error',
    },
  },
  // TypeScript, Angular-ESLint TS, & Security rules config for TS files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      '@angular-eslint': tseslint.tsPlugin,
      security: securityPlugin,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...tseslint.configs.tsRecommended.forEach ? {} : tseslint.configs.tsRecommended.rules || {},
      ...securityPlugin.configs.recommended.rules,
      // Disable vanilla JS rules that conflict with TypeScript type system
      'no-undef': 'error', // TypeScript compiler handles undefined variables natively
      'no-unused-vars': 'error', // Handled by @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-unused-vars': 'error', // Enforce unused var check via TS-aware rule
      'security/detect-object-injection': 'error', // Keep security object injection checking active as error!
    },
  },
  // HTML Template rules config for HTML files
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: tseslint.templateParser,
    },
    plugins: {
      '@angular-eslint/template': tseslint.templatePlugin,
    },
    rules: {
      ...tseslint.configs.templateRecommended.rules,
      ...tseslint.configs.templateAccessibility.rules,
    },
  },
];
