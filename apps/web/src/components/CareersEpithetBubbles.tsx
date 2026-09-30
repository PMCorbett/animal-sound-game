export interface EpithetItem {
  text: string;
  /** Comic-style punch label, e.g. POW!, ZAP! */
  punch?: string;
  rotationDeg: number;
  colorClass: string;
}

const EPITHETS: EpithetItem[] = [
  {
    punch: "WOW!",
    text: "Software is anything that shows on a screen",
    rotationDeg: -4,
    colorClass: "se-bubble-yellow",
  },
  {
    punch: "POW!",
    text: "Engineers design and build things",
    rotationDeg: 3,
    colorClass: "se-bubble-cyan",
  },
  {
    punch: "ZAP!",
    text: "Software Engineers build software",
    rotationDeg: -2,
    colorClass: "se-bubble-pink",
  },
  {
    punch: "BAM!",
    text: "Software lets you build anything you can imagine",
    rotationDeg: 5,
    colorClass: "se-bubble-lime",
  },
  {
    text: "Engineers solve puzzles and try again until it works!",
    rotationDeg: -3,
    colorClass: "se-bubble-orange",
  },
  {
    text: "You use software every day — games, videos, and apps!",
    rotationDeg: 2,
    colorClass: "se-bubble-purple",
  },
  {
    text: "This animal sound game is software too!",
    rotationDeg: -5,
    colorClass: "se-bubble-yellow",
  },
];

export function CareersEpithetBubbles() {
  return (
    <div className="se-epithet-grid" aria-label="What software engineers do">
      {EPITHETS.map((item) => (
        <div
          key={item.text}
          className={`se-bubble ${item.colorClass}`}
          style={{ transform: `rotate(${item.rotationDeg}deg)` }}
        >
          {item.punch && (
            <span className="se-bubble-punch" aria-hidden="true">
              {item.punch}
            </span>
          )}
          <p className="se-bubble-text">{item.text}</p>
        </div>
      ))}
    </div>
  );
}
