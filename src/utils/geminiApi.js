import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateImage(prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image"
  });

  const result = await model.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio: '16:9'
      }
    }
  });

  const response = await result.response;

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('No image generated');
}

export async function evaluateImage(imageData, originalPrompt, intentAnchor, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp"
  });

  const base64Data = imageData.split(',')[1];
  const mimeType = imageData.split(';')[0].split(':')[1];

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  const evaluationPrompt = `You are an expert image quality evaluator for cinematic music video production. Analyze this 16:9 widescreen image against BOTH the current prompt AND the frozen user intent.

ORIGINAL USER SPECIFICATION (current prompt):
${originalPrompt}

FROZEN USER INTENT (core vision that must be preserved):
Subject: ${intentAnchor.subject}
Action: ${intentAnchor.action}
Environment: ${intentAnchor.environment}
Mood: ${intentAnchor.mood}
Style: ${intentAnchor.style}
Priority Elements: ${intentAnchor.priority.join(', ')}

DUAL SCORING REQUIREMENT:
You must provide TWO separate scores:

1. ACCURACY SCORE (0-100): How well does the image match the CURRENT PROMPT's literal specifications?
   - Subject Accuracy (0-20 pts): Are the correct objects/subjects present exactly as specified?
   - Composition (0-20 pts): Is the 16:9 cinematic framing and positioning correct? Rule of thirds? Depth layers?
   - Lighting (0-20 pts): Does lighting match? Direction, color temperature (Kelvin), quality, shadows?
   - Color Palette (0-20 pts): Are colors accurate? Correct tones and relationships?
   - Style/Mood (0-10 pts): Does atmosphere match what was requested?
   - Specific Details (0-10 pts): Are all explicitly mentioned details present and accurate?

2. VISION SCORE (0-100): How well does the image preserve the FROZEN USER INTENT's core vision?
   - Does it maintain the original subject and action?
   - Does it preserve the intended environment and mood?
   - Does it honor the style and priority elements?
   - Has the core vision drifted during refinement?

3. CONFIDENCE (0-1): How confident are you in this evaluation?
   - 1.0 = Very confident, clear success or failure
   - 0.7 = Moderately confident
   - 0.5 = Uncertain, ambiguous result
   - Lower = Very uncertain, may be model randomness

Return ONLY valid JSON (no markdown, no code blocks):
{
  "accuracyScore": [0-100, literal prompt match],
  "visionScore": [0-100, intent preservation],
  "confidence": [0-1, evaluator confidence],
  "issues": ["Detailed issue 1", "Detailed issue 2", "Detailed issue 3"],
  "strengths": ["What's correct 1", "What's correct 2", "What's correct 3"]
}`;

  const result = await model.generateContent([
    evaluationPrompt,
    imagePart
  ]);

  const response = await result.response;
  const text = response.text();

  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanText);
}

export async function generateCorrectedPrompt(imageData, originalPrompt, intentAnchor, issues, strengths, failureType, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp"
  });

  const base64Data = imageData.split(',')[1];
  const mimeType = imageData.split(';')[0].split(':')[1];

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  const failureStrategyGuide = getFailureStrategyGuide(failureType);

  const correctionPrompt = `You are an expert at creating image generation prompts for Gemini 2.5 Flash Image.

ORIGINAL USER SPECIFICATION:
${originalPrompt}

FROZEN USER INTENT (MUST PRESERVE):
Subject: ${intentAnchor.subject}
Action: ${intentAnchor.action}
Environment: ${intentAnchor.environment}
Mood: ${intentAnchor.mood}
Style: ${intentAnchor.style}
Priority Elements: ${intentAnchor.priority.join(', ')}

CURRENT IMAGE ISSUES (classified as ${failureType}):
${issues.join('\n- ')}

CURRENT IMAGE STRENGTHS (DO NOT CHANGE):
${strengths.join('\n- ')}

${failureStrategyGuide}

Create a NEW detailed prompt (75-150 words) that will generate an improved image.

CRITICAL REQUIREMENTS:
1. PRESERVE the frozen user intent above - these are non-negotiable core elements
2. PRESERVE all strengths - do not change what's working
3. Fix ALL identified issues with specific details using the failure-type strategy above
4. Use ONLY positive descriptions - state what SHOULD be present
5. NEVER use negative phrases: "remove", "without", "no", "fix", "don't", "avoid"
6. Include precise cinematographic terms (focal lengths, f-stops, color temps in Kelvin)
7. Account for 16:9 cinematic widescreen composition
8. Be 75-150 words total
9. Focus on observable visual elements
10. Ensure core intent keywords appear in the corrected prompt

Return ONLY the corrected prompt text (no explanations, no JSON, no preamble).`;

  const result = await model.generateContent([
    correctionPrompt,
    imagePart
  ]);

  const response = await result.response;
  return response.text().trim();
}

/**
 * Extract and freeze the user's intent as a non-mutable anchor
 */
export async function extractIntentAnchor(userPrompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp"
  });

  const intentPrompt = `Analyze this image generation prompt and extract the core intent that must be preserved across all refinements.

USER PROMPT:
${userPrompt}

Extract and return ONLY valid JSON (no markdown, no code blocks):
{
  "subject": "The main subject(s) - what/who is in the image",
  "action": "What the subject is doing or the scene depicts",
  "environment": "The setting, location, or background",
  "mood": "The emotional tone or atmosphere",
  "style": "Visual style, artistic approach, or aesthetic",
  "priority": ["3-5 most important elements that define this vision"]
}`;

  const result = await model.generateContent(intentPrompt);
  const response = await result.response;
  const text = response.text();

  const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanText);
}

/**
 * Classify the dominant failure type from issues
 */
export function classifyFailureType(issues) {
  const issueText = issues.join(' ').toLowerCase();

  if (issueText.includes('composition') || issueText.includes('framing') || issueText.includes('positioning')) {
    return 'composition';
  }
  if (issueText.includes('motion') || issueText.includes('movement') || issueText.includes('action')) {
    return 'motion';
  }
  if (issueText.includes('lighting') || issueText.includes('shadow') || issueText.includes('exposure')) {
    return 'lighting';
  }
  if (issueText.includes('style') || issueText.includes('aesthetic') || issueText.includes('mood')) {
    return 'style';
  }
  if (issueText.includes('color') || issueText.includes('palette') || issueText.includes('tone')) {
    return 'color';
  }
  if (issueText.includes('detail') || issueText.includes('missing') || issueText.includes('absent')) {
    return 'detail';
  }

  return 'general';
}

/**
 * Get failure-specific refinement strategy
 */
function getFailureStrategyGuide(failureType) {
  const strategies = {
    composition: `COMPOSITION FAILURE STRATEGY:
- Specify exact subject placement (left/center/right third, foreground/midground/background)
- Define camera angle and distance precisely (wide shot, medium shot, close-up, eye level, high angle, low angle)
- Clarify depth layers and what should be sharp vs blurred
- Use rule of thirds or other composition techniques explicitly`,

    motion: `MOTION FAILURE STRATEGY:
- Describe the exact phase of motion (beginning, middle, end of action)
- Specify motion blur intensity and direction
- Define frozen moment vs dynamic movement
- Clarify body positions and gestures precisely`,

    lighting: `LIGHTING FAILURE STRATEGY:
- Specify light direction (front, back, side, top, bottom)
- Define light quality (hard/soft, natural/artificial)
- State color temperature in Kelvin (2700K warm, 5500K daylight, 7000K cool)
- Describe shadow characteristics (deep, soft, absent)
- Specify time of day if natural light`,

    style: `STYLE FAILURE STRATEGY:
- Name specific artistic movements or references (cyberpunk, film noir, impressionist, etc.)
- Define render style (photorealistic, painterly, stylized, abstract)
- Specify texture quality (smooth, rough, glossy, matte)
- Reference specific color grading approaches (teal and orange, desaturated, vibrant)`,

    color: `COLOR FAILURE STRATEGY:
- Name specific colors for each major element
- Define color relationships (complementary, analogous, monochromatic)
- Specify saturation levels (vivid, muted, desaturated)
- State color temperature and contrast
- Reference color palettes or schemes`,

    detail: `DETAIL FAILURE STRATEGY:
- List ALL required elements explicitly by name
- Specify size, quantity, and characteristics of each element
- Define texture and material properties
- Describe fine details that must be present
- Use concrete nouns rather than abstract concepts`,

    general: `GENERAL REFINEMENT STRATEGY:
- Address each issue with specific, concrete details
- Add measurable specifications (distances, quantities, precise colors)
- Replace vague terms with technical cinematographic language
- Ensure all core elements are explicitly named`
  };

  return strategies[failureType] || strategies.general;
}

// TypeScript type exports for refinement engine
export const ImageEvaluation = {};
export const IntentAnchor = {};
export const FailureType = {};

export async function validateApiKey(apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    await model.generateContent("test");
    return true;
  } catch (error) {
    return false;
  }
}
