# Attribute Filtering (v1.0.3)

Separating state attributes from identity attributes for stable element identification.

## Principle

Element **identity** ≠ Element **state**

An element's identity (what it is) should not change when its state (how it appears) changes.

## Stable Attributes (Identity)

✅ **Preserved** - Define what the element is:

**Semantic Attributes:**
- `type`, `name`, `value` (for inputs)
- `href`, `src`, `action`
- `role`, `aria-label`, `aria-labelledby`, `aria-describedby`
- `for`, `form`, `placeholder`

**Test/Debug Markers:**
- `data-testid`, `data-test`, `data-qa`
- `data-cy` (Cypress)
- `data-test-*` patterns

**Stable IDs:**
- User-defined IDs
- Non-generated IDs

## State Attributes (Filtered Out)

❌ **Excluded** - Describe current state:

**ARIA State:**
- `aria-selected`, `aria-checked`, `aria-pressed`
- `aria-expanded`, `aria-hidden`, `aria-current`
- `aria-disabled`, `aria-busy`, `aria-invalid`

**Data State:**
- `data-state`, `data-active`, `data-open`
- `data-selected`, `data-expanded`, `data-orientation`

**HTML State:**
- `disabled`, `readonly`, `checked`
- `hidden`, `open`

**Library-Generated:**
- `data-radix-*`, `data-headlessui-*`, `data-reach-*`
- `data-mui-*`, `data-chakra-*`

## Example

```html
<!-- Same element in different states -->
<button
  aria-label="Menu"
  aria-expanded="false"
  data-state="closed"
>Menu</button>

<button
  aria-label="Menu"
  aria-expanded="true"
  data-state="open"
>Menu</button>
```

Both generate **same EID**:
```json
{
  "target": {
    "tag": "button",
    "semantics": {
      "attributes": { "aria-label": "Menu" },
      "text": "Menu"
    }
  }
}
```

## Benefits

- ✅ Stable across state changes (open/closed, active/inactive)
- ✅ Resilient to framework state management
- ✅ Consistent identification for analytics
- ✅ Better matching across sessions
