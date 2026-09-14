# Integrated care release — 14 September 2026

Release checkout: `codex/unified-care-wallet`. Deployment and final build evidence will be appended after verification. Earlier local-review notes describe their historical stop; the user subsequently authorized this integrated release. The restriction against protected-deployment checks/bypass remains in force.

## Included behavior

- Retains all three live offers and exact prices. The copied live offer-data SHA-256 is `79B748455262A681C992E873F33FF075D3C6309CA9E00EFCD33C2FFBF7EBB4FF`.
- Prescription uploads remain private and source-bound. Clinical drafts remain veterinarian-only until a verified veterinarian approves the current source version. Existing administrative Gemini assistant stays separate.
- Care cards show actual recorded pending/earned rewards. A proactive checkup creates an idempotent coordination request, not a booking or reward. In-app reminders respect consent and approved dates.
- Whole-bill redemption consumes an approved tier's exact points for its percentage of the entire verified invoice. Versioned manager policy is required; no invented default rates. Historical reservations can finish or reverse. Invoice, award and redemption retries remain transactional/idempotent.
- Google and Apple app-identity buttons use Firebase OAuth popups directly from user gestures. Profile settings links an additional provider only after explicit association consent; collision errors direct the user back to their existing account. Separate accounts are not silently merged. No consumer AI subscription entitlement is inferred.
- Device speech selects a deterministic local voice matching the advice language, handles asynchronously available voices, and starts only after a click. It cancels on stop, version/route/account/pet changes, unmount, failure and new playback. No local voice means readable text; no paid voice API or remote clinical voice transmission. Browser/device voice quality varies.
- Route replacement has no exit wait; mobile entry is 160ms, desktop 180ms, reduced motion zero. Navigation remains outside the page's Suspense loader. Orbit art is preserved; loader detail is 14px, decorative orbit is hidden from accessibility output, keyboard focus is visible, and reduced-motion CSS covers pseudo-elements.

## Confirmed configuration limits

Read-only Firebase audit found Google enabled with a client, and the canonical Vercel hostname authorized. Apple is absent: Apple Developer Services ID, team/key setup, callback configuration and Firebase provider enablement remain required. No provider settings or sign-in identities were fabricated.

All 30 existing Firebase Auth accounts were checked: none has the configured clinic veterinarian/coordinator/manager claims. The existing care policy exists; whole-bill redemption thresholds are unconfigured. Clinical OpenAI provider and research flags are not provisioned by this release. WhatsApp, email, push/calendar sender integration is absent. The UI must preserve these unavailable states. In-app reminders work while the app is opened; no external messages or real appointments were created in testing.

Existing live Firestore prototype rules on legacy users/requests/pointsQueue were previously identified as overly permissive. This release does not claim that access transition is complete: user-directed staff identity/terminal coordination is still outstanding. New server-only care collections remain denied to direct browser clients by the fallback rule. No live claims or rules changed.

## Verification evidence before final integration

- 58 care/prescription/wallet/request/speech unit and API contract tests passed. Real Firebase Auth + Firestore emulator passed award concurrency, competing reservations, repeated billing applies/refunds, and whole-bill retry/ownership tests using synthetic data only. Clinical tests are recorded in the companion integration note; final combined counts follow below.
- In-app browser synthetic speech: delayed voice arrival enables Listen; one click starts one utterance; version/route/unmount cancels; failure keeps readable text and retry. Fixed the stale Playing status found during these checks. No real audio/provider call in the synthetic fixture.
- In-app Samsung clinical fixture: parent sees no draft text; synthetic veterinarian edits and approves version 2; parent sees that exact edited summary; switching pets removes it. No real clinical approval occurred.
- Measured iframe Plans widths/content: 320/320, 432/432, 768/768, 1280/1280. Desktop loaded six sidebar links. Roadmap 320/320, 432/432, 1280/1280. Keyboard Tab reached the next guide control with a solid 2px focus outline. These are constrained browser/iframe checks, not physical-device or native Safari validation.
- Browser screenshot capture failed. Requested viewport override did not change its 1280px outer viewport; dedicated same-origin diagnostic iframes supplied actual inner widths. Do not describe screenshot quality, frame rate, native Safari or real device coverage as verified. No standalone Chrome automation connection was available.
- Exact logo SHA-256 remains `05A9991EEF105EC72A2E16BBD5805977618303CCCD8C60E6C56E4EF416B674F0`.

All synthetic entries and local operations/secrets are excluded from deployment. Public app routes do not import them. No patient messages, live balance changes, staff identities or payment approvals were generated.

## Final combined local verification

74 unit/API contract tests passed. TypeScript and the production build passed. The expanded real Firebase Auth + Firestore emulator test also passed: clinical concurrent generation made one synthetic provider call, parent/coordinator could not read draft content, only the veterinarian approved, the parent received the exact edited summary, a changed source hid the approval, direct client access was denied and wallet points stayed unchanged. Original award/redemption concurrency checks also passed. No real clinical provider or patient data was used.

Final measured Roadmap tablet width/content: 768/768. Browser source and 50 built asset files had zero matches for actual private server credential strings across 157 source paths. Logo and live offer-data hashes matched. Existing build chunk-size and Node dependency warnings remain.

Advanced/Premium source research is implemented but not activated: a separate canonical dog/cat query retrieves primary veterinary literature without patient data in the search; retrieved citations are preserved for veterinarian review and shown with approved observations. Clinical provider credentials/research setup remain required. The browser never accepts an AI key.
