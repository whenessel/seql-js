# Code Style Guide

Coding conventions for seql-js.

## TypeScript

- Use TypeScript for all code
- Prefer interfaces over types
- Use strict mode
- Avoid `any` - use `unknown` if needed

## Naming

- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts`

## Formatting

- 2 spaces indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line

## Comments

- Use JSDoc for public APIs
- Explain "why", not "what"
- Keep comments up-to-date

## Examples

```typescript
/**
 * Generates EID for a DOM element
 *
 * @param target - Element to generate EID for
 * @param options - Generation options
 * @returns Element identity or null
 */
export function generateEID(
  target: Element,
  options?: GeneratorOptions
): ElementIdentity | null {
  // Implementation
}
```
