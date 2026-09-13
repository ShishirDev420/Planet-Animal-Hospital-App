# Recorded care follow-through pilot

This feature branch extends the current green/yellow application. It retains the exact logo, character artwork, navigation, existing card styles and deployed shared bio/loader motion. It does not reuse the earlier redesign. No production deployment, Firestore rule deployment, live patient migration or outgoing message was performed for this feature.

## Connected behavior

Pritpawl explains the selected pet's recorded, veterinarian-approved instructions. Pawlina handles the ordinary follow-through controls: appointment requests, reminders and staff queues. Pawl reads the deterministic verified-care ledger. All three consume the same account/pet state through CareProvider. Selecting a different pet clears the agent conversation; the AI care assistant is remounted on account/pet changes so prior conversation is not carried into another pet's context.

The clinical cycle is: veterinarian records an approved milestone and its clinical source reference, dates and approved reward rule; parent opts into in-app reminders; parent requests a booking; staff records a successful clinic booking reference; staff verifies performed care using a unique service-record/bill-line reference; the transaction records exactly one reward and reveals the next approved milestone. Missing instructions/dates and unresolved attendance produce deduplicated coordinator queues. New concerns remain in a clinical review queue until a veterinarian resolves them. A past appointment is unresolved attendance, not an automatic claim the parent missed it.

The staff portal is `/staff`, also linked from Settings when the authenticated server recognizes a staff role. Queues are paginated in batches of 50, with ownership, status and next action. Managers can publish immutable reward configuration versions; only veterinarians approve clinical instructions or exemptions. Coordinators verify attendance/service records and handle administrative work. Clinical review does not require a vet to approve every reminder.

## Service configuration and release dependencies

The server endpoint is `/api/care`, available as a Vercel function and in the local Vite server. It verifies Firebase ID tokens (including revocation), and uses Firebase Admin transactions. Configure server-only variables through the supported deployment environment:

- `CARE_FIREBASE_PROJECT_ID`: the explicitly selected Firebase project.
- `CARE_FIRESTORE_DATABASE_ID`: the explicitly selected database; the existing app uses a named database, not the default database. Check `firebase-applet-config.json` before selecting it.
- `CARE_FIREBASE_SERVICE_ACCOUNT_JSON`, or supported application-default credentials with the required Firestore/Auth access. Never use a `VITE_` prefix for these credentials.
- `CARE_JOB_TOKEN`: a separate random secret for the optional due-queue worker. Never put it in browser code.

Staff permissions require trusted Firebase Auth custom claims: `clinicId: planet-animal` and `clinicRole: coordinator | veterinarian | manager`. Profile document fields cannot grant access. Assign claims using the clinic's trusted administrative process, then refresh the staff session. No staff identities or permissions were fabricated during implementation.

Deploy the reviewed `firestore.rules` and `firestore.indexes.json` to the intended database during a separately authorized rollout. New care collections are server-only under the deny-by-default rules. Existing profile reads are owner/staff-only, financial fields cannot be rewritten by clients, legacy point requests are read-only, and legacy bookings do not grant points. Test rules in a staging Firestore emulator before release. Rules must be coordinated with any separately maintained staff terminal that depended on public access.

Until the Admin environment is configured, the API returns a truthful 503 and the UI presents a retry/unavailable state. This implementation was not connected to production Admin credentials or staff identities. Firestore emulator integration has not been run in this Windows environment (Java was unavailable); endpoint contract tests use an explicitly identified transactional in-memory double.

## One configurable workflow; no invented medicine or economics

There are no default clinical schedules or production reward values. A manager approves a versioned workflow/reward configuration; a veterinarian selects a rule and records the instructions/date window/reminder time from the clinical record. Every milestone snapshots the approved rule so later configuration changes do not change a promised reward. Unknown dates remain null. An incorrect uncompleted milestone can be exempted by a veterinarian and replaced with a newly approved ID; existing approved records are never silently overwritten.

The local fixture uses 40 points / ₹10 purely to exercise behavior. These are not proposed prices or approved production benefits.

Pilot points and integer-paise clinic credit are separate recorded values. Existing profile balances are not imported, revalued, forfeited or relabeled as a verified ledger. Pet-specific checkup entitlements are a separate collection field and are never inferred from point totals. Billing redemption, entitlement issuance/unlock rules, subscriptions and external wallet transfers are outside this follow-up pilot's connected scope. UI states explicitly identify unavailable redemption. Legacy briefing reads and self-ticked roadmap stages no longer award money/points. The existing one-time registration grant remains; logging into an existing zero balance no longer grants it again.

## Booking and reminders

No booking provider API is configured. Staff must first complete the booking in the clinic's real booking system, then record its successful reference and date in the portal. A parent request or opened messaging app is not a confirmed appointment. Booking failures return to scheduling with no reward. Rescheduling submits a fresh pending request and invalidates the old confirmation in the pilot; staff must also reconcile the previous booking in the real booking system.

The pilot delivers in-app reminders only, based on approved timestamps and explicit parent consent. Snooze changes the reminder, not the clinical due date. Completion, exemption and confirmed booking suppress the relevant reminder. There is no WhatsApp/email/calendar delivery, external notification preview, provider SLA, invented clinic-hours promise or automatic emergency call. Parent updates require consent and remain private to their account and authorized clinic team.

For automated queue reconciliation, a configured scheduler may POST `{ "type": "runDueJobs", "cursor": "optional previous cursor" }` to `/api/care` with `x-care-job-token`. Process every returned cursor until null. Each batch handles 100 accounts. Retries are safe; unchanged states do not create audit events or rewrite queue items. This endpoint sends no external messages. A manager has an explicit first-batch control for pilot operations; no external scheduler was installed by this change.

## Persistence, audit and volume limits

`careAccounts/{ownerUid}` stores the bounded pilot aggregate, `careQueue` the staff projection, `careEvidence` the global unique completion claims, `careAudit` the actor/action/revision audit, and `careConfigs` immutable configuration versions. Award issuance, evidence claim, account update and queue projection share one Firestore transaction. Never edit ledger rows or balances manually.

At 200–300 patients/day, the portal fetches queue pages rather than all patients. Transactions touch only the selected parent's record and changed queue projections. The pilot fails explicitly at 20 pets, 150 recorded milestones/awards, 300 updates or 300 queue items per account; it does not silently truncate history. A reviewed archival/ledger migration is required before those per-account limits are reached. Large-scale load testing is still required; this is not a throughput guarantee.

Baseline metrics are account-scoped and labeled: due milestones (excluding vet exemptions), completed inside the recorded approved window, pets with a dated next step, unresolved queues and total/unique awards. No efficacy improvement is claimed. Define the reporting cohort and observation window before aggregating pilot results.

## Review and validation

Run `npm run test:care`, `npm run lint`, and `npm run build`. The tests cover identity/ownership, role authorization, approved configuration, unavailable instructions, booking confirmation/failure, award retries, duplicate evidence across pets/accounts, captured reward rules, opt-in/out/snooze, unresolved clinical concerns, exemption, missed follow-up and repeat job processing. The API contract test submits 12 concurrent completion requests and verifies one award; it does not substitute for real Firestore concurrency/emulator testing.

Local UI review: `http://localhost:3000/care-review.html`. This isolated page is clearly marked as a test fixture, uses the same state machine and parent component, and cannot change patient data, send messages, create bookings or move money. It is excluded from deployment. The existing mobile app preview remains `/preview?path=/&demo_mode=true&device=samsung-s26-ultra`; `/motion-review.html` remains the real shared-loader review.

Browser verification observed a 320 px care viewport without horizontal overflow, explicit pending booking with zero awards, then a fixture staff completion producing exactly 40 fixture points / ₹10 and one completed milestone. Native date selection was corrected to handle input events consistently. Further physical Android/iPhone/Safari, deployed Firestore/Auth, provider and clinic staff pilot checks remain release prerequisites.

Final local checks: all 22 domain/API contract tests passed, TypeScript lint passed, and the production Vite build passed. Existing large-chunk build warnings remain. The local API returned HTTP 503 with the documented unavailable message when Admin credentials were absent. A development HMR websocket failure was observed; explicit page reloads were used for review. Tablet viewport emulation did not apply reliably, so tablet and desktop browser coverage is not claimed here.
