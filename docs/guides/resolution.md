# Resolution Guide

Understanding how EIDs are resolved back to elements.

## Basic Resolution

```typescript
import { resolve } from 'seql-js';

const eid = {...};  // Previously generated
const result = resolve(eid, document);

console.log('Status:', result.status);
console.log('Elements:', result.elements);
console.log('Confidence:', result.confidence);
```

## Handling Different Statuses

### Success (Single Match)

```typescript
if (result.status === 'success') {
  const element = result.elements[0];
  element.click();
}
```

### Ambiguous (Multiple Matches)

```typescript
if (result.status === 'ambiguous') {
  console.warn(`Found ${result.elements.length} matches`);
  // Use first, ask user, or apply additional filters
}
```

### Error (No Matches)

```typescript
if (result.status === 'error') {
  console.error('Element not found');
  result.warnings.forEach((w) => console.warn(w));
}
```

## Resolution Options

### Strict Mode

```typescript
resolve(eid, document, { strictMode: true });
// Rejects degraded matches
```

### Require Uniqueness

```typescript
resolve(eid, document, { requireUniqueness: true });
// Fails if multiple matches
```

## Scoped Resolution

Search within a container:

```typescript
const modal = document.querySelector('.modal');
const result = resolve(eid, modal); // Search only in modal
```
