/**
 * Type Definitions for Refinement Engine
 *
 * Central type definitions for the intelligent judge-like refinement system.
 */

// ===========================
// INTENT ANCHOR
// ===========================

/**
 * Frozen representation of the user's original intent.
 * Extracted once at session start and never modified.
 * Used to prevent vision drift during iterative refinement.
 */
export interface IntentAnchor {
  /** Main subject(s) in the image */
  subject: string;

  /** What the subject is doing or the scene depicts */
  action: string;

  /** Setting, location, or background */
  environment: string;

  /** Emotional tone or atmosphere */
  mood: string;

  /** Visual style, artistic approach, or aesthetic */
  style: string;

  /** 3-5 most important elements that define this vision */
  priority: string[];

  /**
   * 8-20 normalized core keywords extracted from original prompt.
   * Must be enforced in all refined prompts to prevent drift.
   * Derived from subject, action, environment, mood, style plus key nouns.
   */
  coreKeywords: string[];
}

// ===========================
// EVALUATION
// ===========================

/**
 * Dual-score evaluation result with confidence.
 */
export interface ImageEvaluation {
  /** How well image matches current prompt (0-100) */
  accuracyScore: number;

  /** How well image preserves original user intent (0-100) */
  visionScore: number;

  /** Evaluator confidence in this assessment (0-1) */
  confidence: number;

  /** Specific problems identified in the image */
  issues: string[];

  /** What's working well (to preserve in refinements) */
  strengths: string[];
}

// ===========================
// FAILURE CLASSIFICATION
// ===========================

/**
 * Categories of image generation failures.
 * Used to select targeted refinement strategies.
 */
export type FailureType =
  | 'composition'    // Framing, positioning, rule of thirds issues
  | 'motion'         // Movement, action, blur problems
  | 'lighting'       // Light direction, shadows, color temperature
  | 'style'          // Artistic style, mood, aesthetic issues
  | 'color'          // Color palette, saturation, tone problems
  | 'detail'         // Missing elements, insufficient detail
  | 'missing_subject' // Core subject absent or wrong
  | 'detail_omission' // Specific details missing
  | 'general'        // General issues (from geminiApi.js)
  | 'unclear';       // Ambiguous or unclassifiable issues

// ===========================
// STOPPING REASONS
// ===========================

/**
 * Reasons why the refinement process stopped.
 * Determines the explanation shown to user.
 */
export type StoppingReason =
  | 'target_achieved'           // Hit target accuracy + vision thresholds
  | 'diminishing_returns'       // Plateau detected, no improvement
  | 'vision_risk_prevented'     // Stopped to protect original vision
  | 'low_confidence_stall'      // Persistent low confidence across iterations
  | 'rewrite_budget_exhausted'  // Used all rewrite attempts without improvement
  | 'model_limitation_inferred' // Target likely exceeds model capabilities
  | 'max_iterations_reached'    // Hit iteration limit
  | 'no_acceptable_result';     // No result passed acceptance criteria

// ===========================
// ITERATION TRACKING
// ===========================

/**
 * Single iteration result with all metadata.
 */
export interface RefinementIteration {
  /** Iteration number (1-indexed) */
  iteration: number;

  /** Base64-encoded image data */
  image: string;

  /** Accuracy score for this iteration */
  accuracyScore: number;

  /** Vision score for this iteration */
  visionScore: number;

  /** Evaluator confidence for this iteration */
  confidence: number;

  /** Full evaluation details */
  evaluation: ImageEvaluation;

  /** Prompt used to generate this image */
  prompt: string;

  /** Corrected prompt generated (if action was 'refine') */
  correctedPrompt?: string;

  /** Classified failure type (if applicable) */
  failureType?: FailureType;

  /** Action taken: regenerate same prompt or refine with corrections */
  action?: 'regenerate' | 'refine';

  /**
   * Whether this result passed acceptance criteria.
   * Only accepted results are eligible for bestAcceptedResult.
   */
  isAccepted?: boolean;

  /**
   * Semantic similarity to original prompt (0-1).
   * Used to detect drift.
   */
  promptSimilarity?: number;
}

// ===========================
// SESSION STATE
// ===========================

/**
 * Complete refinement session state.
 * Tracks all iterations, best result, and stopping conditions.
 */
export interface RefinementSession {
  /** Original user prompt (never modified) */
  userPrompt: string;

  /** Frozen intent anchor extracted at start */
  intentAnchor: IntentAnchor;

  /** Current prompt being used for next iteration */
  currentPrompt: string;

  /** All iterations performed so far */
  iterations: RefinementIteration[];

  /**
   * Best accepted result so far.
   * Must pass acceptance criteria (vision >= MIN_VISION, confidence >= MIN_CONFIDENCE).
   * Selected using compareResults logic.
   */
  bestAcceptedResult: RefinementIteration | null;

  /**
   * Best raw result regardless of acceptance (for debugging).
   * May have higher accuracy but failed acceptance criteria.
   */
  bestSeenResult: RefinementIteration | null;

  /** Why the session stopped (null if still running) */
  stoppingReason: StoppingReason | null;

  /** Whether session is complete */
  isComplete: boolean;

  /** Remaining rewrite budget */
  remainingRewriteBudget: number;

  /** Count of consecutive low-confidence evaluations */
  lowConfidenceStreak: number;

  /** Count of consecutive regenerations in current iteration */
  consecutiveRegenerations: number;
}

// ===========================
// REAL-TIME UPDATES
// ===========================

/**
 * Progress update sent to UI during iteration.
 */
export interface IterationUpdate {
  /** Current iteration number */
  iteration: number;

  /** Status message */
  status: string;

  /** Image data (null until generated) */
  image: string | null;

  /** Accuracy score (null until evaluated) */
  accuracyScore: number | null;

  /** Vision score (null until evaluated) */
  visionScore: number | null;

  /** Confidence (null until evaluated) */
  confidence: number | null;

  /** Full evaluation (null until evaluated) */
  evaluation: ImageEvaluation | null;

  /** Corrected prompt (null until generated) */
  correctedPrompt: string | null;
}

// ===========================
// FINAL RESULT
// ===========================

/**
 * Final refinement result returned to user.
 */
export interface FinalResult {
  /** Whether target was achieved */
  success: boolean;

  /** Best accepted result */
  result: RefinementIteration;

  /** Total iterations performed */
  iterations: number;

  /** Why refinement stopped */
  stoppingReason: StoppingReason;

  /** User-friendly explanation of stopping reason */
  stoppingExplanation: string;
}

// ===========================
// DECISION OUTPUTS
// ===========================

/**
 * Decision output from decideNextAction.
 */
export interface NextActionDecision {
  /** Whether to continue iterating */
  shouldContinue: boolean;

  /** Action to take: regenerate, refine, or stop */
  action: 'regenerate' | 'refine' | 'stop';

  /** Reason for stopping (null if continuing) */
  reason: StoppingReason | null;

  /** Detailed explanation of decision */
  explanation?: string;
}

// ===========================
// COMPARISON RESULT
// ===========================

/**
 * Result of comparing two iterations.
 */
export type ComparisonResult = 'a' | 'b' | 'tie';
