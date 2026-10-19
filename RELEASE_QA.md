# Fish Math 1.2.2 — Cafe Bazaar Release QA

**Audit baseline:** commit `6b701179bb546903f74d84423a2e3630888923cc` (audit dated 2026-10-19).  
**Current QA status:** incomplete; unchecked items are **unverified** and must not be treated as passed.

## Version source reconciliation

| Source | Version | versionCode | Evidence |
|---|---:|---:|---|
| `package.json` | `1.2.2` | N/A (web package has no Android versionCode) | `version` field |
| `android/app/build.gradle` | `1.2.2` | `5` | `defaultConfig.versionName/versionCode` |
| `README.md` | `1.2.2` | `5` | Android specifications |
| `RELEASE_QA.md` | `1.2.2` | `5` | This document |

The package version and Android version are separate declarations; the package.json version does not define Android's versionCode.

## Automated checks (CI evidence only)

- [x] Previous recorded Verify workflow passed: run [39140224682](https://github.com/Tahmoures54/multiplication-game/actions/runs/39140224682) on the audit baseline.
- [x] Previous recorded Android workflow passed its APK build/signature verification steps: run [39140224643](https://github.com/Tahmoures54/multiplication-game/actions/runs/39140224643) on the audit baseline.
- [ ] Re-run Verify and Android workflows for the current commit and record new run URLs and artifact ID.
- [ ] Signed Release APK extracted from the artifact ZIP: extracted APK file size and SHA-256 **unverified**.
- [ ] Install and smoke-test the signed Release APK on a physical Android device.
- [ ] Verify final APK package ID, version, and signing certificate on the artifact intended for upload.

### Artifact and AAB evidence

The previously recorded `15,621,649` bytes is the **GitHub Actions Artifact ZIP size**, not the extracted APK size. The extracted APK's size was not recorded in the audit evidence.  
In run [39140224643](https://github.com/Tahmoures54/multiplication-game/actions/runs/39140224643), the AAB build/signing steps were **skipped**; this does not establish an AAB build result. The repository's release guidance says a signed APK is the intended Cafe Bazaar deliverable and AAB is optional unless the current Bazaar console requires otherwise. **Owner confirmation of current Bazaar requirements remains pending.**

## Android configuration (source values; device verification pending)

- Application ID: `com.arsha.fishmath`
- minSdk: 22 (Android 5.1)
- compileSdk: 36
- targetSdk: 36
- versionName: `1.2.2`
- versionCode: `5`
- Release signing is configured via GitHub Actions Secrets; private keystore files must not be committed.
- R8 minification/resource shrinking remain disabled until a release build is verified on-device.

## Manual device checks — all currently unverified

Keep every checkbox unchecked until a dated device record and supporting evidence are attached.

- [ ] **UNVERIFIED** Fresh install launches full-screen without letterboxing or cut-off controls.
- [ ] **UNVERIFIED** Existing save survives app restart and update from the previous version.
- [ ] **UNVERIFIED** Audio starts after user interaction and can be disabled; music stops/resumes correctly.
- [ ] **UNVERIFIED** Pause/resume freezes gameplay and the timer; background/foreground does not duplicate timers.
- [ ] **UNVERIFIED** No numeric keypad appears; answers are selected by tapping choices.
- [ ] **UNVERIFIED** Chain questions show the intermediate and final expressions correctly.
- [ ] **UNVERIFIED** Boss battle completes correctly with answer choices.
- [ ] **UNVERIFIED** Aquarium, achievements, and learning progress open without losing progress.
- [ ] **UNVERIFIED** WhatsApp support opens successfully when WhatsApp is installed; game remains usable if it is not.
- [ ] **UNVERIFIED** Core game works in airplane mode; only external support requires connectivity.
- [ ] **UNVERIFIED** Test at least one small screen and one larger screen, plus an Android version near minSdk and a current Android version.
- [ ] **UNVERIFIED** Purchase test in an authorized Bazaar test setup, including successful return, failed return, uncertain result, and restore after reinstall.

## Device test procedure

1. Download the intended release artifact from the recorded Actions run and extract the ZIP; do not install the ZIP itself.
2. Record APK filename, byte size, SHA-256, package ID, versionName/versionCode, and signing-certificate fingerprint using Android SDK tools (`aapt`/Gradle metadata and `apksigner verify --print-certs`).
3. Install the APK on a physical device. Record device model, Android version/API, date/time, and result for each test below.
4. Launch offline, start a game, answer questions, pause/resume, finish a season, close/reopen the app, and verify saved progress. Capture screenshots or logs for each result.
5. If upgrading, install the previous signed version first, create progress, then update without uninstalling and check that progress remains.
6. Test audio and layouts on a small and a large screen.
7. Only perform payment tests if the owner confirms an authorized Bazaar test procedure/account. Record transaction outcome and restore behavior; do not make an unapproved real charge.
8. Test restore after reinstall only after confirming how the Bazaar test purchase should behave. Keep device test results marked **pending** until evidence is attached.

### Device evidence record template

| Field | Value |
|---|---|
| Test date/time (with timezone) | Pending |
| Tester | Pending |
| Device model | Pending |
| Android version / API | Pending |
| APK filename | Pending |
| APK byte size | Pending — extracted APK, not ZIP |
| APK SHA-256 | Pending |
| versionName / versionCode | Pending |
| Package ID | Pending |
| Signing certificate SHA-256 | Pending |
| Test case / steps | Pending |
| Result (pass/fail/not run) | **NOT RUN / UNVERIFIED** |
| Screenshot filename or log link | Pending |
| Notes / issue reference | Pending |

## Cafe Bazaar listing — owner action required (unverified)

- [ ] Confirm developer account and package ID are ready in the Bazaar panel.
- [ ] Confirm whether the current Bazaar console requires APK or AAB.
- [ ] Upload the signed APK (not the Debug APK or the artifact ZIP), if APK is the accepted format.
- [ ] Provide final app icon, screenshots, Persian title/description, category, and age/content declarations.
- [ ] Publish a reachable privacy-policy URL and ensure its claims match actual app behavior.
- [ ] Complete Bazaar's current content, rights, and age-rating forms.
- [ ] Review the store's validation feedback before publishing.

## Final release reconciliation

| Item | Status | Evidence / follow-up |
|---|---|---|
| Package ID `com.arsha.fishmath` | Source-confirmed; artifact pending | Verify extracted final APK |
| versionName `1.2.2` / versionCode `5` | Source-confirmed; artifact pending | Verify extracted final APK |
| Signing certificate | CI signature-check step passed on prior run; current artifact pending | Record fingerprint from current artifact |
| Bazaar product ID / RSA public key | Code references exist; panel/key match unverified | Owner to confirm without changing values |
| Final artifact | Prior ZIP exists; new run pending | Record new run and artifact ID |
| Store listing and privacy-policy public URL | Unverified | Owner action |
| Age/content rating form | Unverified | Owner action |
| Real device / real Bazaar transaction | **Not tested in this audit** | Human/device execution required |

## Notes

- GitHub Actions Artifacts are ZIP downloads containing the APK; extract the ZIP before installing.
- Keep the generated release keystore and its passwords backed up privately. Future updates must use the same signing key.
- This checklist records evidence status; a green CI run does not prove real-device behavior or a real Bazaar transaction.
