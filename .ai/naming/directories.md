# Directory Naming

Naming conventions for project directories and folder structure.

## Format

- **kebab-case**: All lowercase with hyphens separating words
- **Plural nouns**: Use plural form for collections of related files
- **Descriptive**: Directory name should reflect its contents

## Common Patterns

### Allowed

```
services/          // Collection of service classes
types/             // Type definitions
components/        // UI components
handlers/          // Event/request handlers
processors/        // Data processors
validators/        // Validation functions
```

### Generic Buckets (Avoid for New Code)

Generic buckets like `utils/`, `helpers/`, `common/` are discouraged for new code because they don't reflect domain concepts and become catch-all directories. Prefer domain-specific directory names.

**Legacy code**: If `utils/` or `helpers/` already exists, it's acceptable to maintain for backward compatibility, but avoid creating new generic buckets.

**Preferred approach**: Use domain-specific names that reflect what the code actually does:

```
// Bad: Generic buckets
utils/              // Too generic - what utilities?
helpers/            // Too generic - what helpers?
common/             // Too generic - what's common?

// Good: Domain-specific
text-normalizers/   // Text normalization utilities
validators/         // Validation utilities
formatters/         // Formatting utilities
```

### Forbidden

```
service/           // Singular (use plural)
Service/           // PascalCase
service_utils/     // snake_case
serviceUtils/      // camelCase
```

## When to Use Singular vs Plural

### Use Plural

- Collections of similar entities:
  ```
  services/        // Multiple service classes
  utils/           // Multiple utility functions
  types/           // Multiple type definitions
  components/      // Multiple components
  ```

### Use Singular

- Single entity or concept:
  ```
  src/             // Source root
  dist/             // Distribution output
  build/            // Build output
  public/           // Public assets
  ```

## Common Directory Structures

### Typical Project Layout

```
src/
  services/        // Business logic services
  types/           // Type definitions
  components/      // UI components (if applicable)
  handlers/        // Event/request handlers
  config/          // Configuration files
  constants/       // Constant definitions
  // Note: Avoid generic 'utils/' - use domain-specific names like 'validators/', 'formatters/'
```

### Domain-Driven Structure (Preferred)

Domain-driven structure organizes code by business domain, avoiding generic buckets:

```
src/
  user/            // User domain
    services/
    types/
    validators/    // User-specific validators (not utils/)
  order/           // Order domain
    services/
    types/
    formatters/    // Order-specific formatters (not utils/)
```

**Note**: Even within domain directories, avoid generic `utils/` subdirectories. Use specific names that describe the functionality (validators, formatters, normalizers, etc.).

## Rules

1. **Consistency**: Use the same naming pattern across similar directories
2. **Plural for collections**: Directories containing multiple similar files should be plural
3. **Descriptive**: Directory name should clearly indicate its purpose - prefer domain concepts over technical roles
4. **No abbreviations**: Use full words unless abbreviation is widely accepted
5. **Avoid generic buckets**: Prefer domain-specific names (`validators/`, `formatters/`) over generic ones (`utils/`, `helpers/`, `common/`)

## Special Directories

### Standard Directories

These follow common conventions:

```
node_modules/      // Dependencies (standard)
dist/              // Distribution output
build/             // Build output
coverage/          // Test coverage
docs/              // Documentation
tests/             // Test files
```

### Project-Specific

Project-specific directories should follow kebab-case:

```
src/
  api-clients/     // API client implementations
  data-models/     // Data model definitions
  error-handlers/  // Error handling logic
```

## Examples

### Good

```
src/
  user-service.ts
  order-service.ts
  payment-service.ts
```

Organized as:

```
src/
  services/
    user-service.ts
    order-service.ts
    payment-service.ts
```

### Bad

```
src/
  service/         // Should be plural
    user-service.ts
  Service/         // Wrong case
    order-service.ts
  service_utils/   // Wrong case
    payment-service.ts
```
