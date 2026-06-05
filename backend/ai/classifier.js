/**
 * Lightweight NLP-style classifier for notifications.
 *
 * Produces three signals from a notification's title + message:
 *   1. priority  : High | Medium | Low      (weighted keyword + heuristic score)
 *   2. category  : security | billing | system | social | promo | general
 *   3. isSpam    : boolean                  (spammy-language + signal heuristics)
 *
 * Pure JS, no external API — runs locally so the demo works offline.
 * The scoring is intentionally transparent so reviewers can trace any verdict.
 */

const PRIORITY_LEXICON = {
  high: [
    'urgent', 'critical', 'asap', 'immediately', 'breach', 'failure',
    'failed', 'outage', 'down', 'compromised', 'unauthorized', 'security',
    'alert', 'emergency', 'expired', 'overdue', 'fraud', 'attack'
  ],
  medium: [
    'reminder', 'pending', 'review', 'approval', 'due', 'invoice',
    'update', 'maintenance', 'scheduled', 'meeting', 'deadline', 'action'
  ],
  low: [
    'newsletter', 'tip', 'welcome', 'hello', 'fyi', 'announcement',
    'promo', 'discount', 'sale', 'offer', 'subscribe', 'follow'
  ]
};

const CATEGORY_LEXICON = {
  security: ['login', 'password', 'breach', '2fa', 'unauthorized', 'security', 'verify', 'suspicious'],
  billing:  ['invoice', 'payment', 'charge', 'subscription', 'billing', 'refund', 'card', 'overdue'],
  system:   ['outage', 'deployment', 'server', 'cpu', 'memory', 'maintenance', 'downtime', 'api'],
  social:   ['mentioned', 'commented', 'liked', 'follow', 'message', 'invite', 'reply'],
  promo:    ['sale', 'discount', 'offer', 'deal', '%', 'coupon', 'limited', 'free']
};

const SPAM_LEXICON = [
  'win', 'winner', 'prize', 'congratulations', 'lottery', 'click here',
  'free money', 'guarantee', 'risk-free', 'crypto', 'bitcoin', 'investment opportunity',
  'act now', 'limited time', 'cheap', 'viagra', 'casino', '100% free'
];

function normalize(text = '') {
  return String(text).toLowerCase();
}

function countMatches(haystack, lexicon) {
  let count = 0;
  for (const term of lexicon) {
    if (haystack.includes(term)) count += 1;
  }
  return count;
}

function classifyPriority(text) {
  const high = countMatches(text, PRIORITY_LEXICON.high);
  const med  = countMatches(text, PRIORITY_LEXICON.medium);
  const low  = countMatches(text, PRIORITY_LEXICON.low);

  // exclamation/uppercase amplify urgency
  const exclaims = (text.match(/!/g) || []).length;
  const upperRatio = text.length
    ? (text.replace(/[^A-Z]/g, '').length / text.length)
    : 0;

  const highScore = high * 3 + (exclaims >= 2 ? 1 : 0) + (upperRatio > 0.3 ? 1 : 0);
  const medScore  = med  * 2;
  const lowScore  = low  * 1;

  if (highScore >= 3) return { priority: 'High',   score: highScore };
  if (medScore  >= 2) return { priority: 'Medium', score: medScore };
  if (lowScore  >= 1) return { priority: 'Low',    score: lowScore };
  // default — short, neutral notices fall to Medium so they're not lost
  return { priority: 'Medium', score: 0 };
}

function classifyCategory(text) {
  let best = { category: 'general', hits: 0 };
  for (const [category, lexicon] of Object.entries(CATEGORY_LEXICON)) {
    const hits = countMatches(text, lexicon);
    if (hits > best.hits) best = { category, hits };
  }
  return best.category;
}

function detectSpam(text) {
  const hits = countMatches(text, SPAM_LEXICON);
  const exclaims = (text.match(/!/g) || []).length;
  const hasMoneyEmoji = /(\$\$\$|💰|🤑)/.test(text);
  // 2+ spammy terms, or 1 + heavy exclamation/money signals
  return hits >= 2 || (hits >= 1 && (exclaims >= 3 || hasMoneyEmoji));
}

/**
 * @param {{ title?: string, message?: string }} notification
 * @returns {{ priority: 'High'|'Medium'|'Low', category: string, isSpam: boolean, score: number }}
 */
function classify(notification) {
  const text = `${normalize(notification.title)} ${normalize(notification.message)}`;
  const { priority, score } = classifyPriority(text);
  const category = classifyCategory(text);
  const isSpam = detectSpam(text);

  // Spam always trumps priority — surface it as Low and tag it
  return {
    priority: isSpam ? 'Low' : priority,
    category: isSpam ? 'promo' : category,
    isSpam,
    score
  };
}

module.exports = { classify };
