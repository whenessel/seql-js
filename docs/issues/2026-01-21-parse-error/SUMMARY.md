# Summary: SEQL Parser Component Order Fix

## TL;DR

**Проблема:** Парсер падает с ошибкой `Invalid node: unexpected content ".glass-card#2"`

**Причина:** Генератор создает `tag[attrs].class#pos`, парсер ожидает `tag.class[attrs]#pos`

**Решение:** Поменять местами добавление классов и атрибутов в функции `stringifyNode`

## Quick Fix

**Файл:** `/src/utils/seql-parser.ts`  
**Функция:** `stringifyNode` (строки ~221-339)

**Что делать:**
1. Найти блок "Add stable classes" (~строки 306-320)
2. Найти блок добавления атрибутов `result += [...]` (~строка 304)
3. Поменять их местами: классы должны добавляться ПЕРЕД атрибутами

## Files Created

```
/issues/2026-01-21-parse-error/
├── ISSUE.md              - Полный анализ проблемы с code diff
├── AI_AGENT_PROMPT.md    - Промпт для автоматического исправления
├── MANUAL_FIX.md         - Пошаговая инструкция для ручного исправления
└── SUMMARY.md            - Этот файл
```

## Expected Before/After

**Before (broken):**
```
v1.0: form[data-seql-id="seql-el-17"].glass-card#2 :: button[id="check-out"]
                                      ↑ Wrong order
```

**After (working):**
```
v1.0: form.glass-card[data-seql-id="seql-el-17"]#2 :: button[id="check-out"]
           ↑ Correct order
```

## Testing

```bash
npm run build
# Load test suite in browser at https://appsurify.github.io/modern-seaside-stay/
window.testSeqlJs()
```

## Impact

- **Severity:** CRITICAL
- **Breaking:** YES
- **Migration:** Required for existing SEQL strings

## Next Steps

1. Choose approach:
   - **Автоматически:** Use `AI_AGENT_PROMPT.md` with AI coding assistant
   - **Вручную:** Follow `MANUAL_FIX.md` step by step

2. Run tests to verify fix

3. Regenerate all existing SEQL strings in the database

## References

- Test element: `#check-out` button at https://appsurify.github.io/modern-seaside-stay/
- Test script: `/SEQLJsBrowserTestSuite.js`
- Spec: `/docs/specs/SEQL_SPECIFICATION_v1.0.md`
