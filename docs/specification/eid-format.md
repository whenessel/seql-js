# EID Format Specification

Element Identity Descriptor (EID) JSON structure specification v1.0 (with v1.1.0 extensions).

## Schema

```typescript
interface ElementIdentity {
  version: string; // Format version (e1.0")
  anchor: AnchorNode; // Semantic root element
  path: PathNode[]; // Semantic traversal
  target: TargetNode; // Element being identified
  constraints?: Constraint[]; // Disambiguation rules
  fallbackRules?: FallbackRules; // Fallback resolution rules
  meta: EIDMeta; // Metadata
}
```

## Anchor Node

```typescript
interface AnchorNode {
  tag: string; // Tag name (e.g., "form", "main")
  semantics: ElementSemantics; // Semantic features
  nthChild?: number; // Position among siblings (v1.1.0)
}
```

**Example:**

```json
{
  "tag": "form",
  "semantics": {
    "attributes": { "aria-label": "Login" }
  },
  "nthChild": 1
}
```

## Path Node

```typescript
interface PathNode {
  tag: string; // Tag name
  semantics: ElementSemantics; // Semantic features
  nthChild?: number; // Position (v1.1.0)
}
```

**Example:**

```json
{
  "tag": "div",
  "semantics": {
    "classes": ["fields"]
  }
}
```

## Target Node

```typescript
interface TargetNode {
  tag: string; // Tag name
  semantics: ElementSemantics; // Semantic features
  nthChild?: number; // Position (v1.1.0)
}
```

**Example:**

```json
{
  "tag": "button",
  "semantics": {
    "attributes": { "type": "submit" },
    "text": "Login"
  },
  "nthChild": 2
}
```

## Element Semantics

```typescript
interface ElementSemantics {
  id?: string; // Stable ID (if present)
  classes?: string[]; // Semantic classes (filtered)
  attributes?: Record<string, string>; // Identity attributes
  role?: string; // ARIA role
  text?: string; // Text content
  svgFingerprint?: SvgFingerprint; // SVG-specific
}
```

## Metadata

```typescript
interface EIDMeta {
  confidence: number; // Quality score (0-1)
  generatedAt: string; // ISO timestamp
  degraded: boolean; // True if conditions not ideal
  degradationReason?: string; // Why degraded
}
```

## Complete Example

```json
{
  "version": "1.0",
  "anchor": {
    "tag": "form",
    "semantics": {
      "attributes": { "aria-label": "Login Form" }
    },
    "nthChild": 1
  },
  "path": [
    {
      "tag": "div",
      "semantics": {
        "classes": ["form-fields"]
      }
    }
  ],
  "target": {
    "tag": "input",
    "semantics": {
      "attributes": {
        "type": "email",
        "name": "email"
      }
    },
    "nthChild": 1
  },
  "meta": {
    "confidence": 0.92,
    "generatedAt": "2026-01-22T10:30:00Z",
    "degraded": false
  }
}
```

## nth-child Property (v1.1.0)

The `nthChild` property indicates an element's position among its siblings:

- **1-based indexing** (matches CSS `:nth-child()`)
- Optional - only included when needed for disambiguation
- Helps identify elements in lists, tables, or with identical siblings

**When included:**

- Anchor: For forms, sections with multiple instances
- Path: For disambiguating intermediate nodes
- Target: For identical siblings (same tag + semantics)

**Example - Table Cell:**

```json
{
  "anchor": { "tag": "table", "nthChild": 1 },
  "path": [{ "tag": "tbody" }, { "tag": "tr", "nthChild": 3 }],
  "target": { "tag": "td", "nthChild": 2 }
}
```
