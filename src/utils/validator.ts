import type { ElementIdentity, ValidationResult } from '../types';

/**
 * Validates EID structure for correctness
 * @param eid - The Element Identity to validate
 * @returns Validation result with errors and warnings
 */
export function validateEID(eid: ElementIdentity): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Version check
  if (!eid.version) {
    errors.push('Missing version field');
  } else if (eid.version !== '1.0') {
    warnings.push(`Unknown version: ${eid.version}`);
  }

  // Anchor check
  if (!eid.anchor) {
    errors.push('Missing anchor field');
  } else {
    if (!eid.anchor.tag) {
      errors.push('Anchor missing tag');
    }
    if (typeof eid.anchor.score !== 'number') {
      errors.push('Anchor missing score');
    }
    if (!eid.anchor.semantics) {
      errors.push('Anchor missing semantics');
    }
  }

  // Target check
  if (!eid.target) {
    errors.push('Missing target field');
  } else {
    if (!eid.target.tag) {
      errors.push('Target missing tag');
    }
    if (typeof eid.target.score !== 'number') {
      errors.push('Target missing score');
    }
    if (!eid.target.semantics) {
      errors.push('Target missing semantics');
    }
  }

  // Path check
  if (!Array.isArray(eid.path)) {
    errors.push('Path must be an array');
  } else {
    for (let i = 0; i < eid.path.length; i++) {
      const node = eid.path[i];
      if (!node.tag) {
        errors.push(`Path node ${i} missing tag`);
      }
      if (!node.semantics) {
        errors.push(`Path node ${i} missing semantics`);
      }
    }
  }

  // Meta check
  if (!eid.meta) {
    errors.push('Missing meta field');
  } else {
    if (typeof eid.meta.confidence !== 'number') {
      warnings.push('Missing confidence score');
    }
    if (!eid.meta.generatedAt) {
      warnings.push('Missing generatedAt timestamp');
    }
  }

  // Constraints check
  if (!Array.isArray(eid.constraints)) {
    warnings.push('Constraints should be an array');
  }

  // Fallback check
  if (!eid.fallback) {
    warnings.push('Missing fallback rules');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a value is a valid ElementIdentity object
 * @param value - Value to check
 * @returns True if valid ElementIdentity structure
 */
export function isEID(value: unknown): value is ElementIdentity {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.version === 'string' &&
    typeof obj.anchor === 'object' &&
    Array.isArray(obj.path) &&
    typeof obj.target === 'object'
  );
}
