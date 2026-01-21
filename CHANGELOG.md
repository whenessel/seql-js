# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-01-21

### Added
- **Attribute Stability Filtering**: New `attribute-filters.ts` module to separate stable identity attributes from temporary state attributes
  - Filters ARIA state attributes (`aria-selected`, `aria-expanded`, `aria-hidden`)
  - Filters data-* state attributes (`data-state`, `data-active`, `data-orientation`)
  - Filters library-specific prefixes (`data-radix-*`, `data-headlessui-*`, `data-mui-*`)
  - Filters generated IDs (Radix UI, Headless UI, Material UI patterns)
  - Preserves test IDs (`data-testid`, `data-cy`, `data-qa`)
  - Preserves semantic attributes (`aria-label`, `role`, `name`, `type`)
- Comprehensive test coverage: 31 new tests (17 unit + 14 integration)
- Documentation: `docs/specs/ATTRIBUTE_FILTERING.md` with detailed filtering rules

### Changed
- **BREAKING**: EID generation now excludes state-based attributes from element semantics
  - Elements previously identified with state attributes will have different EID values
  - Recommendation: Regenerate all stored EIDs after upgrading
- `SemanticExtractor.extractAttributes()` now filters attributes through `isStableAttribute()`
- Updated documentation:
  - `docs/specs/ARCHITECTURE.md` - added attribute filters module description
  - `docs/specs/SEQL_IMPROVEMENTS_SUMMARY.md` - added section 17 on attribute filtering
  - `docs/specs/INDEX.md` - added references to new documentation
  - `CLAUDE.md` - added state independence principle
  - `README.md` - added state-independent feature highlight

### Fixed
- Selectors now correctly identify elements across state changes (active/inactive, visible/hidden, expanded/collapsed)
- Reduced brittleness from library-specific generated attributes

### Performance
- Slight overhead in generation: +0.53ms per element (+43%)
- No impact on resolution performance

## [1.0.2] - Previous release

See git history for changes before this version.

---

[Unreleased]: https://github.com/whenessel/seql-js/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/whenessel/seql-js/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/whenessel/seql-js/releases/tag/v1.0.2
