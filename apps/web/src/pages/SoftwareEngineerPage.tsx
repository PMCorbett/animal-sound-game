import { CareersEpithetBubbles } from "../components/CareersEpithetBubbles";
import {
  CareersPortfolioSlideshow,
  type CareersSlide,
} from "../components/CareersPortfolioSlideshow";
import { LeaderboardScoresSection } from "../components/LeaderboardScoresSection";
import slideIphone1 from "../assets/careers-display/iphone-1.png";
import slideIphone2 from "../assets/careers-display/iphone-2.png";
import slideIphone3 from "../assets/careers-display/iphone-3.png";
import slideIphone4 from "../assets/careers-display/iphone-4.png";
import slideIpad from "../assets/careers-display/ipad-royal-london.png";
import slideMonitor from "../assets/careers-display/monitor-personal-site.png";

const SLIDES: CareersSlide[] = [
  {
    src: slideIphone1,
    caption: "Make software for phones!",
    alt: "Hand holding an iPhone showing a mobile app",
  },
  {
    src: slideIphone2,
    caption: "Ask fun questions in apps!",
    alt: "Hand holding an iPhone showing a survey screen",
  },
  {
    src: slideIphone3,
    caption: "Photos, videos, and sounds!",
    alt: "Hand holding an iPhone showing a camera app",
  },
  {
    src: slideIphone4,
    caption: "Help friends talk together!",
    alt: "Hand holding an iPhone showing a community forum",
  },
  {
    src: slideIpad,
    caption: "Build apps for tablets!",
    alt: "iPad showing a guidance and support web app",
  },
  {
    src: slideMonitor,
    caption: "Make websites for big screens!",
    alt: "Desktop monitor showing a personal portfolio website",
  },
];

export function SoftwareEngineerPage() {
  return (
    <div className="se-display">
      <h1 className="se-title">Software Engineer</h1>

      <div className="se-display-grid">
        <div className="se-display-left">
          <CareersEpithetBubbles />
          <CareersPortfolioSlideshow slides={SLIDES} />
        </div>

        <div className="se-leaderboard-panel">
          <LeaderboardScoresSection embedded defaultModeFilter="child" />
        </div>
      </div>
    </div>
  );
}
