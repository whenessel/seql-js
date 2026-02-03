# React Hooks Naming

Naming conventions for custom React hooks.

## Format

- **MANDATORY**: All hooks must start with `use` prefix
- **camelCase**: After `use`, continue with camelCase
- **Descriptive**: Name should clearly describe what the hook does or provides

## Basic Rules

### Allowed

```typescript
function useFetchUser(userId: string) { ... }
function useFormHandler<T>(initialValues: T) { ... }
function useWindowSize() { ... }
function useDebounce<T>(value: T, delay: number) { ... }
function useLocalStorage<T>(key: string, initialValue: T) { ... }
function useToggle(initialValue: boolean = false) { ... }
```

### Forbidden

```typescript
// ❌ Missing 'use' prefix
function fetchUser(userId: string) { ... }
function formHandler() { ... }
function windowSize() { ... }

// ❌ Too generic
function useData() { ... }
function useStuff() { ... }
function useValue() { ... }
function useHook() { ... }        // Redundant - all hooks start with 'use'
function useThing() { ... }

// ❌ Wrong case
function UseFetchUser() { ... }   // PascalCase - should be camelCase
function use_fetch_user() { ... } // snake_case
```

## Hook Categories

### Data Fetching Hooks

Hooks that fetch or manage remote data:

```typescript
function useFetchUser(userId: string): {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} { ... }

function useFetchOrders(filters?: OrderFilters): {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
} { ... }

function useQueryUsers(searchTerm: string) { ... }
```

### State Management Hooks

Hooks that manage local state:

```typescript
function useFormState<T>(initialValues: T): {
  values: T;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  reset: () => void;
} { ... }

function useToggle(initialValue = false): [boolean, () => void] { ... }

function useCounter(initialValue = 0): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
} { ... }
```

### Side Effect Hooks

Hooks that handle side effects:

```typescript
function useDebounce<T>(value: T, delay: number): T { ... }

function useThrottle<T>(value: T, limit: number): T { ... }

function useInterval(callback: () => void, delay: number | null) { ... }

function useTimeout(callback: () => void, delay: number) { ... }
```

### Browser API Hooks

Hooks that interact with browser APIs:

```typescript
function useWindowSize(): { width: number; height: number } { ... }

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] { ... }

function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T) => void] { ... }

function useMediaQuery(query: string): boolean { ... }

function useGeolocation(): {
  latitude: number | null;
  longitude: number | null;
  error: GeolocationPositionError | null;
} { ... }
```

### Event Handler Hooks

Hooks that manage event handlers:

```typescript
function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void
) { ... }

function useKeyPress(targetKey: string): boolean { ... }

function useHover<T extends HTMLElement>(): [RefObject<T>, boolean] { ... }

function useOnScreen<T extends HTMLElement>(ref: RefObject<T>): boolean { ... }
```

### Form Handling Hooks

Hooks specifically for form management:

```typescript
function useFormValidation<T>(
  initialValues: T,
  validationRules: ValidationRules<T>
): {
  values: T;
  errors: Record<keyof T, string>;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleSubmit: (onSubmit: (values: T) => void) => (e: FormEvent) => void;
  isValid: boolean;
} { ... }

function useFormField<T>(
  name: string,
  initialValue: T
): {
  value: T;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error: string | null;
} { ... }
```

## Return Value Patterns

### Tuple Pattern

For hooks returning 2-3 related values:

```typescript
function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(prev => !prev);
  return [value, toggle];
}

// Usage
const [isOpen, toggleOpen] = useToggle(false);
```

### Object Pattern

For hooks returning multiple related values (preferred for 3+ values):

```typescript
function useFetchUser(userId: string): {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  // Implementation
  return { user, isLoading, error, refetch };
}

// Usage
const { user, isLoading, error, refetch } = useFetchUser('123');
```

### Single Value Pattern

For hooks returning a single value:

```typescript
function useWindowWidth(): number {
  const [width, setWidth] = useState(window.innerWidth);
  // Implementation
  return width;
}

// Usage
const width = useWindowWidth();
```

## Generic Hooks

Hooks with generic types should have descriptive type parameter names:

```typescript
// ✅ Good
function useFetchData<TData>(url: string): {
  data: TData | null;
  isLoading: boolean;
  error: Error | null;
} { ... }

function useAsyncOperation<TResult, TError = Error>(
  operation: () => Promise<TResult>
): {
  result: TResult | null;
  isLoading: boolean;
  error: TError | null;
} { ... }

// ❌ Bad (too generic)
function useFetch<T>(url: string) { ... }
function useAsync<T>(fn: () => Promise<T>) { ... }
```

## Hook Composition

Hooks can call other hooks:

```typescript
function useUserProfile(userId: string) {
  // Composing multiple hooks
  const { data: user, isLoading, error } = useFetchUser(userId);
  const { isOnline } = useUserPresence(userId);
  const { canEdit } = useUserPermissions(userId);

  return {
    user,
    isLoading,
    error,
    isOnline,
    canEdit,
  };
}
```

## Naming Patterns

### Pattern: use + Action + Target

```typescript
useFetchUser       // Action: Fetch, Target: User
useFetchOrders     // Action: Fetch, Target: Orders
useCreatePost      // Action: Create, Target: Post
useUpdateProfile   // Action: Update, Target: Profile
useDeleteComment   // Action: Delete, Target: Comment
```

### Pattern: use + State/Feature

```typescript
useAuthentication  // Feature: Authentication
useTheme          // Feature: Theme
usePermissions    // Feature: Permissions
useNotifications  // Feature: Notifications
```

### Pattern: use + BrowserAPI

```typescript
useLocalStorage   // Browser API: LocalStorage
useGeolocation    // Browser API: Geolocation
useMediaQuery     // Browser API: MediaQuery
useIntersectionObserver  // Browser API: IntersectionObserver
```

## Examples

### Good

```typescript
// File: use-fetch-user.ts (or use-fetch-user.tsx if JSX needed)
export function useFetchUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUserById(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { user, isLoading, error };
}
```

### Bad

```typescript
// ❌ Missing 'use' prefix
export function fetchUser(userId: string) { ... }

// ❌ Too generic
export function useData(id: string) { ... }

// ❌ PascalCase
export function UseFetchUser(userId: string) { ... }

// ❌ Redundant naming
export function useHook(id: string) { ... }
export function useUserHook(id: string) { ... }
```

## File Naming

Hook files should use kebab-case:

```
hooks/
  use-fetch-user.ts
  use-form-validation.ts
  use-window-size.ts
  use-local-storage.ts
```

## Testing

Hook test files follow the same pattern:

```
hooks/
  use-fetch-user.ts
  use-fetch-user.test.ts
```

## Summary

| Element | Convention | Example |
|---------|-----------|---------|
| Hook name | use + camelCase | `useFetchUser`, `useToggle` |
| Hook file | use-kebab-case.ts | `use-fetch-user.ts` |
| Return tuple | [value, setter/action] | `[isOpen, toggle]` |
| Return object | {value, isLoading, error} | `{ user, isLoading, error }` |
| Generic types | Descriptive type params | `<TData>`, `<TResult, TError>` |

## Common Mistakes

❌ **Forgetting `use` prefix**

```typescript
function fetchUser() { ... }  // Must be useFetchUser
```

❌ **Too generic names**

```typescript
function useData() { ... }    // What data? Be specific
function useStuff() { ... }   // What stuff? Be specific
```

❌ **Wrong case**

```typescript
function UseFetchUser() { ... }   // Should be camelCase
function use_fetch_user() { ... } // Should be camelCase
```

❌ **Redundant naming**

```typescript
function useUserHook() { ... }    // 'Hook' is redundant
function useHook() { ... }        // Too generic and redundant
```
