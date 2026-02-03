import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { applyJsdomExtended } from '@whenessel/jsdom-extended';
import { generateEID } from '../../src/generator';
import { resolve } from '../../src/resolver';

describe('Path-Only URL Matching (Cross-Origin rrweb Replay)', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    // Simulate localhost iframe serving content
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:63342/fixtures/modern-seaside-stay.htm',
    });
    document = dom.window.document;
    applyJsdomExtended(dom.window);
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  it('should match path-only when matchUrlsByPathOnly is enabled (default behavior)', () => {
    // Setup: Relative URL during generation
    const body = document.body;
    body.innerHTML = '<a href="/modern-seaside-stay/booking">Book Your Stay</a>';
    const linkElement = body.querySelector('a')!;

    // Generate EID with relative URL
    const eid = generateEID(linkElement);
    expect(eid.target.semantics.attributes?.href).toBe('/modern-seaside-stay/booking');

    // Simulate rrweb: convert to absolute cross-origin URL
    body.innerHTML =
      '<a href="https://appsurify.github.io/modern-seaside-stay/booking">Book Your Stay</a>';

    // STRICT MODE (matchUrlsByPathOnly: false): Should fail (cross-origin mismatch)
    const resultStrict = resolve(eid, document, { matchUrlsByPathOnly: false });
    expect(resultStrict.status).not.toBe('success');

    // DEFAULT MODE (matchUrlsByPathOnly: true): Should succeed (pathname matches)
    const resultDefault = resolve(eid, document); // Uses default: true
    expect(resultDefault.status).toBe('success');
    expect(resultDefault.elements).toHaveLength(1);
    expect(resultDefault.elements[0]?.tagName.toLowerCase()).toBe('a');
    expect(resultDefault.elements[0]?.textContent).toBe('Book Your Stay');

    // EXPLICIT PATH-ONLY MODE: Should also succeed
    const resultPathOnly = resolve(eid, document, { matchUrlsByPathOnly: true });
    expect(resultPathOnly.status).toBe('success');
  });

  it('should match paths regardless of origin when matchUrlsByPathOnly is true', () => {
    const body = document.body;

    // Generate EID with one origin
    body.innerHTML = '<a href="https://example.com/booking">Book</a>';
    const link1 = body.querySelector('a')!;
    const eid = generateEID(link1);

    // Resolve with different origin but same path
    body.innerHTML = '<a href="https://different-origin.com/booking">Book</a>';

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).toBe('success');
    expect(result.elements[0]?.getAttribute('href')).toBe('https://different-origin.com/booking');
  });

  it('should still fail if pathname does not match', () => {
    const body = document.body;
    body.innerHTML = '<a href="/booking">Book</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Different path
    body.innerHTML = '<a href="https://example.com/checkout">Book</a>';

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).not.toBe('success');
  });

  it('should disambiguate multiple links with same text by path', () => {
    const body = document.body;

    body.innerHTML = `
      <nav>
        <a href="/booking">Book</a>
        <a href="/checkout">Book</a>
        <a href="/reserve">Book</a>
      </nav>
    `;

    const checkoutLink = body.querySelector('a[href="/checkout"]')!;
    const eid = generateEID(checkoutLink);

    // All links now have different origins but same paths
    body.innerHTML = `
      <nav>
        <a href="https://example.com/booking">Book</a>
        <a href="https://production.com/checkout">Book</a>
        <a href="https://external.com/reserve">Book</a>
      </nav>
    `;

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).toBe('success');
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]!.getAttribute('href')).toContain('/checkout');
  });

  it('should handle special protocols correctly in path-only mode', () => {
    const body = document.body;

    // Test javascript: URL
    body.innerHTML = '<a href="javascript:void(0)">Close</a>';
    const link1 = body.querySelector('a')!;
    const eid1 = generateEID(link1);

    const result1 = resolve(eid1, document, { matchUrlsByPathOnly: true });
    expect(result1.status).toBe('success');

    // Test mailto: URL
    body.innerHTML = '<a href="mailto:user@example.com">Email</a>';
    const link2 = body.querySelector('a')!;
    const eid2 = generateEID(link2);

    const result2 = resolve(eid2, document, { matchUrlsByPathOnly: true });
    expect(result2.status).toBe('success');
  });

  it('should preserve search and hash in path-only matching', () => {
    const body = document.body;

    body.innerHTML = '<a href="/booking?id=123#section">Book</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Convert to absolute URL with same path, search, and hash
    body.innerHTML = '<a href="https://example.com/booking?id=123#section">Book</a>';

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).toBe('success');
    expect(result.elements).toHaveLength(1);
  });

  it('should match even if query params differ (query params are stripped by cleanAttributeValue)', () => {
    const body = document.body;

    body.innerHTML = '<a href="/booking?id=123">Book</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Different query parameter - but query params are stripped before comparison
    body.innerHTML = '<a href="https://example.com/booking?id=456">Book</a>';

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    // Should succeed because query parameters are stripped by cleanAttributeValue
    // before path comparison happens
    expect(result.status).toBe('success');
  });

  it('should work with different CDN origins for same resource', () => {
    const body = document.body;

    // Simulate: Generate EID when link points to CDN A
    body.innerHTML = '<a href="https://cdn-a.example.com/downloads/file.pdf">Download</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Verify EID stores the absolute cross-origin URL
    expect(eid.target.semantics.attributes?.href).toBe(
      'https://cdn-a.example.com/downloads/file.pdf'
    );

    // Simulate rrweb replay: same resource but served from CDN B
    body.innerHTML = '<a href="https://cdn-b.example.com/downloads/file.pdf">Download</a>';

    // DEFAULT MODE: Should fail because origins differ
    const resultDefault = resolve(eid, document, { matchUrlsByPathOnly: false });
    expect(resultDefault.status).not.toBe('success');

    // PATH-ONLY MODE: Should succeed because pathnames match (/downloads/file.pdf)
    const resultPathOnly = resolve(eid, document, { matchUrlsByPathOnly: true });
    expect(resultPathOnly.status).toBe('success');
    expect(resultPathOnly.elements[0]?.tagName.toLowerCase()).toBe('a');
    expect(resultPathOnly.elements[0]?.textContent).toBe('Download');
  });

  it('should handle root path correctly', () => {
    const body = document.body;

    body.innerHTML = '<a href="/">Home</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Convert to absolute URL with root path
    body.innerHTML = '<a href="https://example.com/">Home</a>';

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).toBe('success');
    expect(result.elements).toHaveLength(1);
  });

  it('should handle protocol-relative URLs', () => {
    const body = document.body;

    body.innerHTML = '<a href="//cdn.example.com/resource">Resource</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Should match itself
    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).toBe('success');
  });

  it('should not create false positives with similar paths', () => {
    const body = document.body;

    body.innerHTML = '<a href="/booking">Book</a>';
    const link = body.querySelector('a')!;
    const eid = generateEID(link);

    // Different path that contains the original path as substring
    body.innerHTML = '<a href="https://example.com/booking-confirmation">Book</a>';

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    // Should NOT match - paths are different
    expect(result.status).not.toBe('success');
  });

  it('should work in nested structures with multiple links', () => {
    const body = document.body;

    body.innerHTML = `
      <section id="hero">
        <div class="links">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/booking">Book</a>
        </div>
      </section>
    `;

    const bookingLink = body.querySelector('a[href="/booking"]')!;
    const eid = generateEID(bookingLink);

    // Convert all to absolute URLs with different origins
    body.innerHTML = `
      <section id="hero">
        <div class="links">
          <a href="https://example.com/about">About</a>
          <a href="https://example.com/contact">Contact</a>
          <a href="https://example.com/booking">Book</a>
        </div>
      </section>
    `;

    const result = resolve(eid, document, { matchUrlsByPathOnly: true });

    expect(result.status).toBe('success');
    expect(result.elements).toHaveLength(1);
    expect(result.elements[0]!.getAttribute('href')).toContain('/booking');
  });
});
