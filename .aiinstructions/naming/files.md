# File Naming

Naming conventions for source files, test files, and configuration files.

## Format

- **kebab-case**: All lowercase with hyphens separating words
- **No dots**: Except for file extension and test suffixes
- **Descriptive**: File name should reflect its primary export or purpose

## Source Files

### Regular Files

For services, utilities, and non-component code:

```
user-service.ts
data-processor.ts
api-client.ts
config-loader.ts
error-handler.ts
```

### React Component Files

**Rule**: Component file name must match the exported component name (converted to kebab-case).

```typescript
// File: user-profile.tsx
export function UserProfile() { ... }

// File: login-form.tsx
export function LoginForm() { ... }

// File: button-primary.tsx
export function ButtonPrimary() { ... }
```

**Extension Rules**:

- Use `.tsx` for files containing JSX/React components
- Use `.ts` for files containing only logic (no JSX)

**Exceptions** (use PascalCase as-is):

```
App.tsx
Routes.tsx
```

**Always use `index.tsx`** for directory-level exports:

```
components/
  navbar/
    index.tsx              // Main export
    navbar-links.tsx       // Sub-component
    navbar-styles.ts       // Styles
```

### Forbidden

```
UserService.ts           // PascalCase (except App.tsx, Routes.tsx)
userService.ts           // camelCase not allowed
user_service.ts          // snake_case not allowed
user.service.ts          // Multiple dots not allowed
usr-svc.ts               // Abbreviations not allowed

// React components - forbidden patterns
userProfile.tsx          // camelCase for components
user_profile.tsx         // snake_case
UserProfileComponent.tsx // Redundant "Component" suffix
UserProfile.tsx          // PascalCase (use kebab-case: user-profile.tsx)
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

1. **One primary export per file**: File name should match the primary export (kebab-case for components)
2. **Consistent naming**: Related files should follow similar patterns
3. **No abbreviations**: Use full words unless abbreviation is widely accepted
4. **Descriptive**: File name should clearly indicate its purpose
5. **Component naming**: React component files use kebab-case, component itself uses PascalCase
6. **No suffix redundancy**: Avoid suffixes like `Component`, `Container`, `Page` in filenames

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
