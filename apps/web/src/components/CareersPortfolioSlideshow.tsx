import { useEffect, useState } from "react";

export interface CareersSlide {
  src: string;
  caption: string;
  alt: string;
}

const INTERVAL_MS = 6000;

interface CareersPortfolioSlideshowProps {
  slides: CareersSlide[];
}

export function CareersPortfolioSlideshow({ slides }: CareersPortfolioSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

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
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[index]!;

  return (
    <figure className="se-slideshow">
      <div className="se-slideshow-frame">
        {slides.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={`se-slideshow-img ${i === index ? "se-slideshow-img-active" : ""}`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      <figcaption className="se-slideshow-caption">{slide.caption}</figcaption>
    </figure>
  );
}
