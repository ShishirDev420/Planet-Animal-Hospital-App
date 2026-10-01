# Local reliability release

Work ran on DESKTOP-GN55HE1 in `C:\Users\derma\Documents\Codex\2026-10-02\task\planet-animal`, with local Chrome and Vite at `http://127.0.0.1:3107`.

The initial production alias was `planet-animal-hospital-app.vercel.app`, deployment `dpl_4RQdAcU5xMmTkxgS2q1Mhypkoodr` (READY, September 28). It was a CLI deployment with no commit metadata. The release branch starts from `94c41af`, the corresponding September 28 application revision, rather than the subsequent staged rules cutover. Public and demo route comparisons confirm the existing interface. An exact historical source fingerprint cannot be established from the old deployment metadata.

## Changes

- A successful care save clears the loading state when it supersedes an older refresh; obsolete responses cannot replace the saved state.
- Profile listeners clear old account data on authentication changes and ignore obsolete callbacks. The app shows its existing loader while validating the new account, with a fresh timeout for each authentication event.
- Password recovery trims email input and disables repeated submissions until the request finishes.
- Demo care, prescription, assistant and clinical clients reject live access before requesting a token or making an API call. Manual records do not fall back to a real signed-in account in demo mode.
- Secondary-pet views skip legacy primary-pet record fetches. Account/pet/filter transitions cancel obsolete loads and close record dialogs.

No CSS, layout, branding, clinical decision logic, Firebase rules, identity providers, roles, credentials or production patient records were changed.

## Verification

- TypeScript checking and production Vite build passed. Existing large Firebase bundle warning remains.
- All 75 existing care/domain/API unit tests passed.
- Seven new local Chrome regressions passed against Auth and Firestore emulators: registration/onboarding persistence, persisted session reload, trimmed and single-flight password recovery, wrong-password feedback, overlapping refresh/save ordering, sign-out cleanup, and demo API rejection.
- Three existing emulator integration/rules tests passed, including concurrent completion awarding once, competing wallet reservations, idempotent debits, staff/owner isolation, immutable clinical fields and denied direct financial writes. These test repository rules, not the permissive live legacy ruleset.
- Twelve local mobile demo routes loaded without page exceptions or horizontal overflow. Visit request service/date/time/review/close passed; external sending was not invoked.
- Before/after public login and signup screenshot dimensions and text match. Pixel differences were restricted to the existing animated logo (58 by 58 pixels); all other pixels match.
- Public production baseline: login and staff sign-in rendered, and care/wallet/prescriptions/assistant/clinical returned 401 without credentials.

Browser tests use `tests/reliability-review.html` and `tests/reliability-browser-entry.tsx`, excluded from Vercel uploads by the existing `tests` exclusion. Start Vite on port 3107, set `PLAYWRIGHT_MODULE` to an installed Playwright module (or install it locally), then run:

```powershell
firebase emulators:exec --only auth,firestore --project demo-planet-care --config firebase.test.json "node tests/reliability-browser.cjs"
```

The test intercepts Firebase configuration with a demo project, connects only to local emulators, blocks external HTTPS requests and substitutes unavailable care-service responses where necessary. It creates no production users and sends no external recovery emails.

## Remaining release constraint

The live Rules API configuration was re-read during this task. The named database still uses ruleset `cd637c2e-ad44-4b35-b7e2-d01563305eb0`; legacy users are publicly readable and legacy requests/pointsQueue remain publicly accessible. No patient documents were queried. Publishing this application code does not resolve those legacy permissions. A coordinated staff-terminal identity/workflow migration and explicit action-time approval are required before changing live rules, roles or providers.

No authorized production test accounts were supplied. Real parent/staff authenticated workflows, actual OAuth-provider completion, external email delivery and clinic booking confirmation remain unverified in production. Emulator results must not be represented as live clinical validation.

The production environment-variable name listing contains the existing Firebase Admin, private storage, OCR and assistant configuration; no values were read. No `CARE_CLINICAL_*` settings were listed, so clinical AI activation is not claimed by this release.
