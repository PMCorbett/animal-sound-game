import { CareersEpithetBubbles } from "../components/CareersEpithetBubbles";
import {
  CareersPortfolioSlideshow,
  type CareersSlide,
} from "../components/CareersPortfolioSlideshow";
import { LeaderboardScoresSection } from "../components/LeaderboardScoresSection";
import slideIphone1 from "../assets/careers-display/iphone-1.png";
import slideIphone2 from "../assets/careers-display/iphone-2.png";
import slideIphone3 from "../assets/careers-display/iphone-3.png";
import slideIpad from "../assets/careers-display/ipad-royal-london.png";
import slideMonitor from "../assets/careers-display/monitor-personal-site.png";
import qrCode from "../assets/qr-code.svg";

const ANIMALS_GAME_URL = "https://animals.pmcorbett.dev";

const SLIDES: CareersSlide[] = [
  {
    src: slideIphone1,
    caption: "Make software for phones!",
    alt: "Hand holding an iPhone showing a mobile app",
    colorClass: "se-bubble-yellow",
  },
  {
    src: slideIphone2,
    caption: "Ask fun questions in apps!",
    alt: "Hand holding an iPhone showing a survey screen",
    colorClass: "se-bubble-cyan",
  },
  {
    src: slideIphone3,
    caption: "Photos, videos, and sounds!",
    alt: "Hand holding an iPhone showing a camera app",
    colorClass: "se-bubble-pink",
  },
  {
    src: slideIpad,
    caption: "Build apps for tablets!",
    alt: "iPad showing a guidance and support web app",
    colorClass: "se-bubble-lime",
  },
  {
    src: slideMonitor,
    caption: "Make websites for big screens!",
    alt: "Desktop monitor showing a personal portfolio website",
    colorClass: "se-bubble-orange",
  },
];

export function SoftwareEngineerPage() {
  return (
    <div className="se-display">
      <h1 className="se-title">Software Engineer</h1>

      <div className="se-display-grid">
        <div className="se-display-left">
          <CareersEpithetBubbles />
          <div className="se-slideshow-row">
            <div className="se-qr-block">
              <p className="se-qr-title">Play the Animal Sound Game</p>
              <a
                className="se-qr-link"
                href={ANIMALS_GAME_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Play the Animal Sound Game — scan or open at animals.pmcorbett.dev"
              >
                <img className="se-qr-image" src={qrCode} alt="" width={343} height={343} />
              </a>
            </div>
            <CareersPortfolioSlideshow slides={SLIDES} />
          </div>
        </div>

        <div className="se-leaderboard-panel">
          <LeaderboardScoresSection embedded defaultModeFilter="child" />
        </div>
      </div>
    </div>
  );
}
