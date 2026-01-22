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
