# rrweb Integration Guide

Using SEQL with session replay.

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
