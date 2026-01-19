import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  generateEIQ,
  stringifyEID,
  type ElementIdentity,
} from '../../src';

describe('EIQ Improvements', () => {
  it('should generate human-readable EIQ for links with ID and href', () => {
    const eid: ElementIdentity = {
      version: '1.0',
      anchor: { tag: 'body', semantics: {}, score: 1, degraded: false },
      path: [],
      target: {
        tag: 'a',
        semantics: {
          id: 'booking-btn-123',
          attributes: {
            href: '/modern-seaside-stay/booking?session=abc',
            'pointer-events-none': 'true', // utility-like attribute
          },
          text: {
            raw: 'Book Your Stay',
            normalized: 'Book Your Stay',
          }
        },
        score: 1,
      },
      constraints: [],
      fallback: { onMultiple: 'best-score', onMissing: 'anchor-only', maxDepth: 10 },
      meta: { confidence: 1, generatedAt: '', generator: '', source: '', degraded: false }
    };

    const eiq = stringifyEID(eid);
    
    // CURRENT BEHAVIOR: v1.0: body :: a#booking-btn-123
    // DESIRED BEHAVIOR: should include href (cleaned) and text, because they are semantic
    expect(eiq).toContain('href="/modern-seaside-stay/booking"');
    expect(eiq).toContain('text="Book Your Stay"');
    // It should still have the ID if present and stable, but not ONLY the ID
    expect(eiq).toContain('id="booking-btn-123"');
  });

  it('should filter out utility classes and keep stable ones in EIQ', () => {
    const eid: ElementIdentity = {
      version: '1.0',
      anchor: { tag: 'body', semantics: {}, score: 1, degraded: false },
      path: [],
      target: {
        tag: 'button',
        semantics: {
          classes: ['btn-primary', 'mt-4', 'flex', 'items-center', 'js-submit-order'],
        },
        score: 1,
      },
      constraints: [],
      fallback: { onMultiple: 'best-score', onMissing: 'anchor-only', maxDepth: 10 },
      meta: { confidence: 1, generatedAt: '', generator: '', source: '', degraded: false }
    };

    const eiq = stringifyEID(eid);
    
    // mt-4, flex, items-center are utility classes and should be filtered
    expect(eiq).toContain('.btn-primary');
    expect(eiq).toContain('.js-submit-order');
    expect(eiq).not.toContain('.mt-4');
    expect(eiq).not.toContain('.flex');
  });

  it('should sort attributes alphabetically for determinism but choose them by priority', () => {
    const eid: ElementIdentity = {
      version: '1.0',
      anchor: { tag: 'body', semantics: {}, score: 1, degraded: false },
      path: [],
      target: {
        tag: 'input',
        semantics: {
          attributes: {
            'z-index': '10', // low priority
            'name': 'email', // high priority
            'data-testid': 'login-email', // very high priority
            'aria-label': 'Email Address', // high priority
          },
        },
        score: 1,
      },
      constraints: [],
      fallback: { onMultiple: 'best-score', onMissing: 'anchor-only', maxDepth: 10 },
      meta: { confidence: 1, generatedAt: '', generator: '', source: '', degraded: false }
    };

    // If maxAttributes is 2, it should pick data-testid and aria-label (highest priority),
    // then sort them alphabetically: aria-label, data-testid
    const eiq = stringifyEID(eid, { maxAttributes: 2 });
    
    expect(eiq).toContain('aria-label="Email Address"');
    expect(eiq).toContain('data-testid="login-email"');
    expect(eiq).not.toContain('name="email"');
    expect(eiq).not.toContain('z-index="10"');
  });
});
