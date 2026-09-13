import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PlayPage } from "./pages/PlayPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<main className="app app-play"><PlayPage /></main>} />
        <Route
          path="/leaderboard"
          element={<main className="app app-leaderboard"><LeaderboardPage /></main>}
        />
      </Routes>
    </BrowserRouter>
  );
}
