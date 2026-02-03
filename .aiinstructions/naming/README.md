# Naming Conventions

Universal naming conventions for TypeScript/JavaScript projects.

## Scope

These conventions apply to:

- TypeScript and JavaScript source files
- React components and hooks
- Public and internal APIs
- Test files
- Configuration files
- CSS/styling files

## Priority Order

When applying naming rules, follow this priority:

1. **public-api.md** - Exported symbols (highest priority)
2. **types.md**, **classes.md** - Type system definitions
3. **functions.md**, **variables.md** - Implementation details
4. **files.md**, **directories.md** - File system organization
5. **constants.md**, **enums.md** - Constants and enumerations
6. **internals.md** - Non-exported symbols (lowest priority)

## Global Constraints

- **English only**: All identifiers must use English words
- **ASCII only**: No Unicode characters in identifiers
- **No abbreviations**: Unless listed in project-specific exceptions
- **No synonyms**: Use consistent terminology throughout the project
- **Consistency**: Follow the same pattern across similar entities

## Document Index

### Core Naming Rules

- **[files.md](./files.md)** - File naming conventions
- **[directories.md](./directories.md)** - Directory naming conventions
- **[variables.md](./variables.md)** - Variable naming conventions
- **[functions.md](./functions.md)** - Function naming conventions
- **[classes.md](./classes.md)** - Class naming conventions
- **[types.md](./types.md)** - Type and interface naming conventions
- **[constants.md](./constants.md)** - Constant naming conventions
- **[enums.md](./enums.md)** - Enum naming conventions

### React-Specific Rules

- **[react-components.md](./react-components.md)** - React component naming
- **[react-hooks.md](./react-hooks.md)** - Custom hooks naming
- **[css-modules.md](./css-modules.md)** - CSS and styling naming

### Testing & State Management

- **[tests.md](./tests.md)** - Test file and test case naming
- **[store-slices.md](./store-slices.md)** - Redux/Zustand state management naming

### API & Visibility

- **[public-api.md](./public-api.md)** - Public API naming requirements
- **[internals.md](./internals.md)** - Internal naming rules

## Quick Reference

### General

| Entity           | Convention             | Example                              |
| ---------------- | ---------------------- | ------------------------------------ |
| Files            | kebab-case             | `user-service.ts`, `user-card.tsx`   |
| Directories      | kebab-case, plural     | `services/`, `components/`, `hooks/` |
| Variables        | camelCase              | `userName`, `isActive`               |
| Functions        | camelCase, verb-based  | `getUserById()`, `validateEmail()`   |
| Classes          | PascalCase, noun-based | `UserService`, `DataProcessor`       |
| Types/Interfaces | PascalCase, no I/T prefix | `UserProfile`, `ApiResponse`      |
| Constants        | UPPER_SNAKE_CASE       | `MAX_RETRY_COUNT`, `API_BASE_URL`    |
| Enum types       | PascalCase             | `UserRole`, `HttpStatus`             |
| Enum members     | UPPER_SNAKE_CASE       | `ADMIN`, `ACTIVE`                    |

### React-Specific

| Entity              | Convention                | Example                              |
| ------------------- | ------------------------- | ------------------------------------ |
| Components          | PascalCase                | `UserCard`, `LoginForm`              |
| Component files     | kebab-case.tsx            | `user-card.tsx`, `login-form.tsx`    |
| Hooks               | use + camelCase           | `useFetchUser`, `useFormHandler`     |
| Hook files          | use-kebab-case.ts         | `use-fetch-user.ts`                  |
| Props               | camelCase                 | `onClick`, `isDisabled`, `userName`  |
| Props interface     | ComponentName + Props     | `UserCardProps`, `ButtonProps`       |
| Event handlers      | on + Action               | `onClick`, `onSubmit`, `onChange`    |
| Boolean props       | is/has/can/should         | `isActive`, `hasError`, `canEdit`    |

### Styling

| Entity              | Convention                | Example                              |
| ------------------- | ------------------------- | ------------------------------------ |
| CSS Modules         | name.module.css           | `user-card.module.css`               |
| CSS classes         | kebab-case                | `.user-card`, `.is-active`           |
| Styled components   | PascalCase                | `StyledButton`, `HeaderWrapper`      |
| Style objects       | camelCase                 | `cardStyles`, `buttonStyles`         |

### Testing & State

| Entity              | Convention                | Example                              |
| ------------------- | ------------------------- | ------------------------------------ |
| Test files          | name.test.tsx             | `user-card.test.tsx`                 |
| Mock data           | mock + Name               | `mockUser`, `mockOnEdit`             |
| Redux slices        | name.slice.ts             | `user.slice.ts`, `auth.slice.ts`     |
| Actions             | camelCase, verb           | `loginUser`, `updateProfile`         |
| Selectors           | select + Property         | `selectCurrentUser`, `selectIsLoading` |
| Zustand stores      | use + Name + Store        | `useUserStore`, `useAuthStore`       |

## Principles

1. **Clarity over brevity**: Prefer clear names over short abbreviations
2. **Semantic naming**: Names should describe what something is, not how it's implemented
3. **Consistency**: Similar entities should follow similar naming patterns
4. **TypeScript best practices**: Follow community standards (no I/T prefixes, proper suffixes)
5. **React conventions**: Follow React community standards (hooks start with `use`, components are PascalCase)
6. **No redundancy**: Avoid suffixes like `Component`, `Wrapper` unless they add semantic value

## Common Mistakes to Avoid

❌ **I/T Prefixes on types**: `IUser`, `TApiResponse` → Use `User`, `ApiResponse`

❌ **Wrong component file case**: `UserCard.tsx` → Use `user-card.tsx`

❌ **Missing 'use' in hooks**: `fetchUser()` → Use `useFetchUser()`

❌ **Generic names**: `useData()`, `Container`, `Wrapper` → Be specific

❌ **Redundant suffixes**: `UserCardComponent` → Use `UserCard`

❌ **Wrong test naming**: `test-user-card.tsx` → Use `user-card.test.tsx`

❌ **camelCase for styled components**: `styledButton` → Use `StyledButton`
