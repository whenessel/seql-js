# Generation Issues

Troubleshooting EID generation problems.

## Returns Null

**Problem**: `generateEID()` returns `null`

**Since v1.3.0**: `generateEID` only returns `null` for **invalid elements**. Valid elements always get an EID (low confidence is indicated via `meta.confidence`).

**Causes & Solutions**:

1. **Element not connected to DOM**

   ```typescript
   const orphan = document.createElement('div');
   generateEID(orphan); // Returns null - not in DOM

   // Solution: Ensure element is in document
   document.body.appendChild(orphan);
   generateEID(orphan); // ✓ Now returns EID
   ```

2. **Element has no ownerDocument**

   ```typescript
   const element = document.createElement('div');
   Object.defineProperty(element, 'ownerDocument', { value: null });
   generateEID(element); // Returns null - invalid state
   ```

3. **Confidence below threshold** (explicit filter)

   ```typescript
   // v1.3.0+: Must explicitly set threshold to filter low-confidence
   generateEID(element, { confidenceThreshold: 0.5 }); // May return null

   // Default behavior (threshold: 0.0) - always returns EID
   const eid = generateEID(element);
   if (eid && eid.meta.confidence < 0.5) {
     console.warn('Low confidence:', eid.meta.confidence);
   }
   ```

### Migration from v1.2.0

**Old behavior** (v1.2.0 and earlier):

```typescript
const eid = generateEID(element);
if (!eid) {
  console.log('Element has low semantic quality');
}
```

**New behavior** (v1.3.0+):

```typescript
const eid = generateEID(element);
if (eid && eid.meta.confidence < 0.1) {
  console.log('Element has low semantic quality');
}

// OR restore old behavior
const eid = generateEID(element, { confidenceThreshold: 0.1 });
if (!eid) {
  console.log('Element has low semantic quality');
}
```

## Low Confidence

**Problem**: `eid.meta.confidence < 0.5`

**Causes**:

- Weak anchor (Tier C or deep nesting)
- Path degradation (many non-semantic nodes)
- Sparse semantics (no classes, attributes, text)

**Solutions**:

- Add semantic HTML (`<form>`, `<main>`, etc.)
- Add ARIA attributes
- Use data-testid for important elements

## Degraded EID

**Problem**: `eid.meta.degraded === true`

**Check reason**:

```typescript
const eid = generateEID(element);
if (eid?.meta.degraded) {
  console.log('Reason:', eid.meta.degradationReason);
}
```

**Common reasons**:

- `weak-anchor`: No semantic anchor found
- `deep-path`: Path > 10 nodes
- `sparse-semantics`: Element has minimal features
