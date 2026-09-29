import type { PlayerMode } from "../types";

interface ModePickerProps {
  mode?: PlayerMode;
  onSelect: (mode: PlayerMode) => void;
}

export function ModePicker({ mode, onSelect }: ModePickerProps) {
  return (
    <div className="mode-picker">
      <h2>Are you a kid or a grown-up?</h2>
      <div className="mode-buttons">
        <button
          type="button"
          className={`mode-btn ${mode === "child" ? "active" : ""}`}
          onClick={() => onSelect("child")}
        >
          <span className="mode-icon">🧒</span>
          <span className="mode-label">Kid</span>
          <span className="mode-desc">Extra generous scoring!</span>
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === "grownup" ? "active" : ""}`}
          onClick={() => onSelect("grownup")}
        >
          <span className="mode-icon">🧑</span>
          <span className="mode-label">Grown-up</span>
          <span className="mode-desc">Strict scoring</span>
        </button>
      </div>
    </div>
  );
}
