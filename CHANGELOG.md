# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2026-01-28

### Added

- Comprehensive analytics attribute filtering to improve EID stability
- Support for filtering Google Analytics, GTM, Yandex Metrica, Hotjar, FullStory, Mouseflow, Smartlook, Optimizely, VWO, Facebook Pixel, TikTok Pixel, LinkedIn Pixel attributes
- 28 new analytics prefix patterns and 4 exact-match patterns for filtering third-party tracking data
- Analytics attributes are now excluded from EID generation to prevent instability across marketing campaigns and tracking configuration changes

### Changed

- **BREAKING**: `data-tracking-id` and `data-analytics-id` are now filtered out (analytics prefix takes precedence over `-id` suffix rule)
- **BREAKING**: `data-category`, `data-action`, `data-label`, `data-value` are now filtered out (Google Analytics standard attributes)
- Analytics prefix matching now takes precedence over generic data-*-id suffix rule for better stability

### Tests

- Added 50+ new unit tests for analytics attribute filtering (100% pass rate)
- Added 5 new integration tests for end-to-end analytics filtering validation
- All 932 tests passing (772 unit + 160 integration)

### Migration

If using `data-tracking-id` or `data-analytics-id` for semantic identification, rename to:

- `data-component-id` for component identifiers
- `data-entity-id` for entity identifiers
- `data-testid` for test automation

If using Google Analytics standard attributes for semantic purposes:

- Replace `data-category` with `data-product-category` or similar semantic alternatives
- Replace `data-action` with `data-action-type` or similar
- Replace `data-label` with semantic HTML or `aria-label`
- Replace `data-value` with `data-amount`, `data-price`, or similar

See `docs/specification/attribute-filtering.md` for full migration guide.

## [1.3.0] - 2026-01-27

### Changed

- **Always-Generate Guarantee**: `generateEID` now always returns an EID for valid DOM elements
  - Default `confidenceThreshold` reduced from `0.1` to `0.0`
  - Low confidence is indicated via `meta.confidence` field rather than preventing generation
  - Allows callers to decide whether to use low-confidence EIDs based on their use case
  - Elements with minimal semantics (e.g., plain div with utility classes) can still be identified using positional information (`nthChild`)
  - **Breaking change**: Previous behavior would return `null` for low-confidence elements. Code relying on `null` return values should check `meta.confidence` instead.

- **Improved Stable ID Scoring**: Increased weight for stable ID anchors
  - `ANCHOR_SCORE.STABLE_ID` increased from `0.1` to `0.25` (150% increase)
  - Better confidence for common container IDs (`#root`, `#app`, `#main`, `#content`)
  - More accurate reflection of the importance of stable identifiers in modern web applications
  - Anchor elements with stable IDs now receive appropriate scoring weight in confidence calculation

### Tests

- Added 17 new comprehensive tests (100% pass rate)
  - 9 tests for always-generate guarantee validation
  - 8 tests for STABLE_ID weight verification across different scenarios
- All 909 existing tests pass with no regressions
- Total test suite: 926 tests passing

### Documentation

- Updated `ANCHOR_SCORE` constant with detailed `@remarks` explaining the STABLE_ID weight increase
- Updated `DEFAULT_GENERATOR_OPTIONS` with comprehensive explanation of confidenceThreshold=0.0 rationale
- Added inline documentation for new behavior and implications

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
