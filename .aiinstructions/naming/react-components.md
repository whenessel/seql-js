# React Component Naming

Naming conventions for React components and component-related code.

## Component Names

### Format

- **PascalCase**: Every word capitalized, including first
- **Noun-based**: Components represent UI elements, not actions
- **Descriptive**: Name should indicate what the component displays or represents

### Allowed

```typescript
function UserProfile() { ... }
function LoginForm() { ... }
function ButtonPrimary() { ... }
function NavigationBar() { ... }
function ProductCard() { ... }
```

### Forbidden

```typescript
function userProfile() { ... }        // camelCase
function User_Profile() { ... }       // snake_case
function user-profile() { ... }       // kebab-case
function UserProfileComponent() { ... } // Redundant suffix
function HandleLogin() { ... }        // Action verb (not a noun)
function DoSomething() { ... }        // Action verb (not a noun)
```

## File Naming

**Rule**: Component file name must be kebab-case version of component name.

```
// Component: UserProfile
// File: user-profile.tsx

// Component: LoginForm
// File: login-form.tsx

// Component: ButtonPrimary
// File: button-primary.tsx
```

### Exceptions

These files use PascalCase as-is:

```
App.tsx
Routes.tsx
```

## Component Organization

### Single Component per File

Each file should export one main component:

```typescript
// ✅ Good: user-profile.tsx
export function UserProfile() {
  return <div>Profile</div>;
}

// ❌ Bad: Multiple unrelated components
export function UserProfile() { ... }
export function OrderList() { ... }  // Should be in separate file
```

### Sub-Components

Small, tightly-coupled helper components can be in the same file:

```typescript
// user-card.tsx
function UserCardHeader({ title }: { title: string }) {
  return <header>{title}</header>;
}

function UserCardFooter({ actions }: { actions: ReactNode }) {
  return <footer>{actions}</footer>;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <div>
      <UserCardHeader title={user.name} />
      <div>{user.bio}</div>
      <UserCardFooter actions={<button>Edit</button>} />
    </div>
  );
}
```

For larger sub-components, use directory structure:

```
components/
  user-card/
    index.tsx                 // Main UserCard component
    user-card-header.tsx      // Sub-component
    user-card-footer.tsx      // Sub-component
```

## Component Types

### Page Components

Page-level components (route targets):

```typescript
// pages/user-profile-page.tsx
export function UserProfilePage() { ... }

// pages/login-page.tsx
export function LoginPage() { ... }
```

### Layout Components

Components that provide layout structure:

```typescript
// layouts/main-layout.tsx
export function MainLayout() { ... }

// layouts/sidebar-layout.tsx
export function SidebarLayout() { ... }
```

### UI Components

Reusable UI components:

```typescript
// components/button.tsx
export function Button() { ... }

// components/input.tsx
export function Input() { ... }

// components/modal.tsx
export function Modal() { ... }
```

### Feature Components

Feature-specific components:

```typescript
// features/auth/login-form.tsx
export function LoginForm() { ... }

// features/user/user-profile-card.tsx
export function UserProfileCard() { ... }
```

## Props Naming

### Props Interface

Props interface should be ComponentName + "Props":

```typescript
interface UserProfileProps {
  userId: string;
  onEdit?: () => void;
  isEditable?: boolean;
}

export function UserProfile({ userId, onEdit, isEditable }: UserProfileProps) {
  // ...
}
```

### Event Handler Props

Event handler props should start with `on`:

```typescript
interface ButtonProps {
  onClick: () => void;
  onHover?: () => void;
  onFocus?: () => void;
}
```

### Boolean Props

Boolean props should use `is`, `has`, `can`, `should` prefixes:

```typescript
interface UserCardProps {
  isActive: boolean;
  isEditable?: boolean;
  hasPermission?: boolean;
  canDelete?: boolean;
  shouldShowActions?: boolean;
}
```

## Forbidden Patterns

### Avoid Generic Suffixes

Don't use redundant suffixes like `Component`, `Container`, `Wrapper`:

```typescript
// ❌ Bad
function UserProfileComponent() { ... }
function UserProfileContainer() { ... }
function UserProfileWrapper() { ... }

// ✅ Good
function UserProfile() { ... }
```

### Avoid Action Verbs

Components are nouns (things), not verbs (actions):

```typescript
// ❌ Bad
function HandleLogin() { ... }
function ProcessUser() { ... }
function RenderProfile() { ... }

// ✅ Good
function LoginForm() { ... }
function UserProcessor() { ... }
function UserProfile() { ... }
```

### Avoid Abbreviations

```typescript
// ❌ Bad
function UsrProf() { ... }
function NavBar() { ... }  // Use NavigationBar
function Btn() { ... }     // Use Button

// ✅ Good
function UserProfile() { ... }
function NavigationBar() { ... }
function Button() { ... }
```

## Higher-Order Components (HOC)

HOCs should start with `with`:

```typescript
function withAuth<P>(Component: ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    // ...
  };
}

function withLoading<P>(Component: ComponentType<P>) {
  return function LoadingComponent(props: P) {
    // ...
  };
}

// Usage
const ProtectedUserProfile = withAuth(UserProfile);
```

## Render Props Pattern

Functions that return JSX should be named with `render` prefix:

```typescript
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T) => ReactNode;
  renderEmpty?: () => ReactNode;
}

function DataList<T>({ data, renderItem, renderEmpty }: DataListProps<T>) {
  if (data.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return <>{data.map(renderItem)}</>;
}
```

## Examples

### Good

```typescript
// File: user-profile.tsx
interface UserProfileProps {
  user: User;
  isEditable: boolean;
  onEdit: () => void;
}

export function UserProfile({ user, isEditable, onEdit }: UserProfileProps) {
  return (
    <div>
      <h1>{user.name}</h1>
      {isEditable && <button onClick={onEdit}>Edit</button>}
    </div>
  );
}
```

### Bad

```typescript
// File: UserProfile.tsx (wrong case)
interface IUserProfileProps {  // I prefix forbidden
  user: User;
  editable: boolean;          // Should be isEditable
  edit: () => void;           // Should be onEdit
}

export function UserProfileComponent({ user, editable, edit }: IUserProfileProps) {
  // Redundant "Component" suffix
  return (
    <div>
      <h1>{user.name}</h1>
      {editable && <button onClick={edit}>Edit</button>}
    </div>
  );
}
```

## Summary

| Element | Convention | Example |
|---------|-----------|---------|
| Component name | PascalCase | `UserProfile`, `LoginForm` |
| Component file | kebab-case.tsx | `user-profile.tsx`, `login-form.tsx` |
| Props interface | ComponentName + Props | `UserProfileProps` |
| Event handlers | on + Action | `onClick`, `onSubmit` |
| Boolean props | is/has/can/should | `isActive`, `hasPermission` |
| HOCs | with + Capability | `withAuth`, `withLoading` |
| Render props | render + Item | `renderItem`, `renderEmpty` |
