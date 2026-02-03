# Semantic Extraction

What semantic features are captured from elements.

## Extracted Features

### 1. Tag Name

Always captured: `div`, `button`, `input`, etc.

### 2. Stable ID

Captured if ID is stable (not auto-generated):

- ✅ `user-profile`
- ✅ `login-form`
- ❌ `radix-1`
- ❌ `headlessui-menu-button-2`

### 3. Semantic Classes

Filtered to exclude utility classes:

- ✅ `login-form`, `submit-button`
- ❌ `flex`, `p-4`, `bg-blue-500`

### 4. Identity Attributes (v1.0.3)

Stable attributes only:

- ✅ `type`, `name`, `aria-label`, `role`
- ❌ `aria-selected`, `data-state`, `disabled`

### 5. ARIA Role

Always captured if present.

### 6. Text Content

For specific elements:

- Buttons: button text
- Links: link text
- Headings: heading text
- Labels: label text

Normalized (whitespace collapsed, trimmed).

### 7. SVG Fingerprint

For SVG elements (if enabled):

- Shape type
- Path data hash
- ViewBox geometry
- Animation status

### 8. URL Normalization (v1.5.1)

For `href` and `src` attributes, values are normalized during **resolution** (not generation):

**Generation:**

- URLs stored as-is (relative or absolute)
- Cleaned by `attribute-cleaner.ts` (query params/dynamic hashes removed)

**Resolution:**

- Same-origin absolute URLs → converted to relative (`https://example.com/path` → `/path`)
- Relative URLs → kept as-is (`/path` → `/path`)
- Cross-origin URLs → preserved as absolute (`https://external.com/api` → unchanged)
- Special protocols → preserved (`javascript:`, `mailto:`, `tel:`)

**Rationale:**

Solves rrweb iframe replay scenarios where relative URLs become absolute URLs. By normalizing during comparison, EIDs generated with `/path` can match elements with `https://example.com/path` (same-origin).
