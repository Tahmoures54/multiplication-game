# Fish Math 1.2.1 — Cafe Bazaar Release QA

## Automated checks
- [x] `npm ci` and `npm run verify` in GitHub Actions (latest release pipeline must finish green).
- [x] `npx cap sync android` in GitHub Actions.
- [x] Debug APK build in GitHub Actions.
- [ ] Signed Release APK build and signature verification in GitHub Actions.
- [ ] Install and smoke-test the signed Release APK on a physical Android device.
- [ ] Verify final APK package ID, version, and signing certificate before upload.

## Android configuration
- Application ID: `com.arsha.fishmath`
- minSdk: 22 (Android 5.1)
- compileSdk: 36
- targetSdk: 36
- versionName: `1.2.1`
- versionCode: `4`
- Release signing is configured via GitHub Actions Secrets; private keystore files must not be committed.
- R8 minification/resource shrinking remain disabled until a release build is verified on-device.

## Manual device checks
- [ ] Fresh install launches full-screen without letterboxing or cut-off controls.
- [ ] Existing save survives app restart and update from the previous version.
- [ ] Audio starts after user interaction and can be disabled; music stops/resumes correctly.
- [ ] Pause/resume freezes gameplay and the timer; background/foreground does not duplicate timers.
- [ ] No numeric keypad appears; answers are selected by tapping choices.
- [ ] Chain questions show the intermediate and final expressions correctly.
- [ ] Boss battle completes correctly with answer choices.
- [ ] Aquarium, achievements, and learning progress open without losing progress.
- [ ] WhatsApp support opens successfully when WhatsApp is installed; game remains usable if it is not.
- [ ] Core game works in airplane mode; only external support requires connectivity.
- [ ] Test at least one small screen and one larger screen, plus an Android version near minSdk and a current Android version.

## Cafe Bazaar listing — owner action required
- [ ] Confirm developer account and package ID are ready in the Bazaar panel.
- [ ] Upload the signed APK (not the Debug APK or the artifact ZIP).
- [ ] Provide final app icon, screenshots, Persian title/description, category, and age/content declarations.
- [ ] Publish a reachable privacy-policy URL and ensure its claims match actual app behavior.
- [ ] Complete Bazaar's current content, rights, and age-rating forms.
- [ ] Review the store's validation feedback before publishing.

## Notes
- GitHub Actions Artifacts are ZIP downloads containing the APK; extract the ZIP before installing.
- Keep the generated release keystore and its passwords backed up privately. Future updates must use the same signing key.
- An AAB is optional for this Bazaar-focused release; the signed APK is the intended deliverable unless the Bazaar console says otherwise.
