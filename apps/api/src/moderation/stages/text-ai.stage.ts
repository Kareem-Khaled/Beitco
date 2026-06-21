/**
 * Text AI Stage — Toxicity, hate speech, sentiment analysis.
 *
 * This is Stage 2 of the 3-stage moderation pipeline.
 * Currently a STUB — returns clean results by default.
 * Ready for integration with real AI services (e.g., OpenAI Moderation API,
 * Google Perspective API, or a custom Arabic NLP model).
 */

import { ModerationFlag, ModerationResult } from './rules.stage';

/**
 * Stage 2: AI-based text analysis.
 *
 * When integrated with a real AI service, this would:
 * - Detect hate speech (Arabic + English)
 * - Detect toxicity / bullying
 * - Detect sexual content
 * - Detect self-harm / violence
 * - Detect religious / political extremism
 * - Provide confidence scores
 *
 * @param text - The text content to analyze
 * @returns ModerationResult with AI-generated flags
 */
export async function runTextAiStage(text: string | null | undefined): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { passed: true, flags: [], score: 0, autoAction: 'none' };
  }

  // ──────────────────────────────────────────────────────
  // STUB: In production, replace with real AI API call:
  //
  // const response = await fetch('https://api.openai.com/v1/moderations', {
  //   method: 'POST',
  //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ input: text }),
  // });
  // const data = await response.json();
  // ... process data.results[0].categories and data.results[0].category_scores
  // ──────────────────────────────────────────────────────

  const flags: ModerationFlag[] = [];

  // Dev stub: always returns clean
  return {
    passed: true,
    flags,
    score: 0,
    autoAction: 'none',
  };
}
