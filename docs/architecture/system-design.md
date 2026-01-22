# System Design

Component architecture and data flow.

## Component Layers

### 1. Public API Layer
- `generateEID()`, `resolve()` - Core functions
- `generateSEQL()`, `resolveSEQL()` - String-based convenience
- `generateEIDBatch()` - Batch processing

### 2. Generator Layer
- **AnchorFinder**: Finds semantic root element
- **PathBuilder**: Builds semantic traversal path
- **SemanticExtractor**: Extracts element semantics
- **SvgFingerprinter**: Creates SVG fingerprints
- **ConfidenceCalculator**: Scores EID quality

### 3. Resolver Layer
- **CssGenerator**: Builds CSS selectors from EID
- **SemanticsMatcher**: Scores semantic similarity
- **ConstraintsEvaluator**: Applies disambiguation rules
- **FallbackHandler**: Handles resolution failures

### 4. Utilities Layer
- **EIDCache**: Multi-level caching
- **Validators**: EID validation
- **Parsers**: SEQL string parsing
- **Filters**: Class/attribute filtering

## Data Flow

**Generation Flow:**
```
Element
  → AnchorFinder.findAnchor()
  → PathBuilder.buildPath()
  → SemanticExtractor.extract() (for each node)
  → SvgFingerprinter.fingerprint() (if SVG)
  → ConfidenceCalculator.calculate()
  → ElementIdentity
```

**Resolution Flow:**
```
ElementIdentity
  → CssGenerator.buildSelector()
  → document.querySelectorAll()
  → SemanticsMatcher.match()
  → ConstraintsEvaluator.evaluate()
  → FallbackHandler.handleFallback() (if needed)
  → ResolveResult
```

## Module Organization

```
src/
├── types/              # TypeScript definitions
│   ├── eid.ts
│   ├── semantics.ts
│   ├── constraints.ts
│   └── options.ts
│
├── generator/          # EID generation
│   ├── generator.ts
│   ├── anchor-finder.ts
│   ├── path-builder.ts
│   ├── semantic-extractor.ts
│   └── svg-fingerprinter.ts
│
├── resolver/           # EID resolution
│   ├── resolver.ts
│   ├── css-generator.ts
│   ├── semantics-matcher.ts
│   ├── constraints-evaluator.ts
│   └── fallback-handler.ts
│
├── utils/              # Shared utilities
│   ├── eid-cache.ts
│   ├── seql-parser.ts
│   ├── attribute-filters.ts
│   ├── class-filter.ts
│   └── scorer.ts
│
└── index.ts            # Public API
```
