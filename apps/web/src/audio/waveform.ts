const DEFAULT_BAR_COUNT = 80;

/** Peak amplitudes (0–1) for drawing a time-domain waveform. */
export function extractWaveformPeaks(
  buffer: AudioBuffer,
  barCount = DEFAULT_BAR_COUNT,
): number[] {
  const channel = buffer.getChannelData(0);
  if (channel.length === 0) return [];

  const samplesPerBar = Math.max(1, Math.floor(channel.length / barCount));
  const peaks: number[] = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar;
    const end = Math.min(start + samplesPerBar, channel.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      max = Math.max(max, Math.abs(channel[j]));
    }
    peaks.push(max);
  }

  const maxPeak = Math.max(...peaks, 0.001);
  return peaks.map((peak) => peak / maxPeak);
}
