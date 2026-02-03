# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**seql-js** is a TypeScript library implementing a Element Identity Descriptor (EID) system for stable DOM element identification. The EID describes "what" an element is semantically, rather than "how" to reach it, making it resilient to DOM structure changes. This is designed for use in session replay (rrweb), analytics, and web automation contexts.

### Key Concepts

The EID is built around a semantic identity model consisting of:

- **Anchor**: A semantic root element (e.g., `<form>`, `<main>`, elements with ARIA roles)
- **Path**: Semantic traversal from anchor to target's parent
- **Target**: The element being identified
- **Constraints**: Disambiguation rules applied during resolution
- **Semantics**: Text content, ARIA labels, roles, stable IDs, and SVG fingerprints

The system has two main operations:

1. **Generation** (`generateEID`): DOM Element → EID Identity (JSON)
2. **Resolution** (`resolve`): EID Identity (JSON) → DOM Element(s)

## AI Instructions & Coding Standards

This project follows strict conventions for code style, naming, documentation, and task management. All rules are centralized in `.aiinstructions/` directory.

### Quick Reference

**IMPORTANT**: Before making any changes, consult the checklist in `.aiinstructions/README.md` (line 53-61). The checklist covers:

- API restrictions (SDK is read-only)
- Naming conventions
- Feature and issue documentation requirements
- Documentation-only updates
- Language requirements

### Core Rules

#### 1. **Naming Conventions** (`.aiinstructions/naming/`)

All identifiers must follow strict naming rules:

- **Files**: kebab-case (`user-service.ts`, `url-normalizer.ts`)
- **Directories**: kebab-case, plural (`utils/`, `types/`, `generator/`)
- **Variables/Functions**: camelCase (`generateEID`, `isStableAttribute`)
- **Classes/Types**: PascalCase, no I/T prefixes (`ElementIdentity`, `AnchorNode`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_CACHE_SIZE`, `SEMANTIC_TAGS`)
- **Language**: English only, ASCII only, no abbreviations

Priority order: `public-api.md` → `types.md`/`classes.md` → `functions.md`/`variables.md` → `files.md`/`directories.md` → `constants.md`/`enums.md` → `internals.md`

#### 2. **Feature Work** (`.aiinstructions/rules/feature-docs.md`)

When implementing a new feature or significant change:

1. **Create directory**: `docs/dev/features/<feature-slug>/` (slug in kebab-case)
2. **Create plan** (MANDATORY before or at start): `<slug>.plan.md`
   - Use format from `feature-docs.md` (sections: Task Overview, Objectives, Context, Approach, Implementation Steps, Success Criteria, Risks, Output, Notes)
   - Keep concise for token economy
3. **Create implementation summary**: `<slug>.implementation.md`
   - What was implemented (brief)
   - Main files created/modified
   - Integration points with existing code

**Example**: For feature "url-normalization", create:

- `docs/dev/features/url-normalization/url-normalization.plan.md`
- `docs/dev/features/url-normalization/url-normalization.implementation.md`

#### 3. **Issue Work** (`.aiinstructions/rules/issue-docs.md`)

When fixing bugs or resolving issues:

1. **Create directory**: `docs/dev/issues/<issue-slug>/` (slug in kebab-case)
2. **Create issue description** (MANDATORY when issue identified): `<slug>.issue.md`
   - Use format from `issue-docs.md` (sections: Summary, Reproduction, Context, Impact, Analysis, Notes)
   - Keep concise for token economy
3. **Create resolution summary**: `<slug>.resolution.md`
   - What was fixed (brief)
   - Files created/modified/removed
   - Verification criteria

**Example**: For issue "fix-cache-invalidation", create:

- `docs/dev/issues/fix-cache-invalidation/fix-cache-invalidation.issue.md`
- `docs/dev/issues/fix-cache-invalidation/fix-cache-invalidation.resolution.md`

#### 4. **Code Documentation** (`.aiinstructions/docs/docstrings.md`)

When updating only comments/docstrings (without changing code):

- Use TSDoc/JSDoc format
- First sentence: brief purpose (don't repeat the name)
- Required tags: `@param`, `@returns` (skip for void), `@throws` (only explicit), `@remarks` (side effects, timings), `@example`, `@see`
- Add "Usage (local references)" with up to 5 actual usage sites (`path:line-range`)
- **CRITICAL**: Edit only comments, never change code/signatures/types/logic
- Follow project formatting (2 spaces, LF, 100-120 cols)

#### 5. **Application Language** (`.aiinstructions/rules/app-content-language.md`)

- All user-facing content MUST be in English (error messages, labels, logs)
- Code identifiers MUST be in English (enforced by naming rules)
- Planning docs and commit messages may use any language

### Priority When Rules Conflict

1. Agent profile (`.aiinstructions/agents/default.md`)
2. Rules (feature-docs, issue-docs, app-content-language)
3. Global style (naming, docstrings)

## Development Commands

### Building

```bash
# Build the library (outputs to dist/)
yarn build

# Watch mode for development
yarn build:watch
```

### Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Type Checking

```bash
# Type check without emitting
yarn types:check
```

### Running a Single Test File

```bash
# Using vitest directly
yarn vitest run tests/resolver.test.ts

# Watch a specific test file
yarn vitest watch tests/resolver.test.ts
```

## Code Architecture

### Module Structure

The codebase is organized into four main directories under `src/`:

#### 1. `generator/` - EID Generation Pipeline

Converts DOM elements into EID identities. The generation follows a bottom-up approach:

- **`anchor-finder.ts`**: Searches up the DOM tree (max 10 levels) to find a semantic anchor. Prioritizes semantic HTML tags (`<form>`, `<main>`, `<nav>`), ARIA roles, and stable attributes (data-testid, aria-label).
- **`path-builder.ts`**: Constructs the semantic path from anchor to target, extracting semantics for each intermediate node.
- **`semantic-extractor.ts`**: Extracts semantic features (text content, ARIA labels, roles, IDs, classes) from individual elements.
- **`svg-fingerprinter.ts`**: Creates stable fingerprints for SVG elements based on viewBox, paths, and structural characteristics.
- **`generator.ts`**: Main orchestrator that combines all components and adds constraints.

#### 2. `resolver/` - EID Resolution Pipeline

Converts EID identities back to DOM elements using a 5-phase algorithm:

- **`css-generator.ts`**: Builds CSS selectors from EID semantics (Phase 1: CSS Narrowing).
- **`semantics-matcher.ts`**: Scores candidates based on semantic similarity (Phase 2: Semantic Filtering).
- **`constraints-evaluator.ts`**: Evaluates constraints like uniqueness, visibility, text proximity (Phase 3: Constraints).
- **`fallback-handler.ts`**: Handles resolution failures and degraded matches (Phase 4 & 5).
- **`resolver.ts`**: Main orchestrator implementing the 5-phase resolution algorithm.

#### 3. `types/` - TypeScript Type Definitions

Core data structures and interfaces:

- **`eid.ts`**: Main EID identity structure (`ElementIdentity`, `AnchorNode`, `PathNode`, `TargetNode`)
- **`semantics.ts`**: Semantic features (`ElementSemantics`, `TextContent`, `SvgFingerprint`)
- **`constraints.ts`**: Constraint types (uniqueness, visibility, text proximity, position)
- **`options.ts`**: Configuration for generator and resolver
- **`results.ts`**: Result types for resolution and validation

#### 4. `utils/` - Shared Utilities

Helper functions and shared logic:

- **`constants.ts`**: Semantic tag lists, scoring weights, default options
- **`eid-cache.ts`**: LRU caching layer for generated DSLs and intermediate results
- **`batch-generator.ts`**: Batch processing for generating DSLs for multiple elements
- **`scorer.ts`**: Confidence and element scoring algorithms
- **`text-normalizer.ts`**: Text normalization (whitespace, Unicode, case)
- **`attribute-filters.ts`** (v1.0.3): Filters attributes by stability - separates identity-defining attributes from state-based attributes
- **`class-filter.ts`**: Filters utility/framework classes (Tailwind, Bootstrap, etc.)
- **`class-classifier.ts`** (v1.6.1): Classifies CSS classes as semantic vs. utility - includes catch-all pattern for arbitrary pseudo-class variants (`file:`, `placeholder:`, `invalid:`, etc.)
- **`attribute-cleaner.ts`**: Cleans and normalizes HTML attributes
- **`url-normalizer.ts`** (v1.5.1): Normalizes URLs for consistent comparison - converts same-origin absolute URLs to relative for rrweb iframe compatibility
- **`id-validator.ts`** (v1.6.1): Validates ID stability - refined hash detection to correctly identify semantic camelCase IDs (firstName, lastName) while detecting true dynamic IDs
- **`validator.ts`**: EID identity validation

### Critical Design Principles

1. **Determinism**: Generation must be completely deterministic for the same DOM state. No randomness, no timestamps in identity calculation.

2. **Semantic-First**: The system prioritizes semantic HTML and ARIA attributes over structural selectors (nth-child, positional selectors are avoided).

3. **State Independence** (v1.0.3): EID identifies elements by their semantic identity, not their current state. Filters out state attributes (`aria-selected`, `data-state`, `disabled`) and library-generated attributes (`data-radix-*`) to ensure stability across state changes.

4. **Stability Over Precision**: The EID trades some precision for stability across DOM changes. A slightly less specific selector that survives refactoring is better than a brittle precise one.

5. **No Framework Dependencies**: The library is framework-agnostic and works with vanilla DOM APIs.

6. **Caching Strategy**: Uses an LRU cache (`EIDCache`) to avoid redundant computation. Cache keys are based on element identity and options.

## Project Documentation

Comprehensive specifications are in `docs/specs/`:

- **`SPECIFICATION.md`**: Complete EID v1.0 specification (Russian) - the authoritative reference
- **`ARCHITECTURE.md`**: System architecture and component design
- **`ATTRIBUTE_FILTERING.md`** (v1.0.3): Detailed guide on attribute stability filtering - stable vs state attributes
- **`SEQL_IMPROVEMENTS_SUMMARY.md`**: History of all improvements and changes to the system
- **`AI_AGENT_INSTRUCTIONS.md`**: Guidelines for AI assistants working on this project - contains critical rules about not deviating from specifications

**Important**: Changes to core algorithms (anchor finding, path building, resolution) must align with `SPECIFICATION.md`. This is not a "suggestions" document - it's the formal specification.

## Testing Strategy

Tests are in `tests/` directory, organized by component:

- `generator.test.ts`: Integration tests for EID generation
- `resolver.test.ts`: Integration tests for EID resolution
- `css-generator.test.ts`: CSS selector generation (extensive edge cases)
- `batch-generator.test.ts`: Batch processing
- `cache.test.ts`: Caching behavior
- `class-classifier.test.ts`: CSS class classification
- `attribute-cleaner.test.ts`: Attribute normalization
- `utils.test.ts`: General utilities

Tests use Vitest with jsdom for DOM emulation. When adding tests, prefer integration tests over unit tests for generator/resolver flows.

## Build Configuration

- **Build tool**: Vite (no explicit vite.config.ts - uses defaults)
- **TypeScript**: Standard configuration
- **Package manager**: Yarn 1.22.22
- **Output**:
  - ESM: `dist/seql-js.js`
  - UMD: `dist/seql-js.umd.cjs`
  - Types: `dist/seql-js.d.ts`, `dist/seql-js.d.cts`

The library has zero runtime dependencies and is designed to be tree-shakeable.

## Common Patterns

### Working with the Cache

Always use the provided cache or create one explicitly:

```typescript
import { getGlobalCache, createEIDCache } from './utils';

// Use global cache
const cache = getGlobalCache();

// Or create a custom cache
const customCache = createEIDCache({ maxSize: 500 });
```

### Extending Semantic Extraction

When adding new semantic features, update:

1. `ElementSemantics` type in `types/semantics.ts`
2. `SemanticExtractor` in `generator/semantic-extractor.ts`
3. `SemanticsMatcher` scoring in `resolver/semantics-matcher.ts`

### Adding New Constraints

To add a constraint type:

1. Define the constraint interface in `types/constraints.ts`
2. Implement evaluation in `resolver/constraints-evaluator.ts`
3. Add generation logic in `generator/generator.ts`
