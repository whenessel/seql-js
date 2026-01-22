---
name: Ревью naming conventions
overview: Проведен строгий ревью всех файлов в .ai/naming/ на соответствие TypeScript best practices, внутреннюю консистентность и пригодность для публичной библиотеки. Выявлены критические противоречия и отклонения от baseline.
todos:
  - id: fix-constants-object-naming
    content: Унифицировать naming для object constants в constants.md - использовать UPPER_SNAKE_CASE или явно документировать исключение
    status: completed
  - id: sync-temp-variables
    content: Синхронизировать правила для временных переменных между internals.md и variables.md
    status: completed
  - id: unify-class-suffixes
    content: Унифицировать правила для технических суффиксов в classes.md - разрешить или запретить явно
    status: completed
  - id: clarify-generic-verbs
    content: Уточнить правила для generic verbs в functions.md - явно разрешить handle* только для event handlers
    status: completed
  - id: warn-generic-buckets
    content: Добавить предупреждение о generic buckets в directories.md
    status: completed
  - id: define-abbreviations
    content: Определить явный список 'widely accepted' аббревиатур в internals.md
    status: completed
---

# Ревью Naming Conventions

## Общий вердикт: **PASS WITH NOTES**

Документация в целом соответствует TypeScript best practices, но содержит несколько критических противоречий между файлами и отклонений от baseline, которые требуют исправления.

## Резюме

- **Сильные стороны**: Четкая структура, правильные базовые конвенции (camelCase, PascalCase, kebab-case), хорошее разделение public/internal API
- **Критические проблемы**: Противоречия между файлами по константам-объектам, временным переменным, техническим суффиксам
- **Средние проблемы**: Разрешение generic buckets в директориях, generic verbs в функциях, технических суффиксов в классах
- **Риски**: Несогласованность может привести к неправильной интерпретации правил разработчиками и AI-агентами

## Файл-за-файлом ревью

### README.md
**Статус**: OK

- Определяет scope, priority, conflict resolution
- Не переопределяет правила из листовых файлов
- Является авторитетным entry point
- Quick Reference таблица корректна
- Принципы соответствуют best practices

**Замечания**: Нет.

### files.md
**Статус**: OK

- kebab-case для файлов
- Имена отражают primary export
- Избегает аббревиатур
- Тестовые файлы зеркалируют исходные
- Правила четкие и применимые

**Замечания**: Нет.

### directories.md
**Статус**: WARNING

- kebab-case и плюрализация корректны
- **Проблема**: Разрешает generic buckets (`utils/`, `helpers/`), что противоречит baseline best practices
- Baseline требует: "avoid generic buckets (utils, helpers, common)"
- Примеры в строках 13-23 и 62-69 используют `utils/`, что создает противоречие

**Рекомендация**: Добавить явное предупреждение о том, что generic buckets допустимы только для legacy кода, а новые директории должны отражать domain concepts.

### classes.md
**Статус**: ISSUE

- PascalCase и noun-based naming корректны
- **Критическая проблема**: Противоречие в отношении технических суффиксов
  - Строка 9: "No suffixes: Avoid Manager, Helper, Util suffixes"
  - Строки 55-94: Разрешает Service, Processor, Client, Handler суффиксы
  - Строка 44: CacheManager помечен как "acceptable"
- Baseline требует: "no technical suffixes (Manager, Helper, Service)"
- **Проблема**: Разрешает Base/Abstract префиксы (строки 100-104), что является техническим префиксом

**Рекомендация**: Унифицировать правила - либо явно разрешить определенные суффиксы с обоснованием, либо запретить все технические суффиксы. Если разрешаются Service/Processor/Client/Handler, это должно быть обосновано domain-спецификой, а не технической ролью.

### functions.md
**Статус**: WARNING

- camelCase и verb-based naming корректны
- **Проблема**: Разрешает generic verbs `handle*` и `process*` (строки 68-80, 164-172)
- Baseline требует: "avoid vague verbs (handle, process, do)"
- Строки 199-204 запрещают generic verbs, но строки 68-80 и 164-172 их разрешают для event handlers и processing

**Рекомендация**: Уточнить, что `handle*` допустим только для event handlers (специфический паттерн), а `process*` должен быть заменен на более конкретные глаголы (transform, validate, parse и т.д.).

### variables.md
**Статус**: OK

- camelCase, value-based naming, no type encoding - все корректно
- Разрешение коротких имен в малых scope соответствует baseline
- Boolean predicates корректны
- Правила четкие

**Замечания**: Нет.

### constants.md
**Статус**: ISSUE

- UPPER_SNAKE_CASE для примитивов корректно
- **Критическая проблема**: Разрешает PascalCase для object constants (строки 96-107)
  - `ErrorMessages`, `ApiEndpoints` используют PascalCase
  - Это противоречит UPPER_SNAKE_CASE конвенции для констант
- Baseline требует: "UPPER_SNAKE_CASE" без исключений для объектов

**Рекомендация**: Либо использовать `ERROR_MESSAGES`, `API_ENDPOINTS` (UPPER_SNAKE_CASE), либо явно документировать исключение для object constants с обоснованием. Текущее состояние создает противоречие.

### types.md
**Статус**: OK

- PascalCase, no I/T prefixes - корректно
- Suffixes (Options, Result, Config) соответствуют best practices
- Правила для generics, unions, discriminated unions корректны
- Четкое разделение interface vs type alias

**Замечания**: Нет.

### enums.md
**Статус**: OK

- Enum name PascalCase, members UPPER_SNAKE_CASE - корректно
- Правила для string/numeric enums корректны
- Упоминание альтернатив (union types, as const) полезно, но не нарушает naming conventions

**Замечания**: Нет.

### public-api.md
**Статус**: OK

- No abbreviations, no internal jargon, stability requirements - все корректно
- Правила версионирования и депрекации соответствуют best practices
- Требование alignment с документацией критично для spec-driven библиотеки

**Замечания**: Нет.

### internals.md
**Статус**: WARNING

- Разрешение коротких имен в малых scope корректно
- **Проблема**: Разрешает слишком generic имена для временных переменных
  - Строки 84-87: разрешает `temp`, `result`, `value`
  - Baseline требует: "avoid vague names" и "represent value, not type or lifecycle"
  - Это противоречит `variables.md`, который запрещает generic имена
- **Проблема**: Разрешает аббревиатуры для "widely accepted" (строки 162-171), но не определяет четкий список

**Рекомендация**: Синхронизировать с `variables.md` - либо разрешить generic имена только в очень малых scope (1-2 строки), либо запретить полностью. Определить явный список "widely accepted" аббревиатур.

## Отклонения от best practices

### 1. Противоречие: Object Constants Naming
**Файл**: `constants.md`
**Best practice**: UPPER_SNAKE_CASE для всех констант
**Отклонение**: PascalCase для object constants (`ErrorMessages`, `ApiEndpoints`)
**Обоснование**: Не предоставлено. TypeScript community использует оба подхода, но для консистентности нужно выбрать один.

### 2. Противоречие: Technical Suffixes в Classes
**Файл**: `classes.md`
**Best practice**: "no technical suffixes (Manager, Helper, Service)"
**Отклонение**: Разрешает Service, Processor, Client, Handler
**Обоснование**: Частично обосновано domain-спецификой, но создает противоречие с заявленным правилом "No suffixes".

### 3. Противоречие: Generic Verbs в Functions
**Файл**: `functions.md`
**Best practice**: "avoid vague verbs (handle, process, do)"
**Отклонение**: Разрешает `handle*` и `process*` в определенных контекстах
**Обоснование**: `handle*` для event handlers - устоявшийся паттерн, но `process*` должен быть более конкретным.

### 4. Противоречие: Generic Buckets в Directories
**Файл**: `directories.md`
**Best practice**: "avoid generic buckets (utils, helpers, common)"
**Отклонение**: Использует `utils/` в примерах
**Обоснование**: Не предоставлено. Baseline явно запрещает это.

### 5. Противоречие: Temporary Variables между файлами
**Файлы**: `internals.md` vs `variables.md`
**Best practice**: "avoid vague names" и "represent value, not type"
**Отклонение**: `internals.md` разрешает `temp`, `result`, `value`, а `variables.md` их запрещает
**Обоснование**: Отсутствует. Нужна синхронизация.

## Рекомендации по приоритетам

### Приоритет 1 (Критично - противоречия)

1. **Унифицировать naming для object constants** (`constants.md`)
   - Решение A: Использовать `ERROR_MESSAGES`, `API_ENDPOINTS` (UPPER_SNAKE_CASE)
   - Решение B: Явно документировать исключение с обоснованием
   - Рекомендация: Решение A для консистентности

2. **Синхронизировать правила для временных переменных** (`internals.md` и `variables.md`)
   - Запретить `temp`, `result`, `value` везде, кроме очень малых scope (1-2 строки)
   - Или явно разрешить только в `internals.md` с четким определением scope

3. **Унифицировать правила для технических суффиксов** (`classes.md`)
   - Либо явно разрешить Service/Processor/Client/Handler с domain-обоснованием
   - Либо запретить все технические суффиксы
   - Удалить противоречие между строкой 9 и строками 55-94

### Приоритет 2 (Важно - отклонения от baseline)

4. **Уточнить правила для generic verbs** (`functions.md`)
   - Явно разрешить `handle*` только для event handlers
   - Запретить или ограничить `process*` - требовать более конкретные глаголы

5. **Добавить предупреждение о generic buckets** (`directories.md`)
   - Добавить раздел о том, что `utils/`, `helpers/` допустимы только для legacy
   - Новые директории должны отражать domain concepts

6. **Определить список "widely accepted" аббревиатур** (`internals.md`)
   - Явный список: `id`, `url`, `api`, `http`, `html`, `dom`, `ast`
   - Запретить все остальные аббревиатуры

### Приоритет 3 (Улучшения)

7. **Уточнить правила для Base/Abstract префиксов** (`classes.md`)
   - Либо разрешить явно с обоснованием
   - Либо запретить и использовать только concept names

8. **Добавить примеры для AST/parser проектов**
   - В `classes.md`: примеры типа `Parser`, `Tokenizer`, `AstNode`
   - В `functions.md`: примеры типа `parseExpression`, `tokenizeInput`

## Консистентность между файлами

### Обнаруженные противоречия:

1. **constants.md vs baseline**: Object constants используют PascalCase вместо UPPER_SNAKE_CASE
2. **classes.md внутреннее**: Строка 9 запрещает суффиксы, но строки 55-94 их разрешают
3. **internals.md vs variables.md**: Разные правила для временных переменных
4. **directories.md vs baseline**: Разрешает generic buckets, которые baseline запрещает
5. **functions.md внутреннее**: Строки 199-204 запрещают generic verbs, но строки 68-80 их разрешают

### Консистентные области:

- Базовые конвенции (camelCase, PascalCase, kebab-case) согласованы
- Public API правила строгие и последовательные
- Type naming правила соответствуют TypeScript best practices
- Enum naming правила четкие и последовательные

## Пригодность для публичной библиотеки

**Оценка**: Хорошая, с оговорками

- Public API правила (`public-api.md`) строгие и подходят для долгоживущей библиотеки
- Требование alignment с документацией критично для spec-driven проекта
- Версионирование и депрекация документированы
- **Риск**: Противоречия между файлами могут привести к неправильной интерпретации правил

## Пригодность для AST/parser проектов

**Оценка**: Достаточная, но можно улучшить

- Базовые правила применимы
- **Недостаток**: Нет специфических примеров для AST/parser домена
- Рекомендация: Добавить примеры в `classes.md` (Parser, Tokenizer, AstNode) и `functions.md` (parse*, tokenize*)

## Заключение

Документация в целом качественная и соответствует TypeScript best practices, но содержит критические противоречия, которые должны быть устранены для обеспечения консистентности. Особое внимание нужно уделить синхронизации правил между `constants.md`, `classes.md`, `internals.md` и `variables.md`.