import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface CareersSlide {
  src: string;
  caption: string;
  alt: string;
  /** Shared with epithet bubbles, e.g. se-bubble-yellow */
  colorClass: string;
}

const INTERVAL_MS = 6000;
const FLY_MS = 950;

interface FlyVector {
  x: number;
  y: number;
  rotate: number;
}

interface LeavingSlide {
  slideIndex: number;
  exitVector: FlyVector;
}

interface CareersPortfolioSlideshowProps {
  slides: CareersSlide[];
}

function randomFlyVector(): FlyVector {
  const angle = Math.random() * Math.PI * 2;
  const magnitude = 90 + Math.random() * 50;
  return {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
    rotate: (Math.random() - 0.5) * 32,
  };
}

function flyStyle(vector: FlyVector): CSSProperties {
  return {
    "--se-fly-x": `${vector.x}%`,
    "--se-fly-y": `${vector.y}%`,
    "--se-fly-rotate": `${vector.rotate}deg`,
  } as CSSProperties;
}

interface SlideBoxProps {
  slide: CareersSlide;
  captionFirst: boolean;
  boxClassName: string;
  style?: CSSProperties;
  imageLoading?: "eager" | "lazy";
  onAnimationEnd?: (e: React.AnimationEvent<HTMLDivElement>) => void;
}

function SlideBox({
  slide,
  captionFirst,
  boxClassName,
  style,
  imageLoading = "lazy",
  onAnimationEnd,
}: SlideBoxProps) {
  return (
    <div
      className={[
        "se-slideshow-box",
        "se-bubble",
        slide.colorClass,
        captionFirst ? "se-slideshow-caption-first" : "",
        boxClassName,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onAnimationEnd={onAnimationEnd}
    >
      <div className="se-slideshow-frame">
        <img
          src={slide.src}
          alt={slide.alt}
          className="se-slideshow-img"
          loading={imageLoading}
        />
      </div>
      <p className="se-slideshow-caption se-bubble-text">{slide.caption}</p>
    </div>
  );
}

export function CareersPortfolioSlideshow({ slides }: CareersPortfolioSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [leaving, setLeaving] = useState<LeavingSlide | null>(null);
  const [enterVector, setEnterVector] = useState<FlyVector | null>(null);
  const indexRef = useRef(0);

  indexRef.current = index;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion || slides.length <= 1) return;
    const id = window.setInterval(() => {
      const current = indexRef.current;
      const next = (current + 1) % slides.length;
      setEnterVector(randomFlyVector());
      setLeaving({ slideIndex: current, exitVector: randomFlyVector() });
      setIndex(next);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  if (slides.length === 0) return null;

  const activeSlide = slides[index]!;

  const handleEnterAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (reduceMotion || e.animationName !== "se-slideshow-fly-in") return;
    setEnterVector(null);
  };

  const handleExitAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (e.animationName !== "se-slideshow-fly-out") return;
    setLeaving((current) => (current !== null ? null : current));
  };

  return (
    <figure className="se-slideshow" aria-live="polite">
      <div className="se-slideshow-viewport">
        {leaving !== null && !reduceMotion && (
          <div className="se-slideshow-layer se-slideshow-layer-leaving" aria-hidden>
            <SlideBox
              slide={slides[leaving.slideIndex]!}
              captionFirst={leaving.slideIndex % 2 === 1}
              boxClassName="se-slideshow-box-exit"
              style={{
                ...flyStyle(leaving.exitVector),
                animationDuration: `${FLY_MS}ms`,
              }}
              onAnimationEnd={handleExitAnimationEnd}
            />
          </div>
        )}

        <div className="se-slideshow-layer se-slideshow-layer-active">
          <SlideBox
            slide={activeSlide}
            captionFirst={index % 2 === 1}
            boxClassName={
              enterVector && !reduceMotion ? "se-slideshow-box-enter" : ""
            }
            imageLoading={index === 0 ? "eager" : "lazy"}
            style={
              enterVector && !reduceMotion
                ? {
                    ...flyStyle(enterVector),
                    animationDuration: `${FLY_MS}ms`,
                  }
                : undefined
            }
            onAnimationEnd={handleEnterAnimationEnd}
          />
        </div>
      </div>
    </figure>
  );
}
