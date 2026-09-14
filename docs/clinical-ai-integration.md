# Tiered clinical analysis integration

Source owner baseline: `codex/unified-care-wallet` HEAD `7158d86` plus dirty source copied with owner's explicit permission. Baseline snapshot commit `a84b80a` is not the feature and must not replace the owner's newer source. Integrate only the subsequent feature commit/new files and the listed hooks.

## Behavior

- Essential / Advanced / Premium use the server-verified `essential` / `advanced` / `prestige` subscription IDs, progressively increasing analysis detail. Unknown, expired, unverified and cancelled plans cannot generate. Existing approved care remains accessible.
- Uses selected pet profile, existing parent history/updates, approved milestones and current prescription transcriptions. Missing values remain unknown. Expired/deleted prescriptions are excluded. Source changes invalidate publication and approval; entitlement changes during generation discard the draft.
- AI generates a server-only draft. Parents and other non-veterinarian roles receive status only. Verified veterinarian claims permit edit, approve, reject/withdraw. Editing approved content removes its approval. Revision conflicts fail closed. An immutable review audit stores the before/after content and real actor UID/time. The server does not invent staff identities.
- Approval never creates a booking, reward, care milestone or payment. Suggested checkups remain proposals until reviewed. Use the existing staff care workflow to record scheduling instructions.
- Advanced and Premium require a separate source-linked literature retrieval stage. It searches canonical dog/cat preventive guidance only (no names, breed free text, history or prescriptions in web search), restricts domains to AAHA, WSAVA, AVMA and Merck Veterinary Manual, and requires a completed search plus valid HTTPS URL-citation annotations. It stores the brief and citations as an immutable analysis evidence snapshot, separate from the patient-source hash. Citations appear beside approved observations; drafts and draft evidence stay vet-only. It is a bounded general literature brief, not exhaustive systematic research or ChatGPT subscription equivalence. Veterinarian review remains essential for relevance and factual accuracy.
- Parent-controlled export lets the parent select profile/history/prescription text/recorded approved care, inspect the text and download it. No automatic transmission, account linking, credentials, wallet data, other pets or AI drafts. Free text can contain identifying information entered by the parent; preview tells them to check it.

## Integration hooks owned by release task

1. Import default `ClinicalCare` into AIVet and/or Roadmap and mount once per page within existing `CareProvider`. Optional speech: `<ClinicalCare renderSpeech={props => <ApprovedAdviceSpeech {...props}/>} />`. Callback only runs for currently approved content. Full text remains visible.
2. Import named `ClinicalReview` into StaffCare. Within the loaded `state`, for veterinarian role only, mount `<ClinicalReview ownerUid={state.ownerUid} petId={pet.id}/>` for the selected pet. Component/server both preserve separate parent and clinician views. Doctor can inspect current source context and compare original prescription using existing source viewer.
3. Selectively apply `vite.config.ts`: delete unused Sarvam proxy and imports; add `clinicalHandler` and `/api/clinical`, body cap 45 KB. Vercel discovers `api/clinical.ts` automatically. Keep owner's newer auth/voice/routes.
4. Remove unused `APISettings.tsx` and `useAPIKeys.ts`; neither has remaining imports. No parent provider/key setup UI exists.
5. Add `tests/clinical.test.ts` to test script. Include new collections in retention/access audits: `careClinical/{ownerUid}/pets/{petId}`, `careClinicalAudit`, `careClinicalUsage`. Existing deny-all Firestore fallback keeps browser clients out; API checks authenticated identity/role. No production rules were changed.

## Clinic provider configuration (not provisioned by this task)

Server-only `CARE_CLINICAL_PROVIDER=openai`, `CARE_CLINICAL_MODEL` (clinic-selected supported Responses model), `CARE_CLINICAL_API_KEY`, and `CARE_CLINICAL_DATA_APPROVED=true` are all required. Advanced/Premium also require `CARE_CLINICAL_RESEARCH_ENABLED=true` and a web-search-compatible model (`CARE_CLINICAL_RESEARCH_MODEL` optional, otherwise the clinical model). No default consumer subscription or key is inferred. No parent-facing keys. No credentials were copied, created or printed. No live clinical API request was performed.

The flag records the clinic's approved provider/data setup; do not turn it on simply to hide an unavailable state. Clinical synthesis uses `store:false`, no tools and a 25-second timeout; separate general research uses a restricted web_search tool and a 20-second timeout. Both have bounded input/output and validated citations/content. Client timeout is 55 seconds; existing Vercel function timeout is 60 seconds. Research failure blocks the Advanced/Premium draft instead of silently downgrading the benefit. `store:false` is not a promise of zero provider retention. OpenAI API billing is separate from consumer ChatGPT access. Daily limit is three analysis preparation attempts/account/UTC day (up to two provider calls per research-enabled attempt); each request has at most two attempts. Ten saved analyses per pet is the current pilot cap; operational retention/archive handling is still needed for longer use.

Gemini remains administrative-only. Current Gemini API terms prohibit clinical practice/medical advice. This task did not assume veterinary drafting is exempt or repurpose that key.

## Validation and release status

16 transactional/domain contract tests cover the final module (final result in handoff); the initial 12 passed (in-memory Firestore double, not emulator evidence): role/owner/pet isolation, verified tiers, consent, no draft leakage, conflicting reviews, profile/source invalidation, entitlement changes during generation, bounded retries/concurrency, source citations, export isolation and no care/wallet mutation. TypeScript passed. Final build/test results are recorded in the handoff.

Synthetic UI entry: `/clinical-review.html`, intended inside the customized mobile preview: `http://localhost:3000/preview?path=/clinical-review.html&demo_mode=true&device=samsung-s26-ultra`. This entry is not imported by production routes. Toggle vet, review/edit/approve, return to parent, export, switch pets. The release owner owns integrated mobile/browser verification and deployment. This task performs no competing deploy or protected-deployment check.

## Primary documentation checked 2026-09-14

- [OpenAI Responses](https://developers.openai.com/api/reference/cli/resources/responses/methods/create): API shape, `store`, `max_output_tokens`, output messages.
- [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search): primary-domain filters, completed search provenance and URL citation annotations.
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data): provider retention is not eliminated by `store:false`.
- [Gemini API terms](https://ai.google.dev/gemini-api/terms): clinical-use restriction and paid/unpaid data handling.
- [Sarvam models](https://docs.sarvam.ai/api/getting-started/models): reasoning, Indic text/voice capabilities; no veterinary-quality guarantee. User subsequently rejected Sarvam; it is not used.
