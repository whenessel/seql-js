---
name: Настройка Prettier и ESLint
overview: Настройка Prettier и ESLint для проекта seql-js в соответствии с правилами из `.ai/` директории, с использованием последних версий библиотек и умеренной строгостью конфигурации.
todos:
  - id: install-deps
    content: 'Установить зависимости: prettier@^3.7.4, eslint@^9.x, typescript-eslint@^8.x, @eslint/js'
    status: completed
  - id: prettier-config
    content: Создать .prettierrc.json с настройками форматирования (2 spaces, single quotes, semicolons, trailing commas)
    status: completed
  - id: prettier-ignore
    content: Создать .prettierignore для исключения node_modules, dist, coverage и других сгенерированных файлов
    status: completed
  - id: eslint-config
    content: Создать eslint.config.mjs с flat config, базовыми правилами и умеренной строгостью
    status: completed
  - id: eslint-ignore
    content: Создать .eslintignore для исключения ненужных файлов
    status: completed
  - id: package-scripts
    content: Добавить скрипты format, format:check, lint, lint:fix в package.json
    status: completed
---

# Настройка Prettier и ESLint для seql-js

## Цель

Настроить инструменты форматирования и линтинга кода в соответствии с правилами из `.ai/` директории, используя последние версии библиотек и умеренную строгость конфигурации.

## Анализ требований

### Правила из `.ai/` и `docs/contributing/code-style.md`

- **Форматирование**: 2 spaces, single quotes, semicolons required, trailing commas в multi-line
- **Именование**:
- Файлы: kebab-case
- Классы: PascalCase
- Функции/переменные: camelCase
- Константы: UPPER_SNAKE_CASE
- Типы: PascalCase (без префиксов I/T)
- **TypeScript**: strict mode, prefer interfaces over types, avoid `any`

## План реализации

### 1. Установка зависимостей

Добавить в `package.json` devDependencies:

- `prettier@^3.7.4` - форматирование кода
- `eslint@^9.x` - линтинг (flat config)
- `typescript-eslint@^8.x` - поддержка TypeScript для ESLint
- `@eslint/js` - базовая конфигурация ESLint

### 2. Конфигурация Prettier

Создать `.prettierrc.json` с настройками:

- `tabWidth: 2` - 2 пробела для отступов
- `useTabs: false` - использовать пробелы
- `singleQuote: true` - одинарные кавычки
- `semi: true` - точки с запятой обязательны
- `trailingComma: 'es5'` - trailing commas для совместимости
- `printWidth: 100` - ширина строки (стандартное значение)
- `arrowParens: 'always'` - всегда скобки для стрелочных функций

Создать `.prettierignore` для исключения:

- `node_modules/`, `dist/`, `coverage/`, `*.d.ts`, сгенерированные файлы

### 3. Конфигурация ESLint (Flat Config)

Создать `eslint.config.mjs` с:

- Базовой конфигурацией `@eslint/js`
- Рекомендуемой конфигурацией `typescript-eslint`
- Правилами для именования (camelCase, PascalCase, UPPER_SNAKE_CASE)
- Умеренной строгостью (warn вместо error для мелких проблем)
- Игнорированием некоторых правил для упрощения

Основные правила:

- `@typescript-eslint/naming-convention` - для проверки именования
- Отключение слишком строгих правил (например, `@typescript-eslint/explicit-function-return-type`)
- Предупреждения вместо ошибок для стилистических правил

Создать `.eslintignore` для исключения:

- `node_modules/`, `dist/`, `coverage/`, сгенерированные файлы

### 4. Скрипты в package.json

Добавить скрипты:

- `format` - форматирование всех файлов через Prettier
- `format:check` - проверка форматирования без изменений
- `lint` - проверка кода через ESLint
- `lint:fix` - автоматическое исправление проблем ESLint

### 5. Интеграция с существующим workflow

Конфигурация будет работать с существующими инструментами:

- TypeScript (`tsconfig.json`)
- Vitest (тесты)
- Vite (сборка)

## Файлы для создания/изменения

1. **Новые файлы**:

- `.prettierrc.json` - конфигурация Prettier
- `.prettierignore` - исключения для Prettier
- `eslint.config.mjs` - конфигурация ESLint (flat config)
- `.eslintignore` - исключения для ESLint

2. **Изменения**:

- `package.json` - добавление зависимостей и скриптов

## Особенности конфигурации

- **Умеренная строгость**: большинство стилистических правил будут выдавать предупреждения, а не ошибки
- **Игнорирование мелких проблем**: некоторые правила отключены или настроены на предупреждения
- **Совместимость**: конфигурация не конфликтует с существующими инструментами проекта
- **Автоматическое исправление**: поддержка `--fix` для автоматического исправления проблем

## Проверка после настройки

После установки и настройки рекомендуется:

1. Запустить `yarn format` для форматирования всего кода
2. Запустить `yarn lint` для проверки линтинга
3. При необходимости запустить `yarn lint:fix` для автоматического исправления
