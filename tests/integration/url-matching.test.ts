import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { applyJsdomExtended } from '@whenessel/jsdom-extended';
import { generateEID } from '../../src/generator';
import { resolve } from '../../src/resolver';

describe('URL Matching Integration Tests', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.com',
    });
    document = dom.window.document;
    applyJsdomExtended(dom.window);
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  describe('Relative URL during generation, Absolute URL during resolution', () => {
    it('should match when EID has relative href and DOM has absolute href', () => {
      // Generation scenario: relative URL
      const body = document.body;
      body.innerHTML = '<a href="/booking">Book Your Stay</a>';
      const linkElement = body.querySelector('a')!;

      // Generate EID with relative URL
      const eid = generateEID(linkElement);
      expect(eid.target.semantics.attributes?.href).toBe('/booking');

      // Resolution scenario: absolute URL (rrweb iframe replay)
      body.innerHTML = '<a href="https://example.com/booking">Book Your Stay</a>';

      // Resolve should find the element despite URL format difference
      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
      expect(result.elements[0]).toBeTruthy();
      expect(result.elements[0]?.getAttribute('href')).toBe('https://example.com/booking');
    });

    it('should match with query parameters removed by cleanAttributeValue', () => {
      // Generation: relative URL with query params (will be cleaned)
      const body = document.body;
      body.innerHTML = '<a href="/booking?session=123">Book</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);
      // cleanAttributeValue removes query params from relative URLs
      expect(eid.target.semantics.attributes?.href).toBe('/booking');

      // Resolution: absolute URL with different query params
      body.innerHTML = '<a href="https://example.com/booking?session=456">Book</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
      expect(result.elements[0]).toBeTruthy();
    });

    it('should match with hash preserved', () => {
      // Generation: relative URL with hash
      const body = document.body;
      body.innerHTML = '<a href="/booking#section">Book</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);
      expect(eid.target.semantics.attributes?.href).toBe('/booking#section');

      // Resolution: absolute URL with same hash
      body.innerHTML = '<a href="https://example.com/booking#section">Book</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });
  });

  describe('Absolute URL during generation, Relative URL during resolution', () => {
    it('should match when EID has absolute href and DOM has relative href', () => {
      // Generation: absolute same-origin URL
      const body = document.body;
      body.innerHTML = '<a href="https://example.com/apartments">Apartments</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);
      expect(eid.target.semantics.attributes?.href).toBe('https://example.com/apartments');

      // Resolution: relative URL
      body.innerHTML = '<a href="/apartments">Apartments</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
      expect(result.elements[0]?.getAttribute('href')).toBe('/apartments');
    });
  });

  describe('Cross-origin URL preservation', () => {
    it('should match cross-origin URLs exactly', () => {
      // Generation: cross-origin URL
      const body = document.body;
      body.innerHTML = '<a href="https://external.com/api">External API</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);
      expect(eid.target.semantics.attributes?.href).toBe('https://external.com/api');

      // Resolution: same cross-origin URL
      body.innerHTML = '<a href="https://external.com/api">External API</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });

    it('should NOT match cross-origin URL with relative URL', () => {
      // Generation: cross-origin URL
      const body = document.body;
      body.innerHTML = '<a href="https://external.com/api">API</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);

      // Resolution: relative URL (different semantic - local API vs external API)
      body.innerHTML = '<a href="/api">API</a>';

      const result = resolve(eid, document);
      // Should fail - cross-origin link is semantically different from local link
      expect(result.status === 'success').toBe(false);
    });

    it('should NOT match different cross-origin URLs', () => {
      // Generation: one external domain
      const body = document.body;
      body.innerHTML = '<a href="https://external1.com/api">API</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);

      // Resolution: different external domain
      body.innerHTML = '<a href="https://external2.com/api">API</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(false);
    });
  });

  describe('rrweb iframe replay scenario', () => {
    it('should resolve EID generated during recording in iframe replay', () => {
      // Simulates real rrweb scenario
      // Recording: page at https://appsurify.github.io with relative links
      // Create a specific JSDOM instance for this test with the correct origin
      const testDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'https://appsurify.github.io',
      });
      applyJsdomExtended(testDom.window);
      const testDocument = testDom.window.document;
      const testBody = testDocument.body;

      testBody.innerHTML = `
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/modern-seaside-stay/booking">Book Your Stay</a>
            <a href="/apartments">Apartments</a>
          </nav>
        </header>
      `;

      // Set global window temporarily for URL normalization
      const originalWindow = global.window;
      global.window = testDom.window as unknown as Window & typeof globalThis;

      const bookingLink = testBody.querySelector('a[href="/modern-seaside-stay/booking"]')!;
      const eid = generateEID(bookingLink);

      // Replay: rrweb converts relative URLs to absolute in iframe
      testBody.innerHTML = `
        <header>
          <nav>
            <a href="https://appsurify.github.io/">Home</a>
            <a href="https://appsurify.github.io/modern-seaside-stay/booking">Book Your Stay</a>
            <a href="https://appsurify.github.io/apartments">Apartments</a>
          </nav>
        </header>
      `;

      const result = resolve(eid, testDocument);

      // Restore original window
      global.window = originalWindow;

      expect(result.status === 'success').toBe(true);
      expect(result.elements[0]?.textContent).toBe('Book Your Stay');
    });
  });

  describe('Special protocols', () => {
    it('should match javascript: URLs exactly', () => {
      const body = document.body;
      body.innerHTML = '<a href="javascript:void(0)">Close</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);

      body.innerHTML = '<a href="javascript:void(0)">Close</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });

    it('should match mailto: URLs exactly', () => {
      const body = document.body;
      body.innerHTML = '<a href="mailto:user@example.com">Email</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);

      body.innerHTML = '<a href="mailto:user@example.com">Email</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });

    it('should match tel: URLs exactly', () => {
      const body = document.body;
      body.innerHTML = '<a href="tel:+1234567890">Call</a>';
      const linkElement = body.querySelector('a')!;

      const eid = generateEID(linkElement);

      body.innerHTML = '<a href="tel:+1234567890">Call</a>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });
  });

  describe('Complex scenarios', () => {
    it('should match in navigation with mixed URL formats', () => {
      const body = document.body;
      body.innerHTML = `
        <nav>
          <a href="/home">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      `;

      const contactLink = body.querySelector('a[href="/contact"]')!;
      const eid = generateEID(contactLink);

      // Change all links to absolute URLs
      body.innerHTML = `
        <nav>
          <a href="https://example.com/home">Home</a>
          <a href="https://example.com/about">About</a>
          <a href="https://example.com/contact">Contact</a>
        </nav>
      `;

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
      expect(result.elements[0]?.textContent).toBe('Contact');
    });

    it('should handle src attribute on images', () => {
      const body = document.body;
      body.innerHTML = '<img src="/images/logo.png" alt="Logo" />';
      const imgElement = body.querySelector('img')!;

      const eid = generateEID(imgElement);

      body.innerHTML = '<img src="https://example.com/images/logo.png" alt="Logo" />';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });

    it('should handle src attribute on scripts', () => {
      const body = document.body;
      body.innerHTML = '<script src="/js/app.js"></script>';
      const scriptElement = body.querySelector('script')!;

      const eid = generateEID(scriptElement);

      body.innerHTML = '<script src="https://example.com/js/app.js"></script>';

      const result = resolve(eid, document);
      expect(result.status === 'success').toBe(true);
    });
  });

  describe('Non-URL attributes (regression tests)', () => {
    it('should still match non-URL attributes exactly', () => {
      const body = document.body;
      body.innerHTML = '<button data-testid="submit-btn" type="button">Submit</button>';
      const buttonElement = body.querySelector('button')!;

      const eid = generateEID(buttonElement);

      // Same attributes
      body.innerHTML = '<button data-testid="submit-btn" type="button">Submit</button>';

      const result1 = resolve(eid, document);
      expect(result1.status === 'success').toBe(true);

      // Different data-testid - should not match
      body.innerHTML = '<button data-testid="cancel-btn" type="button">Submit</button>';

      const result2 = resolve(eid, document);
      expect(result2.status === 'success').toBe(false);
    });
  });

  describe('Iframe URL Resolution (Bug Fix - documentUrl parameter)', () => {
    it('should resolve element with relative href in iframe after rrweb converts to absolute', () => {
      // Create an iframe with correct document context
      const iframeDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'https://appsurify.github.io/modern-seaside-stay/',
      });
      applyJsdomExtended(iframeDom.window);
      const iframeDoc = iframeDom.window.document;

      iframeDoc.body.innerHTML = `
        <section id="hero">
          <a href="/modern-seaside-stay/booking">Book Your Stay</a>
          <a href="/apartments">View Apartments</a>
        </section>
      `;

      const bookingLink = iframeDoc.querySelector('a[href="/modern-seaside-stay/booking"]')!;

      // Set global window to iframe's window for generation
      const originalWindow = global.window;
      global.window = iframeDom.window as unknown as Window & typeof globalThis;

      // Generate EID from relative URL
      const eid = generateEID(bookingLink, { root: iframeDoc });

      // Simulate rrweb: convert relative URLs to absolute
      iframeDoc.body.innerHTML = `
        <section id="hero">
          <a href="https://appsurify.github.io/modern-seaside-stay/booking">Book Your Stay</a>
          <a href="https://appsurify.github.io/apartments">View Apartments</a>
        </section>
      `;

      // Resolve with iframe's document (passes correct window.location context)
      const result = resolve(eid, iframeDoc, { root: iframeDoc });

      // Restore original window
      global.window = originalWindow;

      // CRITICAL: Must return <a>, NOT <section>
      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]!.tagName.toLowerCase()).toBe('a');
      expect(result.elements[0]!.textContent).toBe('Book Your Stay');
      expect(result.elements[0]!.getAttribute('href')).toContain('booking');
    });

    it('should verify href mismatch behavior in iframe context', () => {
      const iframeDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'https://appsurify.github.io/modern-seaside-stay/',
      });
      applyJsdomExtended(iframeDom.window);
      const iframeDoc = iframeDom.window.document;

      iframeDoc.body.innerHTML = `
        <section id="hero">
          <a href="/modern-seaside-stay/booking">Book Your Stay</a>
        </section>
      `;

      const bookingLink = iframeDoc.querySelector('a')!;

      const originalWindow = global.window;
      global.window = iframeDom.window as unknown as Window & typeof globalThis;

      const eid = generateEID(bookingLink, { root: iframeDoc });

      // Simulate rrweb but with DIFFERENT href
      iframeDoc.body.innerHTML = `
        <section id="hero">
          <a href="https://appsurify.github.io/different-path">Book Your Stay</a>
        </section>
      `;

      const result = resolve(eid, iframeDoc, { root: iframeDoc });

      global.window = originalWindow;

      // When href doesn't match, Phase 2 semantic filtering should fail
      // The bug was that wrong document context caused CORRECT hrefs to fail
      // This test verifies that with correct context, different hrefs properly fail
      // Result may be degraded-fallback (returns section) or error (no match)
      // The key is that with CORRECT documentUrl, semantic matching works properly
      expect(result.status).not.toBe('success'); // Should not be exact success with mismatched href
    });

    it('should disambiguate links with same text but different hrefs after rrweb URL conversion', () => {
      const iframeDom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'https://example.com',
      });
      applyJsdomExtended(iframeDom.window);
      const iframeDoc = iframeDom.window.document;
      const body = iframeDoc.body;

      body.innerHTML = `
        <nav>
          <a href="/booking">Book</a>
          <a href="/checkout">Book</a>
          <a href="/reserve">Book</a>
        </nav>
      `;

      const checkoutLink = body.querySelector('a[href="/checkout"]')!;

      const originalWindow = global.window;
      global.window = iframeDom.window as unknown as Window & typeof globalThis;

      const eid = generateEID(checkoutLink);

      // Simulate rrweb: convert to absolute URLs
      body.innerHTML = `
        <nav>
          <a href="https://example.com/booking">Book</a>
          <a href="https://example.com/checkout">Book</a>
          <a href="https://example.com/reserve">Book</a>
        </nav>
      `;

      const result = resolve(eid, iframeDoc);

      global.window = originalWindow;

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]!.getAttribute('href')).toBe('https://example.com/checkout');
    });

    it('should preserve cross-origin URLs and not match with same-path relative URLs', () => {
      const body = document.body;
      body.innerHTML = '<a href="https://external.com/api/data">External API</a>';
      const externalLink = body.querySelector('a')!;
      const eid = generateEID(externalLink);

      // Change to same path but different origin
      body.innerHTML = '<a href="/api/data">External API</a>';

      const result = resolve(eid, document);

      // Should NOT match - different semantic identity
      expect(result.status).not.toBe('success');
    });
  });
});
