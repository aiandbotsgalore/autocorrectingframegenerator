/**
 * Refinement Engine
 *
 * The single authority for image refinement orchestration.
 * Handles iteration state, evaluation comparison, strategy selection,
 * and intelligent stopping conditions.
 *
 * Upgraded to a consistent, judge-like system that converges toward
 * the best achievable image while preserving the user's original vision.
 */

import {
  generateImage,
  evaluateImage,
  generateCorrectedPrompt,
  extractIntentAnchor as extractIntentAnchorFromAPI,
  classifyFailureType,
} from '../utils/geminiApi';

import {
  extractCoreKeywords,
  compareResults,
  isAcceptable,
  sanitizePrompt,
  calculateSimilarity,
} from './utils';

import * as CONFIG from './constants';

// Re-export types from centralized types file
export type {
  IntentAnchor,
  ImageEvaluation,
  FailureType,
  StoppingReason,
  RefinementIteration,
  RefinementSession,
  IterationUpdate,
  FinalResult,
  NextActionDecision,
} from './types';

// ===========================
// SESSION MANAGEMENT
// ===========================

/**
 * Extract intent anchor with core keywords.
 * Wraps the API call and adds keyword extraction.
 */
async function extractIntentAnchor(
  userPrompt: string,
  apiKey: string
): Promise<import('./types').IntentAnchor> {
  // Get base intent anchor from API
  const baseAnchor = await extractIntentAnchorFromAPI(userPrompt, apiKey);

  // Extract and normalize core keywords
  const coreKeywords = extractCoreKeywords(userPrompt, {
    ...baseAnchor,
    coreKeywords: [], // Temporary empty array for extraction
  });

  return {
    ...baseAnchor,
    coreKeywords,
  };
}

/**
 * Start a new refinement session with full initialization.
 */
export async function startRefinementSession(
  userPrompt: string,
  apiKey: string,
  mode: 'simple' | 'pro' = 'pro'
): Promise<import('./types').RefinementSession> {
  // Extract and freeze the user's intent with core keywords
  const intentAnchor = await extractIntentAnchor(userPrompt, apiKey);

  // Enhance simple prompts with technical defaults
  const currentPrompt = mode === 'simple'
    ? enhanceSimplePrompt(userPrompt)
    : userPrompt;

  return {
    userPrompt,
    intentAnchor,
    currentPrompt,
    iterations: [],
    bestAcceptedResult: null,
    bestSeenResult: null,
    stoppingReason: null,
    isComplete: false,
    remainingRewriteBudget: CONFIG.REWRITE_BUDGET,
    lowConfidenceStreak: 0,
    consecutiveRegenerations: 0,
  };
}

/**
 * Run a single iteration with acceptance checking and similarity tracking.
 */
export async function runIteration(
  session: import('./types').RefinementSession,
  apiKey: string,
  onUpdate: (update: import('./types').IterationUpdate) => void
): Promise<import('./types').RefinementIteration> {
  const iteration = session.iterations.length + 1;

  // Update status: Generating
  onUpdate({
    iteration,
    status: iteration === 1
      ? 'Generating your first frame...'
      : `Creating refined version ${iteration}...`,
    image: null,
    accuracyScore: null,
    visionScore: null,
    confidence: null,
    evaluation: null,
    correctedPrompt: null,
  });

  // Generate image
  const imageData = await generateImage(session.currentPrompt, apiKey);

  // Update status: Evaluating
  onUpdate({
    iteration,
    status: 'Evaluating against your vision...',
    image: imageData,
    accuracyScore: null,
    visionScore: null,
    confidence: null,
    evaluation: null,
    correctedPrompt: null,
  });

  // Evaluate image with dual scoring + confidence
  const evaluation = await evaluateImage(
    imageData,
    session.userPrompt,
    session.intentAnchor,
    apiKey
  );

  // Calculate prompt similarity to detect drift
  const promptSimilarity = calculateSimilarity(
    session.userPrompt,
    session.currentPrompt
  );

  const result: import('./types').RefinementIteration = {
    iteration,
    image: imageData,
    accuracyScore: evaluation.accuracyScore,
    visionScore: evaluation.visionScore,
    confidence: evaluation.confidence,
    evaluation,
    prompt: session.currentPrompt,
    promptSimilarity,
    isAccepted: false, // Will be set by acceptance check
  };

  // Check if result passes acceptance criteria
  result.isAccepted = isAcceptable(result, true, CONFIG.SIMILARITY_FLOOR);

  // Update with scores
  const progressStatus = getProgressStatus(evaluation);
  onUpdate({
    iteration,
    status: progressStatus,
    image: imageData,
    accuracyScore: evaluation.accuracyScore,
    visionScore: evaluation.visionScore,
    confidence: evaluation.confidence,
    evaluation,
    correctedPrompt: null,
  });

  return result;
}

/**
 * Decide the next action based on current state with all adaptive stopping conditions.
 */
export function decideNextAction(
  session: import('./types').RefinementSession,
  currentIteration: import('./types').RefinementIteration
): import('./types').NextActionDecision {
  const { iterations, bestAcceptedResult, remainingRewriteBudget, lowConfidenceStreak } = session;
  const { visionScore } = currentIteration;

  // 1. CHECK TARGET ACHIEVED
  // Best accepted result meets both accuracy and vision targets
  if (
    bestAcceptedResult &&
    bestAcceptedResult.accuracyScore >= CONFIG.TARGET_ACCURACY &&
    bestAcceptedResult.visionScore >= CONFIG.MIN_VISION
  ) {
    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'target_achieved',
      explanation: 'Target quality thresholds achieved',
    };
  }

  // 2. CHECK VISION RISK
  // Current vision score dangerously low (prevents further vision drift)
  if (visionScore < CONFIG.MIN_VISION) {
    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'vision_risk_prevented',
      explanation: 'Stopping to protect original vision from further drift',
    };
  }

  // 3. CHECK LOW CONFIDENCE STALL
  // Persistent low confidence suggests unclear target or model limitation
  if (lowConfidenceStreak >= CONFIG.LOW_CONFIDENCE_STREAK_STOP) {
    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'low_confidence_stall',
      explanation: 'Evaluator confidence persistently low - target may be unclear',
    };
  }

  // 4. CHECK PLATEAU (DIMINISHING RETURNS)
  // Check accepted iterations only for plateau
  const acceptedIterations = iterations.filter(iter => iter.isAccepted);
  if (acceptedIterations.length >= CONFIG.PLATEAU_WINDOW + 1) {
    const recentAccepted = acceptedIterations.slice(-CONFIG.PLATEAU_WINDOW);
    const improvements = recentAccepted.map((iter, idx) => {
      if (idx === 0) return 0;
      return iter.accuracyScore - recentAccepted[idx - 1].accuracyScore;
    });

    const isPlateau = improvements.every(delta => Math.abs(delta) < CONFIG.MIN_ACCURACY_DELTA);

    if (isPlateau) {
      return {
        shouldContinue: false,
        action: 'stop',
        reason: 'diminishing_returns',
        explanation: 'Plateau detected - no meaningful improvement in recent iterations',
      };
    }
  }

  // 5. CHECK REWRITE BUDGET EXHAUSTION
  // Budget exhausted AND no improvement in recent accepted iterations
  if (remainingRewriteBudget <= 0) {
    if (acceptedIterations.length >= CONFIG.PLATEAU_WINDOW) {
      const recentAccepted = acceptedIterations.slice(-CONFIG.PLATEAU_WINDOW);
      const hasImprovement = recentAccepted.some((iter, idx) => {
        if (idx === 0) return false;
        return iter.accuracyScore > recentAccepted[idx - 1].accuracyScore + CONFIG.MIN_ACCURACY_DELTA;
      });

      if (!hasImprovement) {
        return {
          shouldContinue: false,
          action: 'stop',
          reason: 'rewrite_budget_exhausted',
          explanation: 'Rewrite budget exhausted without further improvement',
        };
      }
    }
  }

  // 6. CHECK MAX ITERATIONS
  if (iterations.length >= CONFIG.MAX_ITERATIONS) {
    // Check if we have any acceptable result
    if (!bestAcceptedResult) {
      return {
        shouldContinue: false,
        action: 'stop',
        reason: 'no_acceptable_result',
        explanation: 'Max iterations reached without achieving acceptable result',
      };
    }

    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'max_iterations_reached',
      explanation: 'Maximum iterations reached - returning best result',
    };
  }

  // 7. CHECK MODEL LIMITATION (persistent low confidence across all attempts)
  if (iterations.length >= 5) {
    const allConfidence = iterations.map(iter => iter.confidence);
    const avgConfidence = allConfidence.reduce((a, b) => a + b, 0) / allConfidence.length;

    if (avgConfidence < CONFIG.MIN_CONFIDENCE) {
      return {
        shouldContinue: false,
        action: 'stop',
        reason: 'model_limitation_inferred',
        explanation: 'Persistent low confidence suggests model capability limits',
      };
    }
  }

  // CONTINUE: Decide between regeneration and refinement
  const shouldRegenerate = shouldRegenerateNotRefine(
    currentIteration,
    iterations,
    session.consecutiveRegenerations
  );

  return {
    shouldContinue: true,
    action: shouldRegenerate ? 'regenerate' : 'refine',
    reason: null,
  };
}

/**
 * Determine if we should regenerate (same prompt) vs refine (new prompt).
 * Prefers regeneration when confidence is low or when unexpected regressions occur.
 */
function shouldRegenerateNotRefine(
  current: import('./types').RefinementIteration,
  history: import('./types').RefinementIteration[],
  consecutiveRegenerations: number
): boolean {
  const { visionScore, confidence, accuracyScore } = current;

  // Force refinement if we've hit the regeneration limit
  if (consecutiveRegenerations >= CONFIG.MAX_REGENERATIONS_PER_ITERATION) {
    return false;
  }

  // Prefer regeneration if confidence is low (unclear failure)
  if (confidence < CONFIG.REGENERATE_CONFIDENCE_THRESHOLD) {
    return true;
  }

  // Prefer regeneration if vision is stable but accuracy dropped unexpectedly
  // (suggests model variance rather than systematic failure)
  if (history.length > 0) {
    const previous = history[history.length - 1];
    const visionStable = Math.abs(visionScore - previous.visionScore) < CONFIG.STABLE_VISION_DELTA;
    const unexpectedDrop = accuracyScore < previous.accuracyScore - CONFIG.UNEXPECTED_REGRESSION_THRESHOLD;

    if (visionStable && unexpectedDrop) {
      return true; // Regenerate
    }
  }

  // If issues are vague or contradictory, try regeneration
  const issues = current.evaluation.issues;
  if (issues.length > 0 && issues.every(issue => issue.length < 15)) {
    return true; // Issues too vague
  }

  // Default to refinement for clear, actionable failures
  return false;
}

/**
 * Update best results using compareResults logic.
 * Tracks both bestAcceptedResult (must pass acceptance criteria)
 * and bestSeenResult (best raw scores regardless of acceptance).
 */
export function updateBestResults(
  session: import('./types').RefinementSession,
  currentIteration: import('./types').RefinementIteration
): void {
  // Update bestSeenResult (best raw scores, no acceptance check)
  if (!session.bestSeenResult) {
    session.bestSeenResult = currentIteration;
  } else {
    const comparison = compareResults(currentIteration, session.bestSeenResult);
    if (comparison === 'a') {
      session.bestSeenResult = currentIteration;
    }
  }

  // Update bestAcceptedResult (only if current passes acceptance criteria)
  if (currentIteration.isAccepted) {
    if (!session.bestAcceptedResult) {
      session.bestAcceptedResult = currentIteration;
    } else {
      const comparison = compareResults(currentIteration, session.bestAcceptedResult);
      if (comparison === 'a') {
        session.bestAcceptedResult = currentIteration;
      }
    }
  }
}

/**
 * Generate the next prompt (either regenerate or refine).
 * For refinement, uses sanitizePrompt to enforce keyword constraints.
 */
export async function generateNextPrompt(
  session: import('./types').RefinementSession,
  currentIteration: import('./types').RefinementIteration,
  action: 'regenerate' | 'refine',
  apiKey: string,
  onUpdate: (update: import('./types').IterationUpdate) => void
): Promise<string> {
  if (action === 'regenerate') {
    // Use the same prompt - no budget consumed
    currentIteration.action = 'regenerate';
    session.consecutiveRegenerations++;
    return session.currentPrompt;
  }

  // Reset regeneration counter on refinement
  session.consecutiveRegenerations = 0;

  // Consume rewrite budget
  session.remainingRewriteBudget--;

  // Classify failure type
  const failureType = classifyFailureType(currentIteration.evaluation.issues);
  currentIteration.failureType = failureType;
  currentIteration.action = 'refine';

  // Update status
  const mainIssue = currentIteration.evaluation.issues[0] || 'details';
  onUpdate({
    iteration: currentIteration.iteration,
    status: `Correcting ${mainIssue.toLowerCase().substring(0, 50)}...`,
    image: currentIteration.image,
    accuracyScore: currentIteration.accuracyScore,
    visionScore: currentIteration.visionScore,
    confidence: currentIteration.confidence,
    evaluation: currentIteration.evaluation,
    correctedPrompt: null,
  });

  // Generate corrected prompt with failure type and intent anchor
  const rawCorrectedPrompt = await generateCorrectedPrompt(
    currentIteration.image,
    session.userPrompt,
    session.intentAnchor,
    currentIteration.evaluation.issues,
    currentIteration.evaluation.strengths,
    failureType,
    apiKey
  );

  // Sanitize prompt to enforce keyword constraints and prevent drift
  const sanitizedPrompt = sanitizePrompt(rawCorrectedPrompt, session.intentAnchor);

  currentIteration.correctedPrompt = sanitizedPrompt;

  // Update with corrected prompt
  onUpdate({
    iteration: currentIteration.iteration,
    status: `Applying corrections for iteration ${currentIteration.iteration + 1}...`,
    image: currentIteration.image,
    accuracyScore: currentIteration.accuracyScore,
    visionScore: currentIteration.visionScore,
    confidence: currentIteration.confidence,
    evaluation: currentIteration.evaluation,
    correctedPrompt: sanitizedPrompt,
  });

  return sanitizedPrompt;
}

/**
 * Complete the refinement session with explanation.
 * Returns bestAcceptedResult or falls back to bestSeenResult if no acceptable results exist.
 */
export function completeSession(
  session: import('./types').RefinementSession,
  stoppingReason: import('./types').StoppingReason
): import('./types').FinalResult {
  session.isComplete = true;
  session.stoppingReason = stoppingReason;

  // Use bestAcceptedResult if available, otherwise fall back to bestSeenResult
  const bestResult = session.bestAcceptedResult || session.bestSeenResult!;
  const explanation = getStoppingExplanation(stoppingReason, bestResult, session.iterations.length);

  return {
    success: stoppingReason === 'target_achieved',
    result: bestResult,
    iterations: session.iterations.length,
    stoppingReason,
    stoppingExplanation: explanation,
  };
}

// ===========================
// HELPER FUNCTIONS
// ===========================

function enhanceSimplePrompt(simplePrompt: string): string {
  return `${simplePrompt}. Shot with 50mm focal length at eye level, f/4 depth of field. Natural lighting at 5500K color temperature. Cinematic 16:9 widescreen composition with balanced framing. Professional color grading with rich, saturated tones.`;
}

function getProgressStatus(evaluation: import('./types').ImageEvaluation): string {
  const score = evaluation.accuracyScore;

  if (score >= 95) {
    return '🎬 Professional quality achieved!';
  } else if (score >= 90) {
    return `Nearly there! ${score}% — refining final details...`;
  } else if (score >= 85) {
    return `Strong progress at ${score}% — continuing refinement...`;
  } else if (score >= 70) {
    return `${score}% quality — identifying improvements...`;
  } else {
    return `${score}% — analyzing and correcting...`;
  }
}

function getStoppingExplanation(
  reason: import('./types').StoppingReason,
  bestResult: import('./types').RefinementIteration,
  totalIterations: number
): string {
  const acc = Math.round(bestResult.accuracyScore);
  const vis = Math.round(bestResult.visionScore);
  const conf = Math.round(bestResult.confidence * 100);

  switch (reason) {
    case 'target_achieved':
      return `Target achieved! Professional quality reached with ${acc}% accuracy and ${vis}% vision preservation. Your original intent has been fully realized with ${conf}% evaluator confidence.`;

    case 'diminishing_returns':
      return `Refinement complete. Plateau detected - further iterations show minimal improvement. Best result: ${acc}% accuracy, ${vis}% vision preservation (${conf}% confidence).`;

    case 'vision_risk_prevented':
      return `Stopped to protect your original vision. Recent iterations risked drifting from your intent. Best preserved result: ${acc}% accuracy, ${vis}% vision (${conf}% confidence).`;

    case 'low_confidence_stall':
      return `Persistent low confidence detected. The evaluator struggled to assess recent iterations, suggesting the target may be ambiguous or beyond current capabilities. Best result: ${acc}% accuracy.`;

    case 'rewrite_budget_exhausted':
      return `Rewrite budget exhausted without further improvement. The system attempted ${CONFIG.REWRITE_BUDGET} refinements. Best achieved: ${acc}% accuracy, ${vis}% vision (${conf}% confidence).`;

    case 'model_limitation_inferred':
      return `Model capability limits detected. Average confidence remained low across ${totalIterations} iterations, suggesting the target exceeds current model capabilities. Best effort: ${acc}% accuracy.`;

    case 'max_iterations_reached':
      return `Maximum ${CONFIG.MAX_ITERATIONS} iterations reached. Returning best result: ${acc}% accuracy, ${vis}% vision preservation (${conf}% confidence).`;

    case 'no_acceptable_result':
      return `Unable to achieve acceptable result. After ${totalIterations} iterations, no result met the minimum vision threshold of ${CONFIG.MIN_VISION}%. Best attempt: ${acc}% accuracy, ${vis}% vision.`;

    default:
      return `Refinement complete with ${acc}% accuracy and ${vis}% vision preservation.`;
  }
}

// ===========================
// MAIN ORCHESTRATION
// ===========================

/**
 * Main entry point - Orchestrate the complete refinement process.
 * Upgraded to judge-like system with convergence toward best achievable result.
 */
export async function autoRefineImage(
  userPrompt: string,
  apiKey: string,
  mode: 'simple' | 'pro' = 'pro',
  onIterationUpdate: (update: import('./types').IterationUpdate) => void
): Promise<import('./types').FinalResult> {
  // Start refinement session (extract intent anchor with core keywords)
  const session = await startRefinementSession(userPrompt, apiKey, mode);

  // Main refinement loop
  while (true) {
    // Run iteration (generate + evaluate + check acceptance)
    const currentIteration = await runIteration(session, apiKey, onIterationUpdate);

    // Add to session history
    session.iterations.push(currentIteration);

    // Track low confidence streak
    if (currentIteration.confidence < CONFIG.MIN_CONFIDENCE) {
      session.lowConfidenceStreak++;
    } else {
      session.lowConfidenceStreak = 0; // Reset on good confidence
    }

    // Update best results (both accepted and seen)
    updateBestResults(session, currentIteration);

    // Decide next action (includes all stopping conditions)
    const decision = decideNextAction(session, currentIteration);

    if (!decision.shouldContinue) {
      // Complete session with explanation
      return completeSession(session, decision.reason!);
    }

    // Generate next prompt (regenerate or refine)
    const nextPrompt = await generateNextPrompt(
      session,
      currentIteration,
      decision.action as 'regenerate' | 'refine',
      apiKey,
      onIterationUpdate
    );

    // Update current prompt for next iteration
    session.currentPrompt = nextPrompt;

    // Delay before next iteration
    await new Promise(resolve => setTimeout(resolve, CONFIG.ITERATION_DELAY_MS));
  }
}
