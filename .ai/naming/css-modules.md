# CSS and Styling Naming

Naming conventions for CSS Modules, styled-components, and other styling approaches in React.

## CSS Modules

### File Naming

CSS Module files should match the component name with `.module.css` or `.module.scss` suffix:

```
components/
  user-card/
    index.tsx
    user-card.module.css      // For UserCard component
    user-card.module.scss     // Or SCSS variant
```

**Pattern**: `component-name.module.{css,scss}`

### Class Names in CSS Modules

Use kebab-case for CSS class names:

```css
/* user-card.module.css */
.user-card {
  display: flex;
  padding: 1rem;
}

.user-card-header {
  font-weight: bold;
}

.user-card-footer {
  margin-top: 1rem;
}

.is-active {
  border-color: green;
}

.is-disabled {
  opacity: 0.5;
}
```

### Usage in Components

Import and use with camelCase in JavaScript:

```typescript
// user-card.tsx
import styles from './user-card.module.css';

export function UserCard({ isActive }: UserCardProps) {
  return (
    <div className={styles.userCard}>
      <header className={styles.userCardHeader}>Header</header>
      <footer className={styles.userCardFooter}>Footer</footer>
    </div>
  );
}
```

**Note**: CSS Modules automatically converts kebab-case to camelCase in imports.

## Styled Components / CSS-in-JS

### Variable Naming

Styled component variables use PascalCase (they are components):

```typescript
import styled from 'styled-components';

// ✅ Good: PascalCase for styled components
const HeaderWrapper = styled.header`
  display: flex;
  padding: 1rem;
`;

const StyledButton = styled.button`
  background: blue;
  color: white;
`;

const UserCardContainer = styled.div`
  border: 1px solid #ccc;
`;

// Usage
export function UserCard() {
  return (
    <UserCardContainer>
      <HeaderWrapper>
        <StyledButton>Click me</StyledButton>
      </HeaderWrapper>
    </UserCardContainer>
  );
}
```

### Naming Patterns

#### Pattern 1: Styled + ComponentType

```typescript
const StyledButton = styled.button`...`;
const StyledInput = styled.input`...`;
const StyledDiv = styled.div`...`;
```

#### Pattern 2: Descriptive + Wrapper/Container

```typescript
const HeaderWrapper = styled.header`...`;
const ContentContainer = styled.div`...`;
const SidebarWrapper = styled.aside`...`;
```

#### Pattern 3: Component-Specific Names

```typescript
const UserCardHeader = styled.header`...`;
const ProductListItem = styled.li`...`;
const NavigationMenu = styled.nav`...`;
```

### Forbidden Patterns

```typescript
// ❌ camelCase
const styledButton = styled.button`...`;

// ❌ kebab-case (invalid JavaScript)
const styled-button = styled.button`...`;

// ❌ Generic names
const Wrapper = styled.div`...`;      // Too generic - what wrapper?
const Container = styled.div`...`;    // Too generic - what container?
const Box = styled.div`...`;          // Too generic
```

## Chakra UI / Emotion

For Chakra UI v3 and Emotion-based styling:

### Style Objects

```typescript
// Inline styles with Chakra
export function UserCard() {
  return (
    <Box
      padding="1rem"
      borderWidth="1px"
      borderRadius="md"
    >
      <Heading size="lg">User Name</Heading>
    </Box>
  );
}
```

### Reusable Style Objects

```typescript
// ✅ camelCase for style objects
const cardStyles = {
  padding: '1rem',
  borderWidth: '1px',
  borderRadius: 'md',
};

const headerStyles = {
  fontSize: '2xl',
  fontWeight: 'bold',
};

export function UserCard() {
  return (
    <Box {...cardStyles}>
      <Heading {...headerStyles}>User Name</Heading>
    </Box>
  );
}
```

### Style Constants

For reusable style constants, use camelCase:

```typescript
// styles/theme.ts
export const buttonStyles = {
  primary: {
    bg: 'blue.500',
    color: 'white',
    _hover: { bg: 'blue.600' },
  },
  secondary: {
    bg: 'gray.200',
    color: 'gray.800',
    _hover: { bg: 'gray.300' },
  },
};

export const cardStyles = {
  base: {
    p: 4,
    borderWidth: 1,
    borderRadius: 'md',
  },
  elevated: {
    p: 4,
    shadow: 'md',
    borderRadius: 'lg',
  },
};
```

## Tailwind CSS

### Class Names

Tailwind uses utility classes directly in JSX:

```typescript
export function UserCard({ isActive }: UserCardProps) {
  return (
    <div className="flex flex-col p-4 border rounded-lg">
      <header className="font-bold text-xl mb-2">Header</header>
      <footer className="mt-auto text-sm text-gray-600">Footer</footer>
    </div>
  );
}
```

### Custom Classes with @apply

In CSS files using `@apply`, use kebab-case:

```css
/* components.css */
.user-card {
  @apply flex flex-col p-4 border rounded-lg;
}

.user-card-header {
  @apply font-bold text-xl mb-2;
}
```

## Theme/Design System

### Theme File Naming

```
styles/
  theme.ts              // Main theme configuration
  colors.ts             // Color palette
  typography.ts         // Typography settings
  spacing.ts            // Spacing scale
```

### Theme Object Structure

```typescript
// styles/theme.ts
export const theme = {
  colors: {
    primary: '#0070f3',
    secondary: '#7928ca',
    success: '#00c853',
    danger: '#ff5252',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  typography: {
    fontFamily: {
      body: 'Inter, sans-serif',
      heading: 'Poppins, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
    },
  },
};
```

## Animation/Keyframe Naming

### CSS Animations

Use kebab-case for keyframe names:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animated-element {
  animation: fade-in 0.3s ease-in-out;
}
```

### JS Animation Objects

Use camelCase for animation objects:

```typescript
const fadeInAnimation = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

const slideUpAnimation = {
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' },
};
```

## Examples

### Good

```typescript
// CSS Modules
import styles from './user-card.module.css';

export function UserCard() {
  return <div className={styles.userCard}>...</div>;
}

// Styled Components
const StyledButton = styled.button`
  background: blue;
`;

const HeaderWrapper = styled.header`
  display: flex;
`;

// Style Objects
const cardStyles = {
  padding: '1rem',
  border: '1px solid #ccc',
};
```

### Bad

```typescript
// ❌ Wrong case for styled components
const styledButton = styled.button`...`;
const styled_button = styled.button`...`;

// ❌ Too generic
const Wrapper = styled.div`...`;
const Container = styled.div`...`;

// ❌ Wrong naming for style objects
const CardStyles = { ... };        // Should be camelCase
const CARD_STYLES = { ... };       // Not a constant
```

## Summary

| Element | Convention | Example |
|---------|-----------|---------|
| CSS Module files | kebab-case.module.{css,scss} | `user-card.module.css` |
| CSS class names | kebab-case | `.user-card`, `.is-active` |
| Styled components | PascalCase | `StyledButton`, `HeaderWrapper` |
| Style objects | camelCase | `cardStyles`, `buttonStyles` |
| Animation names (CSS) | kebab-case | `@keyframes fade-in` |
| Animation objects (JS) | camelCase | `fadeInAnimation` |
| Theme files | kebab-case.ts | `theme.ts`, `colors.ts` |
