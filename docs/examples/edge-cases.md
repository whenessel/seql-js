# Edge Cases

Complex scenarios and advanced usage.

## Dynamic Modal

```html
<div role="dialog" aria-label="Confirm Delete">
  <p>Are you sure?</p>
  <button>Cancel</button>
  <button>Delete</button>
</div>
```

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

const deleteButton = document.querySelector('[role="dialog"] button:last-child');
const selector = generateSEQL(deleteButton);
// "v1: div[role="dialog",aria-label="Confirm Delete"] :: button[text="Delete"]"

// Later, when modal reappears
const found = resolveSEQL(selector, document);
// Finds button even if modal is recreated
```

## Shadow DOM

SEQL works with elements in Shadow DOM if you provide the shadow root as the context:

```typescript
const host = document.querySelector('my-component');
const shadowRoot = host.shadowRoot;

if (shadowRoot) {
  const button = shadowRoot.querySelector('button');
  const selector = generateSEQL(button);

  // Resolve within shadow root
  const found = resolveSEQL(selector, shadowRoot);
}
```

## Nested Forms

```html
<form id="outer">
  <form id="inner">
    <input name="email" />
  </form>
</form>
```

```typescript
const input = document.querySelector('#inner input');
generateSEQL(input);
// Uses closest semantic anchor (inner form)
```

## Identical Siblings

```html
<div>
  <button>Action</button>
  <button>Action</button>
  <button>Action</button>
</div>
```

```typescript
const secondButton = document.querySelectorAll('button')[1];
generateSEQL(secondButton);
// "v1: button[text="Action",nthChild=2]"
// Uses nth-child for disambiguation
```
