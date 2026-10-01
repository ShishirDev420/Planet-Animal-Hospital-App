# Roadmap, conversation and care motion refinement

Implemented locally on DESKTOP-GN55HE1, building on reliability release 69cbcc16.

## Changes

- Fixed direct-route unstyled conversations: CareAssistant owns its stylesheet rather than relying on the lazy AI Vet page to load it.
- Refined roadmap hierarchy, recorded progress, general guides, milestone typography and conversation spacing within the existing green/gold Planet branding. Empty/loading/error states do not invent progress; retry uses the existing care refresh.
- Faded the Care agents ambient decoration on all edges. Foreground characters, cards and selection routes remain intact.
- Replaced the shared loader's raster companions/emoji satellite with six original SVG care symbols in three coordinated orbiting elements. The central Planet logo stays unchanged. One animation clock drives the 28-second orbit, slow ring deformation, soft energy pulses and shaped symbol crossfades. No audio, canvas, GPU renderer or new dependencies.
- All existing Planet loading gates use the shared renderer. No decorative loading delay was added.

## Validation

- TypeScript, Vite production build, and 75 existing care/domain/API tests passed. The pre-existing Firebase chunk size warning remains.
- Local Chrome: direct visits, reload, both AI/roadmap navigation orders, history back/forward, all three care agent selections and disclosure passed at 390px and 1440px.
- Isolated synthetic fixture: recorded progress excludes exempt steps; empty/loading/error states, retry, consent gating, quota blocking, service failure/retry, answer rendering and pet-change reset passed. No overflow at 320/390/768/1440px; keyboard focus visible.
- Motion: real style changes over elapsed frames, pause/resume, static reduced motion and all six vector symbols verified. Animation stops offscreen/when the document is hidden and releases observers/listeners/RAF on teardown.
- Twelve public/demo routes and service/date/time/visit review/close passed without page errors or horizontal overflow. No WhatsApp submission was invoked.
- Local screenshots are in the task's evidence/refinement-qa and evidence/refinement-after-local folders. They are independent browser captures, not the supplied Library screenshot. Library materialization on Windows failed because the supported metadata helper called unavailable os.setxattr; no metadata bypass was attempted.

## Reuse and boundaries

The framework-independent pair src/brand-motion/planet-motion.js and soul-art.js can be consumed by the verified bio app with mountPlanetMotion(host, logoSrc, {motionControl, words}). Keep both files byte-identical when pairing deployments. Call the returned cleanup on unmount. The renderer uses Shadow DOM for style isolation, scalable SVG for DPR independence, ResizeObserver with a window-resize fallback, and the system reduced-motion preference. No rendering plugin is required.

Bioversal's exact repository/deployed identity is still unresolved. The existing planetanimal-bio project was discovered, but it is not assumed to be Bioversal. No unidentified app is modified or deployed.

No Firebase rules, role claims, auth providers, secrets, patient records, real appointments or external messages changed. Signed-in production workflows require an authorized test account; prior emulator results are documented in the reliability release. This release does not resolve the separately documented permissive live legacy Firestore rules. Physical Android/iOS/Safari devices have not been tested.

Local Windows WebKit 26.6 also passed roadmap/AI/agents rendering without overflow or page exceptions at 390px/1440px and DPR 2, plus active orbit and pause. The initial timing assertion sampled before the first animation frame; explicitly waiting for frame start resolved the test discrepancy without an application change. This is not a physical Safari-device test.
