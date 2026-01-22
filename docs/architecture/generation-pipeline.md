# Generation Pipeline

How EIDs are created from DOM elements.

## Pipeline Stages

### Stage 1: Anchor Finding

Find semantic root element up to 10 levels above target.

**Input**: Target element  
**Output**: Anchor element + tier + depth  
**Component**: `AnchorFinder`

### Stage 2: Path Building

Build semantic path from anchor to target.

**Input**: Anchor, target, semantic extractor  
**Output**: Array of path nodes  
**Component**: `PathBuilder`

### Stage 3: Semantic Extraction

Extract semantics for anchor, path nodes, and target.

**Input**: Each element  
**Output**: `ElementSemantics` object  
**Component**: `SemanticExtractor`

### Stage 4: SVG Fingerprinting (Optional)

Create fingerprints for SVG elements.

**Input**: SVG element  
**Output**: `SvgFingerprint`  
**Component**: `SvgFingerprinter`

### Stage 5: Confidence Calculation

Calculate quality score for generated EID.

**Input**: Anchor tier, path degradation, semantic richness  
**Output**: Confidence score (0-1)  
**Component**: Built into generator

### Stage 6: Constraints Generation

Add disambiguation constraints if needed.

**Input**: EID, DOM context  
**Output**: Constraint array  
**Component**: Built into generator

## Complete Example

```typescript
// Stage 1: Find anchor
const anchor = anchorFinder.findAnchor(target);
// { element: <form>, tier: 'A', depth: 2 }

// Stage 2: Build path
const pathResult = pathBuilder.buildPath(anchor.element, target);
// { path: [{ tag: 'div', semantics: {...} }], degraded: false }

// Stage 3: Extract semantics
const anchorSemantics = semanticExtractor.extract(anchor.element);
const targetSemantics = semanticExtractor.extract(target);

// Stage 4: SVG fingerprint (if applicable)
const svgFingerprint = isSvg ? svgFingerprinter.fingerprint(target) : undefined;

// Stage 5: Calculate confidence
const confidence = calculateConfidence({
  anchorTier: anchor.tier,
  pathDegraded: pathResult.degraded,
  semanticRichness: targetSemantics.attributes.length,
});

// Stage 6: Generate constraints
const constraints = generateConstraints(target, targetSemantics);

// Final EID
const eid: ElementIdentity = {
  version: '1.0',
  anchor: { tag: anchor.element.tagName, semantics: anchorSemantics },
  path: pathResult.path,
  target: { tag: target.tagName, semantics: targetSemantics },
  constraints,
  meta: { confidence, generatedAt: new Date().toISOString(), degraded: false },
};
```
