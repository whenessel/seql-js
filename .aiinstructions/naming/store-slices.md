# State Management Naming

Naming conventions for Redux, Zustand, and other state management solutions.

## Redux Toolkit Slices

### Slice File Naming

Use `name.slice.ts` pattern:

```
store/
  slices/
    user.slice.ts
    auth.slice.ts
    orders.slice.ts
    products.slice.ts
```

### Slice Name

Use singular, camelCase for the slice name property:

```typescript
// user.slice.ts
const userSlice = createSlice({
  name: 'user',  // ✅ Singular, camelCase
  initialState,
  reducers: { ... },
});

// auth.slice.ts
const authSlice = createSlice({
  name: 'auth',  // ✅ Singular, camelCase
  initialState,
  reducers: { ... },
});
```

### Initial State

Use camelCase with `initialState` or `initial` + domain name:

```typescript
// ✅ Good
const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

// Or with domain prefix
const initialUserState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};
```

## Actions

### Action Names

Use camelCase, verb-based names:

```typescript
// user.slice.ts
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // ✅ Good: camelCase, verb-based
    loginUser: (state, action) => { ... },
    logoutUser: (state) => { ... },
    updateUser: (state, action) => { ... },
    setUserProfile: (state, action) => { ... },
    clearUserData: (state) => { ... },

    // ❌ Bad: Wrong case or generic
    LoginUser: (state, action) => { ... },      // PascalCase
    login_user: (state, action) => { ... },     // snake_case
    user: (state, action) => { ... },           // Not a verb
    setUser: (state, action) => { ... },        // Too generic - what about user?
  },
});
```

### Async Thunks

Use camelCase with descriptive action:

```typescript
// ✅ Good
export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId: string) => {
    const response = await api.users.getById(userId);
    return response.data;
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData: CreateUserParams) => {
    const response = await api.users.create(userData);
    return response.data;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async ({ userId, data }: { userId: string; data: Partial<User> }) => {
    const response = await api.users.update(userId, data);
    return response.data;
  }
);
```

### Action Type Strings

In the thunk, use format: `sliceName/actionName`

```typescript
// ✅ Good: Consistent pattern
'user/fetchUserById'
'user/createUser'
'auth/loginUser'
'orders/fetchOrders'

// ❌ Bad: Inconsistent
'USER/FETCH'                    // UPPER_CASE
'user/fetch_user_by_id'         // snake_case in action
'fetchUserById'                 // Missing slice prefix
```

## Selectors

### Selector Naming

Use `select` + property name, camelCase:

```typescript
// user.selectors.ts
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectIsLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectIsAuthenticated = (state: RootState) => state.user.currentUser !== null;

// With createSelector
export const selectUserFullName = createSelector(
  [selectCurrentUser],
  (user) => (user ? `${user.firstName} ${user.lastName}` : null)
);

export const selectUserPermissions = createSelector(
  [selectCurrentUser],
  (user) => user?.permissions || []
);
```

### Selector File Naming

```
store/
  slices/
    user.slice.ts
    user.selectors.ts       // ✅ Separate selectors file
  auth/
    auth.slice.ts
    auth.selectors.ts
```

## Zustand Stores

### Store File Naming

```
stores/
  user-store.ts
  auth-store.ts
  cart-store.ts
```

### Store Creation

```typescript
// user-store.ts
interface UserStore {
  // State
  currentUser: User | null;
  isLoading: boolean;

  // Actions
  loginUser: (credentials: LoginCredentials) => Promise<void>;
  logoutUser: () => void;
  updateUser: (data: Partial<User>) => void;
  clearUserData: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  // Initial state
  currentUser: null,
  isLoading: false,

  // Actions
  loginUser: async (credentials) => {
    set({ isLoading: true });
    const user = await api.auth.login(credentials);
    set({ currentUser: user, isLoading: false });
  },

  logoutUser: () => {
    set({ currentUser: null });
  },

  updateUser: (data) => {
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...data } : null,
    }));
  },

  clearUserData: () => {
    set({ currentUser: null, isLoading: false });
  },
}));
```

### Store Hook Naming

Store hooks should be `use` + name + `Store`:

```typescript
// ✅ Good
export const useUserStore = create<UserStore>(...);
export const useAuthStore = create<AuthStore>(...);
export const useCartStore = create<CartStore>(...);

// ❌ Bad
export const userStore = create<UserStore>(...);     // Missing 'use'
export const UseUserStore = create<UserStore>(...);  // PascalCase
export const use_user_store = create<UserStore>(...); // snake_case
```

## Context API

### Context Naming

Use PascalCase with `Context` suffix:

```typescript
// ✅ Good
export const UserContext = createContext<UserContextValue | null>(null);
export const ThemeContext = createContext<ThemeContextValue | null>(null);
export const AuthContext = createContext<AuthContextValue | null>(null);

// ❌ Bad
export const userContext = createContext<UserContextValue | null>(null);  // camelCase
export const User = createContext<UserContextValue | null>(null);         // Missing Context
```

### Context Provider Component

```typescript
// user-context.tsx
export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const value = {
    currentUser,
    loginUser: (credentials: LoginCredentials) => { ... },
    logoutUser: () => { ... },
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
```

### Context Hook

Create a custom hook for the context:

```typescript
// user-context.tsx
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}

// Usage
function UserProfile() {
  const { currentUser, logoutUser } = useUser();
  // ...
}
```

## File Organization

### Redux Structure

```
store/
  index.ts                    // Store configuration
  slices/
    user.slice.ts
    user.selectors.ts
    auth.slice.ts
    auth.selectors.ts
    orders.slice.ts
    orders.selectors.ts
  types/
    user-state.ts
    auth-state.ts
```

### Zustand Structure

```
stores/
  user-store.ts
  auth-store.ts
  cart-store.ts
  theme-store.ts
```

### Context Structure

```
contexts/
  user-context.tsx
  theme-context.tsx
  auth-context.tsx
```

## State Type Definitions

### State Interface Naming

Use domain + `State` suffix:

```typescript
// ✅ Good
interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
}

interface OrdersState {
  orders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
}
```

## Action Payload Types

### Payload Interface Naming

Use action name + `Payload` suffix:

```typescript
// ✅ Good
interface LoginUserPayload {
  email: string;
  password: string;
}

interface UpdateUserPayload {
  userId: string;
  data: Partial<User>;
}

interface CreateOrderPayload {
  items: OrderItem[];
  shippingAddress: Address;
}
```

## Examples

### Good Redux Slice

```typescript
// user.slice.ts
interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId: string) => {
    const response = await api.users.getById(userId);
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    clearUserData: (state) => {
      state.currentUser = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch user';
        state.isLoading = false;
      });
  },
});

export const { updateUser, clearUserData } = userSlice.actions;
export default userSlice.reducer;
```

### Good Selectors

```typescript
// user.selectors.ts
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectIsLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;

export const selectIsAuthenticated = createSelector(
  [selectCurrentUser],
  (user) => user !== null
);

export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role || 'guest'
);
```

## Summary

| Element | Convention | Example |
|---------|-----------|---------|
| Slice files | name.slice.ts | `user.slice.ts` |
| Slice name | camelCase | `'user'`, `'auth'` |
| Actions | camelCase, verb-based | `loginUser`, `updateUser` |
| Async thunks | camelCase, verb-based | `fetchUserById` |
| Selectors | select + Property | `selectCurrentUser` |
| Selector files | name.selectors.ts | `user.selectors.ts` |
| Zustand stores | use + Name + Store | `useUserStore` |
| Store files | name-store.ts | `user-store.ts` |
| Context | PascalCase + Context | `UserContext` |
| Context hook | use + Name | `useUser` |
| State type | Name + State | `UserState` |
| Payload type | Action + Payload | `LoginUserPayload` |
