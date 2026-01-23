import { describe, it, expect } from 'vitest';
import {
  isDynamicId,
  hasDynamicIdReference,
  isStableId,
  ID_REFERENCE_ATTRIBUTES,
} from '../../src/utils/id-validator';

describe('isDynamicId - multi-word patterns', () => {
  it('should detect react-day-picker-1 as dynamic', () => {
    expect(isDynamicId('react-day-picker-1')).toBe(true);
  });

  it('should detect mui-date-input-42 as dynamic', () => {
    expect(isDynamicId('mui-date-input-42')).toBe(true);
  });

  it('should detect radix-dialog-content-5 as dynamic', () => {
    expect(isDynamicId('radix-dialog-content-5')).toBe(true);
  });

  it('should detect headless-ui-menu-1 as dynamic', () => {
    expect(isDynamicId('headless-ui-menu-1')).toBe(true);
  });

  it('should NOT detect main-content as dynamic', () => {
    expect(isDynamicId('main-content')).toBe(false);
  });

  it('should NOT detect nav-menu as dynamic', () => {
    expect(isDynamicId('nav-menu')).toBe(false);
  });

  it('should NOT detect user-profile-section as dynamic', () => {
    expect(isDynamicId('user-profile-section')).toBe(false);
  });

  it('should NOT detect login-form as dynamic', () => {
    expect(isDynamicId('login-form')).toBe(false);
  });
});

describe('isDynamicId - underscore patterns', () => {
  it('should detect radix_dialog_1 as dynamic', () => {
    expect(isDynamicId('radix_dialog_1')).toBe(true);
  });

  it('should detect menu_item_42 as dynamic', () => {
    expect(isDynamicId('menu_item_42')).toBe(true);
  });

  it('should NOT detect main_content as dynamic', () => {
    expect(isDynamicId('main_content')).toBe(false);
  });
});

describe('isDynamicId - existing patterns', () => {
  it('should detect input-123 as dynamic', () => {
    expect(isDynamicId('input-123')).toBe(true);
  });

  it('should detect :r0: as dynamic', () => {
    expect(isDynamicId(':r0:')).toBe(true);
  });

  it('should detect UUID as dynamic', () => {
    expect(isDynamicId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('should detect radix-:r0: as dynamic', () => {
    expect(isDynamicId('radix-:r0:')).toBe(true);
  });

  it('should detect mui-123456 as dynamic', () => {
    expect(isDynamicId('mui-123456')).toBe(true);
  });
});

describe('hasDynamicIdReference', () => {
  it('should detect dynamic ID in aria-labelledby value', () => {
    expect(hasDynamicIdReference('react-day-picker-1')).toBe(true);
  });

  it('should detect dynamic ID in space-separated list', () => {
    expect(hasDynamicIdReference('title-id react-day-picker-1 desc-id')).toBe(true);
  });

  it('should return false for stable IDs', () => {
    expect(hasDynamicIdReference('modal-title modal-description')).toBe(false);
  });

  it('should return false for single stable ID', () => {
    expect(hasDynamicIdReference('main-header')).toBe(false);
  });

  it('should detect dynamic ID at the beginning of list', () => {
    expect(hasDynamicIdReference('input-123 stable-id')).toBe(true);
  });

  it('should detect dynamic ID at the end of list', () => {
    expect(hasDynamicIdReference('stable-id input-123')).toBe(true);
  });
});

describe('ID_REFERENCE_ATTRIBUTES', () => {
  it('should contain aria-labelledby', () => {
    expect(ID_REFERENCE_ATTRIBUTES.has('aria-labelledby')).toBe(true);
  });

  it('should contain aria-describedby', () => {
    expect(ID_REFERENCE_ATTRIBUTES.has('aria-describedby')).toBe(true);
  });

  it('should contain aria-controls', () => {
    expect(ID_REFERENCE_ATTRIBUTES.has('aria-controls')).toBe(true);
  });

  it('should contain for', () => {
    expect(ID_REFERENCE_ATTRIBUTES.has('for')).toBe(true);
  });

  it('should NOT contain aria-label', () => {
    expect(ID_REFERENCE_ATTRIBUTES.has('aria-label')).toBe(false);
  });

  it('should NOT contain role', () => {
    expect(ID_REFERENCE_ATTRIBUTES.has('role')).toBe(false);
  });
});

describe('isStableId', () => {
  it('should return false for null', () => {
    expect(isStableId(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isStableId(undefined)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isStableId('')).toBe(false);
  });

  it('should return true for stable ID', () => {
    expect(isStableId('user-profile')).toBe(true);
  });

  it('should return false for dynamic ID', () => {
    expect(isStableId('input-123')).toBe(false);
  });

  it('should return true for semantic ID', () => {
    expect(isStableId('login-form')).toBe(true);
  });

  it('should return false for UUID', () => {
    expect(isStableId('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
  });
});

describe('isDynamicId - hash-like edge cases', () => {
  it('should detect hash with only lowercase and numbers', () => {
    expect(isDynamicId('css1a2b3c4d')).toBe(true);
  });

  it('should detect hash with mixed case', () => {
    expect(isDynamicId('scBdVaJaXy')).toBe(true); // 10 chars: 'sc' + 'BdVaJaXy' (8 chars)
  });

  it('should NOT detect short hash without digits or uppercase', () => {
    // Pattern requires 8+ chars after 1-3 letter prefix AND (digits OR uppercase)
    expect(isDynamicId('cssabcdefgh')).toBe(false);
  });

  it('should NOT detect hash shorter than 9 chars total', () => {
    // Pattern requires 1-3 prefix + 8+ additional = at least 9 chars total
    expect(isDynamicId('scBdVaJa')).toBe(false); // Only 8 chars: 'sc' + 'BdVaJa'
  });
});
