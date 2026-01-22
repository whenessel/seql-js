# 🔧 ИНСТРУКЦИЯ: Исправление фильтрации отрицательных Tailwind классов

## 📊 ДИАГНОСТИКА ПРОБЛЕМЫ

### Корневая причина

Фильтр классов **НЕ распознает** Tailwind утилиты с **ведущим дефисом** (отрицательные значения) как нестабильные классы.

### Проблемный сценарий

```html
<div class="absolute -bottom-6 -left-6 w-2/3 rounded-2xl overflow-hidden shadow-xl">
  <img src="..." alt="Luxury apartment interior" />
</div>
```

### Текущее поведение (❌ НЕПРАВИЛЬНО)

1. **Генератор EID** включает `-bottom-6` и `-left-6` в семантику элемента
2. **Генератор SEQL** создает селектор: `div.-bottom-6.-left-6#2`
3. **Парсер SEQL** не может разобрать классы с ведущим дефисом
4. **Ошибка**: `Invalid node: unexpected content ".-bottom-6.-left-6#2"`

### Ожидаемое поведение (✅ ПРАВИЛЬНО)

1. **Фильтр классов** должен отфильтровать ВСЕ утилитарные классы: `absolute`, `-bottom-6`, `-left-6`, `w-2/3`, `rounded-2xl`, `overflow-hidden`, `shadow-xl`
2. **Генератор SEQL** не должен включать утилиты в селектор
3. **Результат**: `div#2` (без утилитарных классов)

---

## 🎯 РЕШЕНИЕ

### Файл 1: `src/utils/class-classifier.ts`

**Где**: После строки 91 (после существующих Tailwind паттернов)

**Добавить** следующие паттерны в массив `UTILITY_CLASS_PATTERNS`:

```typescript
// === Negative Tailwind utilities (margins, positioning, z-index, spacing) ===
/^-[mp][trblxy]?-\d+$/,           // -m-4, -mt-2, -mx-4, -px-4, -py-2
/^-(top|right|bottom|left|inset)-\d+$/,  // -top-4, -bottom-6, -left-6, -inset-0
/^-z-\d+$/,                        // -z-10, -z-20
/^-space-[xy]-\d+$/,               // -space-x-2, -space-y-4
/^-translate-[xy]-\d+$/,           // -translate-x-4, -translate-y-2
/^-rotate-\d+$/,                   // -rotate-45, -rotate-90
/^-scale-\d+$/,                    // -scale-50, -scale-75
/^-skew-[xy]-\d+$/,                // -skew-x-12, -skew-y-6
```

**Контекст для вставки**:

```typescript
// === Spacing (Tailwind) ===
/^(gap|space)-/,
/^[mp][trblxy]?-(\d+|auto|px)$/,

// === ДОБАВИТЬ ЗДЕСЬ НОВЫЕ ПАТТЕРНЫ ===

// === Sizing ===
/^(w|h|min-w|min-h|max-w|max-h|size)-/,
```

---

### Файл 2: `tests/unit/class-classifier.test.ts`

**Где**: После строки 111 (в блоке `describe('isUtilityClass')`)

**Добавить** новый тест-кейс:

```typescript
it('should detect negative Tailwind utility classes (margins, positioning)', () => {
  // Negative margins
  expect(isUtilityClass('-m-4')).toBe(true);
  expect(isUtilityClass('-mt-2')).toBe(true);
  expect(isUtilityClass('-mx-4')).toBe(true);
  expect(isUtilityClass('-mb-6')).toBe(true);
  expect(isUtilityClass('-py-2')).toBe(true);

  // Negative positioning
  expect(isUtilityClass('-top-4')).toBe(true);
  expect(isUtilityClass('-bottom-6')).toBe(true);
  expect(isUtilityClass('-left-6')).toBe(true);
  expect(isUtilityClass('-right-8')).toBe(true);
  expect(isUtilityClass('-inset-0')).toBe(true);

  // Negative z-index
  expect(isUtilityClass('-z-10')).toBe(true);
  expect(isUtilityClass('-z-20')).toBe(true);

  // Negative spacing
  expect(isUtilityClass('-space-x-2')).toBe(true);
  expect(isUtilityClass('-space-y-4')).toBe(true);

  // Negative transforms
  expect(isUtilityClass('-translate-x-4')).toBe(true);
  expect(isUtilityClass('-translate-y-2')).toBe(true);
  expect(isUtilityClass('-rotate-45')).toBe(true);
  expect(isUtilityClass('-scale-50')).toBe(true);
  expect(isUtilityClass('-skew-x-12')).toBe(true);
});
```

---

### Файл 3: `tests/integration/negative-tailwind-filter.test.ts` (НОВЫЙ)

**Создать** новый интеграционный тест:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { generateEID, stringifySEQL, parseSEQL, resolve } from '../../src';

describe('Negative Tailwind classes filtering', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <section id="welcome">
            <div class="container">
              <div class="absolute -bottom-6 -left-6 w-2/3 rounded-2xl overflow-hidden shadow-xl">
                <img src="https://example.com/image.jpg" alt="Luxury apartment interior" class="w-full h-full object-cover">
              </div>
            </div>
          </section>
        </body>
      </html>
    `);
    document = dom.window.document;
  });

  it('should filter out negative Tailwind utility classes from EID', () => {
    const img = document.querySelector('img')!;
    const eid = generateEID(img);

    expect(eid).not.toBeNull();

    // Проверяем, что родитель с классами -bottom-6, -left-6 НЕ содержит эти классы в семантике
    const pathNode = eid!.path.find((node) => node.tag === 'div');

    if (pathNode?.semantics.classes) {
      // Все Tailwind утилиты должны быть отфильтрованы
      expect(pathNode.semantics.classes).not.toContain('absolute');
      expect(pathNode.semantics.classes).not.toContain('-bottom-6');
      expect(pathNode.semantics.classes).not.toContain('-left-6');
      expect(pathNode.semantics.classes).not.toContain('w-2/3');
      expect(pathNode.semantics.classes).not.toContain('rounded-2xl');
      expect(pathNode.semantics.classes).not.toContain('overflow-hidden');
      expect(pathNode.semantics.classes).not.toContain('shadow-xl');
    }
  });

  it('should not include negative Tailwind classes in SEQL selector', () => {
    const img = document.querySelector('img')!;
    const seql = stringifySEQL(generateEID(img)!);

    // SEQL селектор НЕ должен содержать утилитарные классы
    expect(seql).not.toContain('.-bottom-6');
    expect(seql).not.toContain('.-left-6');
    expect(seql).not.toContain('.absolute');
    expect(seql).not.toContain('.w-2');
    expect(seql).not.toContain('.rounded');
    expect(seql).not.toContain('.overflow');
    expect(seql).not.toContain('.shadow');
  });

  it('should successfully parse and resolve SEQL without utility classes', () => {
    const img = document.querySelector('img')!;
    const eid = generateEID(img);
    const seql = stringifySEQL(eid!);

    // Парсинг должен успешно пройти (без ошибок)
    expect(() => parseSEQL(seql)).not.toThrow();

    const parsedEid = parseSEQL(seql);
    expect(parsedEid).not.toBeNull();

    // Резолв должен найти элемент
    const result = resolve(parsedEid, document);
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]).toBe(img);
  });

  it('should filter various negative Tailwind utilities', () => {
    const testCases = [
      { classes: ['-m-4', '-mt-2'], shouldBeEmpty: true },
      { classes: ['-top-4', '-bottom-6', '-left-6'], shouldBeEmpty: true },
      { classes: ['-z-10', '-z-20'], shouldBeEmpty: true },
      { classes: ['-space-x-2', '-space-y-4'], shouldBeEmpty: true },
      { classes: ['semantic-class', '-mt-4', 'button-primary'], shouldBeEmpty: false },
    ];

    for (const { classes, shouldBeEmpty } of testCases) {
      const html = `<div class="${classes.join(' ')}"></div>`;
      const testDom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`);
      const testDoc = testDom.window.document;
      const div = testDoc.querySelector('div')!;

      const eid = generateEID(div);
      const remainingClasses = eid?.target.semantics.classes || [];

      if (shouldBeEmpty) {
        // Все утилиты должны быть отфильтрованы
        expect(remainingClasses.length).toBe(0);
      } else {
        // Семантические классы должны остаться
        expect(remainingClasses).toContain('semantic-class');
        expect(remainingClasses).toContain('button-primary');
        expect(remainingClasses).not.toContain('-mt-4');
      }
    }
  });
});
```

---

## ✅ КРИТЕРИИ УСПЕХА

После внесения исправлений:

1. ✅ Все отрицательные Tailwind классы распознаются как утилиты
2. ✅ Фильтр `filterStableClasses()` исключает эти классы
3. ✅ SEQL селекторы НЕ содержат утилитарные классы
4. ✅ Парсер успешно разбирает селекторы (нет классов с дефисом)
5. ✅ Резолвер находит элементы в DOM
6. ✅ Все тесты проходят (220+ тестов)

---

## 🧪 ПРОВЕРКА

### 1. Запустить тесты

```bash
# Unit тесты классификатора
yarn test tests/unit/class-classifier.test.ts

# Новый интеграционный тест
yarn test tests/integration/negative-tailwind-filter.test.ts

# Все тесты
yarn test
```

### 2. Браузерный тест

```bash
# Открыть https://appsurify.github.io/modern-seaside-stay/
# Выполнить SEQLJsBrowserTestSuite.js на элементе:
# XPath: /html/body/div/div[2]/main/section[2]/div/div/div[2]/div[2]/img
```

**Ожидаемый результат**:

```
✅ EID успешно сгенерирован
✅ SEQL string сгенерирован (БЕЗ утилитарных классов)
✅ Парсинг SEQL успешен
✅ Элемент найден в DOM
```

### 3. Ручная проверка

```javascript
// В консоли браузера
const { filterStableClasses, isUtilityClass } = window.SeqlJS;

// Проверить конкретные классы
console.log(isUtilityClass('-bottom-6')); // Должно быть: true
console.log(isUtilityClass('-left-6')); // Должно быть: true
console.log(isUtilityClass('absolute')); // Должно быть: true

// Проверить фильтрацию
const classes = ['absolute', '-bottom-6', '-left-6', 'semantic-name'];
const filtered = filterStableClasses(classes);
console.log(filtered); // Должно быть: ['semantic-name']
```

---

## 📝 ДОПОЛНИТЕЛЬНО: Обратная совместимость парсера (опционально)

Если необходимо поддержать **обратную совместимость** со старыми SEQL селекторами, содержащими классы с дефисом, можно также исправить парсер:

### Файл: `src/utils/seql-parser.ts` (строка 456)

**Заменить**:

```typescript
while ((classMatch = remaining.match(/^\.([a-zA-Z][a-zA-Z0-9-_]*)/))) {
```

**На**:

```typescript
while ((classMatch = remaining.match(/^\.(-?[a-zA-Z][a-zA-Z0-9-_]*)/))) {
```

**Объяснение**: Добавляет поддержку опционального ведущего дефиса `-?` в regex паттерне для классов.

**НО**: Это исправление вторично, так как после исправления фильтра классов, утилиты с дефисом вообще не попадут в SEQL селектор.

---

## 🎯 ПРИОРИТЕТ ИСПРАВЛЕНИЙ

1. **ВЫСОКИЙ**: Исправить фильтр классов (`class-classifier.ts`)
2. **ВЫСОКИЙ**: Добавить unit тесты
3. **СРЕДНИЙ**: Добавить integration тесты
4. **НИЗКИЙ**: Исправить парсер (для обратной совместимости)

---

## 📚 СВЯЗАННЫЕ ФАЙЛЫ

- `src/utils/class-classifier.ts` - Классификация и фильтрация классов
- `src/utils/class-filter.ts` - Обертка над классификатором
- `src/generator/index.ts` - Использует фильтр классов при генерации EID
- `src/utils/seql-parser.ts` - Парсинг SEQL селекторов
- `tests/unit/class-classifier.test.ts` - Тесты классификатора
- `LEADING_DASH_FIX_DEMO.md` - Документация по экранированию дефиса в CSS

---

## ⚠️ ВАЖНЫЕ ПРИМЕЧАНИЯ

1. **Утилитарные классы** (Tailwind, Bootstrap) НЕ должны использоваться в SEQL селекторах по спецификации
2. **Причина**: Утилиты нестабильны, меняются при рефакторинге дизайна
3. **SEQL селекторы** должны опираться на семантические, стабильные классы
4. **Отрицательные классы** (`-mt-4`, `-bottom-6`) - это такие же утилиты, как и положительные (`mt-4`, `bottom-6`)

---

## 🚀 ГОТОВО К РАБОТЕ

Инструкция готова для передачи AI агенту или для ручного исправления!
