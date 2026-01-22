# File Naming

Naming conventions for source files, test files, and configuration files.

## Format

- **kebab-case**: All lowercase with hyphens separating words
- **No dots**: Except for file extension
- **Descriptive**: File name should reflect its primary export or purpose

## Source Files

### Allowed

```
user-service.ts
data-processor.ts
api-client.ts
config-loader.ts
error-handler.ts
```

### Forbidden

```
UserService.ts          // PascalCase not allowed
userService.ts           // camelCase not allowed
user_service.ts          // snake_case not allowed
user.service.ts          // Multiple dots not allowed
usr-svc.ts              // Abbreviations not allowed
```

## Test Files

Test files mirror source file names exactly, with test suffix.

### Allowed

```
user-service.test.ts
user-service.spec.ts
data-processor.test.ts
```

### Forbidden

```
UserService.test.ts      // Wrong case
user-service-test.ts     // Wrong suffix position
test-user-service.ts     // Wrong prefix
```

## Configuration Files

Configuration files follow project conventions but typically use kebab-case:

```
tsconfig.json
eslint.config.js
vite.config.ts
```

## Special Files

### Index Files

Use `index.ts` (or `index.js`) for module entry points:

```
src/
  services/
    index.ts           // Re-exports from services
  utils/
    index.ts           // Re-exports from utils
```

### Type Definition Files

Use `.d.ts` extension for type definitions:

```
types.d.ts
global.d.ts
```

## Rules

1. **One primary export per file**: File name should match the primary export
2. **Consistent naming**: Related files should follow similar patterns
3. **No abbreviations**: Use full words unless abbreviation is widely accepted
4. **Descriptive**: File name should clearly indicate its purpose

## Examples

### Good

```
// File: user-service.ts
export class UserService { ... }

// File: api-client.ts
export class ApiClient { ... }

// File: config-loader.ts
export function loadConfig() { ... }
```

### Bad

```
// File: user.ts          // Too generic
export class UserService { ... }

// File: api.ts            // Too generic
export class ApiClient { ... }

// File: cfg.ts            // Abbreviation
export function loadConfig() { ... }
```
