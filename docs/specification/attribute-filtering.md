# Attribute Filtering (v1.4.0)

Separating state attributes from identity attributes for stable element identification.

## Principle

Element **identity** ≠ Element **state**

An element's identity (what it is) should not change when its state (how it appears) changes.

## Stable Attributes (Identity)

✅ **Preserved** - Define what the element is:

**Semantic Attributes:**

- `type`, `name`, `value` (for inputs)
- `href`, `src`, `action`
- `role`, `aria-label`, `aria-labelledby`, `aria-describedby`
- `for`, `form`, `placeholder`

**Test/Debug Markers:**

- `data-testid`, `data-test`, `data-qa`
- `data-cy` (Cypress)
- `data-test-*` patterns

**Stable IDs:**

- User-defined IDs
- Non-generated IDs

## State Attributes (Filtered Out)

❌ **Excluded** - Describe current state:

**ARIA State:**

- `aria-selected`, `aria-checked`, `aria-pressed`
- `aria-expanded`, `aria-hidden`, `aria-current`
- `aria-disabled`, `aria-busy`, `aria-invalid`

**Data State:**

- `data-state`, `data-active`, `data-open`
- `data-selected`, `data-expanded`, `data-orientation`

**HTML State:**

- `disabled`, `readonly`, `checked`
- `hidden`, `open`

**Library-Generated:**

- `data-radix-*`, `data-headlessui-*`, `data-reach-*`
- `data-mui-*`, `data-chakra-*`

## Example

```html
<!-- Same element in different states -->
<button aria-label="Menu" aria-expanded="false" data-state="closed">Menu</button>

<button aria-label="Menu" aria-expanded="true" data-state="open">Menu</button>
```

Both generate **same EID**:

```json
{
  "target": {
    "tag": "button",
    "semantics": {
      "attributes": { "aria-label": "Menu" },
      "text": "Menu"
    }
  }
}
```

## Analytics & Tracking Attributes (v1.4.0)

### Overview

❌ **Excluded** - Third-party analytics, tracking, and experimentation attributes

These attributes are used by analytics platforms, session recording tools, A/B testing frameworks, and advertising pixels. They change based on marketing campaigns and tracking configuration, not element identity.

### Filtered Patterns

#### Google Analytics / GTM

- `data-ga*`, `data-gtm*`, `data-google-*`
- `data-layer*`, `data-event*`
- `data-category`, `data-action`, `data-label`, `data-value`

**Rationale**: GA attributes change per campaign, environment, and tracking requirements.

#### Yandex Metrica

- `data-yandex*`, `data-ym*`, `data-metrika*`

**Rationale**: Russian analytics platform with dynamic tracking attributes.

#### Session Recording

- **Hotjar**: `data-hj*`, `data-hotjar*`
- **FullStory**: `data-fs*`
- **Mouseflow**: `data-mouseflow*`, `data-mf*`
- **Smartlook**: `data-smartlook*`, `data-sl*`

**Rationale**: Session replay tools inject tracking attributes for heatmaps and recordings.

#### A/B Testing

- **Optimizely**: `data-optimizely*`
- **VWO**: `data-vwo*`
- **Google Optimize**: `data-optimize*`

**Rationale**: Experiment variations change frequently and are environment-specific.

#### Social / Ad Pixels

- **Facebook**: `data-fb*`, `data-facebook*`
- **TikTok**: `data-tt*`
- **LinkedIn**: `data-li*`

**Rationale**: Advertising pixels track conversions, not element identity.

#### Generic Tracking

- `data-track*`, `data-tracking*`
- `data-click*`, `data-impression*`
- `data-conversion*`, `data-segment*`
- `data-analytics*`

**Rationale**: Custom tracking implementations vary by marketing needs.

### Important Edge Cases

#### Analytics `-id` Suffix Conflict

**Problem**: Some analytics attributes end with `-id` (e.g., `data-tracking-id`, `data-analytics-id`), which might suggest they're stable identifiers.

**Decision**: Analytics prefix matching takes **precedence** over the `-id` suffix rule. These attributes are **blocked**.

**Examples**:

- ❌ `data-tracking-id="track-123"` → BLOCKED (analytics)
- ❌ `data-analytics-id="ga-456"` → BLOCKED (analytics)
- ❌ `data-event-id="evt-789"` → BLOCKED (analytics)
- ✅ `data-product-id="12345"` → ALLOWED (semantic ID)
- ✅ `data-user-id="abc"` → ALLOWED (semantic ID)

#### Test Attributes Protected

Test and QA attributes are **always allowed** regardless of name similarity:

- ✅ `data-testid`, `data-test`, `data-qa`, `data-cy` → ALLOWED (whitelisted)

#### Semantic Conflicts

Some analytics attributes have semantic-sounding names:

- ❌ `data-category` → BLOCKED (GA category, use `data-product-category` instead)
- ❌ `data-label` → BLOCKED (GA label, use `aria-label` or semantic HTML)
- ❌ `data-value` → BLOCKED (GA value, use `data-amount`, `data-price`, etc.)

### Migration Guide

If your application uses `data-tracking-id` or `data-analytics-id` for semantic identification:

**Before:**

```html
<button data-tracking-id="user-submit-btn">Submit</button>
```

**After (use semantic naming):**

```html
<button data-component-id="user-submit-btn">Submit</button>
<!-- or -->
<button data-entity-id="user-submit-btn">Submit</button>
<!-- or -->
<button data-testid="user-submit-btn">Submit</button>
```

### Benefits

- ✅ Stable EIDs across marketing campaigns
- ✅ Consistent identification across dev/staging/prod
- ✅ No false mismatches due to analytics changes
- ✅ Smaller EID payloads (fewer attributes)
- ✅ Better privacy (no tracking data in EIDs)

## Benefits

- ✅ Stable across state changes (open/closed, active/inactive)
- ✅ Resilient to framework state management
- ✅ Consistent identification for analytics
- ✅ Better matching across sessions
- ✅ No instability from third-party tracking tools
