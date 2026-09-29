import { Link } from "react-router-dom";

export function SoftwareEngineerPage() {
  return (
    <div className="explainer-page">
      <nav className="wizard-back-row">
        <Link to="/" className="wizard-back">
          ← Back home
        </Link>
      </nav>

      <header className="page-header">
        <h1>What is a software engineer?</h1>
      </header>

      <div className="explainer-body">
        <p>
          A computer is like a very fast helper that does not know what to do
          until someone tells it. <strong>Software</strong> is the list of
          instructions the computer follows — like the rules of a board game or
          steps in a recipe.
        </p>
        <p>
          A <strong>software engineer</strong> is a person who writes those
          instructions. They think up ideas, solve little puzzles, and build
          things you can use — apps on a phone, games on a website, and tools
          that help people every day.
        </p>
        <p>
          It is a bit like building with LEGO blocks, but the blocks are ideas
          and the finished thing can make sounds, show pictures, or let friends
          play together. This animal sound game was built by software engineers!
        </p>
        <p>
          If you like figuring things out and making stuff, software engineering
          can be a lot of fun when you grow up — or even sooner, if you start
          playing with code and games now.
        </p>
      </div>
    </div>
  );
}
