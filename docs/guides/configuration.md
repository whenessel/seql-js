# Configuration Guide

Customizing SEQL behavior.

## Generator Options

```typescript
interface GeneratorOptions {
  maxPathDepth?: number;          // Default: 10
  enableSvgFingerprint?: boolean; // Default: true
  confidenceThreshold?: number;   // Default: 0.1
  fallbackToBody?: boolean;       // Default: true
  cache?: EIDCache;              // Default: global cache
}
```

## Resolver Options

```typescript
interface ResolverOptions {
  strictMode?: boolean;         // Default: false
  requireUniqueness?: boolean;  // Default: false
  enableFallback?: boolean;     // Default: true
  maxCandidates?: number;       // Default: 100
}
```

## Stringify Options

```typescript
interface StringifyOptions {
  verbose?: boolean;        // Default: false
  includeNthChild?: boolean; // Default: true
}
```

## Example Configurations

### High Quality

```typescript
generateEID(element, {
  maxPathDepth: 15,
  confidenceThreshold: 0.5
});
```

### Performance Optimized

```typescript
generateEID(element, {
  maxPathDepth: 5,
  enableSvgFingerprint: false
});
```

### Strict Resolution

```typescript
resolve(eid, document, {
  strictMode: true,
  requireUniqueness: true,
  enableFallback: false
});
```
