import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PlayPage } from "./pages/PlayPage";
import { AdminPage } from "./pages/AdminPage";
import { SoftwareEngineerPage } from "./pages/SoftwareEngineerPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<main className="app app-play"><LandingPage /></main>} />
        <Route path="/play" element={<main className="app app-play"><PlayPage /></main>} />
        <Route
          path="/leaderboard"
          element={<main className="app app-leaderboard"><LeaderboardPage /></main>}
        />
        <Route
          path="/what-is-a-software-engineer"
          element={<main className="app app-display"><SoftwareEngineerPage /></main>}
        />
        <Route
          path="/admin"
          element={<main className="app app-leaderboard"><AdminPage /></main>}
        />
      </Routes>
    </BrowserRouter>
  );
}
