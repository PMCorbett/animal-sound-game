import { afterEach, describe, expect, it, vi } from "vitest";

describe("unlockAudioOnUserGesture", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("resumes the shared AudioContext synchronously", async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    const start = vi.fn();
    const createBuffer = vi.fn(() => ({ length: 1 }));
    const createBufferSource = vi.fn(() => ({
      buffer: null as AudioBuffer | null,
      connect: vi.fn(),
      start,
    }));
    const createGain = vi.fn(() => ({
      gain: { value: 1 },
      connect: vi.fn(),
    }));

    class MockAudioContext {
      state = "suspended";
      sampleRate = 44100;
      destination = {};
      resume = resume;
      createBuffer = createBuffer;
      createBufferSource = createBufferSource;
      createGain = createGain;
    }

    vi.stubGlobal("AudioContext", MockAudioContext);

    const { unlockAudioOnUserGesture } = await import("./context");
    unlockAudioOnUserGesture();

    expect(resume).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(0);
  });
});
