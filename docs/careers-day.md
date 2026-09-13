# Careers Day — Demo Guide

Use this guide when presenting the Animal Sound Game at a school careers day.

**Live URL:** [https://animals.pmcorbett.dev](https://animals.pmcorbett.dev)

**QR code:** Print [qr-code.svg](qr-code.svg) on a poster so kids can scan and play on their own devices.

---

## Before the event

1. **Deploy the day before** — push to `main` and confirm a green GitHub Actions run.
2. **Print the QR code** — open `docs/qr-code.svg` and print at A4 or larger on a poster.
3. **Test devices** — run through the checklist below on at least one iPhone, iPad, and Chromebook.
4. **Prepare demo tabs** — have these open in separate browser tabs:
   - The live game (play screen)
   - The leaderboard (with "How it works" panel visible)
   - A recent green GitHub Actions deploy run
   - AWS DynamoDB console (Scores table) — optional, for the "watch data appear" moment

---

## Demo script (~10 minutes)

### 1. Hook (1 min)

> "Who can do the best cow sound? This game listens to you and gives you a score out of 100 — and your score can go on a leaderboard for everyone to see."

Show the QR code poster. Let a volunteer scan it or open the URL on a shared tablet.

### 2. Play a round (3 min)

1. Choose **Kid mode** (explain: younger players get friendlier scores).
2. Pick an animal — tap a big emoji button.
3. **Hear the reference sound**, then **Record my sound**.
4. Show the quiet countdown ("we wait for a quiet moment so the classroom noise doesn't mess up your score").
5. Reveal the score with the pop animation and encouraging message.
6. Enter a fun nickname and **Save to leaderboard**.

> "Notice we only ask for a nickname — no real names, and your voice recording never leaves your device."

### 3. Leaderboard + how it works (3 min)

Open the **Leaderboard** screen. Point to the split layout:

- **Left:** scores with Kid / Grown-up badges and filters.
- **Right:** "How it works" — walk through the four steps and the diagram.

> "When you save a score, it travels to Amazon's cloud. That's real servers in a data centre — the same kind of thing Netflix and many apps use."

Expand **Tell me more (for grown-ups)** for teachers:

> "React in the browser, S3 and CloudFront for hosting, Lambda and DynamoDB for the API, GitHub Actions to deploy automatically when I push code."

### 4. Behind the scenes (2 min)

Show GitHub Actions:

> "When I push code, robots run tests and put the new version on the internet. No one has to manually copy files."

Optional: show DynamoDB filling with scores as kids play.

### 5. Wrap-up (1 min)

> "Software engineering is about solving problems for real people — today we built something fun that uses microphones, maths, and the cloud. Any questions?"

---

## Device testing checklist

Test on real hardware before the event. Use the live HTTPS URL (not localhost).

| Device | Browser | Check |
|--------|---------|-------|
| iPhone | Safari | Tap to enable mic; record works; score appears; submit saves |
| iPad | Safari | Same as iPhone; landscape layout readable |
| Chromebook | Chrome | Mic permission; recording; leaderboard loads |
| Android tablet | Chrome | Optional but recommended |

### Common issues

| Problem | Fix |
|---------|-----|
| Microphone blocked | Use HTTPS URL; tap "Tap to enable microphone"; check browser site settings |
| No sound playback | Unmute device; tap "Hear the sound" again |
| Score not on leaderboard | Confirm `VITE_API_URL` is set in production build; check network tab for API errors |
| Shy kid / broken mic | Use **Demo mode** — scores without a microphone |

---

## Privacy talking points

- Nickname only — no real names, photos, or email addresses.
- Voice recordings stay on the device; only the score is submitted.
- Scores auto-delete after **7 days** (DynamoDB TTL).
- Practice mode lets kids score without saving.

---

## Fallback plan

- **No Wi-Fi:** Demo mode works offline after the page loads; local leaderboard still works without API.
- **API down:** Practice mode + local leaderboard; explain cloud saves are temporarily unavailable.
- **Mic issues everywhere:** Run demo mode rounds and focus on the "How it works" architecture panel.
