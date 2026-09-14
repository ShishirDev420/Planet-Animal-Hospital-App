# Doctor portal

The `/doctor` route shares the hospital app's Firebase identity, named Firestore database, clinical service and parent roadmap. The `/staff` workspace links verified veterinarians to it. No separate domain or clinical database is required.

Veterinarians can open a paginated patient list, select one pet, compare the parent-reported profile/history, current prescription text, recorded care and updates, and review AI content with its evidence. The current paid plan comes from the verified server subscription; each analysis separately records the tier used when prepared. Essential provides a brief roadmap, Advanced detailed analysis, and Premium comprehensive synthesis. Every tier requires the same clinical safeguards and veterinarian approval.

Edits return approved content to draft; rejection withdraws it. Approving a replacement atomically removes prior approved content from the parent response and records a supersession audit. Revision/source checks reject stale review attempts. Parent advice is revalidated on record changes, focus and every 60 seconds, so an already-open view may take up to that refresh interval to remove a remotely withdrawn version. New reads never receive withdrawn draft text.

Prescription and recorded follow-up controls reuse the existing care service. A doctor must record an actual clinical reference, approved instructions and reward eligibility; unknown dates remain blank. Analysis approval does not automatically book appointments or issue points. The service enforces roles independently of portal visibility.

## Configuration audit, 14 September 2026

All 30 current Auth accounts were inspected; none has the clinic's veterinarian/coordinator/manager claim. Google is enabled and the canonical app domain is authorized. The 11 existing production settings for Firebase, private storage, administrative AI/OCR and maintenance are present. No clinical OpenAI, Apple or external sender setting was found in the project environment or process environment. The whole-bill redemption policy is absent.

Activation requires actual staff identities and role assignments, approved point-to-percentage thresholds, a clinic OpenAI server credential/model and processing approval, actual Apple Developer configuration, and an authorized external reminder integration. Credentials should be entered through secure provider settings, not parent-facing forms or chat. Existing Google login and recorded care remain separate from those pending activations. No patient messages or live clinical drafts were produced during verification. Legacy public prototype Firestore rules require a coordinated staff-terminal transition; they have not been changed by this portal release.

## Validation

The isolated `doctor-review.html` entry uses synthetic services, not real patient data or provider calls, and is excluded from the production build. Browser checks cover patient selection, verified-plan/depth display, editing, approval attribution, withdrawal, queue-count refresh and switching to a pet with no draft. Unit and Firebase emulator checks cover server role isolation, pagination, single-current approval, supersession audit, parent visibility and financial isolation. Deployment details belong in the integrated release receipt.
