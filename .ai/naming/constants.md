# Constant Naming

Naming conventions for constants and immutable values.

## Format

- **UPPER_SNAKE_CASE**: All uppercase with underscores separating words
- **Descriptive**: Name should clearly indicate the constant's purpose
- **No abbreviations**: Use full words unless abbreviation is widely accepted

## Basic Rules

### Allowed

```typescript
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
const API_BASE_URL = 'https://api.example.com';
const MIN_PASSWORD_LENGTH = 8;
```

### Forbidden

```typescript
const maxRetryCount = 3; // camelCase
const MaxRetryCount = 3; // PascalCase
const max_retry_count = 3; // snake_case (lowercase)
const MAX_RETRY_CNT = 3; // Abbreviation
const MR = 3; // Too abbreviated
```

## Constant Types

### Configuration Constants

Configuration values:

```typescript
const DEFAULT_TIMEOUT = 5000;
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const CACHE_TTL = 3600000;
```

### Limit Constants

Numeric limits and bounds:

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_PASSWORD_LENGTH = 8;
const MAX_ITEMS_PER_PAGE = 100;
const MIN_AGE = 18;
```

### Enum-Like Constants

Constants representing fixed sets of values:

```typescript
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;
```

### Magic Numbers

Replace magic numbers with named constants:

```typescript
// Bad
if (retries > 3) { ... }
setTimeout(callback, 5000);

// Good
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

if (retries > MAX_RETRY_COUNT) { ... }
setTimeout(callback, DEFAULT_TIMEOUT);
```

## Object Constants

For constant objects, use UPPER_SNAKE_CASE for consistency with other constants:

```typescript
const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input provided',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
} as const;

const API_ENDPOINTS = {
  USERS: '/api/users',
  ORDERS: '/api/orders',
  PRODUCTS: '/api/products',
} as const;
```

## Array Constants

For constant arrays:

```typescript
const REQUIRED_FIELDS = ['name', 'email', 'password'] as const;
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de'] as const;
```

## Regex Constants

For regular expressions:

```typescript
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

## Environment-Specific Constants

For environment-specific values:

```typescript
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const DEBUG_MODE = process.env.DEBUG === 'true';
```

## Computed Constants

Constants computed from other values:

```typescript
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;
```

## Examples

### Good

```typescript
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
const API_BASE_URL = 'https://api.example.com';
const MIN_PASSWORD_LENGTH = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ERROR_MESSAGES = {
  INVALID_INPUT: 'Invalid input',
  NOT_FOUND: 'Not found',
} as const;
```

### Bad

```typescript
const maxRetryCount = 3; // Wrong case
const MAX_RETRY_CNT = 3; // Abbreviation
const max_retry_count = 3; // Wrong case
const MR = 3; // Too abbreviated
const retries = 3; // Not a constant name
```

## When to Use Constants

Use constants for:

- Configuration values
- Magic numbers/strings
- Fixed sets of values
- Environment-specific flags
- Computed values that don't change

Don't use constants for:

- Values that change at runtime
- Function parameters
- Local variables

## Readonly vs Const

Prefer `const` for primitives, `as const` for objects/arrays:

```typescript
const MAX_COUNT = 10; // Primitive

const CONFIG = {
  timeout: 5000,
  retries: 3,
} as const; // Object

const ITEMS = ['a', 'b', 'c'] as const; // Array
```
