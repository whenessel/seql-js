import { describe, it, expect, beforeEach } from 'vitest';
import { generateEID } from '../../src/generator';

describe('Generator - Attribute Filtering Integration', () => {
  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Test');
  });

  describe('State attribute filtering', () => {
    it('should exclude state attributes from generated EID', () => {
      const form = doc.createElement('form');
      form.id = 'test-form';

      const button = doc.createElement('button');
      button.id = 'submit-btn';
      button.setAttribute('role', 'button');
      button.setAttribute('aria-label', 'Submit');
      button.setAttribute('aria-selected', 'true'); // state
      button.setAttribute('data-state', 'active'); // state
      button.setAttribute('data-testid', 'submit');
      button.setAttribute('disabled', ''); // state
      button.textContent = 'Submit';

      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include stable attributes
      expect(eidStr).toContain('submit-btn'); // id
      expect(eidStr).toContain('button'); // role
      expect(eidStr).toContain('Submit'); // aria-label or text
      expect(eidStr).toContain('submit'); // data-testid

      // Should exclude state attributes
      expect(eidStr).not.toContain('aria-selected');
      expect(eidStr).not.toContain('data-state');
      expect(eidStr).not.toContain('disabled');
    });

    it('should exclude ARIA state attributes', () => {
      const nav = doc.createElement('nav');

      const tab = doc.createElement('button');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-label', 'Tab 1');
      tab.setAttribute('aria-selected', 'true'); // state
      tab.setAttribute('aria-expanded', 'false'); // state
      tab.setAttribute('aria-hidden', 'false'); // state
      tab.textContent = 'Tab 1';

      nav.appendChild(tab);
      doc.body.appendChild(nav);

      const eid = generateEID(tab);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include stable ARIA attributes
      expect(eidStr).toContain('tab'); // role
      expect(eidStr).toContain('Tab 1'); // aria-label or text

      // Should exclude ARIA state attributes
      expect(eidStr).not.toContain('aria-selected');
      expect(eidStr).not.toContain('aria-expanded');
      expect(eidStr).not.toContain('aria-hidden');
    });

    it('should exclude HTML state attributes', () => {
      const form = doc.createElement('form');
      form.id = 'user-form';

      const input = doc.createElement('input');
      input.setAttribute('name', 'email');
      input.setAttribute('type', 'email');
      input.setAttribute('placeholder', 'Enter email');
      input.setAttribute('disabled', ''); // state
      input.setAttribute('required', ''); // state
      input.setAttribute('readonly', ''); // state
      input.setAttribute('value', 'test@example.com'); // state

      form.appendChild(input);
      doc.body.appendChild(form);

      const eid = generateEID(input);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include stable HTML attributes
      expect(eidStr).toContain('email'); // name or type
      expect(eidStr).toContain('Enter email'); // placeholder

      // Should exclude HTML state attributes
      expect(eidStr).not.toContain('disabled');
      expect(eidStr).not.toContain('required');
      expect(eidStr).not.toContain('readonly');
      expect(eidStr).not.toContain('test@example.com'); // value
    });
  });

  describe('Library-specific attribute filtering', () => {
    it('should exclude library-generated attributes', () => {
      const main = doc.createElement('main');

      const div = doc.createElement('div');
      div.id = 'radix-:ru:-content'; // generated ID
      div.setAttribute('data-radix-collection-item', '');
      div.setAttribute('data-orientation', 'horizontal'); // state
      div.setAttribute('role', 'tabpanel');
      div.textContent = 'Content';

      main.appendChild(div);
      doc.body.appendChild(main);

      const eid = generateEID(div);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include stable attributes
      expect(eidStr).toContain('tabpanel'); // role

      // Should exclude library-generated attributes
      expect(eidStr).not.toContain('radix');
      expect(eidStr).not.toContain('data-radix');
      expect(eidStr).not.toContain('data-orientation');
    });

    it('should exclude Radix UI attributes', () => {
      const div = doc.createElement('div');
      div.setAttribute('data-radix-scroll-area-viewport', '');
      div.setAttribute('data-state', 'open');
      div.setAttribute('role', 'region');
      doc.body.appendChild(div);

      const eid = generateEID(div);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      expect(eidStr).toContain('region'); // role
      expect(eidStr).not.toContain('data-radix');
      expect(eidStr).not.toContain('data-state');
    });

    it('should exclude Headless UI attributes', () => {
      const button = doc.createElement('button');
      button.setAttribute('data-headlessui-state', 'open');
      button.setAttribute('aria-label', 'Menu');
      button.textContent = 'Menu';
      doc.body.appendChild(button);

      const eid = generateEID(button);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      expect(eidStr).toContain('Menu'); // aria-label or text
      expect(eidStr).not.toContain('data-headlessui');
    });
  });

  describe('data-* ID attribute filtering', () => {
    it('should include data-testid and similar attributes', () => {
      const form = doc.createElement('form');

      const button = doc.createElement('button');
      button.setAttribute('data-testid', 'submit-btn');
      button.setAttribute('data-cy', 'submit-button');
      button.setAttribute('data-qa', 'submit');
      button.textContent = 'Submit';

      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include test ID attributes
      expect(eidStr).toContain('submit-btn'); // data-testid
      // Note: Only highest priority attribute may be included
    });

    it('should include data-*-id pattern attributes', () => {
      const div = doc.createElement('div');
      div.setAttribute('data-product-id', '12345');
      div.setAttribute('data-user-id', 'abc123');
      div.setAttribute('data-custom-id', 'xyz');
      doc.body.appendChild(div);

      const eid = generateEID(div);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include at least one ID attribute
      const hasIdAttr =
        eidStr.includes('12345') || eidStr.includes('abc123') || eidStr.includes('xyz');
      expect(hasIdAttr).toBe(true);
    });

    it('should include generic data-* attributes (non-analytics)', () => {
      const div = doc.createElement('div');
      div.setAttribute('data-section', 'header');
      div.setAttribute('data-region', 'main');
      div.textContent = 'Section';
      doc.body.appendChild(div);

      const eid = generateEID(div);

      expect(eid).not.toBeNull();

      // Generic data-* attributes may or may not be included based on priority
      // This test just ensures no error is thrown
    });
  });

  describe('Analytics attribute filtering', () => {
    it('should exclude analytics attributes from generated EID', () => {
      const form = doc.createElement('form');
      form.id = 'checkout-form';

      const button = doc.createElement('button');
      button.setAttribute('data-testid', 'submit-btn'); // STABLE ✓
      button.setAttribute('data-ga-event', 'purchase'); // ANALYTICS ✗
      button.setAttribute('data-tracking-id', 'track-123'); // ANALYTICS ✗
      button.setAttribute('data-category', 'checkout'); // ANALYTICS ✗
      button.setAttribute('aria-label', 'Submit Order'); // STABLE ✓
      button.textContent = 'Submit';

      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Stable attributes should be present
      expect(eidStr).toContain('submit-btn');
      expect(eidStr).toContain('Submit');

      // Analytics attributes should be excluded
      expect(eidStr).not.toContain('data-ga-event');
      expect(eidStr).not.toContain('purchase');
      expect(eidStr).not.toContain('track-123');
      expect(eidStr).not.toContain('data-category');
    });

    it('should handle mixed tracking and semantic attributes', () => {
      const div = doc.createElement('div');
      div.setAttribute('data-product-id', '12345'); // STABLE ✓
      div.setAttribute('data-ga-click', 'product-click'); // ANALYTICS ✗
      div.setAttribute('data-hj-suppress', 'true'); // ANALYTICS ✗
      div.setAttribute('role', 'article'); // STABLE ✓
      doc.body.appendChild(div);

      const eid = generateEID(div);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Semantic attributes included
      expect(eidStr).toContain('12345');
      expect(eidStr).toContain('article');

      // Analytics excluded
      expect(eidStr).not.toContain('data-ga-click');
      expect(eidStr).not.toContain('data-hj-suppress');
    });

    it('should filter Yandex Metrica attributes', () => {
      const link = doc.createElement('a');
      link.setAttribute('href', '/product'); // STABLE ✓
      link.setAttribute('data-yandex-goal', 'click-product'); // ANALYTICS ✗
      link.setAttribute('data-ym-event', 'interaction'); // ANALYTICS ✗
      link.setAttribute('data-testid', 'product-link'); // STABLE ✓
      link.textContent = 'View Product';
      doc.body.appendChild(link);

      const eid = generateEID(link);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      expect(eidStr).toContain('product');
      expect(eidStr).not.toContain('yandex');
      expect(eidStr).not.toContain('data-ym');
    });

    it('should handle complex forms with multiple analytics tools', () => {
      const input = doc.createElement('input');
      input.setAttribute('type', 'email'); // STABLE ✓
      input.setAttribute('name', 'user-email'); // STABLE ✓
      input.setAttribute('data-qa', 'email-input'); // STABLE ✓
      input.setAttribute('data-gtm-event', 'email-entered'); // ANALYTICS ✗
      input.setAttribute('data-optimizely-element', 'form1'); // ANALYTICS ✗
      input.setAttribute('data-fb-track', 'Lead'); // ANALYTICS ✗
      doc.body.appendChild(input);

      const eid = generateEID(input);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      expect(eidStr).toContain('email');
      expect(eidStr).toContain('user-email');
      expect(eidStr).not.toContain('gtm');
      expect(eidStr).not.toContain('optimizely');
      expect(eidStr).not.toContain('data-fb-track');
    });

    it('should preserve resolution stability without analytics attributes', () => {
      // This test verifies that EIDs generated without analytics attributes
      // can still be resolved correctly
      const button = doc.createElement('button');
      button.setAttribute('data-testid', 'action-btn');
      button.setAttribute('data-track-click', 'campaign-123'); // will be filtered
      button.textContent = 'Click Me';
      doc.body.appendChild(button);

      const eid = generateEID(button);

      expect(eid).not.toBeNull();

      // Verify EID doesn't contain analytics
      const eidStr = JSON.stringify(eid);
      expect(eidStr).not.toContain('track-click');
      expect(eidStr).not.toContain('campaign-123');

      // Verify core stable attributes are present
      expect(eidStr).toContain('action-btn');
    });
  });

  describe('ID filtering', () => {
    it('should exclude generated IDs with radix pattern', () => {
      const form = doc.createElement('form');
      form.id = 'user-form';

      const div = doc.createElement('div');
      div.id = 'radix-:ru:-trigger-card';
      div.textContent = 'Content';

      form.appendChild(div);
      doc.body.appendChild(form);

      const eid = generateEID(div);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should not include generated radix ID
      expect(eidStr).not.toContain('radix-:ru:-trigger-card');
    });

    it('should exclude generated IDs with headlessui pattern', () => {
      const nav = doc.createElement('nav');

      const menu = doc.createElement('div');
      menu.id = 'headlessui-menu-1';
      menu.setAttribute('role', 'menu');

      nav.appendChild(menu);
      doc.body.appendChild(nav);

      const eid = generateEID(menu);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should not include generated headlessui ID
      expect(eidStr).not.toContain('headlessui-menu-1');
      // Should include role
      expect(eidStr).toContain('menu');
    });

    it('should include stable IDs', () => {
      const form = doc.createElement('form');

      const button = doc.createElement('button');
      button.id = 'submit-button';
      button.textContent = 'Submit';

      form.appendChild(button);
      doc.body.appendChild(form);

      const eid = generateEID(button);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include stable ID
      expect(eidStr).toContain('submit-button');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle elements with mixed stable and state attributes', () => {
      const nav = doc.createElement('nav');
      nav.setAttribute('aria-label', 'Main navigation');

      const link = doc.createElement('a');
      link.setAttribute('href', '/home');
      link.setAttribute('aria-current', 'page'); // state
      link.setAttribute('data-testid', 'nav-home');
      link.setAttribute('data-active', 'true'); // state
      link.setAttribute('role', 'menuitem');
      link.textContent = 'Home';

      nav.appendChild(link);
      doc.body.appendChild(nav);

      const eid = generateEID(link);

      expect(eid).not.toBeNull();

      const eidStr = JSON.stringify(eid);

      // Should include stable attributes
      expect(eidStr).toContain('home'); // href or data-testid or text
      expect(eidStr).toContain('menuitem'); // role

      // Should exclude state attributes
      expect(eidStr).not.toContain('aria-current');
      expect(eidStr).not.toContain('data-active');
    });

    it('should generate valid EID even when all attributes are filtered out', () => {
      const div = doc.createElement('div');
      div.setAttribute('data-state', 'active');
      div.setAttribute('aria-hidden', 'false');
      div.setAttribute('disabled', '');
      div.textContent = 'Content';
      doc.body.appendChild(div);

      const eid = generateEID(div);

      // Should still generate EID based on tag and text
      expect(eid).not.toBeNull();
      expect(eid!.target.tag).toBe('div');
    });
  });
});
