/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateEID } from '../src/generator';
import { resolve } from '../src/resolver';

describe('iframe Integration - Real-World Scenarios', () => {
  let iframe: HTMLIFrameElement;
  let iframeDoc: Document;

  beforeEach(() => {
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframeDoc = iframe.contentDocument!;
  });

  afterEach(() => {
    document.body.removeChild(iframe);
  });

  describe('Google Docs-like iframe editing', () => {
    beforeEach(() => {
      // Simulate Google Docs-like structure
      iframeDoc.body.innerHTML = `
        <div class="docs-editor" role="textbox" aria-label="Document content">
          <div class="docs-line" data-line-id="line-1">
            <span class="docs-text">First paragraph of text</span>
          </div>
          <div class="docs-line" data-line-id="line-2">
            <span class="docs-text">Second paragraph with more content</span>
          </div>
          <div class="docs-line" data-line-id="line-3">
            <span class="docs-text" style="font-weight: bold;">Bold text here</span>
          </div>
        </div>
      `;
    });

    it('should track specific text span across edits', () => {
      const boldSpan = iframeDoc.querySelector('[data-line-id="line-3"] .docs-text')!;
      const eid = generateEID(boldSpan, { root: iframeDoc });

      expect(eid).toBeTruthy();

      // Simulate adding new line before bold text
      const editor = iframeDoc.querySelector('.docs-editor')!;
      const newLine = iframeDoc.createElement('div');
      newLine.className = 'docs-line';
      newLine.setAttribute('data-line-id', 'line-2.5');
      newLine.innerHTML = '<span class="docs-text">Inserted line</span>';
      editor.insertBefore(newLine, boldSpan.parentElement);

      // Should still resolve (may not be perfect in jsdom, but should work)
      const result = resolve(eid!, iframeDoc, { root: iframeDoc });

      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should track editor container with ARIA role', () => {
      const editor = iframeDoc.querySelector('[role="textbox"]')!;
      const eid = generateEID(editor, { root: iframeDoc });

      expect(eid).toBeTruthy();

      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Payment form in iframe (Stripe-like)', () => {
    beforeEach(() => {
      // Simulate Stripe payment form
      iframeDoc.body.innerHTML = `
        <form id="payment-form" class="stripe-form">
          <div class="form-row">
            <label for="card-number">Card Number</label>
            <input
              id="card-number"
              type="text"
              name="cardnumber"
              placeholder="1234 5678 9012 3456"
              autocomplete="cc-number"
            />
          </div>
          <div class="form-row">
            <label for="card-expiry">Expiry Date</label>
            <input
              id="card-expiry"
              type="text"
              name="exp-date"
              placeholder="MM / YY"
              autocomplete="cc-exp"
            />
          </div>
          <div class="form-row">
            <label for="card-cvc">CVC</label>
            <input
              id="card-cvc"
              type="text"
              name="cvc"
              placeholder="123"
              autocomplete="cc-csc"
            />
          </div>
          <button type="submit" class="pay-button">Pay $99.99</button>
        </form>
      `;
    });

    it('should identify card number input by autocomplete attribute', () => {
      const cardInput = iframeDoc.getElementById('card-number')!;
      const eid = generateEID(cardInput, { root: iframeDoc });

      expect(eid).toBeTruthy();

      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle all payment inputs independently', () => {
      const inputs = iframeDoc.querySelectorAll('input');
      const eids = Array.from(inputs).map((input) => generateEID(input, { root: iframeDoc }));

      expect(eids.every((eid) => eid !== null)).toBe(true);

      // Each should resolve
      eids.forEach((eid) => {
        const result = resolve(eid!, iframeDoc, { root: iframeDoc });
        expect(result.elements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should track submit button with dynamic amount', () => {
      const button = iframeDoc.querySelector('.pay-button')!;
      const eid = generateEID(button, { root: iframeDoc });

      expect(eid).toBeTruthy();

      // Simulate price update
      button.textContent = 'Pay $149.99';

      // Should still resolve (text is semantic but not primary identifier)
      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Analytics tracking across iframe boundary', () => {
    beforeEach(() => {
      // Simulate embedded content with tracking attributes
      iframeDoc.body.innerHTML = `
        <div id="widget" data-widget-id="abc123">
          <header>
            <h2>Newsletter Signup</h2>
          </header>
          <form data-track="signup-form">
            <input
              type="email"
              placeholder="Enter your email"
              data-track="email-input"
            />
            <button
              type="submit"
              data-track="submit-button"
            >
              Subscribe
            </button>
          </form>
          <footer>
            <a href="/privacy" data-track="privacy-link">Privacy Policy</a>
          </footer>
        </div>
      `;
    });

    it('should generate stable EIDs for tracked elements', () => {
      const emailInput = iframeDoc.querySelector('[data-track="email-input"]')!;
      const submitButton = iframeDoc.querySelector('[data-track="submit-button"]')!;
      const privacyLink = iframeDoc.querySelector('[data-track="privacy-link"]')!;

      const eids = [
        generateEID(emailInput, { root: iframeDoc }),
        generateEID(submitButton, { root: iframeDoc }),
        generateEID(privacyLink, { root: iframeDoc }),
      ];

      expect(eids.every((eid) => eid !== null)).toBe(true);

      // All should have different identities
      const serialized = eids.map((eid) => JSON.stringify(eid));
      expect(new Set(serialized).size).toBe(3);
    });

    it('should maintain tracking across widget updates', () => {
      const submitButton = iframeDoc.querySelector('[data-track="submit-button"]')!;
      const eid = generateEID(submitButton, { root: iframeDoc });

      // Simulate widget state change (add loading spinner)
      const form = iframeDoc.querySelector('form')!;
      const spinner = iframeDoc.createElement('div');
      spinner.className = 'spinner';
      form.insertBefore(spinner, submitButton);

      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle widget container with data attributes', () => {
      const widget = iframeDoc.getElementById('widget')!;
      const eid = generateEID(widget, { root: iframeDoc });

      expect(eid).toBeTruthy();

      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cross-origin iframe simulation', () => {
    it('should handle same-origin iframe gracefully', () => {
      // This is same-origin (both in jsdom)
      iframeDoc.body.innerHTML = '<div id="test">Test Content</div>';

      const div = iframeDoc.getElementById('test')!;
      const eid = generateEID(div, { root: iframeDoc });

      expect(eid).toBeTruthy();

      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements).toHaveLength(1);
    });

    it('should detect when element is from different document', () => {
      // Create element in main doc
      const mainDiv = document.createElement('div');
      mainDiv.id = 'main-div';
      document.body.appendChild(mainDiv);

      // Try to generate with iframe document root
      const eid = generateEID(mainDiv, { root: iframeDoc });

      // Should fail validation
      expect(eid).toBeNull();

      document.body.removeChild(mainDiv);
    });
  });

  describe('Shadow DOM inside iframe', () => {
    it('should handle shadow DOM within iframe content', () => {
      // Create custom element with shadow DOM inside iframe
      iframeDoc.body.innerHTML = '<div id="shadow-host"></div>';

      const host = iframeDoc.getElementById('shadow-host')!;
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `
        <style>button { color: blue; }</style>
        <button id="shadow-button">Shadow Button</button>
      `;

      const shadowButton = shadow.getElementById('shadow-button')!;

      // Shadow DOM element should still have ownerDocument pointing to iframe doc
      expect(shadowButton.ownerDocument).toBe(iframeDoc);

      const eid = generateEID(shadowButton, { root: iframeDoc });

      expect(eid).toBeTruthy();
      expect(eid?.target.tag).toBe('button');
    });
  });

  describe('Performance with large iframe content', () => {
    it('should handle iframe with many elements efficiently', () => {
      // Generate large DOM structure
      const rows: string[] = [];
      for (let i = 0; i < 100; i++) {
        rows.push(`
          <div class="row" data-row="${i}">
            <span class="cell">${i * 2}</span>
            <span class="cell">${i * 2 + 1}</span>
          </div>
        `);
      }
      iframeDoc.body.innerHTML = `<div class="table">${rows.join('')}</div>`;

      // Find specific row
      const targetRow = iframeDoc.querySelector('[data-row="50"]')!;

      const startTime = performance.now();
      const eid = generateEID(targetRow, { root: iframeDoc });
      const generateTime = performance.now() - startTime;

      expect(eid).toBeTruthy();
      expect(generateTime).toBeLessThan(100); // Should be fast

      const resolveStart = performance.now();
      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      const resolveTime = performance.now() - resolveStart;

      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(targetRow);
      expect(resolveTime).toBeLessThan(100); // Should be fast
    });
  });
});
