# Performance Optimization

Tips for improving SEQL performance.

## Slow Generation

**Problem**: `generateEID()` takes too long

**Solutions**:

1. **Use Caching**

   ```typescript
   // Automatic with global cache
   generateEID(element); // Cached automatically
   ```

2. **Reduce Path Depth**

   ```typescript
   generateEID(element, { maxPathDepth: 5 });
   ```

3. **Disable SVG Fingerprinting**

   ```typescript
   generateEID(element, { enableSvgFingerprint: false });
   ```

4. **Batch Processing**

   ```typescript
   // Bad: Individual calls
   elements.forEach((el) => generateEID(el));

   // Good: Batch
   generateEIDBatch(elements);
   ```

## Slow Resolution

**Problem**: `resolve()` takes too long

**Solutions**:

1. **Scope to Container**

   ```typescript
   // Bad: Search entire document
   resolve(eid, document);

   // Good: Search within container
   const container = document.querySelector('.modal');
   resolve(eid, container);
   ```

2. **Limit Candidates**

   ```typescript
   resolve(eid, document, { maxCandidates: 50 });
   ```

3. **Use Simple Selectors**
   - Shorter paths resolve faster
   - Fewer constraints = faster evaluation

## Memory Issues

**Problem**: High memory usage

**Solutions**:

1. **Limit Cache Size**

   ```typescript
   const cache = createEIDCache({ maxSize: 500 });
   ```

2. **Clear Cache Periodically**

   ```typescript
   // On navigation
   window.addEventListener('beforeunload', () => {
     getGlobalCache().clear();
   });
   ```

3. **Avoid Storing DOM References**

   ```typescript
   // Bad: Storing elements
   const elements = [element1, element2];

   // Good: Storing selectors
   const selectors = elements.map((el) => generateSEQL(el));
   ```

## Monitoring

```typescript
// Track generation time
console.time('generation');
const eid = generateEID(element);
console.timeEnd('generation');

// Track resolution time
console.time('resolution');
const result = resolve(eid, document);
console.timeEnd('resolution');

// Monitor cache
const stats = getGlobalCache().getStats();
console.log('Hit rate:', stats.hitRate);
```
