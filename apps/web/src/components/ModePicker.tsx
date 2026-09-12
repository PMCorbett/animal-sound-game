import type { PlayerMode } from "../types";

interface ModePickerProps {
  mode: PlayerMode;
  onChange: (mode: PlayerMode) => void;
}

export function ModePicker({ mode, onChange }: ModePickerProps) {
  return (
    <div className="mode-picker">
      <h2>Choose your mode</h2>
      <div className="mode-buttons">
        <button
          type="button"
          className={`mode-btn ${mode === "child" ? "active" : ""}`}
          onClick={() => onChange("child")}
        >
          <span className="mode-icon">🧒</span>
          <span className="mode-label">Kid mode</span>
          <span className="mode-desc">Extra generous scoring!</span>
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === "grownup" ? "active" : ""}`}
          onClick={() => onChange("grownup")}
        >
          <span className="mode-icon">🧑</span>
          <span className="mode-label">Grown-up mode</span>
          <span className="mode-desc">Strict scoring</span>
        </button>
      </div>
    </div>
  );
}
