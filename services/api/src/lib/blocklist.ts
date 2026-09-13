const BLOCKED = [
  "admin",
  "moderator",
  "fuck",
  "shit",
  "damn",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "retard",
];

export function isBlockedNickname(nickname: string): boolean {
  const normalized = nickname.trim().toLowerCase();
  if (!normalized) return true;
  return BLOCKED.some(
    (word) => normalized === word || normalized.includes(word),
  );
}
