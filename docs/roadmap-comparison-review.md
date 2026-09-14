# Roadmap and comparison: local review

This review carries forward the uncommitted roadmap follow-up and all care, prescription and wallet work. It is not a production repair or release. No protected deployment checks, security bypass, live rules/claims changes, push or deployment were performed for this request.

## Root cause and model

The source for the deployed motion/Plans baseline (`426e3f3`, `src/pages/Roadmap.tsx`) reads `import.meta.env.VITE_GROQ_API_KEY`, throws `Groq API Key missing`, and calls `https://api.groq.com/openai/v1/chat/completions` from the browser with `llama-3.3-70b-versatile`. It also asks the model to invent fixed phase timelines. The screenshot describes this legacy route, not the new `/api/assistant` implementation. Adding another browser key is not the fix.

The combined local checkout renders shared recorded care plus the bounded authenticated server assistant. No legacy Groq error, endpoint or browser key reference remains in the built assets or active source. A free prepared educational checklist remains usable when private services fail. Provider output is an explicit discussion draft; only verified veterinary instructions are represented as approved care. Missing dates remain missing.

Recommendation: keep the existing securely configured `gemini-2.5-flash-lite` for lightweight administrative record summaries, missing-field questions and appointment preparation. Official model documentation lists structured output and describes low-latency lightweight tasks: https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite . This is not an unrestricted clinical-advice recommendation: the current Gemini terms restrict clinical practice and medical advice, https://ai.google.dev/gemini-api/terms . The existing synthetic provider connection was verified previously; real provider generation was not re-tested in this local-only follow-up. Switching models does not resolve the still-unconfirmed deployed environment configuration issue.

## Comparison

The combined checkout now includes the exact already-live three-offer data from the Plans worktree. SHA256 of `src/lib/planOffers.ts` matches that source: `79B748455262A681C992E873F33FF075D3C6309CA9E00EFCD33C2FFBF7EBB4FF`. Essential ₹999/month, Advanced ₹1,999/month, Premium ₹3,499/month, every benefit value and every uncertainty label are retained.

The annotated comparison now has a stronger heading, benefit categories, a differences-only filter, price headings that highlight the selected column, grouped rows and a focused plan summary leading to the existing hospital enquiry. No paw trails, shimmer, invented savings, purchase activation or membership write were added. The logo, navigation and shared motion/styles were not changed.

## Verification

- 51 tests passed; TypeScript and Vite build passed. TypeScript now scopes to application/API/test sources instead of scanning local operational helpers.
- Browser credential scan: zero server key/private-key matches. Legacy Groq code scan: no matches in active source or build.
- Samsung in-app MobilePreview: category selection, differences filter (3 everyday rows to 2 differing rows), Premium highlight and correct ₹3,499 WhatsApp enquiry href verified. No message was sent.
- Desktop: 1280px viewport and content width, all 12 rows, no console errors.
- Isolated synthetic assistant at 320px: consent gate, failure, same-request retry to a labelled draft, 2 attempts / 1 unique request ID, no overflow; changing pet clears the draft. This is a simulated provider, not a claim of live AI success.
- Expanded real Auth/Firestore emulator run PASSED, including source context, provider failure/retry without extra quota, unchanged clinical record, stale-cache rejection, owner isolation and wallet concurrency. The first attempt stopped during emulator startup timeout before tests; the bounded retry completed successfully.

Local preview: `http://localhost:3000/preview?path=/plans&demo_mode=true&device=samsung-s26-ultra` and the same URL with `path=/roadmap`. Vite was started using PowerShell Start-Job from the care-wallet checkout; port3000 serves this combined source.

Release boundary: the current live legacy route cannot be replaced by local edits alone. The earlier protected-preview configuration problem remains unconfirmed; production rollout is stopped by the prior automatic safety review. Actual veterinarian/billing identities and coordinated private access remain outstanding. Do not claim production fixed or activate individualized care without completing those authorized steps later.
