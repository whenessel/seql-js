# План исправления генерации CSS селекторов для корневых элементов DOM

## Проблема

Система EID не генерирует корректные CSS селекторы для корневых элементов DOM (html, head, meta и других элементов внутри head).

**Текущее поведение:**
- Для `<html>`: anchor = body → селектор = `body html` ❌ (неправильно, html — родитель body)
- Для `<head>`: anchor = body → селектор = `body head` ❌ (неправильно, head — sibling body)
- Для `<meta>` в head: anchor = body → селектор = `body meta` ❌ (неправильно, meta не в body)
- Результат: `document.querySelectorAll(selector)` возвращает пустой массив

**Требуемое поведение:**
- Для `<html>`: селектор = `html`
- Для `<head>`: селектор = `html > head`
- Для `<meta>` в head: селектор = `html > head > meta[name="..."]`

## Корневая причина

Выявлены три структурные проблемы:

1. **anchor-finder.ts:49** — поиск anchor начинается с `target.parentElement`, поэтому сам target никогда не рассматривается как anchor. Для `<html>` parentElement = null, поэтому anchor не находится.

2. **anchor-finder.ts:54-66** — алгоритм останавливается на `<body>`, считая его корнем. Это не позволяет найти anchor для элементов выше body (html, head и их потомков).

3. **css-generator.ts:99-145** — генератор селекторов конкатенирует anchor и target без проверки, что target является потомком anchor. Результат: неправильные селекторы типа `body html`.

## Архитектурное решение

**Подход:** Специальная обработка корневых элементов (Special Case Root Elements)

Добавляем явные проверки для html, head и элементов внутри head **до** начала обычной логики поиска anchor. Это:
- Сохраняет семантическую модель anchor→path→target для 99% случаев
- Не ломает существующие EID
- Дает очевидно правильные CSS селекторы
- Требует средней сложности реализации

## Критические файлы для изменения

### 1. `src/utils/constants.ts`
**Изменение:** Добавить константы для корневых элементов

```typescript
export const ROOT_ELEMENTS = new Set(['html', 'head', 'body']);
export const HEAD_ELEMENTS = new Set([
  'title', 'meta', 'link', 'style', 'script', 'base', 'noscript'
]);
```

### 2. `src/generator/anchor-finder.ts`
**Изменение:** Добавить специальную обработку в начало метода `findAnchor()` (строка 49)

**До начала цикла `while (current && depth < this.maxDepth)` добавить:**
- Проверка: если target = `<html>` → вернуть `{ element: target, score: 1.0, tier: 'A', depth: 0 }`
- Проверка: если target = `<head>` или внутри head → вернуть `{ element: htmlElement, score: 1.0, tier: 'A', depth: 0 }`
- Проверка: если target = `<body>` → вернуть `{ element: htmlElement, score: 1.0, tier: 'A', depth: 0 }`

**Добавить приватный метод:**
```typescript
private isInsideHead(element: Element): boolean {
  let current: Element | null = element.parentElement;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'head') return true;
    if (tag === 'body') return false;
    current = current.parentElement;
  }
  return false;
}
```

### 3. `src/generator/path-builder.ts`
**Изменение:** Добавить специальную обработку в начало метода `buildPath()`

**В начале метода добавить проверки:**
- Если anchor = html и target = head/body → вернуть `{ path: [], degraded: false }`
- Если anchor = html и target внутри head → вызвать `buildHeadPath()`

**Добавить валидацию в конце существующего while-цикла:**
```typescript
if (current !== anchor) {
  console.warn('[PathBuilder] Target is not a descendant of anchor');
  return { path: [], degraded: true, degradationReason: 'target-not-descendant-of-anchor' };
}
```

**Добавить приватный метод:**
```typescript
private buildHeadPath(
  htmlElement: Element,
  target: Element,
  extractor: SemanticExtractor
): PathBuildResult {
  // Строит путь html → head → ... → target
  // Всегда включает head в path
}
```

### 4. `src/resolver/css-generator.ts`
**Изменение:** Добавить специальную обработку в начало метода `buildSelector()` (строка 73)

**В самом начале метода добавить проверки:**
- Если target = `html` → вернуть `'html'`
- Если anchor = html и path пустой (head/body) → вернуть `'html > ${targetSelector}'`
- Если anchor = html и path[0] = head → вызвать `buildHeadSelector()`

**Добавить приватный метод:**
```typescript
private buildHeadSelector(
  eid: ElementIdentity,
  options?: BuildSelectorOptions
): string | BuildSelectorResult {
  // Генерирует 'html > head > ... > target'
  // Использует child combinator (>) для строгой структуры
}
```

### 5. `src/generator/generator.ts`
**Изменение:** Добавить fast-path для html в начало функции `generateEID()` (строка 18)

**После проверки кэша добавить:**
```typescript
const targetTag = target.tagName.toLowerCase();

if (targetTag === 'html') {
  const semanticExtractor = new SemanticExtractor(opts, cache);
  const htmlEID = generateHtmlEID(target, opts, semanticExtractor, cache);
  cache.setEID(target, htmlEID);
  return htmlEID;
}
```

**Добавить функцию в конец файла:**
```typescript
function generateHtmlEID(
  htmlElement: Element,
  options: ...,
  extractor: SemanticExtractor,
  cache: EIDCache
): ElementIdentity {
  // Генерирует EID где anchor = target = html
  // confidence = 1.0, degraded = false
}
```

## Порядок реализации

1. **Фаза 1:** Добавить константы в `constants.ts`
2. **Фаза 2:** Обновить `anchor-finder.ts` — специальная обработка + метод `isInsideHead()`
3. **Фаза 3:** Обновить `path-builder.ts` — специальная обработка + метод `buildHeadPath()` + валидация
4. **Фаза 4:** Обновить `css-generator.ts` — специальная обработка + метод `buildHeadSelector()`
5. **Фаза 5:** Обновить `generator.ts` — fast-path для html + функция `generateHtmlEID()`
6. **Фаза 6:** Написать тесты для проверки всех случаев

## Тестирование

### Unit тесты (новый файл `tests/unit/root-elements.test.ts`)

**Проверить:**
- ✅ `generateEID(document.documentElement)` возвращает валидный EID
- ✅ CSS селектор для html = `'html'`
- ✅ `generateEID(document.head)` возвращает anchor = html, path = []
- ✅ CSS селектор для head содержит `'html'` и `'head'`
- ✅ `generateEID(metaElement)` возвращает anchor = html, path содержит head
- ✅ CSS селектор для meta корректно резолвится через querySelector
- ✅ Множественные meta различаются по атрибутам

### Integration тесты (новый файл `tests/integration/root-elements.test.ts`)

**Проверить round-trip (generate → resolve):**
- ✅ html элемент
- ✅ head элемент
- ✅ meta элементы с корректной disambiguation
- ✅ Сложная структура head с title, meta, link, script

### Проверка регрессии

- ✅ Все существующие тесты проходят без изменений
- ✅ Производительность не ухудшилась (< 1% overhead)

## Критерии успеха

1. CSS селектор для `<html>` = `'html'` и находит элемент
2. CSS селектор для `<head>` включает html и head, находит элемент
3. CSS селектор для `<meta>` в head корректно резолвится
4. Все существующие тесты проходят
5. Новые unit и integration тесты покрывают все случаи
6. Нет breaking changes для существующих EID

## Edge cases

- **Disconnected элементы:** Уже обрабатывается через `isConnected` проверку → null
- **iframes:** Работают через `ownerDocument` без изменений
- **SVG в head:** Обрабатывается через `isInsideHead()` корректно
- **Shadow DOM:** Вне scope (отдельная фича)
- **Malformed HTML:** Обрабатываем по фактической DOM структуре

## Риски

| Риск | Вероятность | Митигация |
|------|------------|-----------|
| Ломается существующий код | Низкая | Только аддитивные изменения, полное покрытие тестами |
| Неправильные селекторы | Средняя | Валидация через querySelector в тестах |
| Производительность | Низкая | Бенчмарки до/после, early exits |

## Обратная совместимость

✅ **Нет breaking changes** — реализация чисто аддитивная:
- Существующие EID для элементов в body работают без изменений
- Добавляется только поддержка ранее неподдерживаемых элементов
- Структура EID не меняется

## Стиль кодирования и именование

Весь код должен следовать правилам из `.ai/README.md`:

### Именование

**Константы** (UPPER_SNAKE_CASE):
```typescript
const ROOT_ELEMENTS = new Set(['html', 'head', 'body']);
const HEAD_ELEMENTS = new Set(['title', 'meta', 'link', ...]);
```

**Функции** (camelCase, verb-based):
- ✅ Разрешено: `buildHeadPath()`, `isInsideHead()`, `generateHtmlEID()`
- ✅ Используем: `build*`, `generate*`, `is*`, `validate*`
- ❌ Запрещено: `processHead()`, `handleHead()` (слишком общие глаголы)

**Классы** (PascalCase, noun-based):
- Существующие классы: `AnchorFinder`, `PathBuilder`, `CssGenerator` — уже следуют стилю
- Запрещено добавлять: `*Manager`, `*Helper`, `*Util` суффиксы

**Переменные** (camelCase):
```typescript
const targetTag = target.tagName.toLowerCase();
const anchorElement = anchorResult?.element;
```

### Документация (TSDoc)

Все публичные методы должны иметь JSDoc комментарии:

```typescript
/**
 * Checks if element is inside <head> section.
 * Stops at <body> to avoid false positives.
 * @param element - Element to check
 * @returns True if element is inside head, false otherwise
 * @remarks
 * Traverses up the DOM tree until finding head or body.
 * Returns false if body is encountered first.
 * @example
 * const meta = document.querySelector('meta');
 * if (isInsideHead(meta)) { ... }
 */
private isInsideHead(element: Element): boolean { ... }
```

**Обязательные теги:**
- `@param` — для каждого параметра
- `@returns` — для non-void функций
- `@throws` — если функция может выбросить исключение
- `@remarks` — для важных нюансов
- `@example` — минимальный рабочий пример

### Форматирование

- Английский язык для всех идентификаторов и комментариев
- ASCII only, без Unicode символов в именах
- Без аббревиатур (используем `element`, не `el`; `target`, не `tgt`)
- Консистентность: одинаковые паттерны для похожих сущностей

## Обязательное тестирование и проверка регрессии

### Стратегия тестирования

**Уровень 1: Unit тесты** (файл: `tests/unit/root-elements.test.ts`)

Минимум 20 тестов, покрывающих:

1. **HTML element** (5 тестов):
   - Генерация EID для html
   - CSS селектор для html = 'html'
   - Резолв html элемента
   - Confidence = 1.0
   - Degraded = false

2. **HEAD element** (5 тестов):
   - Генерация EID для head
   - Anchor = html
   - CSS селектор содержит 'html' и 'head'
   - Резолв head элемента
   - Path = []

3. **Elements in HEAD** (7 тестов):
   - Генерация EID для meta
   - Path содержит head
   - CSS селектор валидный
   - Резолв meta элемента
   - Disambiguation между несколькими meta
   - Title элемент
   - Link элемент

4. **BODY element** (3 тестов):
   - Генерация EID для body
   - Anchor = html (новая логика)
   - CSS селектор корректный

**Уровень 2: Integration тесты** (файл: `tests/integration/root-elements.test.ts`)

Минимум 10 тестов, покрывающих:

1. **Round-trip тесты** (generateEID → resolve):
   - html элемент
   - head элемент
   - body элемент
   - meta с уникальным name
   - meta без name (по nth-child)
   - title элемент
   - link элемент
   - script в head

2. **Комплексные сценарии**:
   - Множественные meta с разными атрибутами
   - Сложная структура head (title + meta + link + script)
   - Nested elements в head

**Уровень 3: Regression тесты**

Все существующие тесты **должны пройти без изменений**:

```bash
# Запустить ВСЕ тесты перед коммитом
yarn test

# Проверить coverage (должен быть ≥ 80%)
yarn test:coverage

# Запустить только новые тесты
yarn vitest run tests/unit/root-elements.test.ts
yarn vitest run tests/integration/root-elements.test.ts
```

**Критерии успешной регрессии:**
- ✅ Все тесты в `tests/generator.test.ts` проходят
- ✅ Все тесты в `tests/resolver.test.ts` проходят
- ✅ Все тесты в `tests/css-generator.test.ts` проходят
- ✅ Coverage не ухудшился (остается ≥ 80%)
- ✅ Performance не ухудшился (< 1% overhead)

### Обязательные проверки перед коммитом

**Чеклист:**
1. ☐ Все unit тесты проходят (`yarn test`)
2. ☐ Все integration тесты проходят
3. ☐ Новые тесты добавлены (≥ 30 тестов)
4. ☐ Coverage ≥ 80% для новых файлов
5. ☐ Нет регрессии в существующих тестах
6. ☐ Type checking проходит (`yarn types:check`)
7. ☐ Build проходит (`yarn build`)
8. ☐ Все функции документированы (TSDoc)
9. ☐ Код следует стилю из `.ai/README.md`
10. ☐ Нет `console.log` или `debugger`

### Performance benchmarks

Создать benchmark тесты (файл: `tests/benchmarks/root-elements.bench.ts`):

```typescript
import { bench, describe } from 'vitest';
import { generateEID } from '../../src/generator/generator';

describe('Root Elements Performance', () => {
  bench('generateEID for regular button', () => {
    const button = document.querySelector('button')!;
    generateEID(button);
  });

  bench('generateEID for html element', () => {
    generateEID(document.documentElement);
  });

  bench('generateEID for meta in head', () => {
    const meta = document.querySelector('meta')!;
    generateEID(meta);
  });
});
```

**Требования к performance:**
- HTML element: < 0.5ms (fast-path)
- HEAD element: < 1ms
- META element: < 2ms
- Регрессия для body elements: < 1%

---

**Оценка:** ~6-8 часов разработки + 4-6 часов тестирования + 2 часа документации
