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

## Canonical production receipt

Final deployed application source: `c265652` (includes the integrated release `dc28afb` and sign-in CSS correction `da1e8c4`). Vercel deployment `dpl_729Gvde1rPDmsyeAXKku21M4CWh5` is READY and aliased to https://planet-animal-hospital-app.vercel.app . No protected URL/access bypass was used.

Public canonical homepage returned 200. All six private endpoints (`care`, `wallet`, `assistant`, `prescriptions`, `clinical`, `maintenance`) returned JSON 401 without identity; the care endpoint also rejected a malformed token with 401. This verifies loading/auth rejection, not live clinical/provider/staff operations.

The served graph contained all 50 expected assets. Ten were byte-identical to the local build; all 49 non-CSS assets matched after normalizing content-hashed filename references. Production CSS retained every local selector, added 78 utility selectors and six utility/theme defaults, and differed in tiny compiler color-conversion rounding. No byte-identical CSS claim is made. The sole omitted legacy sign-in utility found in the earlier rollout was replaced with supported `grow`. Canonical logo bytes match exactly. No actual private credential strings were found in the served graph.

The live in-app Samsung preview rendered all three offers and the new Roadmap with working navigation. Final patch prevents a visual preview or isolated review page from connecting to a signed-in live wallet; both component mounting and the wallet request helper enforce the guard. The final live preview displayed the disconnected-wallet notice, and no explicit wallet transaction was submitted during the checks. Care/prescription review fixtures now provide their speech component's Router context. Post-fix typecheck/build passed; backend test logic was unchanged.

Operational limits above still apply. Deployed code does not mean Apple sign-in, staff approval access, clinical inference/research, commercial redemption rates or external messaging are configured. Actual staff/terminal identity coordination is also still required for the legacy Firestore rule transition. Native Safari, physical-device audio and screenshot-based visual verification were not available.


## Doctor portal and desktop release — 14 September 2026

Deployed application source: d865ec7 (portal 8e88412 plus integrated desktop redesign). Vercel deployment dpl_26TA7puykENREbJrAmYUwACSqVKk is READY and aliased to https://planet-animal-hospital-app.vercel.app. Doctor portal: https://planet-animal-hospital-app.vercel.app/doctor. This supersedes the earlier application release above.

The portal shares existing authentication, clinical service and parent roadmap. It includes veterinarian-only patient pagination, selected-pet sources, verified active paid tier and per-analysis depth, editing/approval/withdrawal and recorded follow-up controls. A replacement approval atomically supersedes older approved analysis and writes audit history. Details and remaining configuration: docs/doctor-portal.md. Desktop now uses grouped navigation, a compact header and solid green surfaces; mobile structure is preserved. Design evidence: docs/desktop-redesign-review.md.

Final combined TypeScript and production build passed. Care suite 74/74 passed; expanded real Firebase emulator passed roles, 11-account pagination without duplicates, unknown tier handling, replacement approval/audit, withdrawal and financial isolation. Synthetic browser checks covered selected pet, structured sources, editing/approval attribution, queue refresh and switching pets. Expanded portal at 320 CSS pixels measured viewport/content 320/320. Desktop peer visually inspected portal at 1920 and initial selection at 432 with no horizontal overflow. Integrated overview measured 1280/1280 with main 1022/1022. Native Safari and physical-device performance remain untested.

Canonical verification: /doctor HTTP200; seven unauthenticated API probes (including clinical patient list) returned JSON401; malformed-token care returned401. All52 served assets fetched. Ten are byte-identical; all51 non-CSS assets match after normalizing content-hashed references. CSS is not byte-identical: all2198 local rules remain, production has2276 rules, adds78 selectors and six defaults, and differs in small compiler Oklab rounding. No omitted local selector. Zero private credential matches across161 source files and52 browser assets. Logo and live three-offer data hashes remain unchanged from the receipt above. Canonical Samsung preview loads and renders Essential ₹999, Advanced ₹1,999 and Premium ₹3,499 per month.

Operational status remains separate from deployment: no actual veterinarian/coordinator/manager role is assigned; whole-bill policy, clinical OpenAI, Apple login and external reminder sender are unconfigured. Existing Google sign-in and11 server infrastructure/admin-AI/OCR/maintenance settings were verified. Legacy rules transition requires real staff/terminal coordination. No live clinical draft, patient message or billing transaction was made during this release. No protected deployment access or bypass was used.
