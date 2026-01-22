# Basic Examples

15 essential SEQL patterns you'll use every day.

## 1. Simple Button

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

// HTML: <button type="submit">Submit</button>
const button = document.querySelector('button[type="submit"]');
const selector = generateSEQL(button);
// Result: "v1: button[type="submit",text="Submit"]"

// Later, find it again
const found = resolveSEQL(selector, document);
console.log(found[0] === button); // true
```

## 2. Form Submit Button

```typescript
// HTML: <form><button type="submit">Create Account</button></form>
const submitBtn = document.querySelector('form button[type="submit"]');
const selector = generateSEQL(submitBtn);
// Result: "v1: form :: button[type="submit",text="Create Account"]"
```

## 3. Text Input Field

```typescript
// HTML: <input type="text" name="username" placeholder="Enter username">
const input = document.querySelector('input[name="username"]');
const selector = generateSEQL(input);
// Result: "v1: form :: input[type="text",name="username"]"
```

## 4. Email Input

```typescript
// HTML: <input type="email" name="email" required>
const email = document.querySelector('input[type="email"]');
const selector = generateSEQL(email);
// Result: "v1: form :: input[type="email",name="email"]"
```

## 5. Checkbox

```typescript
// HTML: <input type="checkbox" name="terms" id="accept-terms">
const checkbox = document.querySelector('#accept-terms');
const selector = generateSEQL(checkbox);
// Result: "v1: form :: input[type="checkbox",name="terms"]"
```

## 6. Link in Navigation

```typescript
// HTML: <nav><a href="/about">About Us</a></nav>
const link = document.querySelector('nav a[href="/about"]');
const selector = generateSEQL(link);
// Result: "v1: nav :: a[href="/about",text="About Us"]"
```

## 7. Select Dropdown

```typescript
// HTML: <select name="country"><option>USA</option></select>
const select = document.querySelector('select[name="country"]');
const selector = generateSEQL(select);
// Result: "v1: form :: select[name="country"]"
```

## 8. Dialog Close Button

```typescript
// HTML: <div role="dialog"><button aria-label="Close">×</button></div>
const closeBtn = document.querySelector('[role="dialog"] button[aria-label="Close"]');
const selector = generateSEQL(closeBtn);
// Result: "v1: div[role="dialog"] :: button[aria-label="Close"]"
```

## 9. Main Content Area

```typescript
// HTML: <main><h1>Welcome</h1></main>
const heading = document.querySelector('main h1');
const selector = generateSEQL(heading);
// Result: "v1: main :: h1[text="Welcome"]"
```

## 10. Article Link

```typescript
// HTML: <article><a href="/post/123">Read More</a></article>
const readMore = document.querySelector('article a');
const selector = generateSEQL(readMore);
// Result: "v1: article :: a[href="/post/123",text="Read More"]"
```

## 11. Search Input

```typescript
// HTML: <input type="search" placeholder="Search..." aria-label="Search">
const search = document.querySelector('input[type="search"]');
const selector = generateSEQL(search);
// Result: "v1: input[type="search",aria-label="Search"]"
```

## 12. Radio Button

```typescript
// HTML: <input type="radio" name="plan" value="pro">
const radio = document.querySelector('input[type="radio"][value="pro"]');
const selector = generateSEQL(radio);
// Result: "v1: form :: input[type="radio",name="plan",value="pro"]"
```

## 13. Textarea

```typescript
// HTML: <textarea name="message" rows="5"></textarea>
const textarea = document.querySelector('textarea[name="message"]');
const selector = generateSEQL(textarea);
// Result: "v1: form :: textarea[name="message"]"
```

## 14. Icon Button

```typescript
// HTML: <button aria-label="Menu"><svg>...</svg></button>
const menuBtn = document.querySelector('button[aria-label="Menu"]');
const selector = generateSEQL(menuBtn);
// Result: "v1: button[aria-label="Menu"]"
```

## 15. List Item Link

```typescript
// HTML: <ul><li><a href="/products">Products</a></li></ul>
const productLink = document.querySelector('ul li a[href="/products"]');
const selector = generateSEQL(productLink);
// Result: "v1: ul > li > a[href="/products",text="Products"]"
```

## Event Tracking Example

Track all button clicks on a page:

```typescript
import { generateSEQL } from 'seql-js';

document.addEventListener('click', (event) => {
  const target = event.target as Element;
  const button = target.closest('button');

  if (button) {
    const selector = generateSEQL(button);
    console.log('Button clicked:', selector);

    // Send to analytics
    gtag('event', 'button_click', {
      element_selector: selector,
    });
  }
});
```

## Batch Example

Generate selectors for all buttons:

```typescript
import { generateEIDBatch, stringifySEQL } from 'seql-js';

const buttons = Array.from(document.querySelectorAll('button'));
const eids = generateEIDBatch(buttons);
const selectors = eids.filter((eid) => eid !== null).map((eid) => stringifySEQL(eid!));

console.log(`Generated ${selectors.length} button selectors`);
```

## Testing Pattern

Verify selectors work correctly:

```typescript
import { generateSEQL, resolveSEQL } from 'seql-js';

function testSelector(element: Element): boolean {
  const selector = generateSEQL(element);

  if (!selector) {
    console.error('Failed to generate selector');
    return false;
  }

  const resolved = resolveSEQL(selector, document);

  if (resolved.length === 0) {
    console.error('Selector found no elements');
    return false;
  }

  if (resolved[0] !== element) {
    console.error('Selector matched different element');
    return false;
  }

  console.log('✓ Selector works correctly');
  return true;
}

// Test it
const button = document.querySelector('button');
if (button) {
  testSelector(button);
}
```

## Next Steps

- [Forms](./forms.md) - More form examples
- [Navigation](./navigation.md) - Nav menus and tabs
- [Tables](./tables.md) - Table cell identification
- [API Reference](../api/) - Complete API docs
