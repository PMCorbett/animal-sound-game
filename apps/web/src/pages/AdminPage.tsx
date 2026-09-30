import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  adminDeleteScore,
  adminLoginErrorMessage,
  adminLogout,
  adminUpdateNickname,
  fetchAdminLeaderboard,
  fetchAdminSession,
  getGithubAuthStartUrl,
} from "../api/adminClient";
import { isApiConfigured } from "../api/client";
import { getAnimal } from "../data/animals";
import { modeLabel } from "../scoring/modes";
import type { LeaderboardEntry } from "../types";

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loginError] = useState(() =>
    adminLoginErrorMessage(searchParams.get("error")),
  );
  const [sessionLogin, setSessionLogin] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nicknameFilter, setNicknameFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");

  const loadSession = useCallback(async () => {
    if (!isApiConfigured()) {
      setSessionChecked(true);
      return;
    }

    try {
      const session = await fetchAdminSession();
      setSessionLogin(session.authenticated ? (session.login ?? null) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load session");
    } finally {
      setSessionChecked(true);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    if (!sessionLogin) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAdminLeaderboard({ limit: 100 });
      setEntries(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [sessionLogin]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (searchParams.get("error")) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const q = nicknameFilter.trim().toLowerCase();
    if (!q) {
      return entries;
    }
    return entries.filter((entry) =>
      entry.nickname.toLowerCase().includes(q),
    );
  }, [entries, nicknameFilter]);

  async function handleLogout() {
    try {
      await adminLogout();
      setSessionLogin(null);
      setEntries([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  }

  async function handleDelete(entry: LeaderboardEntry) {
    const animal = getAnimal(entry.animal);
    const label = animal ? `${animal.emoji} ${animal.name}` : entry.animal;
    if (
      !window.confirm(
        `Delete score for "${entry.nickname}" (${label}, ${entry.score})?`,
      )
    ) {
      return;
    }

    try {
      await adminDeleteScore(entry.id, entry.animal);
      setEntries((prev) => prev.filter((row) => row.id !== entry.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function startEdit(entry: LeaderboardEntry) {
    setEditingId(entry.id);
    setEditNickname(entry.nickname);
  }

  async function saveEdit(entry: LeaderboardEntry) {
    const trimmed = editNickname.trim();
    if (!trimmed || trimmed === entry.nickname) {
      setEditingId(null);
      return;
    }

    try {
      const updated = await adminUpdateNickname(
        entry.id,
        entry.animal,
        trimmed,
      );
      setEntries((prev) =>
        prev.map((row) => (row.id === entry.id ? updated : row)),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  if (!isApiConfigured()) {
    return (
      <div className="admin-page">
        <header className="page-header">
          <h1>Admin</h1>
          <p>Cloud API is not configured. Set VITE_API_URL to use moderation tools.</p>
        </header>
        <nav className="page-nav">
          <Link to="/">← Back home</Link>
        </nav>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <div className="admin-page">
        <p className="admin-muted">Checking session…</p>
      </div>
    );
  }

  if (!sessionLogin) {
    return (
      <div className="admin-page">
        <header className="page-header">
          <h1>Admin</h1>
          <p>Sign in with GitHub to moderate the leaderboard.</p>
        </header>
        {loginError && (
          <p className="error-message" role="alert">
            {loginError}
          </p>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <a className="btn btn-primary admin-github-btn" href={getGithubAuthStartUrl()}>
          Sign in with GitHub
        </a>
        <nav className="page-nav">
          <Link to="/">← Back home</Link>
        </nav>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="page-header">
        <h1>Admin</h1>
        <p>
          Signed in as <strong>{sessionLogin}</strong>
        </p>
        <div className="admin-toolbar">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void loadEntries()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void handleLogout()}>
            Sign out
          </button>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </header>

      <label className="admin-filter">
        <span>Filter by nickname</span>
        <input
          type="search"
          value={nicknameFilter}
          onChange={(event) => setNicknameFilter(event.target.value)}
          placeholder="Search nicknames"
        />
      </label>

      {filteredEntries.length === 0 ? (
        <p className="empty-leaderboard">No matching scores.</p>
      ) : (
        <table className="leaderboard-table admin-table">
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Animal</th>
              <th>Score</th>
              <th>Mode</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => {
              const animal = getAnimal(entry.animal);
              const isEditing = editingId === entry.id;
              return (
                <tr key={entry.id}>
                  <td>
                    {isEditing ? (
                      <input
                        className="admin-inline-input"
                        value={editNickname}
                        maxLength={20}
                        onChange={(event) => setEditNickname(event.target.value)}
                      />
                    ) : (
                      entry.nickname
                    )}
                  </td>
                  <td>
                    {animal?.emoji} {animal?.name ?? entry.animal}
                  </td>
                  <td className="score-cell">{entry.score}</td>
                  <td>
                    <span className={`mode-badge mode-${entry.mode}`}>
                      {modeLabel(entry.mode)}
                    </span>
                  </td>
                  <td>{new Date(entry.submittedAt).toLocaleString()}</td>
                  <td className="admin-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => void saveEdit(entry)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => startEdit(entry)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost admin-delete-btn"
                          onClick={() => void handleDelete(entry)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <nav className="page-nav">
        <Link to="/">← Back home</Link>
      </nav>
    </div>
  );
}
