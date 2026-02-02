# Test File Naming

Naming conventions for test files and test-related code.

## Test File Naming

### Format

Test files mirror source file names with `.test.{ts,tsx}` or `.spec.{ts,tsx}` suffix.

**Choose one convention and use it consistently throughout the project.**

### Preferred: `.test.{ts,tsx}`

```
src/
  services/
    user-service.ts
    user-service.test.ts

  components/
    user-card/
      index.tsx
      user-card.test.tsx

  hooks/
    use-fetch-user.ts
    use-fetch-user.test.ts
```

### Alternative: `.spec.{ts,tsx}`

```
src/
  services/
    user-service.ts
    user-service.spec.ts

  components/
    user-card/
      index.tsx
      user-card.spec.tsx
```

### Forbidden

```
// ❌ Wrong suffix position
user-service-test.ts          // Should be user-service.test.ts
test-user-service.ts          // Should be user-service.test.ts

// ❌ Wrong case
UserService.test.ts           // Should be user-service.test.ts
user_service.test.ts          // Should be user-service.test.ts

// ❌ Wrong suffix format
user-service.tests.ts         // Should be .test.ts (singular)
user-service-spec.ts          // Should be .spec.ts (with dot)
```

## Test Location

### Co-located Tests (Recommended)

Place test files next to the source files they test:

```
src/
  components/
    user-card/
      index.tsx
      user-card.test.tsx        // ✅ Next to component

  services/
    user-service.ts
    user-service.test.ts        // ✅ Next to service

  hooks/
    use-fetch-user.ts
    use-fetch-user.test.ts      // ✅ Next to hook
```

### Separate Test Directory

Alternative: Mirror structure in `tests/` directory:

```
src/
  services/
    user-service.ts

tests/
  services/
    user-service.test.ts        // ✅ Mirrors src structure
```

## Test Suite Naming

### describe() Blocks

Use the component/function/class name being tested:

```typescript
// ✅ Good
describe('UserCard', () => {
  it('should render user name', () => { ... });
  it('should call onEdit when edit button is clicked', () => { ... });
});

describe('getUserById', () => {
  it('should return user when found', () => { ... });
  it('should throw error when user not found', () => { ... });
});

describe('useFetchUser', () => {
  it('should fetch user data on mount', () => { ... });
  it('should handle errors gracefully', () => { ... });
});
```

### Nested describe() Blocks

Use descriptive context for nested describes:

```typescript
describe('UserCard', () => {
  describe('when user is active', () => {
    it('should display active badge', () => { ... });
  });

  describe('when user is inactive', () => {
    it('should display inactive badge', () => { ... });
  });

  describe('edit functionality', () => {
    it('should show edit button when editable is true', () => { ... });
    it('should call onEdit when button is clicked', () => { ... });
  });
});
```

## Test Case Naming

### it() / test() Descriptions

Use clear, behavior-focused descriptions starting with "should":

```typescript
// ✅ Good: Clear, behavior-focused
it('should render user name', () => { ... });
it('should call onEdit when button is clicked', () => { ... });
it('should display error message when validation fails', () => { ... });
it('should disable submit button when form is invalid', () => { ... });

// ❌ Bad: Unclear, implementation-focused
it('renders', () => { ... });
it('works', () => { ... });
it('test button', () => { ... });
it('onEdit', () => { ... });
```

### Alternative: Natural Language

Without "should" (also acceptable):

```typescript
it('renders user name', () => { ... });
it('calls onEdit when button is clicked', () => { ... });
it('displays error message when validation fails', () => { ... });
```

## Test Data and Fixtures

### Mock Data Variables

Use descriptive camelCase names:

```typescript
// ✅ Good
const mockUser = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
};

const mockOrders = [
  { id: '1', total: 100 },
  { id: '2', total: 200 },
];

const mockApiResponse = {
  data: mockUser,
  status: 200,
};
```

### Mock Functions

Use descriptive names with `mock` prefix:

```typescript
// ✅ Good
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockFetchUser = vi.fn();
const mockNavigate = vi.fn();

// Usage
<UserCard user={mockUser} onEdit={mockOnEdit} />
```

### Test Fixture Files

Fixture files use kebab-case:

```
fixtures/
  user-fixtures.ts
  order-fixtures.ts
  api-response-fixtures.ts
```

## Test Utility Functions

### Helper Functions

Use camelCase, descriptive names:

```typescript
// test-utils.ts
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  // Implementation
}

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  };
}

export function waitForLoadingToFinish() {
  return waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
}
```

### Custom Matchers

Use descriptive names:

```typescript
expect.extend({
  toBeValidEmail(received: string) {
    // Implementation
  },
  toHaveBeenCalledWithUser(received: Mock, user: User) {
    // Implementation
  },
});
```

## Integration Test Naming

### Directory Structure

```
tests/
  integration/
    user-authentication.test.ts
    order-checkout-flow.test.ts
    product-search.test.ts
```

### Test Suite Naming

Use feature/flow names:

```typescript
describe('User Authentication Flow', () => {
  it('should allow user to sign up', () => { ... });
  it('should allow user to log in', () => { ... });
  it('should allow user to log out', () => { ... });
});

describe('Order Checkout Flow', () => {
  it('should add items to cart', () => { ... });
  it('should proceed to checkout', () => { ... });
  it('should complete payment', () => { ... });
});
```

## E2E Test Naming

### File Naming

```
e2e/
  user-login.e2e.ts
  product-purchase.e2e.ts
  admin-dashboard.e2e.ts
```

### Test Names

Use natural language for user flows:

```typescript
describe('User Login E2E', () => {
  it('completes login flow successfully', () => { ... });
  it('shows error for invalid credentials', () => { ... });
});
```

## MSW (Mock Service Worker) Handlers

### Handler File Naming

```
mocks/
  handlers/
    user-handlers.ts
    order-handlers.ts
    auth-handlers.ts
```

### Handler Variable Naming

```typescript
// user-handlers.ts
export const userHandlers = [
  http.get('/api/users/:id', () => { ... }),
  http.post('/api/users', () => { ... }),
];

export const getUserSuccessHandler = http.get('/api/users/:id', () => {
  return HttpResponse.json(mockUser);
});

export const getUserErrorHandler = http.get('/api/users/:id', () => {
  return HttpResponse.json({ error: 'Not found' }, { status: 404 });
});
```

## Test Constants

```typescript
// Use UPPER_SNAKE_CASE for test constants
const TEST_USER_ID = '123';
const TEST_TIMEOUT = 5000;
const TEST_API_URL = 'http://localhost:3000';

// Use camelCase for test configuration objects
const testConfig = {
  timeout: 5000,
  retries: 3,
};
```

## Examples

### Good Component Test

```typescript
// user-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './user-card';

const mockUser = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
};

const mockOnEdit = vi.fn();

describe('UserCard', () => {
  it('should render user name', () => {
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser.id);
  });
});
```

### Good Hook Test

```typescript
// use-fetch-user.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useFetchUser } from './use-fetch-user';

const mockUser = { id: '123', name: 'John' };

describe('useFetchUser', () => {
  it('should fetch user data on mount', async () => {
    const { result } = renderHook(() => useFetchUser('123'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => useFetchUser('invalid'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.user).toBeNull();
    });
  });
});
```

## Summary

| Element | Convention | Example |
|---------|-----------|---------|
| Test files | name.test.{ts,tsx} | `user-card.test.tsx` |
| Test suites | Component/function name | `describe('UserCard', ...)` |
| Test cases | should + behavior | `it('should render user name', ...)` |
| Mock data | mock + name | `mockUser`, `mockOnEdit` |
| Test utils | camelCase | `renderWithProviders` |
| Fixtures | kebab-case.ts | `user-fixtures.ts` |
| E2E tests | name.e2e.ts | `user-login.e2e.ts` |
| MSW handlers | name-handlers.ts | `user-handlers.ts` |
