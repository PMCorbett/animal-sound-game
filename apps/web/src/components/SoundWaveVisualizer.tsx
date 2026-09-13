import { useEffect, useRef } from "react";
import { getMediaStream } from "../audio/recorder";

interface SoundWaveVisualizerProps {
  active: boolean;
}

const BAR_COUNT = 24;

export function SoundWaveVisualizer({ active }: SoundWaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const stream = getMediaStream();
    const canvas = canvasRef.current;
    if (!stream || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      analyser.getByteFrequencyData(data);

      const barWidth = width / BAR_COUNT - 4;
      const step = Math.floor(data.length / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = data[i * step] / 255;
        const barHeight = Math.max(6, value * height * 0.9);
        const x = i * (barWidth + 4) + 2;
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#6ab0f3");
        gradient.addColorStop(1, "#4a90d9");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      void audioContext.close();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="sound-wave-visualizer" aria-hidden="true">
      <canvas ref={canvasRef} width={320} height={80} />
    </div>
  );
}
