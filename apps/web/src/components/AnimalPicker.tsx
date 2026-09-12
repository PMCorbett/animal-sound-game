import { ANIMALS } from "../data/animals";
import type { AnimalId } from "../types";

interface AnimalPickerProps {
  selected: AnimalId | null;
  onSelect: (animalId: AnimalId) => void;
}

export function AnimalPicker({ selected, onSelect }: AnimalPickerProps) {
  return (
    <div className="animal-picker">
      <h2>Pick an animal</h2>
      <div className="animal-grid">
        {ANIMALS.map((animal) => (
          <button
            key={animal.id}
            type="button"
            className={`animal-btn ${selected === animal.id ? "active" : ""}`}
            onClick={() => onSelect(animal.id)}
            aria-pressed={selected === animal.id}
          >
            <span className="animal-emoji">{animal.emoji}</span>
            <span className="animal-name">{animal.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
