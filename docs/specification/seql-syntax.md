# SEQL Syntax Specification

SEQL selector string format specification.

## Format

```
v1: <anchor> :: <path> > <target>
```

- `v1:` - Version prefix
- `<anchor>` - Anchor node with semantics
- `::` - Anchor-to-path separator
- `<path>` - Path nodes (` > ` separated)
- `<target>` - Target node with semantics

## Element Syntax

Elements are represented as:
```
tag[attr1="value1",attr2="value2",text="content"]
```

**Examples:**
- `form` - Just tag
- `button[type="submit"]` - Tag + attribute
- `a[href="/about",text="About"]` - Tag + multiple attributes
- `div[role="dialog",aria-label="Confirm"]` - ARIA attributes

## Complete Examples

### Simple Button
```
v1: button[type="submit",text="Save"]
```

### Form Input
```
v1: form :: input[type="email",name="email"]
```

### Navigation Link
```
v1: nav[role="navigation"] :: a[href="/products",text="Products"]
```

### Complex Path
```
v1: form :: div.fields > div.row > input[type="text",name="username"]
```

### With nth-child (v1.1.0)
```
v1: table :: tbody > tr[nthChild=3] > td[nthChild=2]
```

## Syntax Rules

1. **Version prefix**: Always `v1:` for current version
2. **Anchor separator**: Always ` :: ` (space-colon-colon-space)
3. **Path separator**: Always ` > ` (space-greater-than-space)
4. **Attribute separator**: Always `,` (comma)
5. **String values**: Always quoted with `"`
6. **Classes**: Use `.` prefix (e.g., `div.container`)
7. **nth-child**: Integer value (e.g., `nthChild=2`)

## Escaping

Special characters in values must be escaped:
- Quote: `\"` → `\"`
- Backslash: `\\` → `\\`
- Comma in value: Rare, use escaping if needed

## Compact vs Verbose

**Compact** (default):
```
v1: form :: button[type="submit"]
```

**Verbose** (all details):
```
v1: form[aria-label="Login",id="login-form"] :: div.fields > button[type="submit",text="Submit",aria-label="Submit form"]
```
