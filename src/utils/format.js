/** Same heuristic as the backend TokenEstimator: ~4 characters per token. */
export function estimateTokens(text) {
  const trimmed = (text || '').trim();
  return trimmed.length === 0 ? 0 : Math.ceil(trimmed.length / 4);
}

export const formatNumber = (n) => Number(n).toLocaleString('en-US');

export function formatCompact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function formatDate(isoDate, options = { month: 'short', day: 'numeric' }) {
  // isoDate is "YYYY-MM-DD"; build it as a local date to avoid time-zone shifts
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', options);
}

export const PLANS = {
  FREE: { label: 'Free', rpm: 10, tokens: 50_000, price: 0 },
  PRO: { label: 'Pro', rpm: 60, tokens: 500_000, price: 19 },
  ENTERPRISE: { label: 'Enterprise', rpm: null, tokens: null, price: 99 },
};
