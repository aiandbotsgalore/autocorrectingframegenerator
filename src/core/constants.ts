/**
 * Refinement Engine Configuration Constants
 *
 * All thresholds and limits for the intelligent judge-like refinement system.
 * These values control when to stop, regenerate vs refine, and how to detect
 * regressions or plateaus.
 */

// ===========================
// ITERATION LIMITS
// ===========================

/**
 * Maximum total iterations before stopping regardless of quality.
 * Prevents infinite loops and excessive API costs.
 */
export const MAX_ITERATIONS = 10;

/**
 * Maximum regenerations (same prompt) per iteration before forcing refinement.
 * Allows exploring model variance without getting stuck.
 */
export const MAX_REGENERATIONS_PER_ITERATION = 2;

/**
 * Total rewrite budget across entire session.
 * Tracks cumulative prompt rewrites to prevent excessive refinement attempts.
 * When exhausted and no improvement in plateauWindow iterations, stop.
 */
export const REWRITE_BUDGET = 6;

/**
 * Maximum number of refinements allowed in a single session.
 * Protects against endless prompt churn when issues are non-actionable.
 */
export const MAX_REFINES = 3;

/**
 * Quality score threshold (0-100) that allows early stop when achieved.
 * Uses fixed computeQualityScore weights in utils.
 */
export const TARGET_QUALITY = 90;

// ===========================
// TARGET THRESHOLDS
// ===========================

/**
 * Target accuracy score (0-100) for successful completion.
 * Represents how well image matches the current prompt specifications.
 */
export const TARGET_ACCURACY = 95;

/**
 * Minimum vision score (0-100) that must be maintained.
 * Represents preservation of original user intent.
 * Results below this are rejected to prevent vision drift.
 */
export const MIN_VISION = 85;

/**
 * Maximum acceptable drop in vision score when improving accuracy.
 * Allows slight vision trade-offs for significant accuracy gains.
 */
export const VISION_TOLERANCE = 5;

// ===========================
// CONFIDENCE THRESHOLDS
// ===========================

/**
 * Minimum evaluator confidence (0-1) to accept a result.
 * Low confidence suggests unclear or ambiguous evaluation.
 */
export const MIN_CONFIDENCE = 0.65;

/**
 * Number of consecutive low-confidence evaluations before stopping.
 * Indicates model limitation or impossible target.
 */
export const LOW_CONFIDENCE_STREAK_STOP = 3;

// ===========================
// PLATEAU DETECTION
// ===========================

/**
 * Number of consecutive iterations to check for improvement plateau.
 * Used to detect diminishing returns.
 */
export const PLATEAU_WINDOW = 2;

/**
 * Minimum accuracy improvement (points) to not be considered a plateau.
 * If improvement is less than this for PLATEAU_WINDOW iterations, stop.
 */
export const MIN_ACCURACY_DELTA = 2;

/**
 * Minimum qualityScore improvement (%) to continue refining.
 * Prevents chasing noise when improvements are marginal.
 */
export const MIN_QUALITY_IMPROVEMENT = 1;

// ===========================
// PROMPT CONSTRAINTS
// ===========================

/**
 * Maximum words allowed in refined prompts.
 * Prevents prompt bloat that can confuse the generator.
 */
export const PROMPT_WORD_CAP = 90;

/**
 * Minimum words required in refined prompts.
 * Ensures sufficient detail for quality generation.
 */
export const PROMPT_WORD_MIN = 75;

// ===========================
// DRIFT SAFEGUARDS
// ===========================

/**
 * Minimum semantic similarity (0-1) between original and refined prompts.
 * If similarity drops below this, prompt has drifted too far from user intent.
 * Set to 0.78 to allow strategic refinement while preventing complete drift.
 */
export const SIMILARITY_FLOOR = 0.78;

/**
 * Number of core keywords (8-20) to extract from original prompt.
 * These keywords must be enforced in all refined prompts.
 */
export const MIN_CORE_KEYWORDS = 8;
export const MAX_CORE_KEYWORDS = 20;

// ===========================
// REGENERATE VS REFINE DECISION
// ===========================

/**
 * Confidence threshold below which to prefer regeneration over refinement.
 * Low confidence suggests unclear failure that may resolve with model variance.
 */
export const REGENERATE_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Minimum accuracy drop to consider unexpected regression.
 * If vision is stable but accuracy drops this much, likely model randomness.
 */
export const UNEXPECTED_REGRESSION_THRESHOLD = 5;

/**
 * Maximum vision delta to consider vision "stable" for regression detection.
 */
export const STABLE_VISION_DELTA = 3;

// ===========================
// ACCEPTANCE RULES
// ===========================

/**
 * Results must meet these criteria to be eligible for bestAcceptedResult:
 * 1. visionScore >= MIN_VISION
 * 2. confidence >= MIN_CONFIDENCE OR issues are clearly actionable
 * 3. prompt has not drifted beyond SIMILARITY_FLOOR (if drift checking enabled)
 */

// ===========================
// COMPARISON WEIGHTS
// ===========================

/**
 * Minimum accuracy difference to clearly prefer one result over another.
 * Differences smaller than this are considered ties.
 */
export const ACCURACY_TIE_THRESHOLD = 1;

/**
 * When accuracy is tied, vision score difference to prefer one result.
 */
export const VISION_TIE_THRESHOLD = 0;

// ===========================
// STOP WORD LIST FOR KEYWORD EXTRACTION
// ===========================

/**
 * Common words to exclude when extracting core keywords.
 * Focuses extraction on meaningful nouns and descriptive terms.
 */
export const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'can', 'of',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'this',
  'that', 'these', 'those', 'it', 'its', 'if', 'than', 'then', 'so',
  'very', 'just', 'also', 'only', 'any', 'some', 'all', 'no', 'not'
]);

// ===========================
// DELAY BETWEEN ITERATIONS
// ===========================

/**
 * Milliseconds to wait between iterations.
 * Prevents API rate limiting and allows time for UI updates.
 */
export const ITERATION_DELAY_MS = 2000;

// ===========================
// QUALITY SCORE WEIGHTS
// ===========================

/**
 * Fixed weights for quality score calculation.
 * Do not alter without updating regression expectations.
 */
export const QUALITY_CONFIG = {
  accuracyWeight: 0.4,
  visionWeight: 0.4,
  confidenceWeight: 0.2,
};
