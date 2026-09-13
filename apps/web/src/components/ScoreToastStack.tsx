import { getAnimal } from "../data/animals";
import { modeLabel } from "../scoring/modes";
import type { ScoreToast } from "../hooks/useScoreToasts";

interface ScoreToastStackProps {
  toasts: ScoreToast[];
  onDismiss: (id: string) => void;
}

export function ScoreToastStack({ toasts, onDismiss }: ScoreToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const animal = getAnimal(toast.entry.animal);
        return (
          <div key={toast.id} className="toast toast-enter">
            <p className="toast-message">
              <span className="toast-emoji" aria-hidden="true">
                {animal?.emoji ?? "🎉"}
              </span>
              <strong>{toast.entry.nickname}</strong> scored{" "}
              <strong>{toast.entry.score}</strong>
              {animal ? ` on ${animal.name}` : ""}!
            </p>
            <span className={`mode-badge mode-${toast.entry.mode} toast-mode`}>
              {modeLabel(toast.entry.mode)}
            </span>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
