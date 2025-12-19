/**
 * Refinement Engine
 *
 * The single authority for image refinement orchestration.
 * Handles iteration state, evaluation comparison, strategy selection,
 * and intelligent stopping conditions.
 */

import {
  generateImage,
  evaluateImage,
  generateCorrectedPrompt,
  extractIntentAnchor,
  classifyFailureType,
} from '../utils/geminiApi';

// ===========================
// GEMINI API TYPES
// ===========================

export interface ImageEvaluation {
  accuracyScore: number;
  visionScore: number;
  confidence: number;
  issues: string[];
  strengths: string[];
}

export interface IntentAnchor {
  subject: string;
  action: string;
  environment: string;
  mood: string;
  style: string;
  priority: string[];
}

export type FailureType =
  | 'composition'
  | 'motion'
  | 'lighting'
  | 'style'
  | 'color'
  | 'detail'
  | 'general';

// ===========================
// TYPES
// ===========================

export interface RefinementIteration {
  iteration: number;
  image: string;
  accuracyScore: number;
  visionScore: number;
  confidence: number;
  evaluation: ImageEvaluation;
  prompt: string;
  correctedPrompt?: string;
  failureType?: FailureType;
  action?: 'regenerate' | 'refine';
}

export interface RefinementSession {
  userPrompt: string;
  intentAnchor: IntentAnchor;
  currentPrompt: string;
  iterations: RefinementIteration[];
  bestResult: RefinementIteration | null;
  stoppingReason: StoppingReason | null;
  isComplete: boolean;
}

export type StoppingReason =
  | 'target_achieved'
  | 'diminishing_returns'
  | 'vision_risk'
  | 'model_limitation'
  | 'best_achievable';

export interface IterationUpdate {
  iteration: number;
  status: string;
  image: string | null;
  accuracyScore: number | null;
  visionScore: number | null;
  confidence: number | null;
  evaluation: ImageEvaluation | null;
  correctedPrompt: string | null;
}

export interface FinalResult {
  success: boolean;
  result: RefinementIteration;
  iterations: number;
  stoppingReason: StoppingReason;
  stoppingExplanation: string;
}

// ===========================
// CONFIGURATION
// ===========================

const CONFIG = {
  // Target thresholds
  TARGET_ACCURACY: 95,
  TARGET_VISION: 90,

  // Tolerance settings
  VISION_TOLERANCE: 5, // Max acceptable vision score drop

  // Stopping condition thresholds
  PLATEAU_THRESHOLD: 2, // Score improvement less than this for 2 iterations = plateau
  MIN_CONFIDENCE_THRESHOLD: 0.6, // Low confidence across iterations

  // Iteration limits
  MAX_ITERATIONS: 10,
  MAX_REGENERATIONS: 2, // Max regenerations before forcing refinement

  // Delta tracking
  CONSECUTIVE_PLATEAUS_LIMIT: 2,
};

// ===========================
// SESSION MANAGEMENT
// ===========================

/**
 * Start a new refinement session
 */
export async function startRefinementSession(
  userPrompt: string,
  apiKey: string,
  mode: 'simple' | 'pro' = 'pro'
): Promise<RefinementSession> {
  // Extract and freeze the user's intent
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
    bestResult: null,
    stoppingReason: null,
    isComplete: false,
  };
}

/**
 * Run a single iteration
 */
export async function runIteration(
  session: RefinementSession,
  apiKey: string,
  onUpdate: (update: IterationUpdate) => void
): Promise<RefinementIteration> {
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

  const result: RefinementIteration = {
    iteration,
    image: imageData,
    accuracyScore: evaluation.accuracyScore,
    visionScore: evaluation.visionScore,
    confidence: evaluation.confidence,
    evaluation,
    prompt: session.currentPrompt,
  };

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
 * Decide the next action based on current state
 */
export function decideNextAction(
  session: RefinementSession,
  currentIteration: RefinementIteration
): {
  shouldContinue: boolean;
  action: 'regenerate' | 'refine' | 'stop';
  reason: StoppingReason | null;
} {
  const { iterations } = session;
  const { accuracyScore, visionScore } = currentIteration;

  // Check if target achieved
  if (accuracyScore >= CONFIG.TARGET_ACCURACY && visionScore >= CONFIG.TARGET_VISION) {
    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'target_achieved',
    };
  }

  // Check for vision drift (critical failure)
  if (visionScore < CONFIG.TARGET_VISION - CONFIG.VISION_TOLERANCE) {
    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'vision_risk',
    };
  }

  // Check for diminishing returns
  if (iterations.length >= CONFIG.CONSECUTIVE_PLATEAUS_LIMIT + 1) {
    const recentIterations = iterations.slice(-CONFIG.CONSECUTIVE_PLATEAUS_LIMIT);
    const deltas = recentIterations.map((iter, idx) => {
      if (idx === 0) return 0;
      return iter.accuracyScore - recentIterations[idx - 1].accuracyScore;
    });

    const isPlateau = deltas.every(delta => Math.abs(delta) < CONFIG.PLATEAU_THRESHOLD);

    if (isPlateau) {
      return {
        shouldContinue: false,
        action: 'stop',
        reason: 'diminishing_returns',
      };
    }
  }

  // Check for persistent low confidence
  if (iterations.length >= 3) {
    const recentConfidence = iterations.slice(-3).map(iter => iter.confidence);
    const avgConfidence = recentConfidence.reduce((a, b) => a + b, 0) / recentConfidence.length;

    if (avgConfidence < CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      return {
        shouldContinue: false,
        action: 'stop',
        reason: 'model_limitation',
      };
    }
  }

  // Check max iterations
  if (iterations.length >= CONFIG.MAX_ITERATIONS) {
    return {
      shouldContinue: false,
      action: 'stop',
      reason: 'best_achievable',
    };
  }

  // Decide between regeneration and refinement
  const shouldRegenerate = shouldRegenerateNotRefine(currentIteration, iterations);

  return {
    shouldContinue: true,
    action: shouldRegenerate ? 'regenerate' : 'refine',
    reason: null,
  };
}

/**
 * Determine if we should regenerate (same prompt) vs refine (new prompt)
 */
function shouldRegenerateNotRefine(
  current: RefinementIteration,
  history: RefinementIteration[]
): boolean {
  const { visionScore, confidence, accuracyScore } = current;

  // If vision is stable and accuracy dropped unexpectedly, likely model randomness
  if (history.length > 0) {
    const previous = history[history.length - 1];
    if (
      Math.abs(visionScore - previous.visionScore) < 3 &&
      accuracyScore < previous.accuracyScore - 5
    ) {
      return true; // Regenerate
    }
  }

  // If evaluator confidence is low, failure type is unclear
  if (confidence < 0.7) {
    return true; // Regenerate
  }

  // Count recent regenerations
  const recentRegenerations = history
    .slice(-CONFIG.MAX_REGENERATIONS)
    .filter(iter => iter.action === 'regenerate')
    .length;

  if (recentRegenerations >= CONFIG.MAX_REGENERATIONS) {
    return false; // Force refinement
  }

  // Default to refinement for clear, repeatable failures
  return false;
}

/**
 * Update the best result using Pareto improvement logic
 */
export function updateBestResult(
  session: RefinementSession,
  currentIteration: RefinementIteration
): void {
  const { bestResult } = session;

  if (!bestResult) {
    session.bestResult = currentIteration;
    return;
  }

  // Pareto improvement: only update if accuracy improves without degrading vision
  const accuracyImproved = currentIteration.accuracyScore > bestResult.accuracyScore;
  const visionSafe = currentIteration.visionScore >= bestResult.visionScore - CONFIG.VISION_TOLERANCE;

  if (accuracyImproved && visionSafe) {
    session.bestResult = currentIteration;
  }
}

/**
 * Generate the next prompt (either regenerate or refine)
 */
export async function generateNextPrompt(
  session: RefinementSession,
  currentIteration: RefinementIteration,
  action: 'regenerate' | 'refine',
  apiKey: string,
  onUpdate: (update: IterationUpdate) => void
): Promise<string> {
  if (action === 'regenerate') {
    // Use the same prompt
    currentIteration.action = 'regenerate';
    return session.currentPrompt;
  }

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
  const correctedPrompt = await generateCorrectedPrompt(
    currentIteration.image,
    session.userPrompt,
    session.intentAnchor,
    currentIteration.evaluation.issues,
    currentIteration.evaluation.strengths,
    failureType,
    apiKey
  );

  currentIteration.correctedPrompt = correctedPrompt;

  // Update with corrected prompt
  onUpdate({
    iteration: currentIteration.iteration,
    status: `Applying corrections for iteration ${currentIteration.iteration + 1}...`,
    image: currentIteration.image,
    accuracyScore: currentIteration.accuracyScore,
    visionScore: currentIteration.visionScore,
    confidence: currentIteration.confidence,
    evaluation: currentIteration.evaluation,
    correctedPrompt,
  });

  return correctedPrompt;
}

/**
 * Complete the refinement session with explanation
 */
export function completeSession(
  session: RefinementSession,
  stoppingReason: StoppingReason
): FinalResult {
  session.isComplete = true;
  session.stoppingReason = stoppingReason;

  const bestResult = session.bestResult!;
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

function getProgressStatus(evaluation: ImageEvaluation): string {
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
  reason: StoppingReason,
  bestResult: RefinementIteration,
  totalIterations: number
): string {
  switch (reason) {
    case 'target_achieved':
      return `Professional quality achieved! The image has reached ${bestResult.accuracyScore}% accuracy with ${bestResult.visionScore}% vision preservation. Your original intent has been fully realized.`;

    case 'diminishing_returns':
      return `Refinement complete. The system has detected diminishing returns across recent iterations. Best result achieved: ${bestResult.accuracyScore}% accuracy with ${bestResult.visionScore}% vision preservation.`;

    case 'vision_risk':
      return `Refinement stopped to protect your original vision. The best result (${bestResult.accuracyScore}% accuracy, ${bestResult.visionScore}% vision) preserves your intent while maximizing quality.`;

    case 'model_limitation':
      return `Model limitations detected. The evaluator's confidence remained low across multiple iterations, suggesting the target may exceed current model capabilities. Best achievable result: ${bestResult.accuracyScore}% accuracy.`;

    case 'best_achievable':
      return `Best achievable result delivered after ${totalIterations} iterations. Final quality: ${bestResult.accuracyScore}% accuracy with ${bestResult.visionScore}% vision preservation.`;

    default:
      return `Refinement complete with ${bestResult.accuracyScore}% accuracy.`;
  }
}

// ===========================
// MAIN ORCHESTRATION
// ===========================

/**
 * Main entry point - Orchestrate the complete refinement process
 * This replaces the old autoRefineImage function
 */
export async function autoRefineImage(
  userPrompt: string,
  apiKey: string,
  mode: 'simple' | 'pro' = 'pro',
  onIterationUpdate: (update: IterationUpdate) => void
): Promise<FinalResult> {
  // Start refinement session (extract intent anchor)
  const session = await startRefinementSession(userPrompt, apiKey, mode);

  // Main refinement loop
  while (true) {
    // Run iteration
    const currentIteration = await runIteration(session, apiKey, onIterationUpdate);

    // Add to session history
    session.iterations.push(currentIteration);

    // Update best result using Pareto improvement
    updateBestResult(session, currentIteration);

    // Decide next action
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
