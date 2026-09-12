# Animal Sound Game

A browser-based game where players imitate animal sounds and get an instant score. Built for a school careers-day demo — kids pick an animal, hear a reference sound, record their imitation, and see how they scored. Scores can be saved to a local leaderboard (Phase 1); AWS backend coming in Phase 2.

## Animals

Cow, dog, cat, sheep, and duck — each with a hand-tuned scoring profile for **human imitation**, not real animal recordings.

## How to run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Microphone access requires HTTPS in production; `localhost` works for development.

### Other commands

```bash
npm run build    # production build
npm run lint     # TypeScript check
npm run test     # unit tests (scoring)
```

## Project structure

```
animal-sound-game/
├── apps/web/              # Vite + React + TypeScript SPA
│   └── src/
│       ├── audio/         # Recording and reference playback
│       ├── scoring/       # Feature extraction, DTW, mode multipliers
│       ├── components/    # UI components
│       └── pages/         # Play and Leaderboard screens
├── assets/profiles/       # Per-animal scoring profiles (JSON)
└── package.json           # npm workspaces root
```

## How scoring works

1. Record up to 5 seconds of audio via the Web Audio API.
2. Extract duration, pitch contour, energy envelope, and MFCCs using [meyda](https://meyda.js.org/).
3. Compare against the animal's scoring profile using DTW and weighted similarity.
4. Apply **Kid** or **Grown-up** mode multipliers (generous vs strict).

Profiles live in `assets/profiles/` and are generated from the reference sounds in `assets/sounds/`. Re-run `npm run generate-profiles` after swapping sound files to refresh duration, pitch, envelope, and MFCC targets.

## Player modes

| Mode | Score floor | Multiplier |
|------|-------------|------------|
| Kid | ~50% | `min(100, raw × 1.25 + 10)` plus ±8% jitter |
| Grown-up | ~35% | Raw score plus ±5% jitter |

Full architecture and implementation plan: [docs/plan.md](docs/plan.md).

## Architecture (planned — Phase 2+)

- **Frontend:** React SPA on S3 + CloudFront
- **API:** API Gateway HTTP API + Lambda (Node 22)
- **Data:** DynamoDB (on-demand, 7-day TTL)
- **IaC:** AWS CDK (TypeScript)
- **CI/CD:** GitHub Actions with OIDC deploy on merge to `main`

## Future improvements

### Server-side score validation

Re-run the scoring formula in Lambda on submit. POST a compact feature vector (~2 KB, not raw audio) alongside the claimed score; reject submissions where `|clientScore - serverScore| > 10`. Prevents DevTools score hacking while keeping uploads tiny.

### Other ideas

- Custom domain on CloudFront
- WAF / API Gateway rate-limiting hardening
- AI "funny comment" bonus round (not for core scoring)
- Host reference sounds on S3/CloudFront in production (`assets/sounds/*.mp3` — mono, 44.1 kHz, 96 kbps)
- Re-calibrate profiles from human imitation recordings (instead of reference animal sounds)

## License

MIT — animal sound assets should be royalty-free (CC0) when added in Phase 2.
