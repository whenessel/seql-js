# Form Examples

Practical examples for identifying form elements.

## Login Form

```html
<form aria-label="Login">
  <input type="email" name="email" placeholder="Email">
  <input type="password" name="password" placeholder="Password">
  <button type="submit">Sign In</button>
</form>
```

```typescript
import { generateSEQL } from 'seql-js';

const emailInput = document.querySelector('input[type="email"]');
const selector = generateSEQL(emailInput);
// "v1: form[aria-label="Login"] :: input[type="email",name="email"]"
```

## Multi-Step Form

```typescript
// Step 1: Personal Info
const firstName = document.querySelector('input[name="firstName"]');
generateSEQL(firstName);
// "v1: form :: div[class="step-1"] > input[name="firstName"]"

// Step 2: Address
const zipCode = document.querySelector('input[name="zipCode"]');
generateSEQL(zipCode);
// "v1: form :: div[class="step-2"] > input[name="zipCode"]"
```

## Form Validation Tracking

```typescript
import { generateSEQL } from 'seql-js';

document.querySelectorAll('input').forEach(input => {
  input.addEventListener('invalid', (event) => {
    const selector = generateSEQL(event.target as Element);
    console.log('Validation failed:', selector);

    // Track in analytics
    gtag('event', 'form_validation_error', {
      field: selector
    });
  });
});
```

## Radio Button Group

```html
<form>
  <input type="radio" name="plan" value="free" id="plan-free">
  <input type="radio" name="plan" value="pro" id="plan-pro">
  <input type="radio" name="plan" value="enterprise" id="plan-enterprise">
</form>
```

```typescript
const proRadio = document.querySelector('input[value="pro"]');
generateSEQL(proRadio);
// "v1: form :: input[type="radio",name="plan",value="pro"]"
```

## Checkbox List

```html
<form>
  <input type="checkbox" name="features" value="feature1">
  <input type="checkbox" name="features" value="feature2">
  <input type="checkbox" name="features" value="feature3">
</form>
```

```typescript
const feature2 = document.querySelector('input[value="feature2"]');
generateSEQL(feature2);
// "v1: form :: input[type="checkbox",name="features",value="feature2"]"
```

## File Upload

```html
<form>
  <input type="file" name="avatar" accept="image/*">
</form>
```

```typescript
const fileInput = document.querySelector('input[type="file"]');
generateSEQL(fileInput);
// "v1: form :: input[type="file",name="avatar"]"
```

## Submit Button States

```typescript
import { generateSEQL } from 'seql-js';

const submitBtn = document.querySelector('button[type="submit"]');
const selector = generateSEQL(submitBtn);
// Selector remains same regardless of disabled/enabled state
// "v1: form :: button[type="submit",text="Submit"]"

// This is stable across state changes (v1.0.3 feature)
```
