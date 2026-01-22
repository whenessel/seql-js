# Resolution Failures

Troubleshooting element resolution problems.

## No Elements Found

**Problem**: `result.elements.length === 0`

**Causes & Solutions**:

1. **Element removed from DOM**
   ```typescript
   // Check if element still exists
   const selector = 'v1: form :: button[type="submit"]';
   const elements = resolveSEQL(selector, document);

   if (elements.length === 0) {
     console.warn('Element may have been removed');
   }
   ```

2. **Wrong root context**
   ```typescript
   // Bad: Wrong container
   resolveSEQL(selector, wrongContainer);

   // Good: Correct container
   const modal = document.querySelector('.modal');
   resolveSEQL(selector, modal);
   ```

3. **DOM structure changed**
   ```typescript
   // Regenerate selector for current DOM
   const newSelector = generateSEQL(element);
   ```

## Multiple Matches (Ambiguous)

**Problem**: `result.status === 'ambiguous'`

**Solutions**:

1. **Use first match**
   ```typescript
   if (result.status === 'ambiguous') {
     const element = result.elements[0];  // Use first
   }
   ```

2. **Require uniqueness**
   ```typescript
   const result = resolve(eid, document, {
     requireUniqueness: true
   });
   // Fails if multiple matches
   ```

3. **Add constraints to EID**
   - Regenerate EID with more specific attributes
   - Element may need unique identifier

## Invalid Selector

**Problem**: Parse error or invalid CSS

**Check**:
```typescript
try {
  const eid = parseSEQL(selector);
  const result = resolve(eid, document);
} catch (error) {
  console.error('Invalid selector:', error.message);
}
```

**Solutions**:
- Verify SEQL selector format
- Check for proper escaping
- Regenerate selector from element
