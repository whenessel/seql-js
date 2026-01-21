# SEQL Parser Error: Component Order Mismatch

**Date:** 2026-01-21  
**Status:** CRITICAL - Breaking parser functionality  
**Component:** `/src/utils/seql-parser.ts`

## Problem Description

**Симптом:**  
Парсинг SEQL строки падает с ошибкой:
```
Invalid node: unexpected content ".glass-card#2" in "form[data-seql-id="seql-el-17"].glass-card#2"
```

**Root Cause:**  
Несоответствие порядка компонентов между генератором (`stringifyNode`) и парсером (`parseNode`):

### Текущий порядок в `stringifyNode` (❌ НЕПРАВИЛЬНЫЙ):
```
tag → [attributes] → .classes → #position
```
Пример: `form[data-seql-id="seql-el-17"].glass-card#2`

### Ожидаемый порядок в `parseNode` (✅ ПРАВИЛЬНЫЙ):
```
tag → .classes → [attributes] → #position
```
Пример: `form.glass-card[data-seql-id="seql-el-17"]#2`

## Test Case

**Элемент:**
```html
<button class="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full justify-start text-left font-normal text-muted-foreground" id="check-out" type="button" aria-haspopup="dialog" aria-expanded="true" aria-controls="radix-:r1:" data-state="open" data-seql-id="seql-el-19">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar mr-2 h-4 w-4">
    <path d="M8 2v4"></path>
    <path d="M16 2v4"></path>
    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
    <path d="M3 10h18"></path>
  </svg>
  <span>Select date</span>
</button>
```

**Сгенерированная SEQL строка (❌ BREAKING):**
```
v1.0: form[data-seql-id="seql-el-17"].glass-card#2 :: button[id="check-out",text="Select date",type="button"]
```

**Ошибка парсинга:**
```
Error: Invalid node: unexpected content ".glass-card#2" in "form[data-seql-id="seql-el-17"].glass-card#2"
    at parseNode (seql-parser.ts:432)
    at parseSEQL (seql-parser.ts:186)
```

## Solution

### Файл: `/src/utils/seql-parser.ts`  
### Функция: `stringifyNode()` (строки ~221-339)

**Требуется:** Изменить порядок добавления компонентов чтобы соответствовать парсеру.

### ДО (текущая реализация):

```typescript
function stringifyNode(
  node: AnchorNode | PathNode | TargetNode,
  isTarget: boolean = false,
  options: Required<StringifyOptions> = DEFAULT_STRINGIFY_OPTIONS
): string {
  const { tag, semantics } = node;
  let result = tag;

  // 1. Prepare Attributes (including ID and Role)
  const attrStrings: string[] = [];
  // ... код подготовки атрибутов ...
  
  if (attrStrings.length > 0) {
    // ... код ...
    if (finalAttrs.length > 0) {
      finalAttrs.sort((a, b) => a.localeCompare(b));
      result += `[${finalAttrs.join(',')}]`; // ❌ ДОБАВЛЯЕМ АТРИБУТЫ ПЕРВЫМИ
    }
  }

  // 2. Add stable classes
  if (semantics.classes && semantics.classes.length > 0) {
    const stableClasses = filterStableClasses(semantics.classes);
    // ... код ...
    if (!skipClasses && stableClasses.length > 0) {
      const limitedClasses = stableClasses
        .sort()
        .slice(0, options.maxClasses);
      result += limitedClasses.map(c => `.${c}`).join(''); // ❌ КЛАССЫ ПОСЛЕ АТРИБУТОВ
    }
  }

  // 3. Add position (nth-child)
  if ('nthChild' in node && node.nthChild) {
    // ... код ...
    if (!skipPosition) {
      result += `#${node.nthChild}`;
    }
  }

  return result;
}
```

### ПОСЛЕ (исправленная реализация):

```typescript
function stringifyNode(
  node: AnchorNode | PathNode | TargetNode,
  isTarget: boolean = false,
  options: Required<StringifyOptions> = DEFAULT_STRINGIFY_OPTIONS
): string {
  const { tag, semantics } = node;
  let result = tag;

  // 1. Prepare Attributes (including ID and Role)
  const attrStrings: string[] = [];
  const rawAttributes = { ...semantics.attributes };

  // In SEQL Selector, ID is just another attribute [id="..."]
  if (semantics.id) {
    rawAttributes.id = semantics.id;
  }

  // Include Role if present in semantics but not in attributes
  if (semantics.role && !rawAttributes.role) {
    rawAttributes.role = semantics.role;
  }

  const processedAttrs = Object.entries(rawAttributes)
    .map(([name, value]) => {
      const priority = getAttributePriority(name);
      const cleanedValue = (name === 'href' || name === 'src')
        ? cleanAttributeValue(name, value)
        : value;
      return { name, value: cleanedValue, priority };
    })
    .filter(attr => {
      // Filter out truly ignored attributes (style, xmlns, etc)
      const trulyIgnored = ['style', 'xmlns', 'tabindex', 'contenteditable'];
      if (trulyIgnored.includes(attr.name)) return false;

      // Filter out ID-reference attributes with dynamic values
      if (ID_REFERENCE_ATTRIBUTES.has(attr.name) && hasDynamicIdReference(attr.value)) {
        return false;
      }

      // Keep if priority > 0 or it's a role or id
      return attr.priority > 0 || attr.name === 'role' || attr.name === 'id';
    });

  // Sort by priority (desc) to pick the best ones
  processedAttrs.sort((a, b) => b.priority - a.priority);

  // Pick top N attributes
  const topAttrs = processedAttrs.slice(0, options.maxAttributes);

  // Sort selected attributes ALPHABETICALLY for SEQL Selector canonical format
  topAttrs.sort((a, b) => a.name.localeCompare(b.name));

  for (const { name, value } of topAttrs) {
    attrStrings.push(`${name}="${escapeAttributeValue(value)}"`);
  }

  // Add text as pseudo-attribute if enabled
  if (options.includeText && semantics.text && !isTextPII(semantics.text.normalized)) {
    const text = semantics.text.normalized;
    if (text.length > 0 && text.length <= options.maxTextLength) {
      attrStrings.push(`text="${escapeAttributeValue(text)}"`);
    }
  }

  // Determine final attributes list for target simplification
  let finalAttrs = attrStrings;
  if (isTarget && options.simplifyTarget && semantics.id) {
     // If we have ID, we can afford to be more selective,
     // but we MUST keep important semantic info like href, text, data-testid
     finalAttrs = attrStrings.filter(s => {
       const name = s.split('=')[0];
       const priority = getAttributePriority(name);
       // Keep high priority attributes (id, data-testid, href, src, role, text)
       return priority >= 60 || name === 'text' || name === 'id' || name === 'role';
     });
  }

  // Final alphabetical sort for the attributes in the bracket
  if (finalAttrs.length > 0) {
    finalAttrs.sort((a, b) => a.localeCompare(b));
  }

  // 2. Add stable classes FIRST (✅ ИЗМЕНЕНИЕ ПОРЯДКА)
  if (semantics.classes && semantics.classes.length > 0) {
    const stableClasses = filterStableClasses(semantics.classes);

    // If simplifying target and we have strong identifiers, we can skip classes
    const hasStrongIdentifier = !!semantics.id ||
      attrStrings.some(s => s.startsWith('href=') || s.startsWith('data-testid=') || s.startsWith('text=') || s.startsWith('role='));
    const skipClasses = isTarget && options.simplifyTarget && hasStrongIdentifier;

    if (!skipClasses && stableClasses.length > 0) {
      const limitedClasses = stableClasses
        .sort() // Alphabetical for determinism
        .slice(0, options.maxClasses);

      result += limitedClasses.map(c => `.${c}`).join(''); // ✅ КЛАССЫ ПЕРЕД АТРИБУТАМИ
    }
  }

  // 3. Add attributes AFTER classes (✅ ИЗМЕНЕНИЕ ПОРЯДКА)
  if (finalAttrs.length > 0) {
    result += `[${finalAttrs.join(',')}]`; // ✅ АТРИБУТЫ ПОСЛЕ КЛАССОВ
  }

  // 4. Add position (nth-child) LAST
  if ('nthChild' in node && node.nthChild) {
    // SEQL Selector position is #N
    const hasStrongIdentifier = !!semantics.id ||
      (semantics.attributes && Object.keys(semantics.attributes).some(isUniqueAttribute));

    const skipPosition = isTarget && options.simplifyTarget && hasStrongIdentifier;

    if (!skipPosition) {
      result += `#${node.nthChild}`;
    }
  }

  return result;
}
```

## Key Changes

1. **Переместить блок "Add stable classes" (строки ~305-320) ПЕРЕД блок добавления атрибутов**
2. **Переместить добавление атрибутов `result += [...]` ПОСЛЕ блока классов**
3. **Сохранить логику фильтрации `finalAttrs`, но применить её ДО добавления классов**

## Expected Output After Fix

**Сгенерированная SEQL строка (✅ ПРАВИЛЬНО):**
```
v1.0: form.glass-card[data-seql-id="seql-el-17"]#2 :: button[id="check-out",text="Select date",type="button"]
```

**Парсинг:** ✅ Успешно
**Резолвинг:** ✅ Успешно

## Verification Steps

1. Запустить тестовый скрипт:
```bash
# В браузере на https://appsurify.github.io/modern-seaside-stay/
# Загрузить файл /Users/whenessel/Development/WebstormProjects/seql-js/SEQLJsBrowserTestSuite.js
window.testSeqlJs()
```

2. Проверить что:
   - ✅ Генерация EID проходит успешно
   - ✅ Stringify создает SEQL строку с порядком `.class[attrs]#pos`
   - ✅ Парсинг SEQL строки проходит без ошибок
   - ✅ EID восстанавливается корректно

## Related Files

- `/src/utils/seql-parser.ts` - Основной файл для исправления
- `/docs/specs/SEQL_SPECIFICATION_v1.0.md` - Спецификация формата
- `/SEQLJsBrowserTestSuite.js` - Тестовый скрипт

## Impact

- **Severity:** CRITICAL
- **Breaking Change:** YES - требует изменения сериализованного формата
- **Backwards Compatibility:** NO - существующие SEQL строки с порядком `[attrs].class` не будут парситься
- **Migration Required:** YES - регенерировать все существующие SEQL строки

## Notes

Этот порядок `tag.class[attr]#pos` является стандартным для CSS селекторов и должен использоваться для обеспечения совместимости и интуитивности.
