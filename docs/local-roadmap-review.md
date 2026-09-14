# Local roadmap follow-up

Scope: local investigation, edits and synthetic verification only, following the coordinator's stop on protected deployment checks and production rollout. These follow-up edits are uncommitted and have not been pushed or deployed.

Added a small free general-guidance panel to Roadmap with three selectable topics and page-only checklists. It works independently of authentication, private care data and the AI provider. Copy explicitly distinguishes prepared education, veterinarian-approved care and reward completion. Topic progress resets on pet/account change; no persisted data or external request is created by checklist interaction. Existing logo, shared motion, paid Plans and wallet/prescription behavior are preserved.

Care requests now have a 15-second timeout, assistant requests a 35-second timeout, and explicit network/non-JSON failure messages. Refresh displays loading and retains the last loaded record. The assistant no longer silently swallows allowance availability failures. Missing identity is rejected before care configuration or database access.

Validation: 48 existing tests plus three new timeout/network/early-authentication tests passed. Local GET /api/care without identity returns JSON 401. Samsung mobile visual review and a 320px synthetic fixture verified topic switching, checked progress, pet reset and zero assistant calls for guide interactions. The fixture measured viewport 320/content 320. No patient/provider requests or wallet mutations were used for this review.

General education references: AAHA https://www.aaha.org/resources/why-are-regular-veterinary-visits-important/ and RCVS Knowledge https://www.rcvsknowledge.org/resource/pre-consultation-conversation-guide-for-pet-owners/ . These sources do not approve an individual patient's treatment.

Unresolved deployment finding from before the stop: the prior preview care endpoint returned configuration-unavailable while its environment variables were listed as branch-scoped. Cause was not confirmed; no further protected checks or environment changes were attempted after the stop. Do not represent this local work as a production API repair. Real veterinarian/billing identities and the live access transition are still outstanding.
