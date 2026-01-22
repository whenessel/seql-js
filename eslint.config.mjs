import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import vitestGlobals from 'eslint-plugin-vitest-globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    rules: {
      // Умеренная строгость - предупреждения вместо ошибок для стилистических правил
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',

      // Правила именования согласно .ai/ правилам
      '@typescript-eslint/naming-convention': [
        'warn',
        // Классы: PascalCase
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        // Интерфейсы и типы: PascalCase, без префиксов I/T
        {
          selector: ['interface', 'typeAlias'],
          format: ['PascalCase'],
          custom: {
            regex: '^(I|T)[A-Z]',
            match: false,
          },
        },
        // Enum: PascalCase
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        // Enum members: UPPER_SNAKE_CASE
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        // Константы: UPPER_SNAKE_CASE (для всех const)
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['UPPER_CASE', 'camelCase', 'PascalCase'],
        },
        // Переменные и функции: camelCase
        {
          selector: ['variable', 'function', 'parameter'],
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        // Приватные члены класса: могут начинаться с _
        {
          selector: ['classProperty', 'classMethod', 'method'],
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
      ],

      // Другие правила с умеренной строгостью
      'no-console': 'warn',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
  {
    // Конфигурация для тестов без project
    files: ['tests/**/*.ts'],
    plugins: {
      'vitest-globals': vitestGlobals,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...vitestGlobals.environments.env.globals,
      },
    },
    rules: {
      // Умеренная строгость - предупреждения вместо ошибок для стилистических правил
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      'no-console': 'warn',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
  {
    // Разрешить console.log в benchmark тестах
    files: ['tests/integration/benchmark.test.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Отключить все правила ESLint, конфликтующие с Prettier
  eslintConfigPrettier,
  {
    // Игнорируем файлы конфигурации и сгенерированные файлы
    ignores: [
      'dist/**',
      'node_modules/**',
      '.coverage/**',
      '*.d.ts',
      '*.d.cts',
      '*.config.*',
      'vitest.setup.ts',
      'extensions/**',
      'fixtures/**',
    ],
  }
);
