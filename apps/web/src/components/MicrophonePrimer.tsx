interface MicrophonePrimerProps {
  onEnable: () => void;
  loading?: boolean;
}

export function MicrophonePrimer({ onEnable, loading }: MicrophonePrimerProps) {
  return (
    <div className="mic-primer">
      <span className="mic-primer-icon" aria-hidden="true">🎙️</span>
      <h2>Allow the microphone</h2>
      <p>
        To record your animal sound, we need permission to use your microphone.
        Tap the button below — your browser will ask you to allow access.
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={onEnable}
        disabled={loading}
      >
        {loading ? "Waiting for permission…" : "Tap to enable microphone"}
      </button>
      <p className="mic-primer-hint">
        On iPhone or iPad, look for &quot;Allow&quot; in the popup at the top of the screen.
      </p>
    </div>
  );
}
