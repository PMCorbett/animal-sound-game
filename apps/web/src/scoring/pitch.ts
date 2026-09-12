const MIN_PITCH_HZ = 60;
const MAX_PITCH_HZ = 800;

/**
 * Estimate fundamental frequency via autocorrelation.
 * Meyda has no YIN/pitch extractor, so we use this lightweight approach.
 */
export function estimatePitchHz(
  slice: Float32Array,
  sampleRate: number,
): number | null {
  const minPeriod = Math.floor(sampleRate / MAX_PITCH_HZ);
  const maxPeriod = Math.floor(sampleRate / MIN_PITCH_HZ);
  if (maxPeriod >= slice.length) return null;

  let bestCorrelation = 0;
  let bestPeriod = 0;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0;
    const limit = slice.length - period;
    for (let i = 0; i < limit; i++) {
      correlation += slice[i] * slice[i + period];
    }
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }

  if (bestPeriod === 0 || bestCorrelation <= 0) return null;
  return sampleRate / bestPeriod;
}
