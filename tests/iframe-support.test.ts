/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateEID } from '../src/generator';
import { resolve } from '../src/resolver';
import { generateEIDBatch } from '../src/utils';
import { getOwnerDocument, validateDocumentContext } from '../src/utils/document-context';

describe('iframe Support', () => {
  let iframe: HTMLIFrameElement;
  let iframeDoc: Document;

  beforeEach(() => {
    // Create and mount iframe
    iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframeDoc = iframe.contentDocument!;

    // Setup basic iframe content
    iframeDoc.body.innerHTML = `
      <div id="iframe-root">
        <form id="test-form">
          <label for="username">Username</label>
          <input id="username" type="text" name="username" />
          <label for="password">Password</label>
          <input id="password" type="password" name="password" />
          <button type="submit">Login</button>
        </form>
        <nav aria-label="Main Navigation">
          <a href="/home">Home</a>
          <a href="/about">About</a>
        </nav>
      </div>
    `;
  });

  afterEach(() => {
    document.body.removeChild(iframe);
  });

  describe('Generation in iframe', () => {
    it('should generate EID for iframe element with contentDocument root', () => {
      const input = iframeDoc.getElementById('username')!;
      expect(input).toBeTruthy();

      const eid = generateEID(input, { root: iframeDoc });

      expect(eid).toBeTruthy();
      expect(eid?.target.tag).toBe('input');
      // Note: jsdom may not fully support all attributes in iframes, so we check tag only
    });

    it('should generate EID without explicit root using ownerDocument', () => {
      const button = iframeDoc.querySelector('button')!;

      const eid = generateEID(button);

      expect(eid).toBeTruthy();
      expect(eid?.target.tag).toBe('button');
    });

    it('should reject cross-document generation (iframe element + main doc root)', () => {
      const iframeInput = iframeDoc.getElementById('username')!;

      // Try to generate with wrong document root
      const eid = generateEID(iframeInput, { root: document });

      expect(eid).toBeNull();
    });

    it('should handle anchor finding within iframe', () => {
      const input = iframeDoc.getElementById('password')!;

      const eid = generateEID(input, { root: iframeDoc });

      expect(eid).toBeTruthy();
      expect(eid?.anchor.tag).toBe('form');
    });
  });

  describe('Resolution in iframe', () => {
    it('should resolve EID in iframe with correct contentDocument', () => {
      const originalInput = iframeDoc.getElementById('username')!;
      const eid = generateEID(originalInput, { root: iframeDoc })!;

      expect(eid).toBeTruthy();

      const result = resolve(eid, iframeDoc, { root: iframeDoc });

      expect(result.elements.length).toBeGreaterThanOrEqual(1);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should fail resolution with wrong document root', () => {
      const iframeInput = iframeDoc.getElementById('username')!;
      const eid = generateEID(iframeInput, { root: iframeDoc })!;

      // Try to resolve in main document
      const result = resolve(eid, document, { root: document });

      expect(result.elements).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle resolution when iframe body is root', () => {
      const form = iframeDoc.getElementById('test-form')!;
      const eid = generateEID(form, { root: iframeDoc.body })!;

      const result = resolve(eid, iframeDoc.body, { root: iframeDoc.body });

      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Batch operations in iframe', () => {
    it('should generate batch for iframe elements', () => {
      const result = generateEIDBatch({
        root: iframeDoc.body,
        filter: 'input',
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.stats.successful).toBeGreaterThan(0);
      expect(result.stats.failed).toBe(0);
    });

    it('should auto-detect document from first element', () => {
      const inputs = Array.from(iframeDoc.querySelectorAll('input'));

      // Don't pass root - should auto-detect from elements
      const eids = inputs.map((el) => generateEID(el)).filter(Boolean);

      expect(eids.length).toBeGreaterThan(0);
      eids.forEach((eid) => {
        expect(eid).toBeTruthy();
      });
    });

    it('should throw error when mixing elements from different documents', () => {
      const mainInput = document.createElement('input');
      document.body.appendChild(mainInput);

      const iframeInput = iframeDoc.getElementById('username')!;

      // Manually test validation (batch generator validates this)
      expect(() => {
        validateDocumentContext(iframeInput, document);
      }).toThrow(/Cross-document operation/);

      document.body.removeChild(mainInput);
    });
  });

  describe('Text matching and fallback behavior', () => {
    it('should resolve target element in iframe even with slight text mismatch', () => {
      // Create nav and button with text
      iframeDoc.body.innerHTML = `
        <nav class="container" id="main-nav">
          <button>  Toggle theme  </button>
        </nav>
      `;

      const nav = iframeDoc.querySelector('nav')!;
      const button = iframeDoc.querySelector('button')!;

      // Generate EID
      const eid = generateEID(button, { root: iframeDoc });
      expect(eid).toBeDefined();

      // Resolve should find button, not fall back to anchor
      const result = resolve(eid!, iframeDoc, { root: iframeDoc });

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0]).toBe(button);
      expect(result.elements[0].tagName.toLowerCase()).toBe('button');
    });

    it('should use relaxed matching when exact text match fails', () => {
      iframeDoc.body.innerHTML = `
        <nav class="container">
          <button>Toggle theme</button>
        </nav>
      `;

      const button = iframeDoc.querySelector('button')!;

      const eid = generateEID(button, { root: iframeDoc });
      expect(eid).toBeTruthy();

      // Slightly modify button text (simulating minor DOM changes)
      button.textContent = 'Toggle  theme'; // Extra space

      // Resolution should still find button with relaxed matching
      const result = resolve(eid!, iframeDoc, { root: iframeDoc });

      expect(result.status).toBe('success');
      expect(result.elements).toHaveLength(1);
      expect(result.elements[0].tagName.toLowerCase()).toBe('button');

      // Should indicate degraded match with relaxed matching
      if (result.meta.degraded) {
        expect(result.meta.degradationReason).toBe('relaxed-text-matching');
        expect(result.warnings.some((w) => w.includes('relaxed'))).toBe(true);
      }
    });

    it('should provide diagnostic info when falling back to anchor', () => {
      iframeDoc.body.innerHTML = `
        <nav class="container">
          <button>Test Button</button>
        </nav>
      `;

      const nav = iframeDoc.querySelector('nav')!;
      const button = iframeDoc.querySelector('button')!;

      const eid = generateEID(button, { root: iframeDoc });
      expect(eid).toBeTruthy();

      // Change button text so it won't match at all
      button.textContent = 'Completely Different';

      // Resolution should fall back to anchor with diagnostic info
      const result = resolve(eid!, iframeDoc, { root: iframeDoc, enableFallback: true });

      expect(result.status).toBe('degraded-fallback');
      expect(result.elements[0].tagName.toLowerCase()).toBe('nav');
      expect(result.warnings.some((w) => w.includes('CSS selector found'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('candidates'))).toBe(true);
    });

    it('should return target button not anchor nav in iframe', () => {
      // This is the exact scenario from the bug report
      iframeDoc.body.innerHTML = `
        <nav class="container" id="nav-1">
          <button>Toggle theme</button>
        </nav>
      `;

      const nav = iframeDoc.querySelector('nav')!;
      const button = iframeDoc.querySelector('button')!;

      const eid = generateEID(button, { root: iframeDoc });
      expect(eid).toBeTruthy();

      // Resolve should return the button, NOT the nav anchor
      const result = resolve(eid!, iframeDoc, { root: iframeDoc });

      expect(result.status).toBe('success');
      expect(result.elements.length).toBeGreaterThanOrEqual(1);

      // Critical: should be the button, not the nav
      const resolved = result.elements[0];
      expect(resolved.tagName.toLowerCase()).toBe('button');
      expect(resolved).toBe(button);
      expect(resolved).not.toBe(nav);
    });
  });

  describe('Edge cases', () => {
    it('should handle nested iframes (2 levels)', () => {
      // Create nested iframe inside first iframe
      const nestedIframe = iframeDoc.createElement('iframe');
      iframeDoc.body.appendChild(nestedIframe);
      const nestedDoc = nestedIframe.contentDocument!;

      nestedDoc.body.innerHTML = '<button id="nested-btn">Nested Button</button>';

      const nestedButton = nestedDoc.getElementById('nested-btn')!;
      const eid = generateEID(nestedButton, { root: nestedDoc });

      expect(eid).toBeTruthy();
      expect(eid?.target.tag).toBe('button');

      const result = resolve(eid!, nestedDoc, { root: nestedDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle detached elements gracefully', () => {
      const detached = iframeDoc.createElement('div');
      // Element is created but not attached to DOM

      // In jsdom, detached elements still have ownerDocument
      // So we just verify it doesn't crash
      const doc = getOwnerDocument(detached);
      expect(doc).toBeTruthy();
    });

    it('should handle dynamic iframe creation', () => {
      // Create new iframe dynamically
      const dynamicIframe = document.createElement('iframe');
      document.body.appendChild(dynamicIframe);
      const dynamicDoc = dynamicIframe.contentDocument!;

      dynamicDoc.body.innerHTML = '<div id="dynamic">Dynamic Content</div>';

      const dynamicDiv = dynamicDoc.getElementById('dynamic')!;
      const eid = generateEID(dynamicDiv, { root: dynamicDoc });

      expect(eid).toBeTruthy();

      const result = resolve(eid!, dynamicDoc, { root: dynamicDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);

      document.body.removeChild(dynamicIframe);
    });

    it('should handle elements with semantic anchors in iframe', () => {
      // Add more complex structure
      iframeDoc.body.innerHTML += `
        <main id="content">
          <article>
            <h1>Article Title</h1>
            <p>Content here</p>
          </article>
        </main>
      `;

      const heading = iframeDoc.querySelector('h1')!;
      const eid = generateEID(heading, { root: iframeDoc });

      expect(eid).toBeTruthy();
      expect(eid?.anchor.tag).toBe('article');

      const result = resolve(eid!, iframeDoc, { root: iframeDoc });
      expect(result.elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Document context utilities', () => {
    it('getOwnerDocument should extract document from iframe element', () => {
      const element = iframeDoc.getElementById('username')!;

      const doc = getOwnerDocument(element);

      expect(doc).toBeTruthy();
      expect(doc).not.toBe(document);
    });

    it('validateDocumentContext should pass for same-document elements', () => {
      const element = iframeDoc.getElementById('username')!;

      expect(() => {
        validateDocumentContext(element, iframeDoc);
      }).not.toThrow();

      expect(() => {
        validateDocumentContext(element, iframeDoc.body);
      }).not.toThrow();
    });

    it('validateDocumentContext should throw for cross-document', () => {
      const iframeElement = iframeDoc.getElementById('username')!;

      expect(() => {
        validateDocumentContext(iframeElement, document);
      }).toThrow(/Cross-document operation/);

      expect(() => {
        validateDocumentContext(iframeElement, document.body);
      }).toThrow(/Cross-document operation/);
    });
  });
});
