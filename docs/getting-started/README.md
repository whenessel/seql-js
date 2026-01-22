# Getting Started with SEQL

Welcome to SEQL (Semantic Element Query Language) - a robust solution for stable DOM element identification.

## What is SEQL?

SEQL provides semantic-first element identification that survives DOM restructuring, CSS changes, and framework updates. Unlike brittle CSS selectors or XPath, SEQL describes **what** an element is, not **how** to reach it.

## Quick Start (5 minutes)

### Installation

```bash
yarn add @whenessel/seql-js
# or
npm install @whenessel/seql-js
```

### Basic Usage

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// 1. Generate a SEQL selector from an element
const button = document.querySelector('.submit-button');
const selector = generateSEQL(button);
// Result: "v1: form :: div.actions > button[type="submit",text="Order Now"]"

// 2. Resolve the selector back to the element
const elements = resolveSEQL(selector, document);
// Returns: [<button>...]
```

That's it! You've just created a stable identifier for a DOM element.

## Why SEQL?

**Problem**: CSS selectors like `.modal > div:nth-child(3) > button.primary` break when:
- Developers add a new div above your target
- CSS classes are renamed during refactoring
- The component library is updated

**Solution**: SEQL uses semantic features:
- Semantic HTML tags (`<form>`, `<main>`, `<nav>`)
- ARIA roles and labels
- Stable attributes (test IDs, names, types)
- Text content
- Structural relationships

**Example**:
```typescript
// Brittle CSS selector
const badSelector = '.modal > div:nth-child(3) > button.primary';

// SEQL semantic selector
const goodSelector = 'v1: main[role="dialog"] :: button[type="submit",text="Save"]';
```

The SEQL selector remains valid even if:
- The modal's CSS classes change
- Divs are added/removed above the button
- The button's position changes in the DOM

## Core Concepts

### EID vs SEQL Selector

SEQL offers two formats:

1. **SEQL Selector (String)** - Compact, URL-safe format for analytics and transport
   ```typescript
   "v1: form :: div.actions > button[text='Submit']"
   ```

2. **EID (JSON)** - Detailed structure for internal operations and high precision
   ```typescript
   {
     "anchor": { "tag": "form", "semantics": {...} },
     "path": [...],
     "target": { "tag": "button", "semantics": {...} }
   }
   ```

Use **SEQL Selector** for most use cases. Use **EID** when you need programmatic access to the full semantic structure.

### The Identity Model

Every SEQL identifier consists of:

- **Anchor**: A semantic root element (e.g., `<form>`, `<main>`, ARIA landmark)
- **Path**: Semantic traversal from anchor to target's parent
- **Target**: The specific element being identified
- **Constraints**: Disambiguation rules (uniqueness, visibility, text proximity)

Example breakdown:
```
v1: form[aria-label="Login"] :: div.fields > input[type="email",name="email"]
│   └────────anchor────────┘    └──────path──────┘  └────────target─────────┘
└─ version
```

## Next Steps

- [Installation](./installation.md) - Detailed setup instructions
- [Basic Usage](./basic-usage.md) - Common patterns and examples
- [Concepts](./concepts.md) - Deep dive into the identity model
- [API Reference](../api/) - Complete API documentation
- [Examples](../examples/) - Real-world use cases

## Common Use Cases

### Session Replay (rrweb)

```typescript
import { generateSEQL } from 'seql-js';

// During recording
document.addEventListener('click', (event) => {
  const selector = generateSEQL(event.target as Element);
  sendAnalytics({ type: 'click', element: selector });
});
```

### Web Analytics

```typescript
import { generateSEQL } from 'seql-js';

// Track button clicks
const trackClick = (button: HTMLButtonElement) => {
  const selector = generateSEQL(button);
  gtag('event', 'button_click', { element: selector });
};
```

### Test Automation

```typescript
import { resolveSEQL } from 'seql-js';

// Find elements by semantic identity
const findLoginButton = () => {
  const selector = 'v1: form[aria-label="Login"] :: button[type="submit"]';
  return resolveSEQL(selector, document)[0];
};
```

## Requirements

- **Node.js**: v18 or higher
- **Browser**: Modern browsers with ES2015+ support
- **TypeScript**: v4.5+ (optional, but recommended)

## Getting Help

- [Troubleshooting](../troubleshooting/) - Common issues and solutions
- [GitHub Issues](https://github.com/whenessel/seql-js/issues) - Report bugs or request features
- [Examples](../examples/) - More real-world examples
