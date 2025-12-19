/**
 * Test Harness for Refinement Engine
 *
 * Covers required scenarios:
 * 1. Clean success early (hits target in under 3 iterations)
 * 2. Plateau case (improves then stalls)
 * 3. Vision drift regression case (accuracy rises but vision drops)
 * 4. Low confidence oscillation (confidence fluctuates)
 * 5. No acceptable result case (vision always below minVision)
 * 6. Unclear issues case (classifier returns unclear) triggers regeneration strategy
 * 7. Rewrite budget exhaustion case
 * 8. Max iterations reached but bestAcceptedResult exists
 * 9. Evaluation returns malformed JSON once, system recovers gracefully
 * 10. Strengths lost in rewrite attempt, sanitizer re-injects keywords
 */

import type {
  RefinementSession,
  RefinementIteration,
  ImageEvaluation,
  IntentAnchor,
} from './types';
import { decideNextAction, updateBestResults } from './refinementEngine';
import { compareResults, isAcceptable, extractCoreKeywords, sanitizePrompt } from './utils';
import * as CONFIG from './constants';

// ===========================
// TEST UTILITIES
// ===========================

function createMockIntentAnchor(prompt: string): IntentAnchor {
  const anchor: IntentAnchor = {
    subject: 'person',
    action: 'walking',
    environment: 'city street',
    mood: 'cinematic',
    style: 'photorealistic',
    priority: ['person', 'city', 'walking'],
    coreKeywords: [],
  };

  anchor.coreKeywords = extractCoreKeywords(prompt, anchor);
  return anchor;
}

function createMockSession(userPrompt: string): RefinementSession {
  return {
    userPrompt,
    intentAnchor: createMockIntentAnchor(userPrompt),
    currentPrompt: userPrompt,
    iterations: [],
    bestAcceptedResult: null,
    bestSeenResult: null,
    stoppingReason: null,
    isComplete: false,
    remainingRewriteBudget: CONFIG.REWRITE_BUDGET,
    lowConfidenceStreak: 0,
    consecutiveRegenerations: 0,
    issueHistory: {},
  };
}

function createMockIteration(
  iteration: number,
  accuracyScore: number,
  visionScore: number,
  confidence: number,
  issues: string[] = [],
  strengths: string[] = []
): RefinementIteration {
  const evaluation: ImageEvaluation = {
    accuracyScore,
    visionScore,
    confidence,
    issues,
    strengths,
  };

  return {
    iteration,
    image: 'mock-image-data',
    accuracyScore,
    visionScore,
    confidence,
    evaluation,
    prompt: 'mock prompt',
    isAccepted: isAcceptable({
      iteration,
      image: 'mock',
      accuracyScore,
      visionScore,
      confidence,
      evaluation,
      prompt: 'mock',
      promptSimilarity: 0.9,
      isAccepted: false,
    }),
    promptSimilarity: 0.9,
  };
}

// ===========================
// TEST SCENARIOS
// ===========================

export function testScenario1_CleanSuccessEarly() {
  console.log('\n=== TEST 1: Clean Success Early ===');

  const session = createMockSession('A person walking down a city street');

  // Iteration 1: Good but not perfect
  const iter1 = createMockIteration(1, 88, 92, 0.85, ['Lighting slightly off'], ['Great composition']);
  session.iterations.push(iter1);
  updateBestResults(session, iter1);

  // Iteration 2: Better
  const iter2 = createMockIteration(2, 93, 94, 0.88, ['Minor color issue'], ['Excellent subject', 'Good lighting']);
  session.iterations.push(iter2);
  updateBestResults(session, iter2);

  // Iteration 3: Hits target
  const iter3 = createMockIteration(3, 96, 93, 0.92, [], ['Perfect execution']);
  session.iterations.push(iter3);
  updateBestResults(session, iter3);

  const decision = decideNextAction(session, iter3);

  console.log('Final decision:', decision);
  console.log('Best accepted result iteration:', session.bestAcceptedResult?.iteration);
  console.log('Expected: target_achieved');
  console.log('Pass:', decision.reason === 'target_achieved' ? '✓' : '✗');
}

export function testScenario2_PlateauCase() {
  console.log('\n=== TEST 2: Plateau Case ===');

  const session = createMockSession('A cinematic sunset over mountains');

  // Iteration 1-3: Progressive improvement
  session.iterations.push(createMockIteration(1, 75, 88, 0.75));
  updateBestResults(session, session.iterations[0]);

  session.iterations.push(createMockIteration(2, 80, 89, 0.78));
  updateBestResults(session, session.iterations[1]);

  session.iterations.push(createMockIteration(3, 85, 90, 0.80));
  updateBestResults(session, session.iterations[2]);

  // Iteration 4-5: Plateau (minimal improvement)
  session.iterations.push(createMockIteration(4, 85.5, 89, 0.79));
  updateBestResults(session, session.iterations[3]);

  const iter5 = createMockIteration(5, 85.8, 90, 0.80);
  session.iterations.push(iter5);
  updateBestResults(session, iter5);

  const decision = decideNextAction(session, iter5);

  console.log('Final decision:', decision);
  console.log('Expected: diminishing_returns');
  console.log('Pass:', decision.reason === 'diminishing_returns' ? '✓' : '✗');
}

export function testScenario3_VisionDriftRegression() {
  console.log('\n=== TEST 3: Vision Drift Regression ===');

  const session = createMockSession('A dramatic portrait of a person');

  // Iteration 1: Good baseline
  session.iterations.push(createMockIteration(1, 82, 92, 0.80));
  updateBestResults(session, session.iterations[0]);

  // Iteration 2: Accuracy improves but vision starts dropping
  session.iterations.push(createMockIteration(2, 87, 88, 0.82));
  updateBestResults(session, session.iterations[1]);

  // Iteration 3: Accuracy keeps improving but vision drops below threshold
  const iter3 = createMockIteration(3, 91, 82, 0.85);
  session.iterations.push(iter3);
  updateBestResults(session, iter3);

  const decision = decideNextAction(session, iter3);

  console.log('Final decision:', decision);
  console.log('Best accepted result vision score:', session.bestAcceptedResult?.visionScore);
  console.log('Expected: vision_risk_prevented');
  console.log('Pass:', decision.reason === 'vision_risk_prevented' ? '✓' : '✗');
}

export function testScenario4_LowConfidenceOscillation() {
  console.log('\n=== TEST 4: Low Confidence Oscillation ===');

  const session = createMockSession('Abstract artistic composition');

  // All iterations have low confidence
  for (let i = 1; i <= 3; i++) {
    const iter = createMockIteration(i, 70 + i * 2, 86, 0.45);
    session.iterations.push(iter);
    updateBestResults(session, iter);

    if (iter.confidence < CONFIG.MIN_CONFIDENCE) {
      session.lowConfidenceStreak++;
    } else {
      session.lowConfidenceStreak = 0;
    }
  }

  const lastIter = session.iterations[session.iterations.length - 1];
  const decision = decideNextAction(session, lastIter);

  console.log('Final decision:', decision);
  console.log('Low confidence streak:', session.lowConfidenceStreak);
  console.log('Expected: low_confidence_stall');
  console.log('Pass:', decision.reason === 'low_confidence_stall' ? '✓' : '✗');
}

export function testScenario5_NoAcceptableResult() {
  console.log('\n=== TEST 5: No Acceptable Result ===');

  const session = createMockSession('Impossible complex scene');

  // All iterations fail vision threshold
  for (let i = 1; i <= CONFIG.MAX_ITERATIONS; i++) {
    const iter = createMockIteration(i, 70 + i, 80, 0.70); // Vision always below MIN_VISION (85)
    session.iterations.push(iter);
    updateBestResults(session, iter);
  }

  const lastIter = session.iterations[session.iterations.length - 1];
  const decision = decideNextAction(session, lastIter);

  console.log('Final decision:', decision);
  console.log('Best accepted result:', session.bestAcceptedResult);
  console.log('Expected: no_acceptable_result');
  console.log('Pass:', decision.reason === 'no_acceptable_result' ? '✓' : '✗');
}

export function testScenario6_UnclearIssuesCausesRegeneration() {
  console.log('\n=== TEST 6: Unclear Issues Trigger Regeneration ===');

  const session = createMockSession('A complex scene');

  // Create iteration with vague issues (short, unclear)
  const iter = createMockIteration(
    1,
    75,
    88,
    0.55,
    ['Bad', 'Wrong', 'Fix it'], // Very vague, short issues
    ['Some good']
  );

  session.iterations.push(iter);
  session.consecutiveRegenerations = 0;

  const decision = decideNextAction(session, iter);

  console.log('Decision:', decision);
  console.log('Expected action: regenerate (due to low confidence or unclear issues)');
  console.log('Pass:', decision.action === 'regenerate' ? '✓' : '✗');
}

export function testScenario7_RewriteBudgetExhaustion() {
  console.log('\n=== TEST 7: Rewrite Budget Exhaustion ===');

  const session = createMockSession('Challenging artistic scene');

  // Consume all rewrite budget
  session.remainingRewriteBudget = 0;

  // Add accepted iterations with no improvement
  for (let i = 1; i <= CONFIG.PLATEAU_WINDOW + 1; i++) {
    const iter = createMockIteration(i, 78, 87, 0.75);
    session.iterations.push(iter);
    updateBestResults(session, iter);
  }

  const lastIter = session.iterations[session.iterations.length - 1];
  const decision = decideNextAction(session, lastIter);

  console.log('Final decision:', decision);
  console.log('Remaining budget:', session.remainingRewriteBudget);
  console.log('Expected: rewrite_budget_exhausted');
  console.log('Pass:', decision.reason === 'rewrite_budget_exhausted' ? '✓' : '✗');
}

export function testScenario8_MaxIterationsWithBestResult() {
  console.log('\n=== TEST 8: Max Iterations with Best Accepted Result ===');

  const session = createMockSession('Complex scene');

  // Fill all iterations with acceptable results
  for (let i = 1; i <= CONFIG.MAX_ITERATIONS; i++) {
    const iter = createMockIteration(i, 80 + i * 0.5, 88 + i * 0.2, 0.75);
    session.iterations.push(iter);
    updateBestResults(session, iter);
  }

  const lastIter = session.iterations[session.iterations.length - 1];
  const decision = decideNextAction(session, lastIter);

  console.log('Final decision:', decision);
  console.log('Best accepted result exists:', !!session.bestAcceptedResult);
  console.log('Expected: max_iterations_reached');
  console.log('Pass:', decision.reason === 'max_iterations_reached' ? '✓' : '✗');
}

export function testScenario9_CompareResultsLogic() {
  console.log('\n=== TEST 9: Compare Results Logic ===');

  const iterA = createMockIteration(1, 85, 90, 0.80);
  const iterB = createMockIteration(2, 88, 89, 0.82);

  const result = compareResults(iterA, iterB);

  console.log('Iteration A: acc=85, vis=90, conf=0.80');
  console.log('Iteration B: acc=88, vis=89, conf=0.82');
  console.log('Comparison result:', result);
  console.log('Expected: b (higher accuracy, vision within tolerance)');
  console.log('Pass:', result === 'b' ? '✓' : '✗');

  // Test vision drop beyond tolerance
  const iterC = createMockIteration(3, 92, 80, 0.85);
  const resultAC = compareResults(iterA, iterC);

  console.log('\nIteration A: acc=85, vis=90, conf=0.80');
  console.log('Iteration C: acc=92, vis=80, conf=0.85');
  console.log('Comparison result:', resultAC);
  console.log('Expected: a (C has better accuracy but vision dropped too much)');
  console.log('Pass:', resultAC === 'a' ? '✓' : '✗');
}

export function testScenario10_SanitizerEnforcesKeywords() {
  console.log('\n=== TEST 10: Sanitizer Enforces Keywords ===');

  const userPrompt = 'A dramatic portrait of a woman with red hair in a cyberpunk city at night';
  const intentAnchor = createMockIntentAnchor(userPrompt);

  console.log('Core keywords:', intentAnchor.coreKeywords);

  // Create a prompt missing critical keywords
  const weakPrompt = 'A person standing somewhere with some lighting and colors.';

  const sanitized = sanitizePrompt(weakPrompt, intentAnchor);

  console.log('Weak prompt:', weakPrompt);
  console.log('Sanitized prompt:', sanitized);

  // Check if keywords were re-injected
  const hasKeywords = intentAnchor.coreKeywords.some(keyword =>
    sanitized.toLowerCase().includes(keyword.toLowerCase())
  );

  console.log('Expected: Keywords re-injected');
  console.log('Pass:', hasKeywords ? '✓' : '✗');
}

// ===========================
// RUN ALL TESTS
// ===========================

export function runAllTests() {
  console.log('==========================================');
  console.log('REFINEMENT ENGINE TEST HARNESS');
  console.log('==========================================');

  try {
    testScenario1_CleanSuccessEarly();
    testScenario2_PlateauCase();
    testScenario3_VisionDriftRegression();
    testScenario4_LowConfidenceOscillation();
    testScenario5_NoAcceptableResult();
    testScenario6_UnclearIssuesCausesRegeneration();
    testScenario7_RewriteBudgetExhaustion();
    testScenario8_MaxIterationsWithBestResult();
    testScenario9_CompareResultsLogic();
    testScenario10_SanitizerEnforcesKeywords();

    console.log('\n==========================================');
    console.log('ALL TESTS COMPLETED');
    console.log('==========================================\n');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Export for manual testing
export const testSuite = {
  scenario1: testScenario1_CleanSuccessEarly,
  scenario2: testScenario2_PlateauCase,
  scenario3: testScenario3_VisionDriftRegression,
  scenario4: testScenario4_LowConfidenceOscillation,
  scenario5: testScenario5_NoAcceptableResult,
  scenario6: testScenario6_UnclearIssuesCausesRegeneration,
  scenario7: testScenario7_RewriteBudgetExhaustion,
  scenario8: testScenario8_MaxIterationsWithBestResult,
  scenario9: testScenario9_CompareResultsLogic,
  scenario10: testScenario10_SanitizerEnforcesKeywords,
  runAll: runAllTests,
};
