# Path Construction

Rules for building the semantic path from anchor to target.

## Path Building Algorithm

```
1. Start from target element
2. Walk up to anchor element
3. For each intermediate node:
   - Extract semantics
   - Skip if non-semantic
   - Add to path array
4. Reverse path (anchor → target order)
```

## Node Filtering

**Include** nodes with:
- Semantic tags (section, article, aside, etc.)
- Classes (semantic, not utility)
- IDs (stable only)
- ARIA roles
- Data attributes (stable)

**Skip** nodes that are:
- Generic `<div>` or `<span>` without attributes
- Utility-class-only elements
- Auto-generated wrappers

## Example

```html
<form>
  <div>  <!-- Skip: no semantic value -->
    <div class="fields">  <!-- Include: has semantic class -->
      <div>  <!-- Skip: no semantic value -->
        <input type="email">
      </div>
    </div>
  </div>
</form>
```

**Path**: `[{ tag: "div", semantics: { classes: ["fields"] } }]`

## Max Path Depth

Default: 10 nodes

Paths longer than max are truncated from the middle, preserving:
- Nodes closest to anchor (context)
- Nodes closest to target (precision)
