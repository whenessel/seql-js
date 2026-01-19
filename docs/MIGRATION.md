# Migration Guide: v0.x DSL → v1.0 EID → v1.1 SEQL Selector

## Version 1.1 Changes (Latest)

### Terminology Update: EIQ → SEQL Selector

Version 1.1 renames the string format from "EIQ" to "SEQL Selector" for better alignment with the library name and improved clarity.

| v1.0 (Old) | v1.1 (New) | Description |
|------------|------------|-------------|
| `parseEIQ()` | `parseSEQL()` | Parse string to EID |
| `stringifyEID()` | `stringifySEQL()` | Stringify EID to string |
| `generateEIQ()` | `generateSEQL()` | Convenience: generate + stringify |
| `resolveEIQ()` | `resolveSEQL()` | Convenience: parse + resolve |
| `ElementIdentityQuery` type | `SeqlSelector` type | TypeScript type for selector string |

**Migration:**

```typescript
// Old (v1.0)
import { generateEIQ, resolveEIQ, parseEIQ, stringifyEID } from 'seql-js';
const eiq = generateEIQ(element);
const elements = resolveEIQ(eiq, document);

// New (v1.1)
import { generateSEQL, resolveSEQL, parseSEQL, stringifySEQL } from 'seql-js';
const selector = generateSEQL(element);
const elements = resolveSEQL(selector, document);
```

**Automated Replacement:**
```bash
# Find and replace in your codebase
find src -type f -name "*.ts" -exec sed -i '' 's/parseEIQ/parseSEQL/g' {} \;
find src -type f -name "*.ts" -exec sed -i '' 's/stringifyEID/stringifySEQL/g' {} \;
find src -type f -name "*.ts" -exec sed -i '' 's/generateEIQ/generateSEQL/g' {} \;
find src -type f -name "*.ts" -exec sed -i '' 's/resolveEIQ/resolveSEQL/g' {} \;
find src -type f -name "*.ts" -exec sed -i '' 's/ElementIdentityQuery/SeqlSelector/g' {} \;
find src -type f -name "*.ts" -exec sed -i '' 's/\beiq\b/selector/g' {} \;
```

---

## Version 1.0 Changes

### Overview

Version 1.0 introduces a major terminology change from "DSL" to "EID/SEQL Selector" to better represent the library's purpose:

- **EID** (Element Identity Descriptor): Internal structured JSON format
- **SEQL Selector**: External string format for transport (similar to CSS Selector or XPath)

This migration guide helps you upgrade from v0.x to v1.0.

## Breaking Changes

### Function Renames

| Old (v0.x) | New (v1.0) | Description |
|------------|------------|-------------|
| `generateDsl()` | `generateEID()` | Generate element identity |
| `resolveDsl()` | `resolve()` | Resolve identity to elements |
| `validateDsl()` | `validateEID()` | Validate identity structure |
| `isDslIdentity()` | `isEID()` | Type guard for identity |
| `createDslCache()` | `createEIDCache()` | Create cache instance |
| `generateDslBatch()` | `generateEIDBatch()` | Batch generation |
| `generateDslForElements()` | `generateEIDForElements()` | Batch with details |

### Type Renames

| Old (v0.x) | New (v1.0) |
|------------|------------|
| `DslIdentity` | `ElementIdentity` |
| `DslVersion` | `EIDVersion` |
| `DslMeta` | `EIDMeta` |
| `DslSemantics` | `ElementSemantics` |
| `DslCache` | `EIDCache` |
| `DslCacheOptions` | `EIDCacheOptions` |

### Cache Method Renames

| Old (v0.x) | New (v1.0) |
|------------|------------|
| `cache.getDsl()` | `cache.getEID()` |
| `cache.setDsl()` | `cache.setEID()` |
| `cache.getDslHitRate()` | `cache.getEIDHitRate()` |

### Cache Statistics Renames

| Old (v0.x) | New (v1.0) |
|------------|------------|
| `stats.dslHits` | `stats.eidHits` |
| `stats.dslMisses` | `stats.eidMisses` |

### Constant Renames

| Old (v0.x) | New (v1.0) |
|------------|------------|
| `DSL_VERSION` | `EID_VERSION` |

## Migration Examples

### Basic Usage

**Before (v0.x):**
```typescript
import { generateDsl, resolveDsl, DslIdentity } from 'seql-js';

const dsl: DslIdentity = generateDsl(element);
const elements = resolveDsl(dsl, document);
```

**After (v1.0):**
```typescript
import { generateEID, resolve, ElementIdentity } from 'seql-js';

const eid: ElementIdentity = generateEID(element);
const elements = resolve(eid, document);
```

### With Cache

**Before (v0.x):**
```typescript
import { generateDsl, createDslCache, DslCache } from 'seql-js';

const cache: DslCache = createDslCache();
const dsl = generateDsl(element, { cache });

// Check cache
const cached = cache.getDsl(element);
cache.setDsl(element, dsl);

// Stats
const stats = cache.getStats();
console.log(`DSL hits: ${stats.dslHits}`);
console.log(`Hit rate: ${cache.getDslHitRate()}`);
```

**After (v1.0):**
```typescript
import { generateEID, createEIDCache, EIDCache } from 'seql-js';

const cache: EIDCache = createEIDCache();
const eid = generateEID(element, { cache });

// Check cache
const cached = cache.getEID(element);
cache.setEID(element, eid);

// Stats
const stats = cache.getStats();
console.log(`EID hits: ${stats.eidHits}`);
console.log(`Hit rate: ${cache.getEIDHitRate()}`);
```

### Validation

**Before (v0.x):**
```typescript
import { validateDsl, isDslIdentity } from 'seql-js';

if (isDslIdentity(data)) {
  const result = validateDsl(data);
  if (!result.valid) {
    console.error('Invalid DSL:', result.errors);
  }
}
```

**After (v1.0):**
```typescript
import { validateEID, isEID } from 'seql-js';

if (isEID(data)) {
  const result = validateEID(data);
  if (!result.valid) {
    console.error('Invalid EID:', result.errors);
  }
}
```

### Batch Generation

**Before (v0.x):**
```typescript
import { generateDslBatch, generateDslForElements } from 'seql-js';

const result1 = generateDslBatch(elements);
const result2 = generateDslForElements(elements);
```

**After (v1.0):**
```typescript
import { generateEIDBatch, generateEIDForElements } from 'seql-js';

const result1 = generateEIDBatch(elements);
const result2 = generateEIDForElements(elements);
```

## Automated Migration

You can use find-and-replace to migrate most of your code:

```bash
# Function names
sed -i '' 's/generateDsl/generateEID/g' src/**/*.ts
sed -i '' 's/resolveDsl/resolve/g' src/**/*.ts
sed -i '' 's/validateDsl/validateEID/g' src/**/*.ts
sed -i '' 's/isDslIdentity/isEID/g' src/**/*.ts
sed -i '' 's/createDslCache/createEIDCache/g' src/**/*.ts
sed -i '' 's/generateDslBatch/generateEIDBatch/g' src/**/*.ts
sed -i '' 's/generateDslForElements/generateEIDForElements/g' src/**/*.ts

# Types
sed -i '' 's/DslIdentity/ElementIdentity/g' src/**/*.ts
sed -i '' 's/DslVersion/EIDVersion/g' src/**/*.ts
sed -i '' 's/DslMeta/EIDMeta/g' src/**/*.ts
sed -i '' 's/DslSemantics/ElementSemantics/g' src/**/*.ts
sed -i '' 's/DslCache/EIDCache/g' src/**/*.ts
sed -i '' 's/DslCacheOptions/EIDCacheOptions/g' src/**/*.ts

# Constants
sed -i '' 's/DSL_VERSION/EID_VERSION/g' src/**/*.ts

# Cache methods
sed -i '' 's/getDsl(/getEID(/g' src/**/*.ts
sed -i '' 's/setDsl(/setEID(/g' src/**/*.ts
sed -i '' 's/getDslHitRate/getEIDHitRate/g' src/**/*.ts

# Cache stats
sed -i '' 's/dslHits/eidHits/g' src/**/*.ts
sed -i '' 's/dslMisses/eidMisses/g' src/**/*.ts
```

**Note:** Always review automated changes before committing!

## No Functional Changes

**Important:** This is a pure terminology change. The functionality remains identical:

- ✅ Same generation algorithm
- ✅ Same resolution behavior
- ✅ Same caching strategy
- ✅ Same confidence scoring
- ✅ Same constraints system
- ✅ Same fallback handling

Your existing EID structures (previously called "DSL") remain fully compatible with the new API.

## What's Not Changed

These remain the same in v1.0:

- All semantic detection logic
- Anchor finding algorithm
- Path building strategy
- CSS selector generation
- Constraint evaluation
- Fallback mechanisms
- SVG fingerprinting
- Class filtering
- Text normalization

## Future Features

Coming in future releases:

- **EIQ Parser**: `parseEIQ()` and `stringifyEID()` functions for string format
- String-based element identity queries
- Transport-optimized EIQ format

## Need Help?

If you encounter issues during migration:

1. Check the [API documentation](../README.md)
2. Review the [CLAUDE.md developer guide](../CLAUDE.md)
3. Open an issue on [GitHub](https://github.com/whenessel/seql-js/issues)

## Version Support

- **v0.x**: No longer supported
- **v1.0+**: Active development and support

We recommend upgrading to v1.0 as soon as possible to benefit from improved naming and future features.
