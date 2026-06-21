/**
 * Moderation Rules Stage — Blocked words, spam patterns, URL filtering.
 *
 * This is Stage 1 of the 3-stage moderation pipeline.
 * Fast, synchronous, rule-based checks.
 */

// ─── BLOCKED WORDS (Arabic + English) ─────────────────
// These trigger immediate flagging. Expandable list.
const BLOCKED_WORDS_AR: string[] = [
  'نصب',
  'احتيال',
  'مخدرات',
  'حشيش',
  'سلاح',
  'قنبلة',
  'إرهاب',
  'تفجير',
];

const BLOCKED_WORDS_EN: string[] = [
  'scam',
  'fraud',
  'drugs',
  'weapon',
  'bomb',
  'terrorism',
  'explosive',
  'illegal',
  'counterfeit',
  'money laundering',
];

// ─── SPAM PATTERNS ─────────────────────────────────────
const SPAM_PATTERNS: RegExp[] = [
  // Repeated characters (5+ of the same)
  /(.)\1{4,}/,
  // Excessive caps (10+ consecutive)
  /[A-Z]{10,}/,
  // Phone numbers in content (suspicious — should use official channels)
  /(?:\+?20)?(?:01[0125]\d{8})/,
  // Excessive URLs (3+)
  /(https?:\/\/[^\s]+.*){3,}/s,
  // WhatsApp/Telegram links (often spam)
  /(?:wa\.me|t\.me|telegram\.me)\/[^\s]+/i,
  // Excessive emoji (20+ unicode emoji)
  /(?:[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][\s]*){20,}/u,
  // ALL CAPS Arabic (diacritics abuse)
  /[\u0610-\u061A\u064B-\u065F]{5,}/,
];

// ─── SUSPICIOUS URL DOMAINS ────────────────────────────
const SUSPICIOUS_DOMAINS: string[] = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  'ow.ly',
  'is.gd',
  't.co',
];

// ─── INTERFACES ────────────────────────────────────────

export interface ModerationFlag {
  stage: 'rules' | 'text_ai' | 'media_ai';
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export interface ModerationResult {
  passed: boolean;
  flags: ModerationFlag[];
  score: number; // 0 = clean, 100 = severely violating
  autoAction: 'none' | 'flag_for_review' | 'auto_reject';
}

// ─── RULES STAGE ───────────────────────────────────────

/**
 * Stage 1: Rule-based moderation.
 * Checks text content against blocked words, spam patterns, and suspicious URLs.
 */
export function runRulesStage(text: string | null | undefined): ModerationResult {
  const flags: ModerationFlag[] = [];

  if (!text || text.trim().length === 0) {
    return { passed: true, flags: [], score: 0, autoAction: 'none' };
  }

  const lowerText = text.toLowerCase();

  // Check blocked words (Arabic)
  for (const word of BLOCKED_WORDS_AR) {
    if (text.includes(word)) {
      flags.push({
        stage: 'rules',
        type: 'blocked_word',
        severity: 'high',
        details: `Blocked Arabic word detected: ${word}`,
      });
    }
  }

  // Check blocked words (English)
  for (const word of BLOCKED_WORDS_EN) {
    if (lowerText.includes(word)) {
      flags.push({
        stage: 'rules',
        type: 'blocked_word',
        severity: 'high',
        details: `Blocked English word detected: ${word}`,
      });
    }
  }

  // Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      flags.push({
        stage: 'rules',
        type: 'spam_pattern',
        severity: 'medium',
        details: `Spam pattern detected: ${pattern.source.slice(0, 50)}`,
      });
    }
  }

  // Check suspicious URLs
  for (const domain of SUSPICIOUS_DOMAINS) {
    if (lowerText.includes(domain)) {
      flags.push({
        stage: 'rules',
        type: 'suspicious_url',
        severity: 'medium',
        details: `Suspicious URL shortener detected: ${domain}`,
      });
    }
  }

  // Calculate score
  let score = 0;
  for (const flag of flags) {
    switch (flag.severity) {
      case 'critical': score += 40; break;
      case 'high': score += 25; break;
      case 'medium': score += 15; break;
      case 'low': score += 5; break;
    }
  }
  score = Math.min(score, 100);

  // Determine auto action
  let autoAction: ModerationResult['autoAction'] = 'none';
  if (score >= 50) {
    autoAction = 'auto_reject';
  } else if (score > 0) {
    autoAction = 'flag_for_review';
  }

  return {
    passed: flags.length === 0,
    flags,
    score,
    autoAction,
  };
}
