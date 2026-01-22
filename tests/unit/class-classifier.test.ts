import { describe, it, expect } from 'vitest';
import {
  classifyClass,
  isDynamicClass,
  isUtilityClass,
  isSemanticClass,
  isStableClass,
  filterStableClasses,
  filterSemanticClasses,
  scoreClass,
} from '../../src/utils/class-classifier';

describe('ClassClassifier', () => {
  describe('isDynamicClass', () => {
    it('should detect CSS-in-JS classes', () => {
      expect(isDynamicClass('css-abc123')).toBe(true);
      expect(isDynamicClass('sc-bdVaJa-0')).toBe(true);
      expect(isDynamicClass('jss123')).toBe(true);
      expect(isDynamicClass('emotion-abc123')).toBe(true);
      expect(isDynamicClass('linaria-xyz')).toBe(true);
    });

    it('should detect Material-UI classes', () => {
      expect(isDynamicClass('MuiButton-root-123')).toBe(true);
      expect(isDynamicClass('makeStyles-button-456')).toBe(true);
    });

    it('should detect hash-based classes', () => {
      expect(isDynamicClass('button-abc123')).toBe(true); // hash suffix
      expect(isDynamicClass('_abc12345')).toBe(true); // underscore prefix
      expect(isDynamicClass('class123456')).toBe(true); // 5+ digits
    });

    it('should NOT detect semantic classes', () => {
      expect(isDynamicClass('nav-item')).toBe(false);
      expect(isDynamicClass('button-primary')).toBe(false);
      expect(isDynamicClass('form-input')).toBe(false);
    });

    it('should NOT detect utility classes', () => {
      expect(isDynamicClass('flex')).toBe(false);
      expect(isDynamicClass('mt-4')).toBe(false);
    });
  });

  describe('isUtilityClass', () => {
    it('should detect Tailwind layout classes', () => {
      expect(isUtilityClass('flex')).toBe(true);
      expect(isUtilityClass('grid')).toBe(true);
      expect(isUtilityClass('block')).toBe(true);
      expect(isUtilityClass('hidden')).toBe(true);
      expect(isUtilityClass('absolute')).toBe(true);
      expect(isUtilityClass('relative')).toBe(true);
    });

    it('should detect Tailwind spacing classes', () => {
      expect(isUtilityClass('mt-4')).toBe(true);
      expect(isUtilityClass('p-2')).toBe(true);
      expect(isUtilityClass('gap-4')).toBe(true);
      expect(isUtilityClass('space-x-2')).toBe(true);
    });

    it('should detect Tailwind responsive classes', () => {
      expect(isUtilityClass('sm:block')).toBe(true);
      expect(isUtilityClass('md:flex')).toBe(true);
      expect(isUtilityClass('lg:grid')).toBe(true);
    });

    it('should detect Tailwind state classes', () => {
      expect(isUtilityClass('hover:bg-blue-500')).toBe(true);
      expect(isUtilityClass('focus:ring-2')).toBe(true);
      expect(isUtilityClass('active:scale-95')).toBe(true);
    });

    it('should detect animation classes', () => {
      expect(isUtilityClass('animate-spin')).toBe(true);
      expect(isUtilityClass('transition-all')).toBe(true);
      expect(isUtilityClass('duration-300')).toBe(true);
      expect(isUtilityClass('fade-in')).toBe(true);
      expect(isUtilityClass('slide-up')).toBe(true);
      expect(isUtilityClass('motion-safe:animate-pulse')).toBe(true);
    });

    it('should detect invalid/arbitrary classes (Tailwind arbitrary values)', () => {
      expect(isUtilityClass('[animation-delay:300ms]')).toBe(true);
      expect(isUtilityClass('[width:100px]')).toBe(true);
      expect(isUtilityClass('[color:red]')).toBe(true);
      expect(isUtilityClass('[any:value]')).toBe(true);
    });

    it('should detect Bootstrap utility classes', () => {
      expect(isUtilityClass('d-flex')).toBe(true);
      // Note: btn-primary is semantic (component class), not utility
      expect(isUtilityClass('btn-sm')).toBe(true); // Size modifier is utility
      expect(isUtilityClass('text-center')).toBe(true);
      expect(isUtilityClass('m-3')).toBe(true);
      expect(isUtilityClass('p-2')).toBe(true);
      expect(isUtilityClass('rounded')).toBe(true);
    });

    it('should detect very short classes', () => {
      expect(isUtilityClass('ab')).toBe(true);
      expect(isUtilityClass('x')).toBe(true);
    });

    it('should detect numeric classes', () => {
      expect(isUtilityClass('123')).toBe(true);
      expect(isUtilityClass('4')).toBe(true);
    });

    it('should detect negative Tailwind utility classes (margins, positioning)', () => {
      // Negative margins
      expect(isUtilityClass('-m-4')).toBe(true);
      expect(isUtilityClass('-mt-2')).toBe(true);
      expect(isUtilityClass('-mx-4')).toBe(true);
      expect(isUtilityClass('-mb-6')).toBe(true);
      expect(isUtilityClass('-py-2')).toBe(true);

      // Negative positioning
      expect(isUtilityClass('-top-4')).toBe(true);
      expect(isUtilityClass('-bottom-6')).toBe(true);
      expect(isUtilityClass('-left-6')).toBe(true);
      expect(isUtilityClass('-right-8')).toBe(true);
      expect(isUtilityClass('-inset-0')).toBe(true);

      // Negative z-index
      expect(isUtilityClass('-z-10')).toBe(true);
      expect(isUtilityClass('-z-20')).toBe(true);

      // Negative spacing
      expect(isUtilityClass('-space-x-2')).toBe(true);
      expect(isUtilityClass('-space-y-4')).toBe(true);

      // Negative transforms
      expect(isUtilityClass('-translate-x-4')).toBe(true);
      expect(isUtilityClass('-translate-y-2')).toBe(true);
      expect(isUtilityClass('-rotate-45')).toBe(true);
      expect(isUtilityClass('-scale-50')).toBe(true);
      expect(isUtilityClass('-skew-x-12')).toBe(true);
    });

    it('should NOT detect semantic classes', () => {
      expect(isUtilityClass('nav-item')).toBe(false);
      expect(isUtilityClass('button-primary')).toBe(false);
      expect(isUtilityClass('form-input')).toBe(false);
    });
  });

  describe('isSemanticClass', () => {
    it('should detect navigation classes', () => {
      expect(isSemanticClass('nav-item')).toBe(true);
      expect(isSemanticClass('menu-link')).toBe(true);
      expect(isSemanticClass('header-nav')).toBe(true);
      expect(isSemanticClass('breadcrumb-item')).toBe(true);
    });

    it('should detect component classes', () => {
      expect(isSemanticClass('btn-primary')).toBe(true);
      expect(isSemanticClass('button-submit')).toBe(true);
      expect(isSemanticClass('card-header')).toBe(true);
      expect(isSemanticClass('modal-dialog')).toBe(true);
      expect(isSemanticClass('form-input')).toBe(true);
    });

    it('should detect content classes', () => {
      expect(isSemanticClass('article-title')).toBe(true);
      expect(isSemanticClass('post-content')).toBe(true);
      expect(isSemanticClass('hero-banner')).toBe(true);
    });

    it('should detect state classes with semantic naming', () => {
      expect(isSemanticClass('button-active')).toBe(true);
      expect(isSemanticClass('item-selected')).toBe(true);
      expect(isSemanticClass('modal-open')).toBe(true);
      expect(isSemanticClass('accordion-expanded')).toBe(true);
    });

    it('should detect action button classes', () => {
      expect(isSemanticClass('submit-button')).toBe(true);
      expect(isSemanticClass('cancel-btn')).toBe(true);
      expect(isSemanticClass('delete-link')).toBe(true);
    });

    it('should NOT detect utility classes', () => {
      expect(isSemanticClass('flex')).toBe(false);
      expect(isSemanticClass('mt-4')).toBe(false);
      expect(isSemanticClass('animate-spin')).toBe(false);
    });

    it('should NOT detect dynamic classes', () => {
      expect(isSemanticClass('css-abc123')).toBe(false);
      expect(isSemanticClass('jss123')).toBe(false);
    });
  });

  describe('isStableClass', () => {
    it('should return true for semantic classes', () => {
      expect(isStableClass('nav-item')).toBe(true);
      expect(isStableClass('button-primary')).toBe(true);
    });

    it('should return false for utility classes', () => {
      expect(isStableClass('flex')).toBe(false);
      expect(isStableClass('mt-4')).toBe(false);
    });

    it('should return false for dynamic classes', () => {
      expect(isStableClass('css-abc123')).toBe(false);
      expect(isStableClass('jss123')).toBe(false);
    });
  });

  describe('classifyClass', () => {
    it('should classify dynamic classes correctly', () => {
      const result = classifyClass('css-abc123');
      expect(result.isDynamic).toBe(true);
      expect(result.isUtility).toBe(false);
      expect(result.isSemantic).toBe(false);
      expect(result.isStable).toBe(false);
    });

    it('should classify utility classes correctly', () => {
      const result = classifyClass('flex');
      expect(result.isDynamic).toBe(false);
      expect(result.isUtility).toBe(true);
      expect(result.isSemantic).toBe(false);
      expect(result.isStable).toBe(false);
    });

    it('should classify semantic classes correctly', () => {
      const result = classifyClass('nav-item');
      expect(result.isDynamic).toBe(false);
      expect(result.isUtility).toBe(false);
      expect(result.isSemantic).toBe(true);
      expect(result.isStable).toBe(true);
    });
  });

  describe('filterStableClasses', () => {
    it('should filter out utility and dynamic classes', () => {
      const classes = ['nav-item', 'flex', 'mt-4', 'button-primary', 'css-abc123', 'animate-spin'];
      const result = filterStableClasses(classes);
      expect(result).toEqual(['nav-item', 'button-primary']);
    });

    it('should return empty array if all classes are unstable', () => {
      const classes = ['flex', 'mt-4', 'css-abc123'];
      const result = filterStableClasses(classes);
      expect(result).toEqual([]);
    });

    it('should return all classes if all are stable', () => {
      const classes = ['nav-item', 'button-primary', 'form-input'];
      const result = filterStableClasses(classes);
      expect(result).toEqual(classes);
    });
  });

  describe('filterSemanticClasses', () => {
    it('should filter to only semantic classes', () => {
      const classes = ['nav-item', 'flex', 'button-primary', 'css-abc123', 'form-input'];
      const result = filterSemanticClasses(classes);
      expect(result).toEqual(['nav-item', 'button-primary', 'form-input']);
    });
  });

  describe('scoreClass', () => {
    it('should return 0 for utility classes', () => {
      expect(scoreClass('flex')).toBe(0);
      expect(scoreClass('mt-4')).toBe(0);
      expect(scoreClass('animate-spin')).toBe(0);
    });

    it('should return 0 for dynamic classes', () => {
      expect(scoreClass('css-abc123')).toBe(0);
      expect(scoreClass('jss123')).toBe(0);
    });

    it('should return higher score for semantic classes', () => {
      const score = scoreClass('nav-item');
      expect(score).toBeGreaterThan(0.5);
    });

    it('should return lower score for short classes', () => {
      const shortScore = scoreClass('ab');
      const longScore = scoreClass('navigation-item');
      expect(longScore).toBeGreaterThan(shortScore);
    });

    it('should reduce score for classes with numbers', () => {
      const withNumber = scoreClass('nav-item-123');
      const withoutNumber = scoreClass('nav-item');
      expect(withoutNumber).toBeGreaterThan(withNumber);
    });
  });
});
