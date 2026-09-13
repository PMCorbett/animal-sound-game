interface PrivacyNoticeProps {
  compact?: boolean;
}

export function PrivacyNotice({ compact = false }: PrivacyNoticeProps) {
  if (compact) {
    return (
      <p className="privacy-notice privacy-notice-compact">
        We only save your nickname and score — no real names, photos, or recordings.
        Scores are deleted after 7 days.
      </p>
    );
  }

  return (
    <div className="privacy-notice" role="note">
      <h3>Privacy notice</h3>
      <ul>
        <li>We only ask for a fun nickname (max 20 characters) — no real names.</li>
        <li>Your voice recording stays on your device and is never uploaded.</li>
        <li>We save your nickname, score, animal, and mode to the leaderboard.</li>
        <li>Scores automatically disappear after 7 days.</li>
      </ul>
    </div>
  );
}
