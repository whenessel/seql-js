# SEQL Selector (EIQ) Specification v1.0

## 🎯 Назначение

**EIQ (SEQL Selector)** — канонический строковый формат для передачи и хранения идентификаторов элементов между системами.

**Ключевой принцип**:
```
EIQ описывает идентичность элемента,
а не инструкцию, как его найти.
```

EIQ является **transport format** для EID (Element Identity Descriptor).

---

## 📋 Основные характеристики

| Характеристика | Описание |
|----------------|----------|
| **Формат** | Однострочная строка |
| **Направление** | Слева направо: anchor → path → target |
| **Детерминированность** | Один EID → всегда один EIQ |
| **Каноничность** | Нет альтернативных представлений |
| **Версионирование** | Обязательно для обратной совместимости |
| **PII-safe** | Не содержит персональных данных |

---

## 🔤 Синтаксис

### Общая структура

```
version: anchor :: path > target {constraints}
```

### Компоненты

```
v1: footer :: ul.space-y-3 > li[text="Subscribe"] {pos=3}
│   │       │  │             │  │                    │
│   │       │  │             │  │                    └─ Constraints (optional)
│   │       │  │             │  └─ Target node
│   │       │  │             └─ Path separator
│   │       │  └─ Path nodes
│   │       └─ Anchor separator
│   └─ Anchor node
└─ Version prefix (required)
```

---

## 📐 Грамматика (BNF)

```ebnf
EIQ        ::= Version ":" Anchor "::" Path Target Constraints?
Version    ::= "v" Digit+
Anchor     ::= Node
Path       ::= (Node " > ")*
Target     ::= Node
Node       ::= Tag Classes? Attributes? Position?
Tag        ::= [a-z][a-z0-9-]*
Classes    ::= ("." ClassName)+
ClassName  ::= [a-zA-Z][a-zA-Z0-9-_]*
Attributes ::= ("[" AttrPair ("," AttrPair)* "]")?
AttrPair   ::= AttrName ("=" | "~=") AttrValue
AttrName   ::= [a-z][a-z0-9-]*
AttrValue  ::= '"' [^"]* '"'
Position   ::= "#" Digit+
Constraints ::= "{" ConstraintPair ("," ConstraintPair)* "}"
ConstraintPair ::= ConstraintKey "=" ConstraintValue
```

---

## 🔧 Разделители (строго фиксированы)

| Разделитель | Назначение | Пример |
|-------------|------------|--------|
| `:` | Версия | `v1:` |
| `::` | Граница anchor | `footer ::` |
| `>` | Иерархия path | `ul > li` |
| `.` | Semantic class | `.space-y-3` |
| `[]` | Атрибуты | `[type="submit"]` |
| `{}` | Constraints | `{pos=3}` |
| `=` | Точное совпадение | `text="Click"` |
| `~=` | Contains / normalized | `text~="subscribe"` |
| `#` | Позиция (nth-child) | `li#3` |
| `,` | Разделитель в списках | `[role="button",type="submit"]` |

**Никаких альтернатив или вариаций не допускается.**

---

## 📦 Узел (Node)

### Формат

```
tag(.class)*[attr=value,attr~=value]#position
```

### Компоненты узла

1. **Tag** (обязательно):
   ```
   div, ul, li, button, svg, path
   ```

2. **Classes** (опционально, только semantic):
   ```
   .btn-primary
   .space-y-3
   .Card
   ```
   
   ❌ **Запрещены utility classes**:
   ```
   .flex, .mt-4, .bg-blue-500, .hover:bg-red
   ```

3. **Attributes** (опционально, сортированы):
   ```
   [role="button",type="submit"]
   [aria-label="Close",id="modal-1"]
   ```

4. **Position** (опционально, для точного позиционирования):
   ```
   #1    — первый ребенок
   #3    — третий ребенок
   ```

### Правила для узлов

1. **Порядок атрибутов**: Строго алфавитный (для каноничности)
   ```
   ✅ [aria-label="Close",id="modal",role="button"]
   ❌ [id="modal",role="button",aria-label="Close"]
   ```

2. **Только semantic classes**: Фильтрация утилитарных классов
   ```
   ✅ .btn-primary, .Card, .sidebar
   ❌ .flex, .mt-4, .inline-flex
   ```

3. **Нормализация текста**: trim, collapse whitespace
   ```
   ✅ text="Subscribe to Newsletter"
   ❌ text="  Subscribe  to   Newsletter  "
   ```

### Примеры узлов

```
button[type="submit"]
input[name="email",type="text"]
li.space-y-2[text="Contact"]#3
svg.lucide-mail
path[dHash="7bf591b2"]
div.container#1
```

---

## 🎯 Anchor (якорь)

### Формат

```
anchorTag(.class)*[attr=value]
```

### Правила

1. **Всегда присутствует**: Если anchor = body, используется `body`
2. **Должен быть уникален**: Или достаточно специфичен
3. **Может иметь атрибуты**: Для уточнения

### Примеры

```
v1: footer :: ul > li
v1: form[id="login"] :: input[name="email"]
v1: nav[aria-label="Main"] :: button
v1: section.hero :: div.container > h1
```

### Default anchor

Если anchor не указан явно, по умолчанию используется `body`:

```
v1: body :: main > section
```

---

## 🛤️ Path (путь)

### Правила

1. **Только semantic узлы**: Layout div без классов/атрибутов пропускаются
2. **Минимально достаточный**: Только узлы, нужные для идентификации
3. **Разделитель**: Всегда ` > ` (пробел-greater-пробел)

### Примеры

```
v1: footer :: ul > li > svg > rect

v1: section :: div.container > ul.space-y-3 > li#3

v1: form :: fieldset > input[type="email"]
```

### Path может быть пустым

Если target является прямым потомком anchor:

```
v1: footer :: span[text="© 2024"]
```

---

## 🎯 Target (цель)

### Формат

Аналогично узлу, но **всегда последний** в цепочке:

```
tag(.class)*[attr=value]#position
```

### Правила

1. **Всегда присутствует**: Target обязателен
2. **Максимально специфичен**: Использует все доступные semantic признаки
3. **Может иметь позицию**: `#N` для точного указания

### Примеры

```
v1: footer :: ul > li[text="+39 123"]

v1: section :: button[type="submit"]

v1: nav :: a[href="/contact"]#2

v1: footer :: svg.lucide-mail > rect[dHash="7bf591b2"]
```

---

## 📊 Constraints (ограничения)

### Формат

```
{key=value,key=value}
```

### Типы constraints

| Constraint | Описание | Пример |
|------------|----------|--------|
| `pos` | Позиция среди siblings | `{pos=3}` |
| `unique` | Требование уникальности | `{unique=true}` |
| `visible` | Требование видимости | `{visible=true}` |
| `fallback` | Стратегия fallback | `{fallback="anchor"}` |

### Правила

1. **Опциональны**: Constraints используются только при необходимости
2. **Сортированы**: Алфавитный порядок ключей
3. **Значения в кавычках**: Если содержат специальные символы

### Примеры

```
v1: footer :: ul > li {pos=3,visible=true}

v1: section :: button {fallback="sibling",unique=true}

v1: nav :: a[href="/"] {pos=1}
```

---

## 📝 Текстовые значения

### Правила

1. **Всегда в двойных кавычках**:
   ```
   text="Subscribe"
   ```

2. **Нормализация**:
   - `trim()` — удаление пробелов по краям
   - Collapse whitespace — множественные пробелы → один
   - Lowercase для сравнения (при `~=`)

3. **Без переносов строк**:
   ```
   ✅ text="Click here to subscribe"
   ❌ text="Click here\nto subscribe"
   ```

4. **PII-safe** (критично):
   ```
   ❌ text="john.doe@example.com"
   ✅ text~="contact" или text-hash="7bf591b2"
   ```

### Операторы сравнения

| Оператор | Назначение | Пример |
|----------|------------|--------|
| `=` | Точное совпадение | `text="Subscribe"` |
| `~=` | Contains / normalized | `text~="subscribe now"` |

### Примеры

```
text="Subscribe to Newsletter"
text~="subscribe"
aria-label="Close dialog"
placeholder="Enter your email"
```

---

## 🎨 SVG элементы

### Формат

```
svg(.class)* > svgChild[dHash="..."]
```

### Правила

1. **SVG как обычный узел**:
   ```
   svg.lucide-mail
   ```

2. **SVG дочерние элементы**:
   ```
   path[dHash="abc123"]
   rect[dHash="7bf591b2"]
   circle[dHash="def456"]
   ```

3. **Geometry hash обязателен**:
   - Использовать `dHash` для path/polygon
   - Использовать dimension hash для rect/circle

4. **Запрещено**:
   - ❌ Сырые координаты: `path[d="M10 10 L20 20"]`
   - ❌ Transform: `path[transform="rotate(45)"]`
   - ❌ Style: `path[style="fill:red"]`

### Примеры

```
v1: footer :: svg.lucide-mail > rect[dHash="7bf591b2"]

v1: section :: svg.icon > path[dHash="abc123"]#1

v1: button :: svg > circle[dHash="def456"]
```

---

## 🔢 Версионирование

### Формат

```
v{major}: ...
```

### Правила

1. **Обязательно**: Всегда указывается префиксом
2. **Текущая версия**: `v1:`
3. **Backward compatibility**: Парсер должен поддерживать все версии

### Эволюция версий

```
v1: footer :: ul > li           — текущая версия
v2: footer :: ul > li @ext      — будущая версия с расширениями
```

### Примеры

```
v1: footer :: ul > li[text="Contact"]
v1: section :: button[type="submit"]
```

---

## ⚖️ Каноничность (критично)

### Требования

EIQ должен быть **строго детерминированным**. Один EID всегда генерирует один и тот же EIQ.

### Обязательные правила

1. **Одинаковый порядок узлов**:
   ```
   ✅ footer :: ul > li > svg
   ❌ footer :: svg > li > ul
   ```

2. **Алфавитный порядок атрибутов**:
   ```
   ✅ [aria-label="Close",id="modal",role="button"]
   ❌ [id="modal",role="button",aria-label="Close"]
   ```

3. **Одинаковые кавычки** (всегда двойные):
   ```
   ✅ text="Subscribe"
   ❌ text='Subscribe'
   ```

4. **Нет лишних пробелов**:
   ```
   ✅ ul > li
   ❌ ul  >  li
   ❌ ul>li
   ```

5. **Stable-sort для классов**:
   ```
   ✅ .btn-primary.large
   ❌ .large.btn-primary
   ```

### Проверка каноничности

```typescript
// Проверка детерминированности
const eid = generateEID(element);
const eiq1 = stringifySEQL(eid);
const eiq2 = stringifySEQL(eid);

assert(eiq1 === eiq2); // ✅ Всегда true
```

---

## 🚫 Явные запреты

### Запрещенные конструкции

1. **CSS псевдоселекторы**:
   ```
   ❌ li:nth-child(3)
   ❌ li:first-child
   ❌ button:hover
   ❌ input:focus
   ✅ li#3 (вместо nth-child)
   ```

2. **CSS комбинаторы** (кроме `>`):
   ```
   ❌ ul ~ li          (general sibling)
   ❌ ul + li          (adjacent sibling)
   ❌ ul   li          (descendant) — используем только >
   ✅ ul > li          (direct child)
   ```

3. **XPath конструкции**:
   ```
   ❌ //footer//ul/li
   ❌ /html/body/footer
   ❌ ancestor::div
   ```

4. **CSS attribute selectors** (расширенные):
   ```
   ❌ [class^="btn-"]   (starts-with)
   ❌ [class$="-primary"] (ends-with)
   ❌ [class*="button"]  (contains)
   ✅ [class="btn-primary"] (exact match)
   ```

5. **Невалидный CSS синтаксис**:
   ```
   ❌ div:has(> ul)
   ❌ div:is(.class1, .class2)
   ❌ div:where([role])
   ```

6. **Dynamic/generated значения**:
   ```
   ❌ [data-reactid="123"]
   ❌ [data-v-abc123="xyz"]
   ❌ [style="display:none"]
   ```

---

## 🔐 PII-безопасность

### Правила обработки PII

1. **Email**: Удалять или хешировать
   ```
   ❌ text="john.doe@example.com"
   ✅ text-hash="7bf591b2"
   ✅ text~="email"
   ```

2. **Телефоны**: Паттерн, не полный номер
   ```
   ❌ text="+39 123 4567 890"
   ✅ text~="+39"
   ✅ text-pattern="phone"
   ```

3. **Имена**: Только если структурные, не персональные
   ```
   ❌ text="John Doe"
   ✅ text="Full Name" (placeholder)
   ```

4. **Адреса**: Только общие признаки
   ```
   ❌ text="123 Main Street, NY"
   ✅ text-pattern="address"
   ```

### PII Hashing

Для текста с PII использовать хеш:

```
text-hash="7bf591b2"
```

Хеш должен быть:
- Короткий (8 символов hex)
- Детерминированный
- Не обратимый

---

## 🔄 Escape-правила

### Специальные символы

| Символ | Escape | Пример |
|--------|--------|--------|
| `"` | `\"` | `text="Say \"Hello\""` |
| `\` | `\\` | `text="C:\\Users"` |
| `>` | `\>` | `text="A \> B"` (в значениях) |
| `:` | `\:` | `text="Time\: 12:00"` |

### Правила

1. **В атрибутах**: Escape `"` и `\`
2. **В constraint values**: Escape `,` и `}`
3. **Unicode**: Допустим, но рекомендуется ASCII

### Примеры

```
text="She said \"Hello\""
text="Path: C:\\Users\\Documents"
aria-label="Show options (all)"
```

---

## 📊 Примеры полных EIQ

### Простой случай

```
v1: footer :: span[text="© 2024"]
```

### Средняя сложность

```
v1: footer :: ul.space-y-3 > li#3 > a[href="mailto:info@example.com"]
```

### С SVG

```
v1: footer :: ul > li#3 > svg.lucide-mail > rect[dHash="7bf591b2"]
```

### С constraints

```
v1: section :: button[type="submit"] {pos=2,unique=true,visible=true}
```

### Сложный путь

```
v1: nav[aria-label="Main"] :: ul.menu > li.active > a[href="/products"]#1
```

### Форма

```
v1: form[id="login"] :: fieldset > input[name="password",type="password"]
```

---

## 🔄 Конвертация: EID ↔ EIQ

### EID → EIQ (stringify)

```typescript
function stringifySEQL(eid: ElementIdentityDescriptor): ElementIdentityQuery {
  const version = `v${eid.version.split('.')[0]}`;
  
  // Anchor
  const anchor = buildNode(eid.anchor);
  
  // Path
  const path = eid.path.map(node => buildNode(node)).join(' > ');
  
  // Target
  const target = buildNode(eid.target);
  
  // Constraints (optional)
  const constraints = buildConstraints(eid.constraints, eid.fallback);
  
  // Assemble
  const eiq = [
    version + ':',
    anchor,
    '::',
    path ? path + ' > ' : '',
    target,
    constraints
  ].filter(Boolean).join(' ');
  
  return eiq.trim();
}

function buildNode(node: NodeDescriptor): string {
  let result = node.tag;
  
  // Classes (sorted, semantic only)
  if (node.semantics.classes) {
    const semantic = filterStableClasses(node.semantics.classes).sort();
    result += semantic.map(c => `.${escapeClass(c)}`).join('');
  }
  
  // Attributes (sorted alphabetically)
  if (node.semantics.attributes) {
    const attrs = Object.entries(node.semantics.attributes)
      .filter(([k, v]) => !shouldIgnoreAttribute(k))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(',');
    
    if (attrs) {
      result += `[${attrs}]`;
    }
  }
  
  // Position (if available)
  if (node.nthChild) {
    result += `#${node.nthChild}`;
  }
  
  return result;
}
```

### EIQ → EID (parse)

```typescript
function parseSEQL(eiq: ElementIdentityQuery): ElementIdentityDescriptor {
  // 1. Extract version
  const [version, rest] = eiq.split(':', 2);
  if (!version.startsWith('v')) {
    throw new Error('Invalid EIQ: missing version');
  }
  
  // 2. Split anchor and path+target
  const [anchorPart, pathTargetPart] = rest.split('::', 2);
  
  // 3. Parse anchor
  const anchor = parseNode(anchorPart.trim());
  
  // 4. Split path and target+constraints
  const parts = pathTargetPart.split('>').map(p => p.trim());
  const targetWithConstraints = parts.pop()!;
  
  // 5. Parse target and constraints
  const [targetPart, constraintsPart] = splitTargetConstraints(targetWithConstraints);
  const target = parseNode(targetPart);
  
  // 6. Parse path
  const path = parts.map(parseNode);
  
  // 7. Parse constraints
  const constraints = parseConstraints(constraintsPart);
  
  // 8. Assemble EID
  return {
    version: version.replace('v', '') + '.0',
    anchor,
    path,
    target,
    constraints,
    fallback: extractFallback(constraints),
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'seql-parser'
    }
  };
}
```

---

## ✅ Валидация EIQ

### Проверки

```typescript
function validateEIQ(eiq: string): ValidationResult {
  const errors: string[] = [];
  
  // 1. Version
  if (!eiq.match(/^v\d+:/)) {
    errors.push('Missing or invalid version');
  }
  
  // 2. Anchor separator
  if (!eiq.includes('::')) {
    errors.push('Missing anchor separator (::)');
  }
  
  // 3. Valid syntax
  if (!eiq.match(/^v\d+:\s*\w+.*::.*/)) {
    errors.push('Invalid syntax');
  }
  
  // 4. No forbidden constructs
  if (eiq.match(/:(nth-child|first-child|hover|focus)/)) {
    errors.push('Forbidden CSS pseudoselectors');
  }
  
  // 5. No double spaces
  if (eiq.match(/\s{2,}/)) {
    errors.push('Multiple consecutive spaces');
  }
  
  // 6. Proper quotes
  if (eiq.match(/='/)) {
    errors.push('Use double quotes, not single');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 📚 Сравнение с CSS

| Аспект | CSS Selector | EIQ |
|--------|--------------|-----|
| **Назначение** | Найти элементы | Описать идентичность |
| **Комбинаторы** | ` `, `>`, `+`, `~` | Только `>` |
| **Псевдоклассы** | `:hover`, `:nth-child()` | Нет (есть `#N`) |
| **Атрибуты** | `[attr^=val]`, `[attr*=val]` | Только `=` и `~=` |
| **Детерминированность** | Нет требования | Обязательна |
| **Версионирование** | Нет | Обязательно |
| **PII-safe** | Нет требования | Обязательно |

**Ключевое отличие**:
```
CSS:  "Как найти элемент" (query instruction)
EIQ:  "Что представляет элемент" (identity description)
```

---

## 🎯 Чек-лист качества EIQ

При создании EIQ убедитесь:

- [ ] Версия указана: `v1:`
- [ ] Anchor separator присутствует: `::`
- [ ] Path separator корректен: ` > ` (с пробелами)
- [ ] Атрибуты отсортированы алфавитно
- [ ] Классы отсортированы алфавитно
- [ ] Используются только semantic классы
- [ ] Текстовые значения в двойных кавычках
- [ ] Текст нормализован (trim, collapse)
- [ ] Нет PII (email, телефоны, имена)
- [ ] Нет CSS псевдоселекторов
- [ ] Нет XPath конструкций
- [ ] Позиция через `#N`, не через `:nth-child()`
- [ ] Escape спецсимволов где нужно
- [ ] Нет двойных пробелов
- [ ] Детерминированность проверена

---

## 🔮 Будущие расширения (v2+)

Возможные улучшения в следующих версиях:

1. **Extended constraints**:
   ```
   v2: section :: button @shadow-root @iframe-nested
   ```

2. **Compression hints**:
   ```
   v2: footer :: ul > li @compress
   ```

3. **Context markers**:
   ```
   v2: form @inside(modal) :: button
   ```

4. **Relation operators**:
   ```
   v2: ul > li @following(div.active)
   ```

Но v1 должна оставаться стабильной и backwards-compatible.

---

## 📖 Заключение

### Ключевые принципы EIQ

1. **Каноничность** — один EID, один EIQ
2. **Детерминированность** — всегда одинаковый результат
3. **Читаемость** — человек должен понимать
4. **Компактность** — достаточно короткий для GA
5. **Безопасность** — нет PII
6. **Версионируемость** — обратная совместимость

### Формула

```
EIQ — это читаемое описание идентичности элемента,
а не инструкция, как его найти.

EID = Source of Truth (AST)
EIQ = Transport Format (String)

Pipeline: EIQ → parse() → EID → resolve() → Element[]
```

### Использование

- ✅ Google Analytics events
- ✅ Backend aggregation keys
- ✅ Human-readable logs
- ✅ Inter-system communication
- ❌ Direct DOM queries (use EID!)
- ❌ CSS selector replacement

---

**Версия спецификации**: 1.0  
**Дата**: 2026-01-19  
**Статус**: Draft
