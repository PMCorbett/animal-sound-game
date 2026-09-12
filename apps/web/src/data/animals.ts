import type { Animal } from "../types";

export const ANIMALS: Animal[] = [
  { id: "cow", name: "Cow", emoji: "🐄", soundLabel: "Moo!" },
  { id: "dog", name: "Dog", emoji: "🐕", soundLabel: "Woof!" },
  { id: "cat", name: "Cat", emoji: "🐈", soundLabel: "Meow!" },
  { id: "sheep", name: "Sheep", emoji: "🐑", soundLabel: "Baa!" },
  { id: "duck", name: "Duck", emoji: "🦆", soundLabel: "Quack!" },
];

export function getAnimal(id: string): Animal | undefined {
  return ANIMALS.find((animal) => animal.id === id);
}
