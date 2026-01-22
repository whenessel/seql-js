# Architecture Overview

System design and component structure for seql-js.

## High-Level Design

```
┌─────────────┐
│   Element   │
└──────┬──────┘
       │ generateEID()
       ↓
┌─────────────────────────────────┐
│  Generator Pipeline             │
│  1. AnchorFinder               │
│  2. PathBuilder                │
│  3. SemanticExtractor          │
│  4. SvgFingerprinter           │
│  5. Confidence Calculator      │
└──────┬──────────────────────────┘
       │
       ↓
┌──────────────┐
│  EID (JSON)  │
└──────┬───────┘
       │ resolve()
       ↓
┌─────────────────────────────────┐
│  Resolver Pipeline (5 Phases)  │
│  1. CSS Narrowing              │
│  2. Semantic Filtering         │
│  3. Uniqueness Check           │
│  4. Constraints Evaluation     │
│  5. Ambiguity Handling         │
└──────┬──────────────────────────┘
       │
       ↓
┌──────────────┐
│  Element(s)  │
└──────────────┘
```

## Core Principles

1. **Semantic-First**: Prioritize meaning over structure
2. **Deterministic**: Same input → same output
3. **State-Independent**: Identity ≠ state (v1.0.3)
4. **Framework-Agnostic**: Works with any framework
5. **Zero Dependencies**: Standalone library

## Module Structure

- **[System Design](./system-design.md)** - Components and data flow
- **[Generation Pipeline](./generation-pipeline.md)** - How EIDs are created
- **[Resolution Algorithm](./resolution-algorithm.md)** - 5-phase resolver
- **[Semantic Model](./semantic-model.md)** - Anchor/path/target structure
- **[Design Decisions](./design-decisions.md)** - Key architectural choices

## Quick Facts

- **Language**: TypeScript
- **Size**: ~15KB minified + gzipped
- **Dependencies**: Zero
- **Browser Support**: ES2015+
- **Performance**: <5ms generation, <20ms resolution
