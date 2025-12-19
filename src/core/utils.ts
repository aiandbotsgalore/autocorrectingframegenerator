/**
 * Utility Functions for Refinement Engine
 *
 * Core utilities for keyword extraction, result comparison,
 * prompt sanitization, and drift detection.
 */

import type { IntentAnchor, RefinementIteration, ComparisonResult } from './types';
import {
  STOP_WORDS,
  MIN_CORE_KEYWORDS,
  MAX_CORE_KEYWORDS,
  PROMPT_WORD_CAP,
  PROMPT_WORD_MIN,
  MIN_VISION,
  MIN_CONFIDENCE,
  VISION_TOLERANCE,
  ACCURACY_TIE_THRESHOLD,
} from './constants';

// ===========================
// KEYWORD EXTRACTION & NORMALIZATION
// ===========================

/**
 * Extract and normalize core keywords from original prompt and intent anchor.
 * Returns 8-20 keywords that must be enforced in all refined prompts.
 *
 * Rules:
 * - Return 8 to 20 keywords max
 * - Include nouns and unique style terms
 * - Remove stop words
 * - Normalize case
 * - Deduplicate
 * - Include at least 3 tokens from subject/environment/action/mood/style combined
 */
export function extractCoreKeywords(
  originalPrompt: string,
  intentAnchor: IntentAnchor
): string[] {
  // Tokenize original prompt
  const promptTokens = tokenizeAndNormalize(originalPrompt);

  // Extract tokens from intent anchor fields
  const intentTokens = [
    ...tokenizeAndNormalize(intentAnchor.subject),
    ...tokenizeAndNormalize(intentAnchor.action),
    ...tokenizeAndNormalize(intentAnchor.environment),
    ...tokenizeAndNormalize(intentAnchor.mood),
    ...tokenizeAndNormalize(intentAnchor.style),
    ...intentAnchor.priority.flatMap(p => tokenizeAndNormalize(p)),
  ];

  // Combine and deduplicate
  const allTokens = [...new Set([...intentTokens, ...promptTokens])];

  // Filter out stop words and short tokens
  const filtered = allTokens.filter(
    token => !STOP_WORDS.has(token) && token.length >= 3
  );

  // Prioritize intent tokens and nouns
  const intentSet = new Set(intentTokens);
  const sorted = filtered.sort((a, b) => {
    const aIsIntent = intentSet.has(a);
    const bIsIntent = intentSet.has(b);

    if (aIsIntent && !bIsIntent) return -1;
    if (!aIsIntent && bIsIntent) return 1;

    // Prefer longer words (likely more specific)
    return b.length - a.length;
  });

  // Take top keywords within limits
  const keywords = sorted.slice(0, MAX_CORE_KEYWORDS);

  // Ensure minimum count
  if (keywords.length < MIN_CORE_KEYWORDS) {
    // Fall back: add more tokens from prompt even if shorter
    const additional = allTokens
      .filter(t => !keywords.includes(t) && t.length >= 2)
      .slice(0, MIN_CORE_KEYWORDS - keywords.length);

    keywords.push(...additional);
  }

  // Ensure we have at least 3 intent tokens
  const intentKeywords = keywords.filter(k => intentSet.has(k));
  if (intentKeywords.length < 3) {
    const needed = 3 - intentKeywords.length;
    const additionalIntent = intentTokens
      .filter(t => !keywords.includes(t))
      .slice(0, needed);

    keywords.push(...additionalIntent);
  }

  return keywords.slice(0, MAX_CORE_KEYWORDS);
}

/**
 * Tokenize text and normalize to lowercase, removing punctuation.
 */
function tokenizeAndNormalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Replace punctuation with space
    .split(/\s+/)              // Split on whitespace
    .filter(token => token.length > 0);
}

// ===========================
// RESULT COMPARISON
// ===========================

/**
 * Compare two refinement iterations and return which is better.
 * Follows strict rules to prevent regressions and prefer stability.
 *
 * Rules:
 * 1. Prefer higher accuracyScore
 * 2. Only accept accuracy gains if visionScore doesn't drop more than visionTolerance
 * 3. If accuracy ties within ACCURACY_TIE_THRESHOLD, prefer higher visionScore
 * 4. If both tie, prefer higher confidence
 * 5. If still tie, prefer earlier iteration (stability)
 */
export function compareResults(
  a: RefinementIteration,
  b: RefinementIteration
): ComparisonResult {
  const accDiff = a.accuracyScore - b.accuracyScore;
  const visDiff = a.visionScore - b.visionScore;

  // Check if B has significantly better accuracy without degrading vision
  if (
    accDiff <= -2 &&
    b.visionScore >= a.visionScore - VISION_TOLERANCE
  ) {
    return 'b';
  }

  // Check if A has significantly better accuracy without degrading vision
  if (
    accDiff >= 2 &&
    a.visionScore >= b.visionScore - VISION_TOLERANCE
  ) {
    return 'a';
  }

  // Accuracy is tied (within threshold)
  if (Math.abs(accDiff) < ACCURACY_TIE_THRESHOLD) {
    // Prefer higher vision
    if (visDiff > 0) return 'a';
    if (visDiff < 0) return 'b';

    // Vision tied, prefer higher confidence
    if (a.confidence > b.confidence) return 'a';
    if (a.confidence < b.confidence) return 'b';

    // Everything tied, prefer earlier (stability)
    return a.iteration <= b.iteration ? 'a' : 'b';
  }

  // Accuracy difference exists but not significant enough
  // Fall back to higher accuracy
  return accDiff > 0 ? 'a' : 'b';
}

// ===========================
// ACCEPTANCE CRITERIA
// ===========================

/**
 * Check if a result passes acceptance criteria to be eligible for bestAcceptedResult.
 *
 * Criteria:
 * - visionScore >= MIN_VISION
 * - confidence >= MIN_CONFIDENCE OR issues are clearly actionable
 * - (optional) prompt has not drifted beyond similarity floor
 */
export function isAcceptable(
  result: RefinementIteration,
  checkDrift: boolean = false,
  similarityFloor: number = 0.78
): boolean {
  // Must maintain minimum vision
  if (result.visionScore < MIN_VISION) {
    return false;
  }

  // Must have sufficient confidence OR actionable issues
  const hasGoodConfidence = result.confidence >= MIN_CONFIDENCE;
  const hasActionableIssues =
    result.evaluation.issues.length > 0 &&
    result.evaluation.issues.every(issue => issue.length >= 10);

  if (!hasGoodConfidence && !hasActionableIssues) {
    return false;
  }

  // Optional drift check
  if (checkDrift && result.promptSimilarity !== undefined) {
    if (result.promptSimilarity < similarityFloor) {
      return false;
    }
  }

  return true;
}

// ===========================
// PROMPT SANITIZATION
// ===========================

/**
 * Sanitize and enforce constraints on refined prompts.
 *
 * Rules:
 * - Enforce presence of coreKeywords
 * - Prevent prompt bloat beyond PROMPT_WORD_CAP
 * - Remove negative phrasing
 * - Ensure 75-140 words
 * - Ensure at least one sentence specifying subject/action/environment
 * - Ensure style/mood preserved
 */
export function sanitizePrompt(
  prompt: string,
  intentAnchor: IntentAnchor
): string {
  let sanitized = prompt.trim();

  // Remove common negative phrases
  const negativePatterns = [
    /\b(remove|without|no |don't|avoid|fix|never)\b/gi,
  ];

  negativePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Count words
  const words = sanitized.split(/\s+/);
  let wordCount = words.length;

  // Enforce keyword presence
  const missingKeywords = intentAnchor.coreKeywords.filter(
    keyword => !sanitized.toLowerCase().includes(keyword.toLowerCase())
  );

  if (missingKeywords.length > 0) {
    // Add critical missing keywords naturally
    const criticalMissing = missingKeywords.slice(0, 3);
    sanitized += `. Features ${criticalMissing.join(', ')}`;
    wordCount = sanitized.split(/\s+/).length;
  }

  // Trim if too long
  if (wordCount > PROMPT_WORD_CAP) {
    const trimmed = words.slice(0, PROMPT_WORD_CAP).join(' ');
    sanitized = trimmed + '.';
    wordCount = PROMPT_WORD_CAP;
  }

  // Pad if too short
  if (wordCount < PROMPT_WORD_MIN) {
    // Add technical details from intent anchor
    const padding = `${intentAnchor.style} style in ${intentAnchor.environment} setting, ${intentAnchor.mood} mood.`;
    sanitized += ' ' + padding;
  }

  // Ensure proper sentence structure
  if (!sanitized.match(/[.!?]$/)) {
    sanitized += '.';
  }

  return sanitized.trim();
}

// ===========================
// SIMILARITY CALCULATION
// ===========================

/**
 * Calculate semantic similarity between two prompts.
 * Uses simple word overlap (Jaccard similarity) as approximation.
 * For production, consider using embedding-based similarity.
 *
 * Returns value between 0 (no overlap) and 1 (identical).
 */
export function calculateSimilarity(prompt1: string, prompt2: string): number {
  const tokens1 = new Set(tokenizeAndNormalize(prompt1));
  const tokens2 = new Set(tokenizeAndNormalize(prompt2));

  const intersection = new Set(
    [...tokens1].filter(token => tokens2.has(token))
  );

  const union = new Set([...tokens1, ...tokens2]);

  // Jaccard similarity
  return union.size > 0 ? intersection.size / union.size : 0;
}

// ===========================
// WORD COUNT VALIDATION
// ===========================

/**
 * Count words in a prompt.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Check if prompt word count is within acceptable range.
 */
export function isWordCountValid(text: string): boolean {
  const count = countWords(text);
  return count >= PROMPT_WORD_MIN && count <= PROMPT_WORD_CAP;
}
