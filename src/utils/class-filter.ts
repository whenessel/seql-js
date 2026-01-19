import {
  isUtilityClass as isUtilityClassFromClassifier,
  isDynamicClass,
  scoreClass as scoreClassFromClassifier,
} from './class-classifier';

/**
 * Filters classes into semantic and utility
 * Uses class-classifier for improved detection
 * @param classes - Array of class names
 * @returns Object with semantic and utility arrays
 */
export function filterClasses(classes: string[]): {
  semantic: string[];
  utility: string[];
} {
  const semantic: string[] = [];
  const utility: string[] = [];

  for (const cls of classes) {
    // Use new classifier logic
    if (isUtilityClassFromClassifier(cls) || isDynamicClass(cls)) {
      utility.push(cls);
    } else {
      semantic.push(cls);
    }
  }

  return { semantic, utility };
}

/**
 * Checks if class is a utility/atomic CSS class
 * Uses class-classifier for improved detection
 * @param className - Class name to check
 * @returns True if utility class
 */
export function isUtilityClass(className: string): boolean {
  // Use new classifier logic
  return isUtilityClassFromClassifier(className) || isDynamicClass(className);
}

/**
 * Scores a class for semantic value
 * Uses class-classifier for improved scoring
 * @param className - Class name to score
 * @returns Score from 0 to 1
 */
export function getClassScore(className: string): number {
  // Use new classifier scoring
  return scoreClassFromClassifier(className);
}
