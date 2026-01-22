# Generation Issues

Troubleshooting EID generation problems.

## Returns Null

**Problem**: `generateEID()` returns `null`

**Causes & Solutions**:

1. **Element not connected to DOM**
   ```typescript
   const orphan = document.createElement('div');
   generateEID(orphan);  // Returns null

   // Solution: Ensure element is in document
   document.body.appendChild(orphan);
   generateEID(orphan);  // Now works
   ```

2. **Element lacks semantic features**
   ```typescript
   const generic = document.createElement('div');
   generateEID(generic);  // May return null

   // Solution: Add semantic attributes
   generic.setAttribute('role', 'region');
   generateEID(generic);  // Now works
   ```

3. **Confidence below threshold**
   ```typescript
   generateEID(element, { confidenceThreshold: 0.9 });  // May return null

   // Solution: Lower threshold or improve element semantics
   generateEID(element, { confidenceThreshold: 0.1 });
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
