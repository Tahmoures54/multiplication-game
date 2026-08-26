# Fish Math 1.1.0 — Release QA

## Automated checks
- `npm ci`
- `npm run verify`
- `npx cap sync android`
- `cd android && ./gradlew bundleRelease`

## Android release checks
- Target SDK: 36
- Compile SDK: 36
- versionCode: 2
- versionName: 1.1.0
- Verify signed AAB before Play Console upload.

## Manual device checks
- Fresh install launches successfully.
- Existing save survives app restart and update.
- Audio starts only after user interaction and stops/resumes correctly.
- Pause/resume freezes gameplay and timer.
- Numeric keypad works on small and large phones.
- Multiple choice and true/false answers work.
- Chain questions show the intermediate and final expressions correctly.
- Boss battle completes correctly.
- Aquarium and achievements open without losing progress.
- Learning Progress screen reports table accuracy correctly.
- App works without network access.
- Back/foreground transitions do not duplicate timers or audio.
