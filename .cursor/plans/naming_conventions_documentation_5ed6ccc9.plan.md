---
name: Naming conventions documentation
overview: Create universal naming convention documentation in `.ai/naming/` directory, applicable to any TypeScript/JavaScript project, following TypeScript best practices and organized similar to docstrings.md format.
todos:
  - id: create-directory
    content: Create .ai/naming/ directory structure
    status: pending
  - id: create-readme
    content: Create README.md with index, priority order, and global constraints
    status: pending
  - id: create-files-dirs
    content: Create files.md and directories.md with universal naming rules
    status: pending
  - id: create-variables-functions
    content: Create variables.md and functions.md with camelCase rules and generic examples
    status: pending
  - id: create-classes-types
    content: Create classes.md, types.md, constants.md, and enums.md with PascalCase/UPPER_SNAKE_CASE rules
    status: pending
  - id: create-api-internals
    content: Create public-api.md and internals.md for API stability and internal naming with universal patterns
    status: pending
---

# Naming Conventions Documentation Plan

## Analysis Summary

**Universal TypeScript/JavaScript Naming Patterns:**

- File naming: kebab-case (e.g., `user-service.ts`, `data-processor.ts`)
- Classes: PascalCase (e.g., `UserService`, `DataProcessor`)
- Functions: camelCase (e.g., `getUserById`, `processData`)
- Types/Interfaces: PascalCase (e.g., `UserProfile`, `ApiResponse`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT`)
- Directories: kebab-case, plural nouns (e.g., `services/`, `utils/`, `types/`)

**Key Principles:**

1. Use general patterns, not project-specific terminology
2. Provide universal examples applicable to any domain
3. Follow TypeScript/JavaScript community best practices
4. Avoid abbreviations unless widely accepted
5. Maintain consistency across all naming conventions

## Document Structure

Create `.ai/naming/` directory with:

1. **README.md** (~100 lines)

- Index and priority order
- Global constraints (English, ASCII, no abbreviations)
- Cross-references to other documents

2. **files.md** (~80 lines)

- File naming rules (kebab-case)
- Test file conventions (*.test.ts, *.spec.ts)
- Generic examples (user-service.ts, data-processor.ts)

3. **directories.md** (~80 lines)

- Directory naming (kebab-case, plural nouns)
- Common directory patterns (services/, utils/, types/, components/)
- When to use singular vs plural

4. **variables.md** (~120 lines)

- camelCase rules
- Semantic naming (value, not role)
- Generic examples (user, data, result, config)
- Loop indices and temporary variables

5. **functions.md** (~150 lines)

- camelCase, verb-based
- Common verb patterns (get, set, create, update, delete, parse, serialize)
- Function naming by purpose (predicates, transformers, validators)
- Generic examples applicable to any domain

6. **classes.md** (~120 lines)

- PascalCase, noun-based
- No Manager/Helper/Util suffixes
- Generic examples (UserService, DataProcessor, ApiClient)
- Abstract classes and base classes

7. **types.md** (~150 lines)

- PascalCase
- Suffixes: Type, Options, Result, Config, Params
- No I/T prefixes (avoid IUser, TData)
- Generic examples (UserProfile, ApiOptions, ParseResult)
- Union types and discriminated unions

8. **constants.md** (~120 lines)

- UPPER_SNAKE_CASE
- Naming patterns for different constant types (config, limits, enums)
- Generic examples (MAX_RETRY_COUNT, DEFAULT_TIMEOUT, API_BASE_URL)

9. **enums.md** (~100 lines)

- Enum naming (PascalCase)
- Enum member naming (UPPER_SNAKE_CASE)
- Generic examples (UserRole, HttpStatus, ErrorCode)

10. **public-api.md** (~150 lines)

- Stability requirements for exported symbols
- No abbreviations in public API
- Alignment with project documentation/specs
- Versioning considerations
- Generic examples of good vs bad public API names

11. **internals.md** (~100 lines)

- Internal naming rules (non-exported symbols)
- Short names in small scopes
- Loop indices (i, j, k)
- Temporary variables
- Still maintain clarity

## Key Principles

1. **Universal applicability**: Rules work for any TypeScript/JavaScript project
2. **General examples**: Use domain-agnostic examples (user, data, api, config)
3. **TypeScript best practices**: Follow community standards (no I/T prefixes, proper suffixes)
4. **Consistency**: All naming follows the same principles
5. **Clarity over brevity**: Prefer clear names over short abbreviations

## Format Style

- Follow docstrings.md format (clear sections, examples, forbidden patterns)
- English only
- Concise, declarative (no narrative)
- Each file <400 lines
- Include "Allowed" and "Forbidden" sections with generic examples
- Use domain-agnostic examples (user, data, api, config, service, etc.)

## Implementation Order

1. Create `.ai/naming/` directory
2. Create README.md (index and overview)
3. Create files.md, directories.md (foundational structure)
4. Create variables.md, functions.md, classes.md (core naming patterns)
5. Create types.md, constants.md, enums.md (type system naming)
6. Create public-api.md, internals.md (scope-specific rules)

Each document will be self-contained but cross-reference where appropriate. All examples will be generic and domain-agnostic, applicable to any TypeScript/JavaScript project.