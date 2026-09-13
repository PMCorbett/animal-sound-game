import { WaveformDisplay } from "./WaveformDisplay";

interface WaveformCompareProps {
  referencePeaks: number[];
  recordingPeaks: number[];
  referenceLabel: string;
}

export function WaveformCompare({
  referencePeaks,
  recordingPeaks,
  referenceLabel,
}: WaveformCompareProps) {
  if (referencePeaks.length === 0 && recordingPeaks.length === 0) return null;

  return (
    <div className="waveform-compare">
      <h3 className="waveform-compare-title">Compare your sound</h3>
      <WaveformDisplay
        peaks={referencePeaks}
        label={referenceLabel}
        variant="reference"
      />
      <WaveformDisplay
        peaks={recordingPeaks}
        label="Your recording"
        variant="recording"
      />
    </div>
  );
}
