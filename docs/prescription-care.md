# Prescription-driven care pilot

This extension builds on `codex/approved-care-workflow` at `f7595e531dab70ce571412ab6394881c05c6362e`. It adds a private prescription workflow to the existing design. It is not activated in production. No real patient upload, provider request, message, booking, staff-claim change or production deployment was performed.

## Parent and clinic workflow

Medical Records, the AI Vet scanner and the shared care controls now use `PrescriptionWorkspace`. The original browser OCR path and unauthenticated external prescription parser are removed. Other manually entered record types remain separate, explicitly unverified records.

1. Choose a pet in the shared care account. Breed is required when saving history; allergies, past surgeries and chronic conditions are optional. History is explicitly parent-reported and does not create treatment, dates or rewards.
2. Consent to private image storage, hospital review and, when configured, Gemini transcription. Upload a PNG/JPEG, maximum 2 MiB, 16 megapixels and 8000 pixels on either side. File signatures, dimensions and image decoding are checked on the server. Progress shows bytes sent separately from server processing; retry uses the same source identity.
3. The server retains the original bytes and SHA-256 provenance. OCR returns four bounded readings: written pet name, medication text, follow-up instructions and follow-up timing. Each has nullable text, confidence and an original extraction quote. No date arithmetic, prescription-date fallback, treatment generation or executable model actions exist in this pipeline. Missing/illegible text remains null or visibly uncertain.
4. Compare the original and edit the reading. Parent changes create a new version with actor, pet and timestamp; the original extraction remains unchanged. Parent confirmation is never clinical approval. If OCR is missing, malformed or unavailable, the source remains available for manual transcription and the UI explicitly says OCR is unavailable.
5. A veterinarian compares the original, current pet/version and conflicting prescriptions in `/staff`. Approval copies the exact confirmed instructions, snapshots an approved deterministic reward rule and binds the milestone to that source/version. If other source-linked steps are active, the vet must explicitly keep them as complementary care or replace them. Missing clinical dates remain null; a coordinator queue obtains the missing approved information. No reminder date is inferred.
6. Pritpawl reads the approved plan, Pawlina uses the existing booking and opted-in reminder controls, and Pawl reads the staff-verified ledger. A booking, upload, chat or transcription confirmation earns nothing. The existing transaction and global service-evidence claim issue a completion reward once.

An uploaded source needs one clinical/source review before it can become an active milestone. Existing reviewed care does not require new vet approval for each routine reminder or scheduling request. The first implementation records one follow-up milestone per source version; it does not autonomously interpret every medication as a task or create a breed-derived schedule. The original clinical-record milestone workflow remains available for additional appropriately reviewed instructions.

## Correction, conflict and deletion behavior

Same bytes are deduplicated within the account, including interrupted uploads. The same source against a different pet in that account produces a conflict and directs the parent to correct its existing association. Another account cannot discover the source or its deduplication identity. Exact-byte deduplication does not detect a crop or re-photograph; staff source/conflict review and unique performed-service evidence remain necessary.

Corrections and pet reassociation suspend pending milestones from the older source version and cancel their reminders. Completed milestones and earned ledger entries remain immutable. Conflicting-source replacement similarly exempts the superseded pending steps. Existing confirmed clinic bookings produce a separate coordinator reconciliation item; this pilot cannot cancel them in the external clinic system.

The parent can delete the source and transcription. A transaction first tombstones the record, scrubs extraction/version text and suspends pending care. Storage deletion follows and is retryable; the UI does not claim completion if storage deletion fails. Reads and approvals reject deleted/expired sources, including a post-download recheck. The retained tombstone contains identifiers, hash, timestamps and status. Previously approved clinical instructions, audit entries, booking reconciliation and completed rewards remain clinic records, as disclosed before upload. A deleted image cannot silently reappear through re-upload.

## Server and access requirements

Use the existing Admin configuration described in [approved-care-pilot.md](approved-care-pilot.md). Both endpoints verify Firebase ID tokens including revocation. Parent ownership is enforced server-side; clinic roles come only from trusted `planet-animal` custom claims. Staff screen state is remounted when the account changes; parent source/history UI is keyed by account and pet. Prescription requests reject responses arriving after an account change.

Additional **server-only** configuration:

| Setting | Purpose |
| --- | --- |
| `CARE_PRIVATE_BUCKET` | A dedicated private prescription bucket in the intended clinic project |
| `CARE_SOURCE_RETENTION_DAYS` | Clinic-approved integer from 1–365; no invented default |
| `CARE_OCR_API_KEY` | Server-side Gemini credential; optional for manual-only transcription |
| `CARE_OCR_MODEL` | Explicit supported model selected and evaluated by the clinic; no automatic fallback |

The upload endpoint refuses a bucket without uniform bucket-level access and enforced public-access prevention. Deploy `storage.rules` to the **dedicated prescription bucket**, where all client SDK reads/writes are denied. Do not apply this file indiscriminately to a shared bucket. Original images are read through the authenticated endpoint with `no-store`, `nosniff` and a server-validated MIME type. No public download token or signed URL is issued. Configure service-account IAM for this bucket and the named Firestore database. The existing deny-by-default Firestore rules keep care aggregates server-only.

The OCR implementation uses the existing Google GenAI SDK's [structured JSON output](https://ai.google.dev/gemini-api/docs/structured-output) and validates the returned object again. Storage writes use [generation preconditions](https://docs.cloud.google.com/storage/docs/request-preconditions) to avoid replacing an existing original. The provider has no tools and its entire response is untrusted reading data. Credentials for this new pipeline never enter browser bundles. Existing user-configured voice/chat providers are a separate integration and were not activated or migrated by this change.

## Retention and operations before activation

Set the approved retention period before accepting uploads. Configure and verify a dedicated-bucket lifecycle policy for physical image expiry, including soft-delete/versioning behavior appropriate to the clinic's retention policy. The application blocks source reads and pending source-dependent actions at expiry; lifecycle configuration and the maintenance process are still needed to remove bytes and scrub transcription on time.

A trusted manager can POST `{ "type": "purgeExpired", "cursor": "optional previous cursor" }` to `/api/prescriptions` with an ordinary verified manager ID token. Each request scans up to 50 accounts, deletes expired/tombstoned originals, scrubs expired transcription, and returns `nextCursor`. Process every cursor until null. Retries are idempotent. Establish a trusted scheduled runner/operational procedure and alerting before activation; this change does not install one or invent a scheduler credential. Configure sufficient function duration for this bounded batch and test under realistic storage latency. The endpoint is separate from the existing in-app reminder worker.

Uploads reserve an account-scoped record before writing storage. A 60-second lease and three-attempt cap bound retries; attempt fencing prevents stale OCR finalizers from overwriting newer attempts. A failed upload can be deleted from its pending card. Late upload/deletion races are rechecked; bucket lifecycle is also required to clean up an orphan if a process is terminated between the two systems. Storage and Firestore do not share an atomic transaction.

The pilot is bounded to 20 source identities per account (including tombstones), five parent transcription versions per source, 300 queue items and a 750 KB serialized care aggregate. Capacity errors are explicit. Use the existing 50-item staff queue pages; no whole-clinic client download was added. Review archival/subcollection migration and run load/operational testing before assuming suitability at 200–300 patients/day. No throughput or clinical outcome improvement is claimed.

Activation still needs: correct Admin identity/database; dedicated private bucket, IAM, Storage/Firestore rules and lifecycle; approved retention and OCR-provider data handling/model evaluation; trusted staff claims; approved eligible-care/reward rules; a retention maintenance runner; real Auth/Firestore/Storage emulator or isolated staging tests; physical mobile-browser checks; and clinic staff pilot acceptance. Booking remains staff-recorded and reminders in-app only. No WhatsApp/calendar/billing provider was added.

## Validation and review

`npm run test:care` passes 42 synthetic tests. Coverage includes revoked/absent/cross-account identity, wrong pet, image bounds, private-bucket enforcement, original-byte retrieval, eight simultaneous upload attempts, unavailable OCR, visible uncertainty, immutable extraction provenance, current-version approval, conflicts, expiry-before-completion, deletion retry, retention purge, and an upload → parent confirmation → vet approval → twelve concurrent completion requests yielding one reward. Transaction tests use an explicitly identified in-memory double, not real Firestore. Java was unavailable here; no emulator or patient-data validation is claimed.

TypeScript and the production build pass. Existing large-chunk/deprecation warnings remain. The unconfigured local prescription endpoint returns 401 without identity and 503 when Admin configuration is absent; no fake connected state is shown. The synthetic review entry is excluded from the production Vite entry graph.

Local synthetic review: `/prescription-review.html`, or the customized mobile wrapper `/preview?path=/prescription-review.html&demo_mode=true&device=samsung-s26-ultra`. The review explicitly substitutes upload/source adapters and never sends files to an OCR provider. Its tiny synthetic upload fixture is disposable test input; the displayed synthetic original is labeled as a fixture. `?reviewWidth=320` and `?reviewWidth=768` provide measured contained viewports when browser viewport overrides do not apply.

Browser checks used the in-app browser: upload failure/retry and consent; source preview; editable uncertain medication text; parent confirmation at zero milestones/awards; vet approval with blank follow-up date disabled; one verified completion reward; pet reassociation preserving that reward; keyboard focus and Escape dismissal; and reduced-motion completion without a transform. Measured content widths equal scroll widths at 320 and 768 pixels. The 320px dialog measured 287px with no horizontal overflow. Fresh tablet and main-app views reported no console errors. Development hot reload initially exposed duplicate component keys and a fixture-root warning; both were corrected. The existing loader's orbit positions were observed changing over real elapsed time.

Brand parity against `f7595e5`: all five tracked logo/artwork/motion files were unchanged. `src/assets/planet-logo.png` SHA-256 is `05a9991eef105ec72a2e16bbd5805977618303cccd8c60e6c56e4ef416b674f0`; `src/assets/logo.png` SHA-256 is `db10bbf3118c8df05ea79849f4c3d75cebd4d832ac167d0d07a59c819ef021cd`. The main Samsung preview rendered the original 6064px-wide logo source.
