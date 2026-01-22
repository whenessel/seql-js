# SVG Examples

SVG icons and graphics identification.

## SVG Icon Button

```html
<button aria-label="Close">
  <svg viewBox="0 0 24 24">
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  </svg>
</button>
```

```typescript
import { generateSEQL } from 'seql-js';

const closeButton = document.querySelector('button[aria-label="Close"]');
const selector = generateSEQL(closeButton);
// "v1: button[aria-label="Close"]"
// SVG fingerprint included in EID but not in compact SEQL selector
```

## SVG Link

```html
<a href="/home">
  <svg><use href="#home-icon"></use></svg>
  Home
</a>
```

```typescript
const homeLink = document.querySelector('a[href="/home"]');
generateSEQL(homeLink);
// "v1: a[href="/home",text="Home"]"
```

## Chart Element

```html
<svg id="sales-chart">
  <rect class="bar" x="0" y="50" width="20" height="50"></rect>
  <rect class="bar" x="25" y="30" width="20" height="70"></rect>
</svg>
```

```typescript
const secondBar = document.querySelector('svg#sales-chart rect:nth-child(2)');
generateSEQL(secondBar);
// Includes SVG-specific fingerprinting for stability
```
