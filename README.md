# Salary Chase

A colorful seven-level Phaser 3 office adventure. Commute by bus and boat, beat five flights of stairs, repair absurd code, survive office hazards, battle QA, hunt HR, collect a fictional salary, and escape before another meeting begins.

The game uses an original 64-bit-retro visual style: richly layered programmatic sprites, colorful beveled environments, scanline polish, expressive characters, and no remote art assets. Level 1 randomly selects sunny, rainy, windy, or cloudy weather for the entire trip. Vehicle collisions remain fatal to the run and open a **You are late to the office** retry screen.

The complete game runs in the browser as a static Vite app—no backend, accounts, tracking, remote gameplay assets, or environment variables.

## Seven levels

1. **The Commute** — Leave home, cross traffic to catch a bus, cross again for a boat, cross once more to the office, climb five stair flights, and mark attendance.
2. **Coding and the Lunch Gauntlet** — Complete a random coding minigame, then hide from support zombies and angry managers. Getting caught launches a funny bug ticket or micro-meeting.
3. **Lunch Maze** — Find the clean plate and an empty seat before the cafeteria timer expires. Timing out gives an HR warning but still unlocks Level 4.
4. **QA Bug Bash** — Play all three Developer-vs-Software-Tester rounds and win at least two.
5. **Hot Tea Maze** — Find hot water, a tea bag, and sugar in order. Timing out unlocks Level 6 without tea or its energy bonus.
6. **Hunt HR** — Search the full office, gather funny clues, avoid support zombies, catch moving HR, and survive the salary questionnaire.
7. **Final Escape** — Leave on time while hiding from support zombies and navigating around roaming managers.

Each level locks the next until its completion condition is met. A timeout counts as completion only in the lunch and tea mazes, exactly as described above.

During Levels 2, 6, and 7, headset-wearing customer-support zombies may attack with urgent tickets. Hide near cabinets or server racks marked **HIDE**, or keep moving until they lose interest.

## Workday schedule

- 10:00 AM — Office opens
- 2:00–3:00 PM — Lunch adventure
- 3:15–4:15 PM — Software Tester Bug Bash
- 4:30–4:45 PM — Tea-break quest
- 6:45 PM — Salary hunt begins
- 7:00 PM — Office closes
- 7:00–7:10 PM — Best normal exit window
- After 7:15 PM — Overtime penalty

The entered player name exists only for the current run. It is written to localStorage only when the completed run qualifies for the top-ten high-score table.

## Screenshots

Add future captures under `docs/screenshots/`, for example:

- `main-menu.png`
- `commute.png`
- `hr-search.png`
- `results.png`

## Requirements

- Node.js 22 LTS or newer
- npm 10 or newer
- A current Chromium, Firefox, or WebKit-based browser

## Local setup

```bash
git clone <repository-url>
cd office-hunt
npm install
npm run dev
```

Vite prints the local URL. The game is designed for desktop and mobile browsers; landscape is recommended on narrow phones.

## Validation

```bash
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

The production output is written to `dist/`.

## Controls and accessibility

- Move: Arrow keys or WASD
- Interact: E or Space
- Bug Bash: A/D to move, J or Space to punch, K to kick, S or Down Arrow to block
- Pause: Escape
- Mobile: on-canvas directional pad, interact button, and pause button

Settings persist in localStorage and include difficulty, sound, reduced motion, high contrast, and larger text. Sound starts muted and uses the Web Audio API only after player interaction.

- Casual gives the player a small movement boost, fewer coding tasks, slower hazards, and fewer support zombies.
- Normal uses balanced movement, workload, hazards, and attacks.
- Corporate adds coding tasks and clues while accelerating hazards, the office clock, HR, and support attacks.

## Content editing

All gameplay content is local and data-driven:

- Dialogue and result messages: `src/data/dialogues.json`
- NPC roles and colors: `src/data/npcs.json`
- Coding challenges: `src/data/codingChallenges.json`
- Traffic, office, and escape events: `src/data/randomEvents.json`
- Score values: `src/data/gameBalance.json`
- Difficulty tuning: `src/data/difficulty.json`
- Achievement labels and descriptions: `src/data/achievements.json`

Keep the existing JSON shape. Invalid or corrupted player save data is recovered safely with defaults.

## GitHub setup

```bash
git init
git add .
git commit -m "Build Salary Chase"
git branch -M main
git remote add origin <repository-url>
git push -u origin main
```

Create the repository before pushing. The workflow in `.github/workflows/ci.yml` validates linting, TypeScript, unit tests, Chromium smoke tests, and the production build, then uploads `dist` as an artifact. Confirm the Actions run passes.

## Vercel deployment

1. Sign in to Vercel and import the GitHub repository.
2. Select **Vite** if it is not detected automatically.
3. Use `npm run build` as the build command.
4. Use `dist` as the output directory.
5. Deploy and open the root route.
6. Future pushes automatically create deployments when the repository is connected.

The included `vercel.json` supplies the same static settings. No secrets are required.

## Architecture

Scenes are separated under `src/game/scenes`; state, persistence, time, and audio live under `src/game/managers`; scoring and achievements live under `src/game/systems`; shared types and UI helpers are isolated. Environments and characters are drawn with Phaser primitives, so gameplay never waits on remote images.

## License and disclaimer

This is a fictional workplace comedy. Characters and events are fictional. Artwork and audio are original programmatic assets. Only add real company logos when the owner has granted permission.
