# SEQL Specification

Formal specifications for the Element Identity Descriptor (EID) and SEQL selector format.

## Version

**Current Version**: 1.0 (with v1.1.0 nth-child extensions)  
**Status**: Stable  
**Last Updated**: 2026-01-22

## Overview

The SEQL specification defines:

- EID JSON format structure
- SEQL string selector syntax
- Anchor finding algorithm
- Path construction rules
- Semantic extraction guidelines
- Resolution algorithm (5 phases)

## Quick Navigation

- **[EID Format](./eid-format.md)** - JSON structure specification
- **[SEQL Syntax](./seql-syntax.md)** - String selector format
- **[Anchor Strategy](./anchor-strategy.md)** - How anchors are found
- **[Path Construction](./path-construction.md)** - Building semantic paths
- **[Semantic Extraction](./semantic-extraction.md)** - What semantics are captured
- **[Attribute Filtering](./attribute-filtering.md)** - State vs identity attributes (v1.0.3)
- **[SVG Fingerprinting](./svg-fingerprinting.md)** - SVG element stability
- **[Constraints](./constraints.md)** - Disambiguation rules
- **[Resolution Phases](./resolution-phases.md)** - 5-phase resolution algorithm

## Design Principles

### 1. Semantic-First

Prioritize semantic HTML and ARIA attributes over structural selectors.

### 2. Deterministic

Same DOM state always produces same EID.

### 3. State-Independent (v1.0.3)

Element identity is separate from element state.

### 4. Stability Over Precision

Trade some precision for long-term stability across DOM changes.

### 5. Framework-Agnostic

Works with vanilla DOM, React, Vue, Angular, etc.

## Format Comparison

| Aspect          | EID (JSON)          | SEQL (String)     |
| --------------- | ------------------- | ----------------- |
| **Size**        | ~500-2000 bytes     | ~100-300 bytes    |
| **Readability** | Machine-friendly    | Human-friendly    |
| **Metadata**    | Full details        | Compact           |
| **Use Case**    | Internal processing | Transport/storage |
| **Parsing**     | Native JSON         | Custom parser     |

## Version History

### v1.1.0 (2026-01-22)

- Added `nthChild` property to anchor, path, and target nodes
- Enhanced CSS selector generation with nth-child support

### v1.0.3 (2026-01-21)

- Introduced attribute stability filtering
- Separated state attributes from identity attributes

### v1.0.0 (2025-01-15)

- Initial stable release
- Core EID/SEQL specification

## Conformance

Implementations MUST:

- Follow EID JSON schema exactly
- Support all specified semantic tags
- Implement 5-phase resolution algorithm
- Handle attribute filtering correctly (v1.0.3+)
- Include nth-child when disambiguating (v1.1.0+)

Implementations SHOULD:

- Cache generation results for performance
- Support batch processing
- Provide TypeScript types

## Next Steps

- Start with [EID Format](./eid-format.md) for JSON structure
- See [SEQL Syntax](./seql-syntax.md) for string format
- Review [Anchor Strategy](./anchor-strategy.md) for algorithm details
