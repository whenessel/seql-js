# Type and Interface Naming

Naming conventions for types, interfaces, and type aliases.

## Format

- **PascalCase**: Capitalize first letter of each word
- **Descriptive**: Name should clearly indicate the type's purpose
- **No prefixes**: **STRICTLY FORBIDDEN** - Never use I/T prefixes (no IUser, TData, IUserProfile, TApiResponse)
- **Suffixes by purpose**: Use appropriate suffixes (Params, Options, Result, State, Config)

## Basic Rules

### Allowed

```typescript
interface UserProfile { ... }
type ApiResponse = { ... };
interface ConfigOptions { ... }
type ProcessResult = { ... };
```

### Forbidden

```typescript
interface IUserProfile { ... }      // I prefix
type TApiResponse = { ... };          // T prefix
interface user_profile { ... }        // snake_case
type api-response = { ... };          // kebab-case
```

## Suffixes

Use appropriate suffixes to indicate purpose:

### Type

For discriminated unions or complex type definitions:

```typescript
type UserRole = 'admin' | 'user' | 'guest';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type StatusType = 'active' | 'inactive' | 'pending';
```

### Options

For configuration objects:

```typescript
interface RequestOptions {
  timeout?: number;
  retries?: number;
}

interface ProcessOptions {
  validate?: boolean;
  transform?: boolean;
}
```

### Result

For function return types:

```typescript
interface ProcessResult {
  success: boolean;
  data?: Data;
  error?: Error;
}

type ValidationResult = { valid: true; value: unknown } | { valid: false; errors: string[] };
```

### Config

For configuration types:

```typescript
interface AppConfig {
  apiUrl: string;
  timeout: number;
}

interface DatabaseConfig {
  host: string;
  port: number;
}
```

### Params

For parameter objects (commonly used in React/API calls):

```typescript
interface CreateUserParams {
  name: string;
  email: string;
}

interface QueryParams {
  limit?: number;
  offset?: number;
}

interface FetchOptions {
  includeDeleted?: boolean;
  sortBy?: string;
}
```

### State

For React/Redux state types:

```typescript
interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
};
```

## Interfaces vs Type Aliases

### Use Interfaces For

- Object shapes that may be extended:

```typescript
interface User {
  id: string;
  name: string;
}

interface AdminUser extends User {
  permissions: string[];
}
```

### Use Type Aliases For

- Unions and intersections:

```typescript
type Status = 'active' | 'inactive';
type UserOrAdmin = User | AdminUser;
type UserWithTimestamp = User & { timestamp: number };
```

- Complex types:

```typescript
type EventHandler = (event: Event) => void;
type StringOrNumber = string | number;
```

## Generic Types

Generic type parameters should be descriptive:

### Allowed

```typescript
interface Repository<TEntity> { ... }
interface Cache<TKey, TValue> { ... }
type Result<TData, TError> = ...;
```

### Forbidden

```typescript
interface Repository<T> { ... }           // Too generic (acceptable in simple cases)
interface Cache<K, V> { ... }             // Single letters (acceptable in simple cases)
type Result<T, E> = ...;                  // Too generic
```

For complex generics, use descriptive names:

```typescript
interface Repository<TEntity extends Entity> { ... }
interface Cache<TKey extends string, TValue> { ... }
type Result<TData, TError extends Error> = ...;
```

## Union Types

Union types should be descriptive:

```typescript
type Status = 'active' | 'inactive' | 'pending';
type UserRole = 'admin' | 'user' | 'guest';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

## Discriminated Unions

Use a discriminator property:

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: string };

type Event =
  | { type: 'click'; target: Element }
  | { type: 'submit'; form: HTMLFormElement }
  | { type: 'load'; url: string };
```

## Utility Types

Utility types follow TypeScript conventions:

```typescript
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type ReadonlyUser = Readonly<User>;
type UserKeys = keyof User;
```

## Examples

### Good

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface ApiOptions {
  timeout?: number;
  retries?: number;
}

type ProcessResult = { success: true; data: Data } | { success: false; error: Error };

interface CreateUserParams {
  name: string;
  email: string;
}
```

### Bad

```typescript
// ❌ STRICTLY FORBIDDEN - Prefixes
interface IUserProfile { ... }            // I prefix - NEVER USE
type TApiResponse = { ... };              // T prefix - NEVER USE
interface IUser { ... }                   // I prefix - NEVER USE

// ❌ Wrong case
interface user_profile { ... }            // snake_case
type api-response = { ... };              // kebab-case

// ❌ Abbreviations
interface ApiOpts { ... }                 // Use ApiOptions
type ProcessRes = ...;                    // Use ProcessResult
interface CreateUserP { ... }             // Use CreateUserParams
```

## Type vs Interface

Prefer interfaces for object shapes, types for unions/intersections:

```typescript
// Good: Interface for object shape
interface User {
  id: string;
  name: string;
}

// Good: Type for union
type Status = 'active' | 'inactive';

// Good: Type for complex type
type EventHandler = (event: Event) => void;
```

## Extending Types

When extending, maintain naming consistency:

```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
}

interface User extends BaseEntity {
  name: string;
  email: string;
}
```
