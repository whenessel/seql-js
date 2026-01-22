# Semantic Model

Anchor-Path-Target structure explained.

## Three-Part Model

### 1. Anchor (Root)

Stable semantic starting point.

**Purpose**: Provide context that's unlikely to change.

**Examples**:

- `<form>` - Forms are stable page structures
- `<main>` - Main content area
- `div[role="dialog"]` - Modal dialogs

### 2. Path (Traversal)

Semantic journey from anchor to target's parent.

**Purpose**: Capture meaningful intermediate steps.

**Filtering**: Skip non-semantic `<div>` and `<span>` wrappers.

**Examples**:

- `div.fields` - Semantic container
- `ul.menu > li` - List structure
- `section[aria-label="Products"]` - Labeled section

### 3. Target (Destination)

The element being identified.

**Purpose**: Uniquely identify the specific element.

**Features**:

- Tag name
- Semantic attributes
- Text content
- nth-child (if needed)

## Why This Model?

**Stability**: Anchors rarely change, targets have clear identity.

**Context**: Path provides enough context without brittleness.

**Balance**: Not too general (just target), not too specific (full XPath).

## Example Breakdown

```html
<form aria-label="Login">
  <div class="wrapper">
    <div>
      <!-- Non-semantic, skipped -->
      <div class="fields">
        <input type="email" name="email" />
      </div>
    </div>
  </div>
</form>
```

**EID Structure**:

```
Anchor: form[aria-label="Login"]
Path:   div.fields
Target: input[type="email",name="email"]
```

**Reasoning**:

- Anchor: `<form>` is stable semantic container
- Path: `div.fields` has semantic value, `div.wrapper` and anonymous `div` skipped
- Target: Input has clear identity via type and name
