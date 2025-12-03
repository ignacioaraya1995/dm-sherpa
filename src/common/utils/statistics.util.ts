/**
 * Statistical utilities for experiment analysis and diagnostics
 */

/**
 * Calculate the sample size needed for an A/B test
 * @param baselineRate - Expected baseline conversion rate (e.g., 0.02 for 2%)
 * @param mde - Minimum Detectable Effect as a relative change (e.g., 0.2 for 20% lift)
 * @param alpha - Significance level (default 0.05)
 * @param power - Statistical power (default 0.80)
 */
export function calculateSampleSize(
  baselineRate: number,
  mde: number,
  alpha: number = 0.05,
  power: number = 0.8,
): number {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);

  // Z-scores for alpha and power
  const zAlpha = getZScore(1 - alpha / 2);
  const zBeta = getZScore(power);

  // Pooled standard deviation
  const p = (p1 + p2) / 2;
  const sd = Math.sqrt(2 * p * (1 - p));

  // Effect size
  const d = Math.abs(p2 - p1);

  // Sample size per group
  const n = Math.ceil(Math.pow((zAlpha + zBeta) * sd / d, 2));

  return n;
}

/**
 * Calculate the p-value for a two-proportion z-test
 */
export function calculatePValue(
  conversionsA: number,
  sampleA: number,
  conversionsB: number,
  sampleB: number,
): number {
  const pA = conversionsA / sampleA;
  const pB = conversionsB / sampleB;

  // Pooled proportion
  const pPooled = (conversionsA + conversionsB) / (sampleA + sampleB);

  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / sampleA + 1 / sampleB));

  if (se === 0) return 1;

  // Z-statistic
  const z = (pB - pA) / se;

  // Two-tailed p-value
  return 2 * (1 - normalCDF(Math.abs(z)));
}

/**
 * Calculate confidence interval for a proportion
 */
export function calculateConfidenceInterval(
  conversions: number,
  sample: number,
  confidence: number = 0.95,
): { lower: number; upper: number } {
  const p = conversions / sample;
  const z = getZScore((1 + confidence) / 2);
  const se = Math.sqrt((p * (1 - p)) / sample);

  return {
    lower: Math.max(0, p - z * se),
    upper: Math.min(1, p + z * se),
  };
}

/**
 * Calculate lift between control and variant
 */
export function calculateLift(
  controlRate: number,
  variantRate: number,
): { lift: number; relativeChange: number } {
  const lift = variantRate - controlRate;
  const relativeChange = controlRate > 0 ? lift / controlRate : 0;

  return { lift, relativeChange };
}

/**
 * Determine if a test has reached statistical significance
 */
export function isStatisticallySignificant(
  pValue: number,
  alpha: number = 0.05,
): boolean {
  return pValue < alpha;
}

/**
 * Check if sample size is sufficient for the test
 */
export function isSampleSizeSufficient(
  actualSample: number,
  requiredSample: number,
  threshold: number = 0.9,
): boolean {
  return actualSample >= requiredSample * threshold;
}

/**
 * Normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal CDF (Z-score lookup)
 */
function getZScore(probability: number): number {
  // Approximation of inverse normal CDF
  if (probability <= 0 || probability >= 1) {
    throw new Error('Probability must be between 0 and 1');
  }

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (probability < pLow) {
    q = Math.sqrt(-2 * Math.log(probability));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (probability <= pHigh) {
    q = probability - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - probability));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

/**
 * Calculate the coefficient of variation
 */
export function calculateCV(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Calculate percentile
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}
