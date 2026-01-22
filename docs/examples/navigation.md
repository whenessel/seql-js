# Navigation Examples

Nav menus, breadcrumbs, and tabs.

## Main Navigation

```html
<nav role="navigation" aria-label="Main">
  <a href="/">Home</a>
  <a href="/products">Products</a>
  <a href="/about">About</a>
</nav>
```

```typescript
import { generateSEQL } from 'seql-js';

const productsLink = document.querySelector('nav a[href="/products"]');
const selector = generateSEQL(productsLink);
// "v1: nav[role="navigation"] :: a[href="/products",text="Products"]"
```

## Tabs

```html
<div role="tablist">
  <button role="tab" aria-selected="true">Overview</button>
  <button role="tab" aria-selected="false">Details</button>
</div>
```

```typescript
const detailsTab = document.querySelector('[role="tab"]:nth-child(2)');
generateSEQL(detailsTab);
// "v1: div[role="tablist"] :: button[role="tab",text="Details"]"
// Note: aria-selected is filtered out (state attribute)
```

## Breadcrumbs

```html
<nav aria-label="Breadcrumb">
  <a href="/">Home</a> >
  <a href="/products">Products</a> >
  <span>Product A</span>
</nav>
```

```typescript
const productsBreadcrumb = document.querySelector('nav a[href="/products"]');
generateSEQL(productsBreadcrumb);
// "v1: nav[aria-label="Breadcrumb"] :: a[href="/products"]"
```

## Dropdown Menu

```html
<nav>
  <button aria-expanded="false" aria-haspopup="true">Menu</button>
  <ul hidden>
    <li><a href="/settings">Settings</a></li>
    <li><a href="/logout">Logout</a></li>
  </ul>
</nav>
```

```typescript
const logoutLink = document.querySelector('nav ul a[href="/logout"]');
generateSEQL(logoutLink);
// "v1: nav :: ul > li > a[href="/logout",text="Logout"]"
```
