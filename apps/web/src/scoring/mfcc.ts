/** MFCC index 0 tracks energy; shape lives in coefficients 1–12. */
const SHAPE_START_INDEX = 1;
const COSINE_MATCH_FLOOR = 0.15;
const SHAPE_EXPONENT = 1.0;
const SHAPE_BOOST = 0.16;
const SHAPE_FLOOR = 0.28;

function unitNormalize(values: number[]): number[] {
  const magnitude = Math.hypot(...values);
  if (magnitude < 1e-6) return values;
  return values.map((value) => value / magnitude);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function coefficientAgreement(mfcc: number[], profileMfcc: number[]): number {
  const len = Math.min(mfcc.length, profileMfcc.length);
  if (len <= SHAPE_START_INDEX) return 0;

  let agreement = 0;
  for (let i = SHAPE_START_INDEX; i < len; i++) {
    const tolerance = Math.max(Math.abs(profileMfcc[i]) * 0.75, 12);
    const error = Math.abs(mfcc[i] - profileMfcc[i]);
    agreement += Math.max(0, 1 - error / tolerance);
  }

  return agreement / (len - SHAPE_START_INDEX);
}

export function mfccShapeSimilarity(
  mfcc: number[],
  profileMfcc: number[],
): number {
  if (mfcc.length <= SHAPE_START_INDEX || profileMfcc.length <= SHAPE_START_INDEX) {
    return 0;
  }

  const shapeA = unitNormalize(mfcc.slice(SHAPE_START_INDEX));
  const shapeB = unitNormalize(profileMfcc.slice(SHAPE_START_INDEX));
  const cosine = Math.max(0, cosineSimilarity(shapeA, shapeB));

  const strictCosine = Math.max(
    0,
    (cosine - COSINE_MATCH_FLOOR) / (1 - COSINE_MATCH_FLOOR),
  );
  const agreement = coefficientAgreement(mfcc, profileMfcc);
  const blended = cosine * 0.15 + strictCosine * 0.3 + agreement * 0.55;
  const adjusted = blended ** SHAPE_EXPONENT + SHAPE_BOOST;

  return Math.min(1, Math.max(SHAPE_FLOOR, adjusted));
}
