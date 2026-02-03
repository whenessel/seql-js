# rrweb Integration Guide

Using SEQL with session replay.

## Iframe Context and URL Normalization (v1.5.1)

**Important**: When resolving EIDs in iframe contexts (rrweb replay), always pass the iframe's document as the root parameter. This ensures correct URL normalization for href/src attributes.

### Why This Matters

rrweb converts relative URLs to absolute URLs during iframe replay. For example:
- Recording: `<a href="/booking">Book</a>`
- Replay: `<a href="https://example.com/booking">Book</a>`

SEQL's URL normalization must use the **iframe's** `window.location`, not the parent window's location, to correctly match these URLs.

### Correct Usage

```typescript
import { resolve } from 'seql-js';

// ✅ CORRECT: Pass iframe's contentDocument as root
const result = resolve(eid, iframe.contentDocument, {
  root: iframe.contentDocument
});

// ❌ WRONG: Using parent document causes origin mismatch
const result = resolve(eid, document); // Uses parent window.location!
```

### Technical Details

The resolver now extracts the document base URL (`root.defaultView?.location?.href`) and passes it to the semantic matcher for Phase 2 URL normalization. This ensures:
- Same-origin detection uses the correct window context
- Relative URLs normalize against the right base URL
- Cross-origin URLs are properly preserved

## Recording Phase

```typescript
import { generateSEQL } from 'seql-js';
import { record } from 'rrweb';

record({
  emit(event) {
    // Add SEQL selector to click events
    if (event.type === 'IncrementalSnapshot' && event.data.source === 'MouseInteraction') {
      const target = event.data.id; // rrweb node ID
      const element = getElementById(target); // Convert to DOM element

      if (element) {
        event.data.seqlSelector = generateSEQL(element);
      }
    }

    // Send to backend
    sendToBackend(event);
  },
});
```

## Replay Phase

```typescript
import { resolveSEQL } from 'seql-js';
import { Replayer } from 'rrweb';

const replayer = new Replayer(events);

// Highlight clicked elements
events.forEach((event) => {
  if (event.data?.seqlSelector) {
    const elements = resolveSEQL(event.data.seqlSelector, replayer.iframe.contentDocument);

    if (elements.length > 0) {
      elements[0].classList.add('rrweb-highlight');
    }
  }
});
```

## Analytics Correlation

```typescript
// During recording, send both rrweb and SEQL data
const selector = generateSEQL(element);

analytics.track('click', {
  seql_selector: selector,
  rrweb_session_id: sessionId,
});

// Later, correlate rrweb sessions with analytics data
```

## URL Handling in rrweb Replay (v1.5.1+)

### The Problem

During rrweb replay in an iframe, **relative URLs are converted to absolute URLs** by rrweb's serialization process. This can cause EID resolution to fail if the EID was generated with a relative URL but the replayed DOM contains an absolute URL (or vice versa).

**Example:**

- **Recording time**: `<a href="/booking">Book</a>` → EID contains `href: "/booking"`
- **Replay time**: `<a href="https://example.com/booking">Book</a>` (rrweb converts to absolute)
- **Result without URL normalization**: ❌ Element not found

### The Solution

As of v1.5.1, seql-js automatically normalizes URLs during resolution:

- **Same-origin absolute URLs** → converted to relative (e.g., `https://example.com/path` → `/path`)
- **Relative URLs** → kept as-is
- **Cross-origin URLs** → preserved as absolute (semantic difference)

**How it works:**

```typescript
// Recording: EID generated with relative URL
const eid = generateEID(element); // href: "/booking"

// Replay: DOM has absolute URL (rrweb converted it)
const replayDocument = replayer.iframe.contentDocument;
const result = resolve(eid, { root: replayDocument });
// ✅ Success! URL normalization handles the mismatch
```

### Best Practices

1. **Use relative URLs when possible** - they're more stable across environments
2. **Let seql-js handle URL normalization** - no manual intervention needed
3. **Cross-origin links are preserved** - external links remain absolute for semantic accuracy

### Troubleshooting

**Issue**: Element with href not found during replay

**Checklist:**

1. Check if the URL is same-origin or cross-origin
2. Verify that `window.location` is correctly set in the replay iframe
3. Ensure href/src attributes aren't being filtered out by attribute-cleaner

**Debug:**

```typescript
import { normalizeUrlForComparison } from 'seql-js';

// Check URL normalization
const recorded = '/booking';
const replayed = 'https://example.com/booking';
const baseUrl = 'https://example.com';

console.log(normalizeUrlForComparison(recorded, baseUrl)); // "/booking"
console.log(normalizeUrlForComparison(replayed, baseUrl)); // "/booking"
// Both normalize to the same value ✅
```

### Limitations

- URL normalization requires a base URL (from `window.location` or explicit parameter)
- In SSR environments without `window`, absolute URLs are preserved as-is
- Protocol mismatches (`http://` vs `https://`) are treated as different origins
