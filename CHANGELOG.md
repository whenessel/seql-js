# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-22

### Added

- **nth-child positioning**: EID now includes `nthChild` property for accurate element positioning
  - Anchor nodes record their position among siblings for better precision
  - Path nodes optionally include position information
  - Target nodes include position for disambiguation
  - Enables precise table cell identification (e.g., `tr:nth-child(4) > td:nth-child(1)`)
- Chrome extension test tools (`seql-js-test-tools.js`) for visual debugging and testing

### Changed

- **CSS Selector Generation**: Improved multi-strategy selector building with nth-child support
  - Enhanced `css-generator.ts` with four distinct selector building strategies
  - Better handling of SVG child elements with proper child combinators (`>`)
  - More accurate selector generation for complex DOM structures
- **Documentation**: Complete restructuring and migration to English
  - Reorganized into logical sections: getting-started, guides, api, specification, architecture, examples, troubleshooting, contributing
  - Translated all Russian specifications to fresh English documentation
  - Archived Russian originals to `docs/archive/legacy-specs-russian/`
  - Archived resolved issues to `docs/archive/issues-resolved/`

### Fixed

- Anchor node positioning in complex nested DOM structures
- CSS selector accuracy for table elements and SVG children
- Path matching scoring for better disambiguation in ambiguous cases

## [1.0.3] - 2026-01-21

### Added

- **Attribute Stability Filtering**: New `attribute-filters.ts` module to separate stable identity attributes from temporary state attributes
  - Filters ARIA state attributes (`aria-selected`, `aria-expanded`, `aria-hidden`)
  - Filters data-\* state attributes (`data-state`, `data-active`, `data-orientation`)
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

[Unreleased]: https://github.com/whenessel/seql-js/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/whenessel/seql-js/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/whenessel/seql-js/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/whenessel/seql-js/releases/tag/v1.0.2
