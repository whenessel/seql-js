import type { ElementIdentity, GeneratorOptions } from '../types';
import { generateEID } from '../generator';
import type { EIDCache } from './eid-cache';
import { getGlobalCache } from './eid-cache';
import { isDynamicId } from './id-validator';

/**
 * Elements to skip during batch generation
 */
const SKIP_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'meta',
  'link',
  'head',
  'title',
]);

/**
 * Options for batch EID generation
 */
export interface BatchGeneratorOptions {
  /** Root element to search from (default: document.body) */
  root?: Element | Document;
  /** CSS selector to filter elements (default: '*') */
  filter?: string;
  /** Maximum number of elements to process (default: Infinity) */
  limit?: number;
  /** Progress callback: (current, total) => void */
  onProgress?: (current: number, total: number) => void;
  /** Interval for calling onProgress (default: 100) */
  progressInterval?: number;
  /** Skip elements without semantic features (default: true) */
  skipNonSemantic?: boolean;
  /** Generator options */
  generatorOptions?: GeneratorOptions;
  /** Optional cache instance */
  cache?: EIDCache;
  /** AbortController for cancellation */
  signal?: AbortSignal;
}

/**
 * Result of batch generation
 */
export interface BatchResult {
  /** Successfully generated Element Identities */
  results: Array<{
    element: Element;
    eid: ElementIdentity;
    generationTimeMs: number;
  }>;
  /** Elements that failed to generate EID */
  failed: Array<{
    element: Element;
    error: string;
  }>;
  /** Statistics */
  stats: {
    totalElements: number;
    successful: number;
    failed: number;
    skipped: number;
    totalTimeMs: number;
    avgTimePerElementMs: number;
    cacheHitRate: number;
  };
}

/**
 * Element priority for optimized processing order
 */
enum ElementPriority {
  HIGH = 3, // Elements with ID
  MEDIUM = 2, // Elements with semantic attributes
  LOW = 1, // Other elements
}

/**
 * Get element priority for processing order
 */
function getElementPriority(element: Element): ElementPriority {
  // High priority: elements with stable ID
  if (element.id && !isDynamicId(element.id)) {
    return ElementPriority.HIGH;
  }

  // Medium priority: elements with semantic attributes
  if (
    element.hasAttribute('role') ||
    element.hasAttribute('aria-label') ||
    element.hasAttribute('aria-labelledby') ||
    element.hasAttribute('data-testid') ||
    element.hasAttribute('data-qa') ||
    element.hasAttribute('data-test')
  ) {
    return ElementPriority.MEDIUM;
  }

  return ElementPriority.LOW;
}

/**
 * Check if element should be skipped
 */
function shouldSkipElement(element: Element, skipNonSemantic: boolean): boolean {
  const tag = element.tagName.toLowerCase();

  // Skip certain tags
  if (SKIP_TAGS.has(tag)) {
    return true;
  }

  // Skip non-semantic elements if requested
  if (skipNonSemantic) {
    const priority = getElementPriority(element);
    if (priority === ElementPriority.LOW) {
      // Check if it's a semantic tag
      const semanticTags = [
        'form',
        'main',
        'nav',
        'section',
        'article',
        'footer',
        'header',
        'button',
        'a',
        'input',
        'label',
        'select',
        'textarea',
      ];
      if (!semanticTags.includes(tag)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Sort elements by priority for optimized processing
 */
function sortElementsByPriority(elements: Element[]): Element[] {
  return [...elements].sort((a, b) => {
    const priorityA = getElementPriority(a);
    const priorityB = getElementPriority(b);
    return priorityB - priorityA; // Higher priority first
  });
}


/**
 * Generate EID for all elements matching criteria
 */
export function generateEIDBatch(
  options: BatchGeneratorOptions = {},
): BatchResult {
  const startTime = performance.now();
  const {
    root = typeof document !== 'undefined' ? document.body : undefined,
    filter = '*',
    limit = Infinity,
    onProgress,
    progressInterval = 100,
    skipNonSemantic = true,
    generatorOptions = {},
    cache,
    signal,
  } = options;

  if (!root) {
    throw new Error('Root element or document is required');
  }

  const cacheInstance = cache ?? getGlobalCache();
  const mergedOptions = { ...generatorOptions, cache: cacheInstance };

  // Get all elements
  let allElements: Element[];
  try {
    if (root instanceof Document) {
      allElements = Array.from(root.querySelectorAll(filter));
    } else {
      allElements = Array.from(root.querySelectorAll(filter));
    }
  } catch (error) {
    return {
      results: [],
      failed: [],
      stats: {
        totalElements: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        totalTimeMs: 0,
        avgTimePerElementMs: 0,
        cacheHitRate: 0,
      },
    };
  }

  // Filter out skipped elements
  const filteredElements = allElements.filter(
    (el) => !shouldSkipElement(el, skipNonSemantic),
  );

  // Sort by priority for optimized processing
  const sortedElements = sortElementsByPriority(filteredElements);

  // Apply limit
  const elementsToProcess = sortedElements.slice(0, limit);

  const results: BatchResult['results'] = [];
  const failed: BatchResult['failed'] = [];
  let skipped = 0;

  const totalElements = elementsToProcess.length;
  let lastProgressCall = 0;

  // Process elements
  for (let i = 0; i < elementsToProcess.length; i++) {
    // Check for cancellation
    if (signal?.aborted) {
      break;
    }

    const element = elementsToProcess[i];

    // Check cache first
    const cachedEID = cacheInstance.getEID(element);
    if (cachedEID) {
      results.push({
        element,
        eid: cachedEID,
        generationTimeMs: 0, // Cached, no generation time
      });
    } else {
      // Generate EID
      const genStart = performance.now();
      try {
        const eid = generateEID(element, mergedOptions);
        const genTime = performance.now() - genStart;

        if (eid) {
          results.push({
            element,
            eid,
            generationTimeMs: genTime,
          });
        } else {
          skipped++;
        }
      } catch (error) {
        failed.push({
          element,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Call progress callback
    if (onProgress && i - lastProgressCall >= progressInterval) {
      onProgress(i + 1, totalElements);
      lastProgressCall = i;
    }
  }

  // Final progress call
  if (onProgress) {
    onProgress(totalElements, totalElements);
  }

  const totalTime = performance.now() - startTime;

  // Calculate cache hit rate
  const cacheStats = cacheInstance.getStats();
  const totalCacheOps =
    cacheStats.eidHits + cacheStats.eidMisses + cacheStats.selectorHits + cacheStats.selectorMisses;
  const totalCacheHits = cacheStats.eidHits + cacheStats.selectorHits;
  const cacheHitRate =
    totalCacheOps > 0 ? totalCacheHits / totalCacheOps : 0;

  return {
    results,
    failed,
    stats: {
      totalElements,
      successful: results.length,
      failed: failed.length,
      skipped,
      totalTimeMs: totalTime,
      avgTimePerElementMs:
        results.length > 0 ? totalTime / results.length : 0,
      cacheHitRate,
    },
  };
}

/**
 * Generate EID for specific elements
 */
export function generateEIDForElements(
  elements: Element[],
  options: Omit<BatchGeneratorOptions, 'root' | 'filter'> = {},
): BatchResult {
  const startTime = performance.now();
  const {
    limit = Infinity,
    onProgress,
    progressInterval = 100,
    skipNonSemantic = true,
    generatorOptions = {},
    cache,
    signal,
  } = options;

  const cacheInstance = cache ?? getGlobalCache();
  const mergedOptions = { ...generatorOptions, cache: cacheInstance };

  // Filter out skipped elements
  const filteredElements = elements.filter(
    (el) => !shouldSkipElement(el, skipNonSemantic),
  );

  // Sort by priority
  const sortedElements = sortElementsByPriority(filteredElements);

  // Apply limit
  const elementsToProcess = sortedElements.slice(0, limit);

  const results: BatchResult['results'] = [];
  const failed: BatchResult['failed'] = [];
  let skipped = 0;

  const totalElements = elementsToProcess.length;
  let lastProgressCall = 0;

  // Process elements
  for (let i = 0; i < elementsToProcess.length; i++) {
    // Check for cancellation
    if (signal?.aborted) {
      break;
    }

    const element = elementsToProcess[i];

    // Check cache first
    const cachedEID = cacheInstance.getEID(element);
    if (cachedEID) {
      results.push({
        element,
        eid: cachedEID,
        generationTimeMs: 0,
      });
    } else {
      // Generate EID
      const genStart = performance.now();
      try {
        const eid = generateEID(element, mergedOptions);
        const genTime = performance.now() - genStart;

        if (eid) {
          results.push({
            element,
            eid,
            generationTimeMs: genTime,
          });
        } else {
          skipped++;
        }
      } catch (error) {
        failed.push({
          element,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Call progress callback
    if (onProgress && i - lastProgressCall >= progressInterval) {
      onProgress(i + 1, totalElements);
      lastProgressCall = i;
    }
  }

  // Final progress call
  if (onProgress) {
    onProgress(totalElements, totalElements);
  }

  const totalTime = performance.now() - startTime;

  // Calculate cache hit rate
  const cacheStats = cacheInstance.getStats();
  const totalCacheOps =
    cacheStats.eidHits + cacheStats.eidMisses + cacheStats.selectorHits + cacheStats.selectorMisses;
  const totalCacheHits = cacheStats.eidHits + cacheStats.selectorHits;
  const cacheHitRate =
    totalCacheOps > 0 ? totalCacheHits / totalCacheOps : 0;

  return {
    results,
    failed,
    stats: {
      totalElements,
      successful: results.length,
      failed: failed.length,
      skipped,
      totalTimeMs: totalTime,
      avgTimePerElementMs:
        results.length > 0 ? totalTime / results.length : 0,
      cacheHitRate,
    },
  };
}
