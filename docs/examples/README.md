# Examples

Real-world examples demonstrating SEQL usage across different scenarios.

## Quick Navigation

- **[Basic Examples](./basic-examples.md)** - 15 essential patterns
- **[Forms](./forms.md)** - Form elements and validation
- **[Navigation](./navigation.md)** - Menus, tabs, breadcrumbs
- **[Tables](./tables.md)** - Table cells with nth-child
- **[SVG Elements](./svg-elements.md)** - SVG graphics and icons
- **[Edge Cases](./edge-cases.md)** - Complex scenarios
- **[Migration](./migration.md)** - Moving from CSS/XPath

## Example Categories

### By Use Case

| Use Case | Examples | Link |
|----------|----------|------|
| Button clicks | Submit buttons, actions, dialogs | [Basic Examples](./basic-examples.md#buttons) |
| Form inputs | Text, email, checkboxes, selects | [Forms](./forms.md) |
| Links & navigation | Nav menus, breadcrumbs, tabs | [Navigation](./navigation.md) |
| Tables | Cells, rows, headers | [Tables](./tables.md) |
| Dynamic content | Modals, dropdowns, tooltips | [Edge Cases](./edge-cases.md) |
| Graphics | SVG icons, charts | [SVG Elements](./svg-elements.md) |

### By Complexity

| Level | Description | Examples |
|-------|-------------|----------|
| Beginner | Single elements, simple selectors | [Basic Examples](./basic-examples.md) |
| Intermediate | Forms, navigation, tables | [Forms](./forms.md), [Navigation](./navigation.md) |
| Advanced | SVG, dynamic content, edge cases | [SVG Elements](./svg-elements.md), [Edge Cases](./edge-cases.md) |

## Common Patterns

### Pattern: Track User Clicks

```typescript
import { generateSEQL } from 'seql-js';

document.addEventListener('click', (event) => {
  const target = event.target as Element;
  const selector = generateSEQL(target);

  if (selector) {
    // Send to analytics
    console.log('Clicked:', selector);
  }
});
```

See: [Basic Examples - Event Tracking](./basic-examples.md#event-tracking)

### Pattern: Form Field Identification

```typescript
import { generateSEQL } from 'seql-js';

const emailInput = document.querySelector('input[type="email"]');
const selector = generateSEQL(emailInput);
// Result: "v1: form :: input[type="email",name="email"]"
```

See: [Forms - Input Fields](./forms.md#input-fields)

### Pattern: Table Cell Selection

```typescript
import { generateSEQL } from 'seql-js';

const cell = document.querySelector('table tr:nth-child(2) td:nth-child(3)');
const selector = generateSEQL(cell);
// Result: "v1: table :: tr[nthChild=2] > td[nthChild=3]"
```

See: [Tables - Cell Identification](./tables.md#cell-identification)

## Testing Your Selectors

All examples can be tested in your browser console:

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// 1. Generate selector
const element = document.querySelector('button');
const selector = generateSEQL(element);

console.log('Selector:', selector);

// 2. Resolve it back
const resolved = resolveSEQL(selector, document);

console.log('Resolved:', resolved[0]);
console.log('Match:', resolved[0] === element);  // Should be true
```

## Next Steps

- Start with [Basic Examples](./basic-examples.md) if you're new to SEQL
- Check [Forms](./forms.md) for common form scenarios
- See [Migration](./migration.md) if moving from CSS/XPath
- Review [Edge Cases](./edge-cases.md) for complex scenarios
