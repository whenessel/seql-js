# EIQ Syntax Cheatsheet

## 🔤 Базовый синтаксис

```
v1: anchor :: path > target {constraints}
│   │       │  │       │      │
│   │       │  │       │      └─ Constraints (optional)
│   │       │  │       └─ Target element
│   │       │  └─ Path (semantic nodes)
│   │       └─ Anchor separator
│   └─ Anchor element
└─ Version (required)
```

## 📐 Компоненты узла

```
tag(.class)*[attr=value,attr~=value]#position
│   │        │                       │
│   │        │                       └─ Position (nth-child)
│   │        └─ Attributes (sorted alphabetically)
│   └─ Classes (semantic only, sorted)
└─ Tag name (required)
```

## 🔧 Разделители

| Символ | Назначение  | Пример                          |
| ------ | ----------- | ------------------------------- |
| `:`    | Версия      | `v1:`                           |
| `::`   | Anchor      | `footer ::`                     |
| `>`    | Path        | `ul > li`                       |
| `.`    | Class       | `.btn-primary`                  |
| `[]`   | Attributes  | `[type="submit"]`               |
| `=`    | Exact match | `text="Click"`                  |
| `~=`   | Contains    | `text~="click"`                 |
| `#`    | Position    | `li#3`                          |
| `{}`   | Constraints | `{pos=3}`                       |
| `,`    | Separator   | `[role="button",type="submit"]` |

## ✅ Правильно

```eiq
v1: footer :: ul.space-y-3 > li#3 > a[href="/contact"]

v1: form :: input[name="email",type="email"]

v1: section :: button.btn-primary[type="button"]

v1: nav[aria-label="Main"] :: ul > li > a

v1: footer :: svg.lucide-mail > rect[dHash="7bf591b2"]
```

## ❌ Неправильно

```
footer>ul>li:nth-child(3)>a
(Нет версии, нет пробелов, псевдокласс)

v1:div[class*="btn"]::button
(CSS attribute selector)

v1: footer :: li[text="john@example.com"]
(PII в тексте)

v1: div.flex.mt-4 :: button
(Utility классы)

v1: ul ~ li
(Запрещенный комбинатор)
```

## 📋 Примеры по категориям

### Кнопки

```eiq
v1: form :: button[type="submit"]
v1: dialog :: button[aria-label="Close"]
v1: section :: button.btn-primary#2
```

### Ссылки

```eiq
v1: nav :: a[href="/products"]
v1: footer :: a[href="mailto:info@example.com"]
v1: section :: a[target="_blank"]
```

### Поля ввода

```eiq
v1: form :: input[name="email",type="email"]
v1: form :: input[name="password",type="password"]
v1: form :: input[type="checkbox"]#1
```

### Списки

```eiq
v1: footer :: ul.space-y-3 > li#3
v1: nav :: ul.menu > li.active > a
v1: article :: ol > li[text~="step"]
```

### SVG

```eiq
v1: footer :: svg.lucide-mail > rect[dHash="abc123"]
v1: button :: svg.icon > path#1
v1: section :: svg > circle[dHash="def456"]
```

### Формы

```eiq
v1: form[id="login"] :: input[name="username"]
v1: form :: fieldset#2 > input[type="text"]
v1: form :: button[type="submit"] {pos=1}
```

### Таблицы

```eiq
v1: table :: thead > tr > th#2
v1: table :: tbody > tr#3 > td#1
v1: table :: tbody > tr[data-id="123"]
```

### Модалы

```eiq
v1: body :: div[role="dialog"]
v1: div[role="dialog"] :: button[aria-label="Close"]
v1: div[role="dialog"] :: div.modal-footer > button
```

## 🚫 Запреты

### Псевдоклассы (используйте #N)

```
❌ li:nth-child(3)
✅ li#3

❌ li:first-child
✅ li#1

❌ button:hover
✅ button
```

### Комбинаторы (только >)

```
❌ ul ~ li
✅ ul > li

❌ ul + li
✅ ul > li

❌ ul   li
✅ ul > li
```

### Attribute selectors (только = и ~=)

```
❌ [class^="btn-"]
✅ .btn-primary

❌ [class*="button"]
✅ .button

❌ [href$=".pdf"]
✅ [href="/docs/file.pdf"]
```

## 🔐 PII Rules

```
❌ text="john.doe@example.com"
✅ text-hash="7bf591b2"

❌ text="+39 123 4567 890"
✅ text~="+39"

❌ text="John Doe"
✅ text-pattern="name"
```

## 📏 Сортировка

### Атрибуты (алфавитно)

```
✅ [aria-label="Close",id="modal",role="button"]
❌ [id="modal",role="button",aria-label="Close"]
```

### Классы (алфавитно)

```
✅ .btn-primary.large
❌ .large.btn-primary
```

## 🔄 Escape правила

```
text="Say \"Hello\""         (quotes)
text="C:\\Users"             (backslash)
text="A \> B"                (greater-than in value)
aria-label="Time\: 12:00"    (colon in value)
```

## ✅ Валидация

Проверьте:

- [ ] Версия: `v1:`
- [ ] Anchor separator: `::`
- [ ] Path separator: `>` (с пробелами!)
- [ ] Атрибуты отсортированы
- [ ] Классы семантические
- [ ] Текст в кавычках
- [ ] Нет PII
- [ ] Позиция через `#N`
- [ ] Нет псевдоклассов

## 🎯 Quick Reference

```
Version:     v1:
Anchor:      footer
Separator:   ::
Path:        ul.menu > li.active
Target:      a[href="/"]
Position:    #3
Constraints: {pos=3,unique=true}

Full:        v1: footer :: ul.menu > li.active > a[href="/"]#3
```

---

**См. также:**

- `EIQ_SPECIFICATION_v1.0.md` — полная спецификация
- `EIQ_PRACTICAL_EXAMPLES.md` — реальные примеры
