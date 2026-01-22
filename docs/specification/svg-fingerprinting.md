# SVG Fingerprinting

Stable identification of SVG elements.

## SVG Fingerprint Structure

```typescript
interface SvgFingerprint {
  shapeType: string; // "path" | "circle" | "rect" | "polygon"
  pathHash?: string; // Hash of path data
  geometry?: {
    viewBox?: string;
    width?: number;
    height?: number;
  };
  animated: boolean;
}
```

## Fingerprinting Algorithm

1. **Identify shape type**: path, circle, rect, etc.
2. **Hash path data**: For `<path>` elements, hash the `d` attribute
3. **Capture geometry**: ViewBox, dimensions
4. **Check animation**: Presence of `<animate>` or CSS animations

## Example

```html
<svg viewBox="0 0 24 24">
  <path d="M19 6.41L17.59 5 12 10.59..." />
</svg>
```

Fingerprint:

```json
{
  "shapeType": "path",
  "pathHash": "a3f9c2...",
  "geometry": { "viewBox": "0 0 24 24" },
  "animated": false
}
```

## Use Cases

- Icon buttons with SVG icons
- Charts and graphs
- Logo elements
- Vector graphics
