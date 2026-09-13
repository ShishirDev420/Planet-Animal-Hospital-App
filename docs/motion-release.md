# Focused motion release — 13 September 2026

Based on deployed commit `781820a79fb5748732331c5384121e806389a820` from `ShishirDev420/Planet-Animal-Hospital-App`, checked out in the saved APP 2 project. The older redesign in the separate Planet Animal Hospital/app folder is not part of this release.

The loader now consumes the exact bio renderer and art/styles in `src/brand-motion`. The original logo file is unchanged. Existing dashboard, navigation, cards, typography and commercial/gamification rules are unchanged.

The 900 ms decorative splash and 640 ms decorative route-loader invocations were removed from Layout. Actual authentication, data and lazy-route loaders continue using their real loading state; no replacement minimum timer is introduced.

Canonical shared files live in the sibling Planet Animal Bio/shared directory. Use its scripts/sync-motion.mjs and --check option to prevent drift. Local motion-review.html isolates the real React loader for visual inspection without modifying application routes, and is excluded from deployment.

Validation: TypeScript check and Vite production build; motion lifecycle test covering reduced preference, background/offscreen pause, phase continuity and cleanup; shared-file and original-logo hashes; browser rendering and elapsed motion. Physical Safari/iPhone/Android testing remains outside this Windows browser verification.

Existing dependencies report audit findings and large bundle warnings. This focused visual release does not claim to resolve the application's broader security or production architecture issues.
