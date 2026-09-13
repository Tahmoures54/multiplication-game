# Fish Math 1.2.0 — Release QA

## Automated checks
- `npm ci`
- `npm run verify`
- `npx cap sync android`
- `cd android && ./gradlew bundleRelease`

## Android release checks
- Target SDK: 36
- Compile SDK: 36
- versionCode: 3
- versionName: 1.2.0
- Verify signed AAB before Play Console upload.

## Manual device checks
- Fresh install launches full-screen (no letterboxed playfield).
- Existing save survives app restart and update.
- Audio starts only after user interaction and stops/resumes correctly.
- Pause/resume freezes gameplay and timer behind a full-screen overlay.
- There is no numeric keypad; answers are only multiple-choice or true/false taps.
- Chain questions show the intermediate and final expressions correctly, then four choices.
- Boss battle completes correctly with choices.
- Aquarium, achievements, and learning progress open without losing progress.
- WhatsApp support opens for +989160684552. No developer contact/about screen.
- App works without network access (except WhatsApp support).
- Back/foreground transitions do not duplicate timers or audio.
