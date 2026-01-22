# Архитектурные решения DSL Identity v1.0

## Дата: 2025-01-15

Этот документ фиксирует ключевые архитектурные решения, принятые в процессе проектирования DSL для идентификации DOM-элементов.

---

## 1. Path Structure (Структура пути)

**Решение:**

- В DSL `path` представляет собой массив узлов от anchor к target (порядок: anchor → ... → target_parent)
- Target НЕ включается в path, он описывается отдельно как финальный элемент DSL
- Path содержит только значимые промежуточные узлы

**Пример структуры:**

```json
{
  "anchor": { "tag": "form", ... },
  "path": [
    { "tag": "div", "semantics": {...} },  // первый ребенок anchor
    { "tag": "ul", "semantics": {...} }     // родитель target
  ],
  "target": { "tag": "button", ... }        // сам целевой элемент
}
```

**Обоснование:**

- Разделение target и path делает структуру более понятной
- Упрощает алгоритм резолва (path → narrowing, target → final match)
- Позволяет различать семантику "путь к элементу" vs "сам элемент"

---

## 2. Disambiguation Algorithm (Алгоритм устранения неоднозначности)

### Решение: Поэтапная проверка с добавлением узлов

### Алгоритм генерации path

1. **Первый проход** — строим minimal path:
   - Обходим снизу вверх (target → anchor)
   - Включаем только узлы с semantic value (см. критерии ниже)
   - Пропускаем noise-элементы (layout wrappers)

2. **Проверка уникальности**:
   - Выполняем test-резолв построенного DSL
   - Если результат уникален (1 элемент) → готово

3. **Добавление пропущенных узлов** (если неуникально):
   - Добавляем пропущенные noise-элементы по очереди
   - Порядок добавления: от target к anchor (ближайшие к target первыми)
   - После каждого добавления — проверка уникальности
   - Останавливаемся при достижении уникальности

4. **Fallback к constraints** (если всё ещё неуникально):
   - Переходим к применению constraints (см. раздел Constraints)

**Обоснование:**

- Минимизирует размер DSL
- Сохраняет устойчивость к структурным изменениям
- Детерминированный процесс (порядок добавления фиксирован)

---

## 3. Semantic Tags (Семантические теги)

### Решение: Нормативный список на основе HTML5 + ARIA

### Категории semantic tags

#### A. HTML5 Semantic Elements (высший приоритет)

```
article, aside, details, figcaption, figure, footer, header,
main, mark, nav, section, summary, time
```

#### B. Form Elements

```
button, datalist, fieldset, form, input, label, legend,
meter, optgroup, option, output, progress, select, textarea
```

#### C. Interactive Elements

```
a, audio, video, canvas, embed, iframe, img, map, area,
object, picture, source, track, dialog, menu
```

#### D. Text Content Semantic Elements

```
blockquote, dd, dl, dt, hr, li, ol, ul, p, pre, h1, h2, h3, h4, h5, h6
```

#### E. Table Elements

```
caption, col, colgroup, table, tbody, td, tfoot, th, thead, tr
```

#### F. SVG Elements

```
svg, path, circle, rect, line, polyline, polygon, ellipse, g, text, use
```

### Явно НЕ semantic (всегда требуют дополнительных признаков)

```
div, span
```

- Эти теги считаются semantic только если содержат:
  - `role` attribute
  - semantic classes
  - semantic attributes (aria-\*, data-testid, etc.)

**Обоснование:**

- Опирается на W3C HTML5 спецификацию
- Покрывает 95%+ реальных веб-приложений
- Предсказуемо и документировано

---

## 4. Resolver Sequence (Последовательность резолва)

### Решение: Вариант A — поэтапный резолв

### Последовательность выполнения в resolver

1. **Phase 1: CSS Narrowing**
   - Построение CSS-селектора из DSL path
   - Выполнение `querySelectorAll()`
   - Результат: candidates[] (массив DOM-элементов)

2. **Phase 2: Semantics Filtering**
   - Применение JS-фильтрации по semantics:
     - text matching (normalized)
     - attributes matching
     - SVG fingerprint matching
   - Результат: filtered_candidates[]

3. **Phase 3: Uniqueness Check**
   - Если `filtered_candidates.length === 1` → успех, возвращаем элемент
   - Если `filtered_candidates.length === 0` → ошибка
   - Если `filtered_candidates.length > 1` → переход к Phase 4

4. **Phase 4: Constraints Application**
   - Применяем constraints по порядку priority (desc)
   - После каждого constraint — проверка уникальности
   - Результат: final_candidates[]

5. **Phase 5: Result**
   - 1 элемент → success
   - 0 элементов → error / fallback
   - > 1 элемент → ambiguity warning + candidates[]

**Обоснование:**

- Четкое разделение ответственности (CSS → JS → Constraints)
- Ранний выход при уникальности (производительность)
- Понятная отладка (каждая фаза изолирована)
- Предсказуемое поведение

---

## 5. text-proximity Constraint

### Решение: Levenshtein distance для текстового содержимого

### Метрика расстояния

- **Тип**: Levenshtein distance (edit distance)
- **Применение**: сравнение normalized текста элемента с reference
- **Параметр maxDistance**: максимальное количество операций редактирования

### Пример

```json
{
  "type": "text-proximity",
  "params": {
    "reference": "Submit",
    "maxDistance": 2
  },
  "priority": 60
}
```

Допустимые совпадения:

- "Submit" (distance = 0) ✅
- "Submitt" (distance = 1) ✅
- "Submt" (distance = 2) ✅
- "Submitting" (distance = 4) ❌

**Обоснование:**

- Levenshtein — стандартная, понятная метрика
- Устойчива к опечаткам и локализации
- Вычислительно эффективна для коротких строк
- Детерминирована

---

## 6. position Constraint в DSL

### Решение: Сериализуется с явным флагом degraded

### Правила

- `position` constraint **включается** в DSL serialization
- Всегда помечается `meta.degraded = true`
- Имеет lowest priority (20)

### Пример

```json
{
  "constraints": [
    {
      "type": "position",
      "params": {
        "strategy": "top-most"
      },
      "priority": 20
    }
  ],
  "meta": {
    "degraded": true,
    "degradationReason": "position-fallback-required"
  }
}
```

**Обоснование:**

- Явное указание на деградацию качества идентификации
- Позволяет аналитике отслеживать "хрупкие" DSL
- Сохраняет полную информацию для replay
- Сигнализирует о необходимости улучшения markup

---

## 7. Confidence Formula (Формула уверенности)

### Решение: Взвешенная сумма компонентов

### Формула

```javascript
confidence =
  (anchor.score * 0.4) +
  (avgPathScore * 0.3) +
  (targetScore * 0.2) +
  (uniquenessBonus * 0.1)

где:
  avgPathScore = sum(path[i].score) / path.length
  targetScore = target.semantics.score
  uniquenessBonus = {
    1.0 если результат уникален,
    0.5 если неоднозначен но resolved,
    0.0 если degraded
  }
```

### Диапазон

- `0.0 - 0.3`: критически низкий (требует пересмотра)
- `0.3 - 0.6`: низкий (работает но хрупкий)
- `0.6 - 0.8`: средний (допустимо)
- `0.8 - 1.0`: высокий (стабильный DSL)

**Обоснование:**

- Anchor наиболее критичен (40%)
- Path важен для устойчивости (30%)
- Target содержит финальные детали (20%)
- Uniqueness — валидация (10%)
- Сумма = 1.0 (нормализовано)

---

## 8. fallback.onMissing Strategy

### Решение: "anchor-only" = возврат anchor как fallback-элемента

### Поведение

Если target не найден после всех попыток резолва:

```javascript
if (onMissing === 'anchor-only') {
  return {
    status: 'degraded-fallback',
    element: anchorElement,
    warning: 'Target not found, returning anchor',
    originalDSL: dsl,
  };
}
```

### Альтернативные стратегии (для будущих версий)

- `"strict"` — вернуть ошибку
- `"anchor-children"` — искать среди прямых детей anchor
- `"none"` — вернуть null

**Обоснование:**

- Anchor всегда валидная семантическая область
- Позволяет heatmap показать хотя бы область интереса
- Явно помечается как degraded
- Не маскирует проблему (warning)

---

## 9. maxDepth Разница

### Решение: Два независимых лимита для разных контекстов

### MAX_PATH_DEPTH = 10 (генерация)

- **Контекст**: генерация DSL во время recording
- **Назначение**: ограничение глубины path от anchor к target
- **Поведение при превышении**:
  - Сократить path (выбрать промежуточный anchor)
  - Пометить как degraded

### fallback.maxDepth = 3 (резолв)

- **Контекст**: fallback-поиск при ambiguity в resolver
- **Назначение**: глубина дополнительного поиска от anchor при неуспешном резолве
- **Поведение**:
  - Искать target в пределах 3 уровней от anchor
  - Если не найден → применить onMissing strategy

### Пример

```
Генерация (MAX_PATH_DEPTH=10):
anchor → div → div → section → ul → li → div → div → span → button
                     (10 уровней)

Fallback резолв (maxDepth=3):
anchor → div → section → ul
         (3 уровня максимум для fallback)
```

**Обоснование:**

- Генерация path должна поддерживать глубокие структуры (SPA, React)
- Fallback должен быть быстрым и консервативным
- Разные цели → разные лимиты
- Предотвращает performance деградацию при fallback

---

## Итоговая таблица решений

| #   | Вопрос              | Решение                                                   | Приоритет |
| --- | ------------------- | --------------------------------------------------------- | --------- |
| 1   | Path structure      | anchor → path[] → target (отдельно)                       | Критичный |
| 2   | Disambiguation      | Поэтапно: minimal → add nodes → constraints               | Критичный |
| 3   | Semantic tags       | Нормативный список (HTML5 + ARIA)                         | Высокий   |
| 4   | Resolver sequence   | CSS → Semantics → Uniqueness → Constraints                | Критичный |
| 5   | text-proximity      | Levenshtein distance                                      | Средний   |
| 6   | position constraint | Сериализуется + degraded flag                             | Средний   |
| 7   | confidence          | Weighted: 0.4 anchor + 0.3 path + 0.2 target + 0.1 unique | Высокий   |
| 8   | onMissing           | Вернуть anchor + warning                                  | Средний   |
| 9   | maxDepth            | 10 для генерации, 3 для fallback                          | Высокий   |

---

## Статус: УТВЕРЖДЕНО v1.0

Дата утверждения: 2025-01-15
