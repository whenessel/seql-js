import { describe, it, expect } from 'vitest';
import { isStableAttribute } from '../../src/utils/attribute-filters';

describe('Attribute Filtering', () => {
  describe('ARIA attributes', () => {
    it('should include stable ARIA attributes', () => {
      expect(isStableAttribute('role', 'button')).toBe(true);
      expect(isStableAttribute('aria-label', 'Close')).toBe(true);
      expect(isStableAttribute('aria-labelledby', 'label-1')).toBe(true);
      expect(isStableAttribute('aria-describedby', 'desc-1')).toBe(true);
      expect(isStableAttribute('aria-controls', 'panel-1')).toBe(true);
      expect(isStableAttribute('aria-owns', 'submenu')).toBe(true);
      expect(isStableAttribute('aria-level', '2')).toBe(true);
      expect(isStableAttribute('aria-posinset', '3')).toBe(true);
      expect(isStableAttribute('aria-setsize', '10')).toBe(true);
      expect(isStableAttribute('aria-haspopup', 'menu')).toBe(true);
    });

    it('should exclude ARIA state attributes', () => {
      expect(isStableAttribute('aria-selected', 'true')).toBe(false);
      expect(isStableAttribute('aria-checked', 'true')).toBe(false);
      expect(isStableAttribute('aria-pressed', 'true')).toBe(false);
      expect(isStableAttribute('aria-expanded', 'false')).toBe(false);
      expect(isStableAttribute('aria-hidden', 'true')).toBe(false);
      expect(isStableAttribute('aria-disabled', 'true')).toBe(false);
      expect(isStableAttribute('aria-current', 'page')).toBe(false);
      expect(isStableAttribute('aria-busy', 'true')).toBe(false);
      expect(isStableAttribute('aria-invalid', 'false')).toBe(false);
      expect(isStableAttribute('aria-grabbed', 'true')).toBe(false);
      expect(isStableAttribute('aria-live', 'polite')).toBe(false);
      expect(isStableAttribute('aria-atomic', 'true')).toBe(false);
    });
  });

  describe('data-* attributes', () => {
    it('should exclude data-* state attributes', () => {
      expect(isStableAttribute('data-state', 'active')).toBe(false);
      expect(isStableAttribute('data-active', 'true')).toBe(false);
      expect(isStableAttribute('data-inactive', 'false')).toBe(false);
      expect(isStableAttribute('data-selected', 'true')).toBe(false);
      expect(isStableAttribute('data-open', 'true')).toBe(false);
      expect(isStableAttribute('data-closed', 'false')).toBe(false);
      expect(isStableAttribute('data-visible', 'true')).toBe(false);
      expect(isStableAttribute('data-hidden', 'false')).toBe(false);
      expect(isStableAttribute('data-disabled', 'true')).toBe(false);
      expect(isStableAttribute('data-enabled', 'true')).toBe(false);
      expect(isStableAttribute('data-loading', 'true')).toBe(false);
      expect(isStableAttribute('data-error', 'true')).toBe(false);
      expect(isStableAttribute('data-success', 'true')).toBe(false);
      expect(isStableAttribute('data-highlighted', 'true')).toBe(false);
      expect(isStableAttribute('data-focused', 'true')).toBe(false);
      expect(isStableAttribute('data-hover', 'true')).toBe(false);
      expect(isStableAttribute('data-orientation', 'horizontal')).toBe(false);
      expect(isStableAttribute('data-theme', 'dark')).toBe(false);
    });

    it('should exclude library-specific prefixes', () => {
      expect(isStableAttribute('data-radix-collection-item', '')).toBe(false);
      expect(isStableAttribute('data-radix-scroll-area-viewport', '')).toBe(false);
      expect(isStableAttribute('data-headlessui-state', 'open')).toBe(false);
      expect(isStableAttribute('data-headlessui-focus', 'true')).toBe(false);
      expect(isStableAttribute('data-reach-dialog', '')).toBe(false);
      expect(isStableAttribute('data-mui-color-scheme', 'light')).toBe(false);
      expect(isStableAttribute('data-chakra-ui', 'true')).toBe(false);
      expect(isStableAttribute('data-mantine-theme', 'light')).toBe(false);
      expect(isStableAttribute('data-tw-merge', '')).toBe(false);
    });

    it('should include data-*-id patterns', () => {
      expect(isStableAttribute('data-testid', 'submit-btn')).toBe(true);
      expect(isStableAttribute('data-test-id', 'submit-btn')).toBe(true);
      expect(isStableAttribute('data-test', 'submit-btn')).toBe(true);
      expect(isStableAttribute('data-cy', 'submit-btn')).toBe(true);
      expect(isStableAttribute('data-qa', 'submit-btn')).toBe(true);
      expect(isStableAttribute('data-automation-id', 'btn-123')).toBe(true);
      expect(isStableAttribute('data-id', 'unique-123')).toBe(true);
      expect(isStableAttribute('data-component', 'Button')).toBe(true);
      expect(isStableAttribute('data-entity-id', '12345')).toBe(true);
      expect(isStableAttribute('data-product-id', '12345')).toBe(true);
      expect(isStableAttribute('data-user-id', 'abc')).toBe(true);
    });

    it('should include data-* ending with -id', () => {
      expect(isStableAttribute('data-custom-id', '123')).toBe(true);
      expect(isStableAttribute('data-tracking-id', 'track-123')).toBe(true);
      expect(isStableAttribute('data-analytics-id', 'ga-456')).toBe(true);
    });

    it('should include other data-* attributes by default', () => {
      expect(isStableAttribute('data-custom', 'value')).toBe(true);
      expect(isStableAttribute('data-analytics', 'click')).toBe(true);
      expect(isStableAttribute('data-section', 'header')).toBe(true);
      expect(isStableAttribute('data-category', 'electronics')).toBe(true);
    });
  });

  describe('id attribute', () => {
    it('should exclude generated IDs with radix pattern', () => {
      expect(isStableAttribute('id', 'radix-:ru:-trigger-card')).toBe(false);
      expect(isStableAttribute('id', 'radix-:r1:-content')).toBe(false);
      expect(isStableAttribute('id', 'radix-dialog')).toBe(false);
    });

    it('should exclude generated IDs with headlessui pattern', () => {
      expect(isStableAttribute('id', 'headlessui-menu-1')).toBe(false);
      expect(isStableAttribute('id', 'headlessui-tabs-panel-42')).toBe(false);
    });

    it('should exclude generated IDs with mui pattern', () => {
      expect(isStableAttribute('id', 'mui-12345')).toBe(false);
      expect(isStableAttribute('id', 'mui-component-67890')).toBe(false);
    });

    it('should exclude IDs with :r*: pattern', () => {
      expect(isStableAttribute('id', ':r1:')).toBe(false);
      expect(isStableAttribute('id', ':ru:')).toBe(false);
      expect(isStableAttribute('id', 'something-:r1:-something')).toBe(false);
    });

    it('should include stable IDs', () => {
      expect(isStableAttribute('id', 'user-profile')).toBe(true);
      expect(isStableAttribute('id', 'main-nav')).toBe(true);
      expect(isStableAttribute('id', 'submit-button')).toBe(true);
      expect(isStableAttribute('id', 'login-form')).toBe(true);
    });
  });

  describe('HTML attributes', () => {
    it('should include stable HTML attributes', () => {
      expect(isStableAttribute('name', 'email')).toBe(true);
      expect(isStableAttribute('type', 'submit')).toBe(true);
      expect(isStableAttribute('placeholder', 'Enter email')).toBe(true);
      expect(isStableAttribute('title', 'Submit form')).toBe(true);
      expect(isStableAttribute('for', 'email-input')).toBe(true);
      expect(isStableAttribute('alt', 'Profile picture')).toBe(true);
      expect(isStableAttribute('href', '/home')).toBe(true);
    });

    it('should exclude HTML state attributes', () => {
      expect(isStableAttribute('disabled', '')).toBe(false);
      expect(isStableAttribute('checked', '')).toBe(false);
      expect(isStableAttribute('selected', '')).toBe(false);
      expect(isStableAttribute('hidden', '')).toBe(false);
      expect(isStableAttribute('readonly', '')).toBe(false);
      expect(isStableAttribute('required', '')).toBe(false);
      expect(isStableAttribute('value', 'current-value')).toBe(false);
    });
  });

  describe('Unknown attributes', () => {
    it('should reject unknown attributes', () => {
      expect(isStableAttribute('custom-attr', 'value')).toBe(false);
      expect(isStableAttribute('x-custom', 'value')).toBe(false);
      expect(isStableAttribute('random', 'value')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty values', () => {
      expect(isStableAttribute('data-testid', '')).toBe(true);
      expect(isStableAttribute('aria-label', '')).toBe(true);
      expect(isStableAttribute('name', '')).toBe(true);
    });

    it('should be case-sensitive', () => {
      expect(isStableAttribute('DATA-TESTID', 'value')).toBe(false);
      expect(isStableAttribute('ARIA-LABEL', 'value')).toBe(false);
      expect(isStableAttribute('NAME', 'value')).toBe(false);
    });
  });
});
