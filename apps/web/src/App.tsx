import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { PlayPage } from "./pages/PlayPage";

export function App() {
  return (
    <BrowserRouter>
      <main className="app">
        <Routes>
          <Route path="/" element={<PlayPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
