# Anchor Finding Strategy

Algorithm for finding semantic anchor elements.

## Algorithm

```
1. Start from target element
2. Traverse upward (max 10 levels)
3. Check each ancestor against tier criteria
4. Return first match or fallback
```

## Anchor Tiers

### Tier A: Native Semantic Tags (Highest Priority)
- `<form>`
- `<main>`
- `<nav>`
- `<section>`
- `<article>`
- `<header>`
- `<footer>`

### Tier B: ARIA Roles
- `role="navigation"`
- `role="main"`
- `role="region"`
- `role="dialog"`
- `role="form"`

### Tier C: Fallback
- Elements with `data-testid`
- Elements with stable `id`
- `<body>` as last resort

## Selection Logic

```typescript
function findAnchor(target: Element): AnchorResult | null {
  let current = target.parentElement;
  let depth = 0;

  while (current && depth < 10) {
    // Check Tier A
    if (SEMANTIC_TAGS.has(current.tagName.toLowerCase())) {
      return { element: current, tier: 'A', depth };
    }

    // Check Tier B
    const role = current.getAttribute('role');
    if (role && SEMANTIC_ROLES.has(role)) {
      return { element: current, tier: 'B', depth };
    }

    // Check Tier C
    if (hasStableTestId(current) || hasStableId(current)) {
      return { element: current, tier: 'C', depth };
    }

    current = current.parentElement;
    depth++;
  }

  // Fallback to body
  return { element: document.body, tier: 'C', depth: 10 };
}
```

## Depth Penalty

Anchors found at greater depths receive lower confidence scores:
- Depth 0-3: No penalty
- Depth 4-6: 10% confidence reduction
- Depth 7-9: 20% confidence reduction
- Depth 10+: 30% confidence reduction (degraded)

## Examples

**Tier A:**
```html
<form>
  <input type="email">  <!-- Anchor: <form>, Tier A, Depth 1 -->
</form>
```

**Tier B:**
```html
<div role="dialog">
  <button>Close</button>  <!-- Anchor: div[role="dialog"], Tier B, Depth 1 -->
</div>
```

**Tier C:**
```html
<div data-testid="user-profile">
  <h1>Profile</h1>  <!-- Anchor: div[data-testid="user-profile"], Tier C, Depth 1 -->
</div>
```
