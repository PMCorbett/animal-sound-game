/**
 * Dynamic Time Warping — compares two sequences of different lengths.
 * Returns a normalized distance in [0, 1] where 0 is a perfect match.
 */
export function dtwDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 1;

  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(Infinity),
  );
  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      dp[i][j] =
        cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  const pathLength = n + m;
  const normalized = dp[n][m] / pathLength;
  return Math.min(1, normalized);
}

/** Steeper than linear — mediocre shape matches score much lower. */
export function dtwSimilarity(a: number[], b: number[]): number {
  const distance = dtwDistance(a, b);
  return Math.exp(-4 * distance);
}
