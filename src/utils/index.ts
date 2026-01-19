// Constants
export {
  EID_VERSION,
  MAX_PATH_DEPTH,
  CONFIDENCE_WEIGHTS,
  ANCHOR_SCORE,
  PATH_SCORE,
  SEMANTIC_ANCHOR_TAGS,
  ROLE_ANCHOR_VALUES,
  SEMANTIC_TAGS,
  SEMANTIC_ATTRIBUTES,
  ATTRIBUTE_PRIORITY,
  IGNORED_ATTRIBUTES,
  DEFAULT_GENERATOR_OPTIONS,
  DEFAULT_RESOLVER_OPTIONS,
} from './constants';

// Text normalization
export { normalizeText } from './text-normalizer';

// Class filtering
export { filterClasses, isUtilityClass, getClassScore } from './class-filter';

// Class classification
export {
  classifyClass,
  isDynamicClass,
  isUtilityClass as isUtilityClassFromClassifier,
  isSemanticClass,
  isStableClass,
  filterStableClasses,
  filterSemanticClasses,
  scoreClass,
  type ClassClassification,
} from './class-classifier';

// Attribute cleaning
export {
  cleanAttributeValue,
  type CleanAttributeOptions,
} from './attribute-cleaner';

// ID validation
export { isDynamicId, isStableId } from './id-validator';

// Scoring
export { calculateConfidence, calculateElementScore } from './scorer';

// Validation
export { validateEID, isEID } from './validator';

// SEQL Selector Parser
export {
  parseSEQL,
  stringifySEQL,
  generateSEQL,
  resolveSEQL
} from './seql-parser';

// Cache
export {
  EIDCache,
  createEIDCache,
  getGlobalCache,
  resetGlobalCache,
  type CacheStats,
  type EIDCacheOptions,
} from './eid-cache';

// Batch generation
export {
  generateEIDBatch,
  generateEIDForElements,
  type BatchGeneratorOptions,
  type BatchResult,
} from './batch-generator';
