# Manual Diagnostic Guide

## Quick Diagnosis

### Симптом

```
Error: Invalid node: unexpected content ".glass-card#2" in "form[data-seql-id="seql-el-17"].glass-card#2"
```

### Root Cause

Генератор создает: `tag[attrs].class#pos`  
Парсер ожидает: `tag.class[attrs]#pos`

## Step-by-Step Manual Fix

### 1. Откройте файл

```
/src/utils/seql-parser.ts
```

### 2. Найдите функцию `stringifyNode` (~строка 221)

### 3. Найдите эти два блока кода

**Блок A - Добавление атрибутов (сейчас идет ПЕРВЫМ):**

```typescript
if (finalAttrs.length > 0) {
  finalAttrs.sort((a, b) => a.localeCompare(b));
  result += `[${finalAttrs.join(',')}]`; // <-- Строка ~304
}
```

**Блок B - Добавление классов (сейчас идет ВТОРЫМ):**

```typescript
if (semantics.classes && semantics.classes.length > 0) {
  const stableClasses = filterStableClasses(semantics.classes);
  // ... код фильтрации ...
  result += limitedClasses.map((c) => `.${c}`).join(''); // <-- Строка ~320
}
```

### 4. Поменяйте блоки местами

**ДО (неправильно):**

```
tag
↓
prepare attributes
↓
ADD ATTRIBUTES  ← Блок A
↓
ADD CLASSES     ← Блок B
↓
ADD POSITION
```

**ПОСЛЕ (правильно):**

```
tag
↓
prepare attributes
↓
ADD CLASSES     ← Блок B (переместить вверх)
↓
ADD ATTRIBUTES  ← Блок A (переместить вниз)
↓
ADD POSITION
```

### 5. Важно

⚠️ **НЕ МЕНЯЙТЕ логику подготовки `finalAttrs`** (строки ~293-302)  
✅ **МЕНЯЙТЕ только порядок добавления в `result`**

Подготовка `finalAttrs` должна остаться ДО блока классов, но само добавление `result += [...]` должно быть ПОСЛЕ блока классов.

### 6. Проверка после исправления

```bash
# Собрать проект
npm run build

# Загрузить тестовый файл в браузере
# https://appsurify.github.io/modern-seaside-stay/
# Загрузить: /Users/whenessel/Development/WebstormProjects/seql-js/SEQLJsBrowserTestSuite.js

# В консоли браузера:
window.testSeqlJs()
```

**Ожидаемый результат:**

```
✅ EID успешно сгенерирован
✅ SEQL string сгенерирован
v1.0: form.glass-card[data-seql-id="seql-el-17"]#2 :: button[id="check-out",text="Select date",type="button"]
      ↑ Классы ПЕРЕД атрибутами
✅ SEQL успешно распарсен
✅ Все проверки пройдены
```

## Debugging Tips

### Если парсинг все еще падает

1. **Проверьте порядок компонентов в сгенерированной строке:**

   ```javascript
   console.log(seqlString);
   // Должно быть: tag.class[attr]#pos
   // НЕ должно быть: tag[attr].class#pos
   ```

2. **Проверьте что функция `parseNode` не изменилась:**

   ```typescript
   // Порядок парсинга в parseNode (НЕ МЕНЯТЬ):
   // 1. tag
   // 2. classes (строка ~367)
   // 3. attributes (строка ~377)
   // 4. position (строка ~422)
   ```

3. **Проверьте что не нарушили вложенность блоков `if`:**
   - Подготовка `finalAttrs` должна быть внутри проверки `if (attrStrings.length > 0)`
   - Добавление классов - отдельный блок `if (semantics.classes && ...)`
   - Добавление атрибутов - отдельный блок `if (finalAttrs.length > 0)`

## Alternative: Минимальное изменение

Если не хотите перемещать большие блоки, можно сделать так:

```typescript
// После подготовки finalAttrs...

// Сохраняем атрибуты для добавления позже
const attributesString =
  finalAttrs.length > 0 ? `[${finalAttrs.sort((a, b) => a.localeCompare(b)).join(',')}]` : '';

// Добавляем классы
if (semantics.classes && semantics.classes.length > 0) {
  // ... код классов ...
  result += limitedClasses.map((c) => `.${c}`).join('');
}

// Теперь добавляем атрибуты
if (attributesString) {
  result += attributesString;
}

// Добавляем позицию
// ... код позиции ...
```

## Contact

Если проблема сохраняется, проверьте:

- `/issues/2026-01-21-parse-error/ISSUE.md` - детальный анализ
- `/issues/2026-01-21-parse-error/AI_AGENT_PROMPT.md` - промпт для ИИ

## Быстрая проверка правильности

```javascript
// В консоли браузера после исправления:
const el = document.querySelector('#check-out');
const eid = window.seqlJs.generateEID(el);
const seql = window.seqlJs.stringifySEQL(eid);
console.log(seql);

// Проверьте порядок:
// ✅ ПРАВИЛЬНО: form.glass-card[...]#2
// ❌ НЕПРАВИЛЬНО: form[...].glass-card#2

// Проверьте парсинг:
const parsed = window.seqlJs.parseSEQL(seql);
console.log('Парсинг:', parsed ? '✅ OK' : '❌ FAILED');
```
