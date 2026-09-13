import { useEffect, useRef } from "react";

export type WaveformVariant = "reference" | "recording";

interface WaveformDisplayProps {
  peaks: number[];
  label: string;
  /** Playback progress from 0 (start) to 1 (end). Omit for a static waveform. */
  progress?: number;
  variant?: WaveformVariant;
}

const COLORS: Record<WaveformVariant, { active: string; inactive: string }> = {
  reference: { active: "#4a90d9", inactive: "#c5d9ed" },
  recording: { active: "#5cb85c", inactive: "#c8e6c9" },
};

export function WaveformDisplay({
  peaks,
  label,
  progress,
  variant = "reference",
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / peaks.length;
    const centerY = height / 2;
    const colors = COLORS[variant];
    const progressX =
      progress !== undefined ? progress * width : width;

    for (let i = 0; i < peaks.length; i++) {
      const barHeight = (peaks[i] * height * 0.85) / 2;
      const x = i * barWidth;
      const barCenter = x + barWidth / 2;
      const isPlayed = progress === undefined || barCenter <= progressX;

      ctx.fillStyle = isPlayed ? colors.active : colors.inactive;
      ctx.fillRect(x + 1, centerY - barHeight, barWidth - 2, barHeight * 2);
    }

    if (progress !== undefined && progress > 0 && progress < 1) {
      ctx.fillStyle = "#f5a623";
      ctx.fillRect(progressX - 1, 0, 2, height);
    }
  }, [peaks, progress, variant]);

  if (peaks.length === 0) return null;

  return (
    <div className={`waveform-display waveform-${variant}`}>
      <span className="waveform-label">{label}</span>
      <canvas ref={canvasRef} width={320} height={72} aria-hidden="true" />
    </div>
  );
}
