import { KeywordDifficultyTier, KeywordIntent } from "./types";

/**
 * Classifies search intent based on linguistic patterns and lexical triggers.
 */
export function classifyKeywordIntent(keyword: string): KeywordIntent {
  const lower = keyword.toLowerCase().trim();

  // 1. Transactional Signals (Intent to purchase / take immediate action)
  const transactionalTriggers = [
    /\b(buy|purchase|order|discount|coupon|promo code|deal|cheap|pricing|price|cost|shop|sale|hire|checkout|for sale)\b/i,
    /\b(near me|online store|free trial|subscribe|book now)\b/i,
  ];
  if (transactionalTriggers.some((re) => re.test(lower))) {
    return "Transactional";
  }

  // 2. Commercial Investigation (Comparison, reviews, top lists)
  const commercialTriggers = [
    /\b(best|top|vs|versus|review|reviews|comparison|compare|alternatives?|rated|benchmark|features|software|tool|tools|agency|services?)\b/i,
  ];
  if (commercialTriggers.some((re) => re.test(lower))) {
    return "Commercial";
  }

  // 3. Navigational (Looking for specific brand, login, or portal)
  const navigationalTriggers = [
    /\b(login|log in|signin|sign in|portal|dashboard|official site|website|app download|account|support desk)\b/i,
  ];
  if (navigationalTriggers.some((re) => re.test(lower))) {
    return "Navigational";
  }

  // 4. Default: Informational (Seeking knowledge, guides, questions)
  return "Informational";
}

/**
 * Maps 0-100 numerical Keyword Difficulty (KD) to intuitive tier labels.
 */
export function getDifficultyTier(kd: number): KeywordDifficultyTier {
  if (kd <= 29) return "Easy";
  if (kd <= 49) return "Possible";
  if (kd <= 69) return "Hard";
  return "Very Hard";
}
