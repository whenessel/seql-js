# Enum Naming

Naming conventions for TypeScript enums.

## Format

- **Enum type**: PascalCase
- **Enum members**: UPPER_SNAKE_CASE
- **Descriptive**: Names should clearly indicate purpose

## Basic Rules

### Allowed

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
```

### Forbidden

```typescript
enum userRole { ... }                  // camelCase
enum User_Role { ... }                 // Wrong separator
enum UserRole {
  admin = 'admin',                     // camelCase member
  Admin = 'admin',                     // PascalCase member
}
```

## Enum Type Names

Enum types should be nouns representing a category:

### Allowed

```typescript
enum UserRole { ... }
enum HttpStatus { ... }
enum ErrorCode { ... }
enum OrderStatus { ... }
enum PermissionLevel { ... }
```

### Forbidden

```typescript
enum Roles { ... }                     // Plural (use singular)
enum HTTPStatus { ... }                // Acronym style (use HttpStatus)
enum errorCode { ... }                 // camelCase
```

## Enum Member Names

Enum members should be UPPER_SNAKE_CASE:

### Allowed

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}
```

### Forbidden

```typescript
enum UserRole {
  Admin = 'admin',                     // PascalCase
  user = 'user',                       // camelCase
  guest_role = 'guest',                // Wrong case
}
```

## String Enums

For string enums, values typically match member names (lowercase):

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

## Numeric Enums

For numeric enums, values are typically sequential:

```typescript
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}
```

## Const Enums

Const enums follow the same naming rules:

```typescript
const enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}
```

## Alternatives to Enums

### Union Types (Preferred)

For string unions, prefer union types:

```typescript
type UserRole = 'admin' | 'user' | 'guest';
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
```

### Object with `as const`

For object-based enums:

```typescript
const UserRole = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];
```

## Examples

### Good

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
}
```

### Bad

```typescript
enum userRole { ... }                  // Wrong case
enum UserRole {
  Admin = 'admin',                      // Wrong case
  user = 'user',                       // Wrong case
}

enum Roles { ... }                      // Plural
enum HTTPStatus { ... }                // Acronym style
```

## Bit Flags

For bit flag enums, use descriptive names:

```typescript
enum Permission {
  READ = 1 << 0,        // 1
  WRITE = 1 << 1,       // 2
  EXECUTE = 1 << 2,     // 4
  ADMIN = 1 << 3,       // 8
}
```

## Usage

When using enums, prefer the enum name:

```typescript
// Good
const role: UserRole = UserRole.ADMIN;
if (status === HttpStatus.OK) { ... }

// Bad
const role = 'admin';                  // Use enum instead
if (status === 200) { ... }            // Use enum instead
```
