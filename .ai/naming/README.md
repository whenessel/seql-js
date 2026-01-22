# Naming Conventions

Universal naming conventions for TypeScript/JavaScript projects.

## Scope

These conventions apply to:

- TypeScript and JavaScript source files
- Public and internal APIs
- Test files
- Configuration files

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

- **[files.md](./files.md)** - File naming conventions
- **[directories.md](./directories.md)** - Directory naming conventions
- **[variables.md](./variables.md)** - Variable naming conventions
- **[functions.md](./functions.md)** - Function naming conventions
- **[classes.md](./classes.md)** - Class naming conventions
- **[types.md](./types.md)** - Type and interface naming conventions
- **[constants.md](./constants.md)** - Constant naming conventions
- **[enums.md](./enums.md)** - Enum naming conventions
- **[public-api.md](./public-api.md)** - Public API naming requirements
- **[internals.md](./internals.md)** - Internal naming rules

## Quick Reference

| Entity           | Convention             | Example                              |
| ---------------- | ---------------------- | ------------------------------------ |
| Files            | kebab-case             | `user-service.ts`                    |
| Directories      | kebab-case, plural     | `services/`, `utils/`                |
| Variables        | camelCase              | `userName`, `data`                   |
| Functions        | camelCase, verb-based  | `getUserById()`, `processData()`     |
| Classes          | PascalCase, noun-based | `UserService`, `DataProcessor`       |
| Types/Interfaces | PascalCase             | `UserProfile`, `ApiResponse`         |
| Constants        | UPPER_SNAKE_CASE       | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| Enum types       | PascalCase             | `UserRole`, `HttpStatus`             |
| Enum members     | UPPER_SNAKE_CASE       | `ADMIN`, `ACTIVE`                    |

## Principles

1. **Clarity over brevity**: Prefer clear names over short abbreviations
2. **Semantic naming**: Names should describe what something is, not how it's implemented
3. **Consistency**: Similar entities should follow similar naming patterns
4. **TypeScript best practices**: Follow community standards (no I/T prefixes, proper suffixes)
5. **Domain-agnostic**: Use generic examples applicable to any project
