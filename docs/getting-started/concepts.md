# Core Concepts

Understanding SEQL's fundamental concepts will help you use the library effectively.

## The Identity Problem

Traditional selectors describe **how to navigate** to an element:

```css
/* CSS Selector: Navigate down the tree */
.modal > div:nth-child(2) > button.primary

/* XPath: Similar navigation approach */
//div[@class='modal']/div[2]/button[@class='primary']
```

**Problem**: These selectors break when:
- DOM structure changes (new divs added, elements moved)
- CSS classes are renamed or removed
- nth-child positions shift

**SEQL's Approach**: Describe **what the element is semantically**:

```
v1: div[role="dialog"] :: button[type="button",text="Confirm"]
```

This remains valid regardless of structural changes because it identifies the element by its semantic properties.

## The Two Formats: EID vs SEQL

SEQL provides two complementary formats for element identification:

### SEQL Selector (String Format)

**Purpose**: Compact, human-readable, URL-safe string representation.

**Use Cases**:
- Sending to analytics platforms
- Storing in databases or logs
- Embedding in URLs
- Human-readable debugging

**Example**:
```
v1: form[aria-label="Login"] :: div.fields > input[type="email",name="email"]
```

**Advantages**:
- Compact (~100-200 characters typically)
- Easy to transmit and store
- URL-safe (when properly encoded)
- Human-readable

### EID (Element Identity Descriptor, JSON Format)

**Purpose**: Structured, programmatically accessible semantic description.

**Use Cases**:
- Programmatic analysis of semantics
- Custom resolution logic
- Debug and introspection
- Internal processing

**Example**:
```json
{
  "anchor": {
    "tag": "form",
    "semantics": {
      "attributes": { "aria-label": "Login" }
    },
    "nthChild": 1
  },
  "path": [
    {
      "tag": "div",
      "semantics": { "classes": ["fields"] }
    }
  ],
  "target": {
    "tag": "input",
    "semantics": {
      "attributes": { "type": "email", "name": "email" }
    },
    "nthChild": 2
  }
}
```

**Advantages**:
- Full semantic metadata
- Type-safe (with TypeScript)
- Programmatically accessible
- Preserves all details

### Conversion Between Formats

```typescript
import { generateEID, stringifySEQL, parseSEQL, resolve } from 'seql-js';

// Element → EID → SEQL Selector
const element = document.querySelector('button');
const eid = generateEID(element);
const selector = stringifySEQL(eid);

// SEQL Selector → EID → Elements
const parsedEID = parseSEQL(selector);
const result = resolve(parsedEID, document);
```

## The Identity Model: Anchor-Path-Target

Every SEQL identifier consists of three components:

### 1. Anchor (Semantic Root)

The **anchor** is a stable, semantic starting point in the DOM.

**Purpose**: Provide a stable reference point that's unlikely to change.

**Anchor Priority** (Tier A → C):
- **Tier A**: Semantic HTML tags
  - `<form>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`
- **Tier B**: ARIA roles
  - `role="navigation"`, `role="main"`, `role="region"`, `role="dialog"`
- **Tier C**: Fallback
  - Elements with stable test IDs (`data-testid`)
  - `<body>` as last resort

**Example**:
```typescript
// Anchor: <form> tag (Tier A)
v1: form :: button[type="submit"]

// Anchor: <div role="dialog"> (Tier B)
v1: div[role="dialog"] :: button[text="Close"]
```

### 2. Path (Semantic Traversal)

The **path** describes the semantic journey from anchor to target's parent.

**Purpose**: Capture meaningful intermediate steps while ignoring noise.

**Path Filtering**:
- Includes: Semantic tags, elements with classes/IDs, role attributes
- Excludes: Generic `<div>` and `<span>` without semantic value

**Example**:
```html
<form>
  <div class="wrapper">
    <div>  <!-- Filtered out: no semantic value -->
      <div class="fields">  <!-- Included: has semantic class -->
        <input type="email">
      </div>
    </div>
  </div>
</form>
```

Results in path: `div.wrapper > div.fields`

The anonymous `<div>` is skipped because it adds no semantic value.

### 3. Target (The Element Itself)

The **target** is the element you're identifying.

**Purpose**: Capture sufficient semantic features for unique identification.

**Target Semantics**:
- **Tag name**: `button`, `input`, `a`
- **Type**: `type="submit"`, `type="email"`
- **Text content**: `text="Login"`, `text="Submit"`
- **Name**: `name="email"`, `name="password"`
- **Classes** (filtered): Semantic classes only, no utility classes
- **ARIA attributes**: `aria-label="Close"`, `role="button"`
- **nth-child** (v1.1.0): Position among siblings for disambiguation

**Example**:
```typescript
// Target with multiple semantic features
button[type="submit",text="Create Account",aria-label="Submit form"]

// Target with nth-child for precision (v1.1.0)
input[type="radio",name="plan",nthChild=2]
```

## Constraints: Disambiguation Rules

**Constraints** help resolve ambiguity when multiple elements match the same semantics.

### Constraint Types

1. **Uniqueness Constraint**
   - Ensures only one element matches
   - Fails resolution if multiple matches found

2. **Text Proximity Constraint**
   - Element must be near specific text
   - Example: Button near "Total: $99.00"

3. **Position Constraint**
   - Element at specific position in list
   - Example: 3rd item in a menu

4. **Visibility Constraint**
   - Element must be visible
   - Filters out hidden or display:none elements

**Example**:
```json
{
  "constraints": {
    "uniqueness": true,
    "textProximity": {
      "text": "Total: $99.00",
      "maxDistance": 200
    }
  }
}
```

## State Independence (v1.0.3)

SEQL identifies elements by their **semantic identity**, not their current state.

**State attributes are filtered out**:
- `aria-selected="true"` → Ignored
- `aria-expanded="false"` → Ignored
- `data-state="active"` → Ignored
- `disabled` → Ignored

**Identity attributes are preserved**:
- `aria-label="Close"` → Preserved
- `role="button"` → Preserved
- `type="submit"` → Preserved
- `name="email"` → Preserved

**Why**: An element's identity doesn't change when its state changes. A "Close" button is still a "Close" button whether the modal is open or closed.

**Example**:
```html
<!-- State changes don't affect identity -->
<button aria-label="Menu" aria-expanded="false">Menu</button>
<button aria-label="Menu" aria-expanded="true">Menu</button>

<!-- Both generate the same SEQL selector -->
v1: button[aria-label="Menu"]
```

## nth-child Positioning (v1.1.0)

For elements that are otherwise identical, **nth-child** provides precise disambiguation.

**When nth-child is used**:
- Multiple sibling elements with identical semantics
- Table cells, list items, form fields
- When order is semantically meaningful

**Example**:
```html
<table>
  <tr>
    <td>Name</td>
    <td>Age</td>
    <td>City</td>
  </tr>
  <tr>
    <td>John</td>
    <td>25</td>
    <td>NYC</td>
  </tr>
</table>
```

```typescript
// Target the "Age" cell in first data row
v1: table :: tr[nthChild=2] > td[nthChild=2]
```

## Semantic Filtering

SEQL automatically filters out non-semantic noise to focus on meaningful identifiers.

### Class Filtering

**Filtered out** (utility/framework classes):
- Tailwind: `flex`, `p-4`, `text-center`, `bg-blue-500`
- Bootstrap: `btn`, `btn-primary`, `col-md-6`, `d-flex`
- Generated: `css-1y7f3z`, `MuiButton-root`

**Preserved** (semantic classes):
- Component names: `login-form`, `submit-button`, `user-profile`
- State modifiers: `active`, `selected`, `highlighted`
- Semantic identifiers: `primary-action`, `navigation-menu`

### Attribute Filtering (v1.0.3)

**Filtered out** (state/generated):
- State: `aria-selected`, `aria-expanded`, `data-state`
- Library-generated: `data-radix-id`, `data-headlessui-state`
- Auto-generated IDs: `radix-1`, `headlessui-menu-button-2`

**Preserved** (identity):
- Test markers: `data-testid`, `data-cy`, `data-qa`
- Semantic: `aria-label`, `role`, `name`, `type`
- Stable IDs: User-defined IDs that follow semantic patterns

## Resolution Algorithm (5 Phases)

SEQL uses a multi-phase resolution algorithm for robustness:

**Phase 1: CSS Narrowing**
- Generate optimized CSS selector from EID
- Narrow down candidates using browser's native query

**Phase 2: Semantic Filtering**
- Score remaining candidates by semantic similarity
- Filter out low-scoring matches

**Phase 3: Uniqueness Check**
- If only one candidate remains, return early
- Skip remaining phases for performance

**Phase 4: Constraints Evaluation**
- Apply uniqueness, visibility, text proximity constraints
- Filter candidates that don't meet constraints

**Phase 5: Handle Ambiguity**
- If multiple matches remain, return all (status: 'ambiguous')
- If no matches, check fallback rules
- Return results with confidence score

**Example**:
```typescript
const result = resolve(eid, document);

// result.status can be:
// - 'success': Single match found
// - 'ambiguous': Multiple matches found
// - 'degraded-fallback': Partial match with degraded confidence
// - 'error': No matches found

// result.confidence: 0.0 to 1.0
// - 1.0: Perfect match
// - 0.7-0.9: Good match
// - 0.5-0.7: Acceptable match
// - < 0.5: Degraded match
```

## Practical Decision Guide

### When to use SEQL Selector?
- Sending to analytics platforms
- Storing in logs or databases
- Simple, string-based workflows
- Human-readable output needed

### When to use EID?
- Need programmatic access to semantics
- Building custom resolution logic
- Debugging semantic extraction
- Internal processing pipelines

### When to use batch processing?
- Generating selectors for 10+ elements
- Performance-critical scenarios
- Initial page load analysis
- Bulk element tracking

## Next Steps

- [API Reference](../api/) - Explore the complete API
- [Examples](../examples/) - See real-world use cases
- [Specification](../specification/) - Deep dive into the formal spec
- [Guides](../guides/) - Advanced topics and patterns
