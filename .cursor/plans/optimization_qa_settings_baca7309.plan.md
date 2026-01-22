---
name: Корректировка конфигураций с централизацией
overview: Согласование конфигураций Prettier, ESLint и markdownlint с переносом всех списков файлов и исключений в конфигурационные файлы для централизации управления.
todos:
  - id: prettier-config
    content: Удалить overrides для *.md из .prettierrc.json
    status: completed
  - id: prettier-ignore
    content: Добавить *.md в .prettierignore для исключения Markdown из форматирования
    status: in_progress
  - id: prettier-scripts
    content: Упростить скрипты format и format:check в package.json - убрать явные паттерны, использовать .
    status: pending
  - id: markdownlint-config
    content: Убрать extends Prettier из .markdownlint.json и настроить правила самостоятельно
    status: pending
  - id: markdownlint-scripts
    content: Упростить скрипты lint:md и lint:md:fix - убрать явные globs, использовать только конфигурационный файл
    status: pending
---

# Корректировка конфигураций с централизацией

## Цель

Согласовать конфигурации Prettier, ESLint и markdownlint согласно принципу разделения ответственности и централизовать все списки файлов в конфигурационных файлах, убрав их из команд.

## Принципы

- **Prettier**: форматирование кода (TypeScript, JavaScript, JSON) - НЕ Markdown
- **ESLint**: семантика кода (TypeScript/JavaScript)
- **markdownlint**: единственный инструмент для Markdown
- **Централизация**: все паттерны файлов и исключения в конфигурационных файлах, команды без явных списков

## Текущие проблемы

1. **Prettier форматирует Markdown**: в скриптах есть `*.md`
2. **markdownlint команды дублируют конфигурацию**: globs и ignores указаны и в команде, и в `.markdownlint-cli2.json`
3. **Явные паттерны в командах**: нарушают принцип централизации

## План исправлений

### 1. Обновление Prettier конфигурации

**Файл**: `.prettierrc.json`

- Удалить секцию `overrides` для `*.md` файлов
- Prettier будет использовать дефолтное поведение: автоматически ищет все поддерживаемые файлы

**Файл**: `.prettierignore`

- Добавить `*.md` для исключения всех Markdown файлов
- Убедиться, что все исключения централизованы здесь (node_modules, dist, coverage и т.д.)

**Файл**: `package.json` (скрипты)

- `format`: изменить на `prettier --write .` (без явных паттернов, использует .prettierignore)
- `format:check`: изменить на `prettier --check .` (без явных паттернов)

### 2. Обновление markdownlint конфигурации

**Файл**: `.markdownlint.json`

- Удалить `"extends": "markdownlint/style/prettier"` (не нужен, т.к. Prettier не форматирует Markdown)
- Настроить правила самостоятельно:
- `MD013`: отключен (длина строки)
- `MD024`: настроен для разрешения дублирующихся заголовков в разных секциях
- `MD033`, `MD040`, `MD041`: отключены (мелкие проблемы)
- `MD046`: fenced code blocks
- `MD047`: обязательное закрытие файла новой строкой
- Остальные правила по умолчанию включены

**Файл**: `.markdownlint-cli2.json`

- Убедиться, что globs и ignores полностью настроены
- Конфигурация уже содержит все необходимое

**Файл**: `package.json` (скрипты)

- `lint:md`: изменить на `markdownlint-cli2` (без аргументов, использует `.markdownlint-cli2.json`)
- `lint:md:fix`: изменить на `markdownlint-cli2 --fix` (без аргументов)

### 3. Проверка ESLint конфигурации

**Файл**: `eslint.config.mjs`

- Убедиться, что ignores централизованы в конфигурации (уже настроено)
- ESLint работает только с TypeScript/JavaScript файлами через `files: ['**/*.ts', '**/*.tsx']`
- Все исключения в секции `ignores` - конфигурация корректна

### 4. Обновление ignore файлов

**Файл**: `.prettierignore`

- Добавить `*.md`
- Убедиться, что все исключения актуальны

**Файл**: `.eslintignore`

- Проверить, что все исключения актуальны (уже настроено)

**Файл**: `.markdownlintignore`

- Проверить, что все исключения актуальны (уже настроено)

## Результат

После изменений:

- **Prettier**: `prettier .` - использует `.prettierignore` для исключений
- **markdownlint**: `markdownlint-cli2` - использует `.markdownlint-cli2.json` для globs и ignores
- **ESLint**: `eslint .` - использует `eslint.config.mjs` для ignores
- Все паттерны файлов и исключения централизованы в конфигурационных файлах
- Команды простые и не содержат явных списков файлов
- Четкое разделение ответственности между инструментами

## Файлы для изменения

1. `.prettierrc.json` - удалить overrides для Markdown
2. `.prettierignore` - добавить `*.md` и проверить все исключения
3. `package.json` - упростить скрипты (убрать явные паттерны)
4. `.markdownlint.json` - убрать extends Prettier, настроить правила самостоятельно
5. `package.json` - упростить markdownlint команды (использовать только конфигурационный файл)
