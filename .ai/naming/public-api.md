# Public API Naming

Naming conventions for exported symbols and public APIs.

## Scope

Public API includes:
- Exported functions
- Exported classes
- Exported types/interfaces
- Exported constants
- Exported enums
- Any symbol accessible from outside the module

## Stability Requirements

Public API names must:
- **Remain stable**: Names should not change without major version bump
- **Reflect specification**: Align with project documentation and specifications
- **Be clear**: No ambiguity about purpose or usage
- **Be complete**: No abbreviations unless widely accepted

## Rules

### No Abbreviations

Public API should use full words:

#### Allowed

```typescript
export function getUserById(id: string): User { ... }
export function processUserData(data: UserData): ProcessedData { ... }
export interface UserProfile { ... }
export type ApiResponse<T> = { ... };
```

#### Forbidden

```typescript
export function getUsr(id: string): User { ... }        // Abbreviation
export function procData(data: Data): void { ... }      // Abbreviation
export interface UsrProf { ... }                       // Abbreviation
export type ApiResp<T> = { ... };                      // Abbreviation
```

### No Internal Jargon

Avoid internal implementation details in public names:

#### Allowed

```typescript
export function createUser(data: UserData): User { ... }
export class UserService { ... }
export interface UserOptions { ... }
```

#### Forbidden

```typescript
export function createUserInternal(data: UserData): User { ... }  // Internal detail
export class UserServiceImpl { ... }                              // Implementation detail
export interface UserOptionsInternal { ... }                      // Internal detail
```

### No Experimental Suffixes

Avoid suffixes indicating instability:

#### Allowed

```typescript
export function processData(data: Data): Result { ... }
export interface ConfigOptions { ... }
```

#### Forbidden

```typescript
export function processDataExperimental(data: Data): Result { ... }  // Experimental
export interface ConfigOptionsBeta { ... }                           // Beta
export function processDataV2(data: Data): Result { ... }             // Version suffix
```

### Alignment with Documentation

Public API names should match project documentation:

```typescript
// If documentation says "User Profile", use:
export interface UserProfile { ... }

// Not:
export interface UserProf { ... }        // Abbreviation
export interface Profile { ... }         // Too generic
```

## Versioning Considerations

### Breaking Changes

Renaming public API requires major version bump:

```typescript
// v1.0.0
export function getUser(id: string): User { ... }

// v2.0.0 (breaking change)
export function getUserById(id: string): User { ... }
```

### Deprecation

When deprecating, use `@deprecated` tag:

```typescript
/**
 * @deprecated Use getUserById instead
 */
export function getUser(id: string): User { ... }
```

## Examples

### Good Public API

```typescript
// Functions
export function getUserById(id: string): User { ... }
export function createUser(data: UserData): User { ... }
export function updateUser(id: string, data: Partial<User>): User { ... }

// Classes
export class UserService { ... }
export class ApiClient { ... }

// Types
export interface UserProfile { ... }
export interface ApiOptions { ... }
export type ProcessResult<T> = { ... };

// Constants
export const DEFAULT_TIMEOUT = 5000;
export const MAX_RETRY_COUNT = 3;

// Enums
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
```

### Bad Public API

```typescript
// Abbreviations
export function getUsr(id: string): User { ... }
export interface UsrProf { ... }

// Internal details
export function createUserInternal(data: UserData): User { ... }
export class UserServiceImpl { ... }

// Experimental
export function processDataBeta(data: Data): Result { ... }

// Too generic
export function process(data: Data): Result { ... }
export interface Options { ... }

// Version suffixes
export function getUserV2(id: string): User { ... }
```

## Consistency

Public API should be consistent:

### Consistent Patterns

```typescript
// Good: Consistent verb patterns
export function getUserById(id: string): User { ... }
export function getOrderById(id: string): Order { ... }
export function getProductById(id: string): Product { ... }

// Good: Consistent suffixes
export interface UserOptions { ... }
export interface OrderOptions { ... }
export interface ProductOptions { ... }
```

### Inconsistent Patterns

```typescript
// Bad: Inconsistent verbs
export function getUser(id: string): User { ... }
export function fetchOrder(id: string): Order { ... }
export function loadProduct(id: string): Product { ... }

// Bad: Inconsistent suffixes
export interface UserOptions { ... }
export interface OrderConfig { ... }
export interface ProductParams { ... }
```

## Documentation Alignment

Public API names should align with:
- Project README
- API documentation
- Type definitions
- Specification documents

If documentation uses "User Profile", API should use `UserProfile`, not `UserProf` or `Profile`.

## Migration Path

When renaming public API:
1. Add new name with `@deprecated` tag on old name
2. Document migration path
3. Remove old name in next major version

```typescript
/**
 * @deprecated Use getUserById instead. Will be removed in v2.0.0
 */
export function getUser(id: string): User { ... }

export function getUserById(id: string): User { ... }
```
