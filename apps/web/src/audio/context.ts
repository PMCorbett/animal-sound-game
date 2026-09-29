let audioContext: AudioContext | null = null;
let unlockSilenceBuffer: AudioBuffer | null = null;

export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/** Call synchronously from a click/tap handler before any `await`. */
export function unlockAudioOnUserGesture(): void {
  const ctx = getAudioContext();
  void ctx.resume();

  if (!unlockSilenceBuffer) {
    unlockSilenceBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  }

  const source = ctx.createBufferSource();
  source.buffer = unlockSilenceBuffer;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  source.connect(gain);
  gain.connect(ctx.destination);
  try {
    source.start(0);
  } catch {
    // resume() was still invoked; context may unlock on the next gesture.
  }
}
