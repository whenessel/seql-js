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

    it('should include data-* ending with -id (non-analytics)', () => {
      expect(isStableAttribute('data-custom-id', '123')).toBe(true);
      expect(isStableAttribute('data-order-id', 'order-123')).toBe(true);
      expect(isStableAttribute('data-session-id', 'sess-456')).toBe(true);
    });

    it('should include other data-* attributes by default (non-analytics)', () => {
      expect(isStableAttribute('data-custom', 'value')).toBe(true);
      expect(isStableAttribute('data-section', 'header')).toBe(true);
      expect(isStableAttribute('data-region', 'main')).toBe(true);
      expect(isStableAttribute('data-module', 'navigation')).toBe(true);
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

  describe('Analytics attribute filtering', () => {
    describe('Google Analytics / GTM', () => {
      it('should exclude data-ga* patterns', () => {
        expect(isStableAttribute('data-ga-click', 'event')).toBe(false);
        expect(isStableAttribute('data-gtm-event', 'click')).toBe(false);
        expect(isStableAttribute('data-google-analytics', 'UA-123')).toBe(false);
        expect(isStableAttribute('data-layer-event', 'purchase')).toBe(false);
        expect(isStableAttribute('data-event-name', 'signup')).toBe(false);
      });

      it('should exclude GA exact-match attributes', () => {
        expect(isStableAttribute('data-category', 'electronics')).toBe(false);
        expect(isStableAttribute('data-action', 'click')).toBe(false);
        expect(isStableAttribute('data-label', 'banner')).toBe(false);
        expect(isStableAttribute('data-value', '100')).toBe(false);
      });
    });

    describe('Yandex Metrica', () => {
      it('should exclude Yandex patterns', () => {
        expect(isStableAttribute('data-yandex-counter', '123')).toBe(false);
        expect(isStableAttribute('data-ym-goal', 'purchase')).toBe(false);
        expect(isStableAttribute('data-metrika-event', 'click')).toBe(false);
      });
    });

    describe('Session Recording tools', () => {
      it('should exclude Hotjar patterns', () => {
        expect(isStableAttribute('data-hj-ignore', 'true')).toBe(false);
        expect(isStableAttribute('data-hotjar-track', 'yes')).toBe(false);
      });

      it('should exclude FullStory patterns', () => {
        expect(isStableAttribute('data-fs-element', 'button')).toBe(false);
      });

      it('should exclude Mouseflow patterns', () => {
        expect(isStableAttribute('data-mouseflow-track', 'yes')).toBe(false);
        expect(isStableAttribute('data-mf-click', 'event')).toBe(false);
      });

      it('should exclude Smartlook patterns', () => {
        expect(isStableAttribute('data-smartlook-ignore', 'true')).toBe(false);
        expect(isStableAttribute('data-sl-event', 'click')).toBe(false);
      });
    });

    describe('A/B Testing tools', () => {
      it('should exclude Optimizely patterns', () => {
        expect(isStableAttribute('data-optimizely-variation', 'A')).toBe(false);
      });

      it('should exclude VWO patterns', () => {
        expect(isStableAttribute('data-vwo-test', '123')).toBe(false);
      });

      it('should exclude Google Optimize patterns', () => {
        expect(isStableAttribute('data-optimize-experiment', 'exp1')).toBe(false);
      });
    });

    describe('Social / Ad Pixels', () => {
      it('should exclude Facebook pixel patterns', () => {
        expect(isStableAttribute('data-fb-event', 'PageView')).toBe(false);
        expect(isStableAttribute('data-facebook-pixel', '123')).toBe(false);
      });

      it('should exclude TikTok pixel patterns', () => {
        expect(isStableAttribute('data-tt-event', 'ViewContent')).toBe(false);
      });

      it('should exclude LinkedIn pixel patterns', () => {
        expect(isStableAttribute('data-li-pixel', '456')).toBe(false);
      });
    });

    describe('Generic tracking patterns', () => {
      it('should exclude generic tracking patterns', () => {
        expect(isStableAttribute('data-track-event', 'click')).toBe(false);
        expect(isStableAttribute('data-tracking-code', 'abc')).toBe(false);
        expect(isStableAttribute('data-click-tracking', 'yes')).toBe(false);
        expect(isStableAttribute('data-impression-id', '123')).toBe(false);
        expect(isStableAttribute('data-conversion-value', '50')).toBe(false);
        expect(isStableAttribute('data-segment-event', 'signup')).toBe(false);
        expect(isStableAttribute('data-analytics-enabled', 'true')).toBe(false);
      });
    });

    describe('Edge cases: analytics *-id patterns', () => {
      it('should exclude analytics-id and tracking-id (analytics prefix wins)', () => {
        // BREAKING CHANGE: These were previously allowed, now blocked
        expect(isStableAttribute('data-tracking-id', 'track-123')).toBe(false);
        expect(isStableAttribute('data-analytics-id', 'ga-456')).toBe(false);
        expect(isStableAttribute('data-ga-id', 'UA-123')).toBe(false);
        expect(isStableAttribute('data-event-id', 'evt-789')).toBe(false);
        expect(isStableAttribute('data-impression-id', 'imp-456')).toBe(false);
      });

      it('should still allow non-analytics *-id patterns', () => {
        expect(isStableAttribute('data-product-id', '12345')).toBe(true);
        expect(isStableAttribute('data-user-id', 'abc')).toBe(true);
        expect(isStableAttribute('data-custom-id', '123')).toBe(true);
        expect(isStableAttribute('data-entity-id', '456')).toBe(true);
        expect(isStableAttribute('data-order-id', '789')).toBe(true);
      });
    });

    describe('Test attributes remain protected', () => {
      it('should still include all test attributes despite any conflicts', () => {
        expect(isStableAttribute('data-testid', 'btn')).toBe(true);
        expect(isStableAttribute('data-test', 'submit')).toBe(true);
        expect(isStableAttribute('data-qa', 'form')).toBe(true);
        expect(isStableAttribute('data-cy', 'input')).toBe(true);
        expect(isStableAttribute('data-automation-id', 'link')).toBe(true);
      });
    });

    describe('Semantic data-* attributes remain allowed', () => {
      it('should allow semantic data attributes that do not match analytics patterns', () => {
        expect(isStableAttribute('data-role', 'admin')).toBe(true);
        expect(isStableAttribute('data-type', 'primary')).toBe(true);
        // Note: data-status is excluded as it's a state attribute
        expect(isStableAttribute('data-feature', 'enabled')).toBe(true);
        expect(isStableAttribute('data-module', 'navigation')).toBe(true);
      });
    });
  });
});
