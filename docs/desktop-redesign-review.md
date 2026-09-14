# Desktop redesign handoff — 14 September 2026

Baseline approved by release owner: `3fbd140fad83764fa186ff8629a63e64a3d16a59`.

## Result

Desktop now uses a solid deep-green workspace, grouped navigation, clear active links, a compact utility bar and an asymmetric pet overview/daily-care composition. The duplicate oversized dashboard brand header and animated desktop backdrop were removed. Supporting pages inherit quieter typography and solid card surfaces. The exact logo asset is unchanged.

Owned implementation: `src/components/Layout.tsx`, `src/pages/Dashboard.tsx`, `src/desktop.css`. Mobile shell markup and mobile header composition remain intact. Shared action improvements add keyboard activation, respect reduced motion and retain the preview query when opening records, AI and roadmap. No care rules, wallet calculations, authentication, APIs or doctor-portal files changed.

## Verification

- TypeScript and production build passed before final accessibility/CSS refinements; final build result is reported in the handoff message.
- Care suite: **74 passed, 0 failed**.
- Chrome screenshots visually inspected: existing desktop, redesigned wide desktop, narrow desktop, Samsung mobile preview, and synthetic doctor portal.
- Measured narrow desktop viewport **1025 × 768**: main client/scroll width **794/794**, sidebar client/scroll height **768/768**.
- **1023px** breakpoint: desktop shell absent, mobile shell present; main client/scroll width **1021/1021**.
- Samsung preview: shell client/scroll width **412/412**; desktop pet overview hidden. Medical Records action opened the intended page and retained preview context.
- Roadmap and Plans at **1025px**: main client/scroll width **794/794**. Roadmap button, sidebar active state, Plans navigation and Enter activation of daily briefing verified.
- Logo SHA-256: `05A9991EEF105EC72A2E16BBD5805977618303CCCD8C60E6C56E4EF416B674F0`.
- Chrome viewport control was affected by host scaling: requested sizes differed from CSS pixels. Figures above use measured DOM dimensions, not requested dimensions.
- Reduced-motion CSS and changed React motion branches reviewed in source; live OS reduced-motion emulation was not available. Native Safari, Firefox, real-device performance and protected production pages were not tested.
- Chrome became unavailable near the end. The attempt to restore its temporary viewport could not complete; no alternate browser was substituted.

## Doctor portal coordination

Release owner retains all doctor portal functionality. Synthetic review at port 3000: selected Milo inspected at **1920px**; initial patient selection inspected at **432px**. Document client/scroll widths match at both widths, with no out-of-bounds main descendants at 432px. Expanded narrow review was not verified because the browser timed out.

Matching palette: canvas `#071912`, solid panels `#10251c`, muted copy `#a8b8ae`, border white/10, primary `#fec708` with dark text. Use the original Logo component for portal branding, 16px panel radii, and Outfit headings at weights 500–600. No portal edits made by this task.

The single release owner integrates these files and performs the authorized Vercel deployment. This task does not deploy.
