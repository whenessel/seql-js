# AI Agent Development Guidelines

Guidelines for AI assistants working on seql-js.

## Core Principles

1. **Follow the specification**: [docs/specification/](../specification/) is authoritative
2. **Maintain determinism**: Same input → same output
3. **Preserve semantics**: Don't break semantic-first approach
4. **Test everything**: Add tests for all changes

## Key Constraints

### DO NOT

- Change EID format without specification update
- Break deterministic generation
- Add runtime dependencies
- Modify core algorithms without deep understanding

### DO

- Add tests for new features
- Update documentation with code changes
- Maintain TypeScript strict mode
- Follow existing code patterns

## Making Changes

1. **Read specifications** in `docs/specification/`
2. **Understand architecture** in `docs/architecture/`
3. **Check existing tests** for patterns
4. **Add new tests** before implementation
5. **Update docs** with code changes

## Testing New Features

```bash
# Run tests
yarn test

# Type check
yarn types:check

# Build
yarn build
```

## Common Tasks

### Adding New Semantic Tag

1. Update `SEMANTIC_TAGS` in `src/utils/constants.ts`
2. Add test in `tests/generator.test.ts`
3. Update `docs/specification/anchor-strategy.md`

### Adding New Constraint Type

1. Define interface in `src/types/constraints.ts`
2. Implement in `src/resolver/constraints-evaluator.ts`
3. Add tests in `tests/resolver.test.ts`
4. Document in `docs/specification/constraints.md`

## Questions?

- Check [CLAUDE.md](../../CLAUDE.md) for project overview
- Review [docs/architecture/](../architecture/) for system design
- See [docs/specification/](../specification/) for technical details
