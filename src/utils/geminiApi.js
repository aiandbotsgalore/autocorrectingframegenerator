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

export async function evaluateImage(imageData, originalPrompt, apiKey) {
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

  const evaluationPrompt = `You are an expert image quality evaluator for cinematic music video production. Analyze this 16:9 widescreen image against the original specification.

ORIGINAL SPECIFICATION:
${originalPrompt}

EVALUATION CRITERIA (score each):
1. Subject Accuracy (0-20 pts): Are the correct objects/subjects present exactly as specified?
2. Composition (0-20 pts): Is the 16:9 cinematic framing and positioning correct? Rule of thirds? Depth layers?
3. Lighting (0-20 pts): Does lighting match? Direction, color temperature (Kelvin), quality, shadows?
4. Color Palette (0-20 pts): Are colors accurate? Correct tones and relationships?
5. Style/Mood (0-10 pts): Does atmosphere match what was requested?
6. Specific Details (0-10 pts): Are all explicitly mentioned details present and accurate?

SCORING GUIDE:
95-100: Professional quality, all elements correct
85-94: Good quality, minor issues only
70-84: Acceptable, notable problems
Below 70: Significant issues

Return ONLY valid JSON (no markdown, no code blocks):
{
  "score": [total 0-100],
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

export async function generateCorrectedPrompt(imageData, originalPrompt, issues, apiKey) {
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

  const correctionPrompt = `You are an expert at creating image generation prompts for Gemini 2.5 Flash Image.

ORIGINAL USER SPECIFICATION:
${originalPrompt}

CURRENT IMAGE ISSUES:
${issues.join('\n- ')}

Create a NEW detailed prompt (75-150 words) that will generate an improved image.

REQUIREMENTS:
1. Fix ALL identified issues with specific details
2. Preserve ALL correct elements from original
3. Use ONLY positive descriptions - state what SHOULD be present
4. NEVER use negative phrases: "remove", "without", "no", "fix", "don't", "avoid"
5. Include precise cinematographic terms (focal lengths, f-stops, color temps in Kelvin)
6. Account for 16:9 cinematic widescreen composition
7. Be 75-150 words total
8. Focus on observable visual elements

Return ONLY the corrected prompt text (no explanations, no JSON, no preamble).`;

  const result = await model.generateContent([
    correctionPrompt,
    imagePart
  ]);

  const response = await result.response;
  return response.text().trim();
}

export async function autoRefineImage(userPrompt, apiKey, onIterationUpdate) {
  const maxIterations = 10;
  let iteration = 0;
  let currentPrompt = userPrompt;
  let bestResult = null;

  while (iteration < maxIterations) {
    iteration++;

    try {
      onIterationUpdate({
        iteration,
        status: 'Generating image...',
        image: null,
        score: null,
        evaluation: null,
        correctedPrompt: null
      });

      const imageData = await generateImage(currentPrompt, apiKey);

      onIterationUpdate({
        iteration,
        status: 'Analyzing quality...',
        image: imageData,
        score: null,
        evaluation: null,
        correctedPrompt: null
      });

      const evaluation = await evaluateImage(imageData, userPrompt, apiKey);

      const result = {
        iteration,
        image: imageData,
        score: evaluation.score,
        evaluation,
        prompt: currentPrompt
      };

      bestResult = result;

      onIterationUpdate({
        iteration,
        status: evaluation.score >= 95 ? 'Target achieved!' : 'Evaluation complete',
        image: imageData,
        score: evaluation.score,
        evaluation,
        correctedPrompt: null
      });

      if (evaluation.score >= 95) {
        return { success: true, result: bestResult, iterations: iteration };
      }

      onIterationUpdate({
        iteration,
        status: 'Creating correction...',
        image: imageData,
        score: evaluation.score,
        evaluation,
        correctedPrompt: null
      });

      const correctedPrompt = await generateCorrectedPrompt(
        imageData,
        userPrompt,
        evaluation.issues,
        apiKey
      );

      currentPrompt = correctedPrompt;

      onIterationUpdate({
        iteration,
        status: 'Generating next iteration...',
        image: imageData,
        score: evaluation.score,
        evaluation,
        correctedPrompt
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`Error in iteration ${iteration}:`, error);
      throw error;
    }
  }

  return { success: false, result: bestResult, iterations: maxIterations };
}

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
