// Framework-independent, resolution-independent care artwork for the shared renderer.
const symbols = [
  ['earth', '#efd28a', '<path d="M16 10v10a10 10 0 0 0 20 0V10M13 10h6m14 0h6M26 30v5a9 9 0 0 0 18 0v-6"/><circle cx="44" cy="25" r="4"/>', '<path d="M28 8v40m-6-35h12M21 19c-10 8 24 9 14 17-5 4-16 3-12 9M32 15c7-6 4-9 0-8"/>'],
  ['moon', '#92d8c5', '<path d="M28 44S8 33 8 20C8 9 22 7 28 18 34 7 48 9 48 20c0 13-20 24-20 24Z"/><path d="M12 27h9l4-8 6 16 4-8h9"/>', '<path d="M15 42C6 23 20 9 44 10c1 25-11 36-29 32Zm0 0 22-23M26 30V19m0 11h11"/>'],
  ['vet', '#e6e3c8', '<path d="M8 37c5-4 8-4 13-1l7 4 12-7c6-3 10 1 6 5L31 49c-2 1-4 1-7 0L8 43"/><path d="M24 25c-5 6-1 9 4 7 6 2 10-1 5-7-3-5-6-5-9 0Z"/><ellipse cx="20" cy="19" rx="2.5" ry="3.5"/><ellipse cx="27" cy="15" rx="2.5" ry="3.5"/><ellipse cx="35" cy="18" rx="2.5" ry="3.5"/>', '<path d="m28 7 17 7v14c0 10-17 20-17 20S11 38 11 28V14L28 7Z"/><path d="m20 27 6 6 11-13"/>'],
];
const icon = (content, alternate = false) => `<svg class="care-symbol${alternate ? ' care-symbol-next' : ''}" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
export const soulMarkup = `<div class="hero-logo-orbit soul-stage" role="img" aria-label="Planet Animal Hospital: veterinary care, wellness and support">
  <div class="soul-aura" aria-hidden="true"></div>
  <svg class="care-orbit-field" viewBox="0 0 360 313" aria-hidden="true"><g class="care-warp"><ellipse cx="180" cy="156.5" rx="128" ry="105"/><ellipse class="care-orbit-echo" cx="180" cy="156.5" rx="139" ry="116"/><ellipse class="care-orbit-trail" cx="180" cy="156.5" rx="128" ry="105"/></g></svg>
  ${symbols.map(([name, tone, first, second]) => `<div class="orbit-arm orbit-arm-${name}" style="--care-tone:${tone}" aria-hidden="true"><div class="care-emblem"><span class="care-energy"></span><span class="care-energy-ring"></span>${icon(first)}${icon(second, true)}</div></div>`).join('')}
  <img class="brand-logo" alt="" width="128" height="128" decoding="sync" fetchpriority="high" />
</div>`;
export const soulStyles = `
:host{display:block;width:100%;min-width:0}*{box-sizing:border-box}
.soul-stage{position:relative;width:100%;aspect-ratio:1.15;margin:auto;isolation:isolate}
.brand-logo{position:absolute;left:50%;top:50%;width:29%;height:auto;transform:translate(-50%,-50%);z-index:3}
.soul-aura{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(ellipse,#fec70815,transparent 66%)}
.care-orbit-field{position:absolute;inset:0;width:100%;height:100%;overflow:visible;fill:none;stroke:#dac57930;stroke-width:.8}
.care-warp{transform-origin:180px 156.5px}.care-orbit-echo{stroke:#85c9b918;stroke-dasharray:2 9}.care-orbit-trail{stroke:#d9c27a80;stroke-width:1.5;stroke-dasharray:75 665;stroke-linecap:round}
.orbit-arm{position:absolute;left:50%;top:50%;width:19%;aspect-ratio:1;z-index:4}
.care-emblem{position:absolute;inset:0;transform:translate(-50%,-50%);color:var(--care-tone)}
.care-emblem:before{content:'';position:absolute;inset:5%;border-radius:30% 42% 32% 44%;background:linear-gradient(140deg,#ffffff12,#0b201ac9 65%);border:1px solid #ffffff16;box-shadow:inset 0 1px 0 #ffffff14,0 5px 16px #0002;transform:rotate(-8deg)}
.care-energy{position:absolute;inset:-48%;border-radius:50%;background:radial-gradient(circle,var(--care-tone),transparent 66%);opacity:.12;transform:scale(var(--energy-scale,1))}
.care-energy-ring{position:absolute;inset:-12%;border:1px solid var(--care-tone);opacity:var(--energy-opacity,.1);border-radius:45% 55% 53% 47%;transform:rotate(var(--energy-angle,0deg)) scale(var(--energy-scale,1))}
.care-symbol{position:absolute;inset:8%;width:84%;height:84%;opacity:var(--symbol-first,1);transform:scale(var(--symbol-scale,1));filter:drop-shadow(0 1px 2px #0004)}
.care-symbol-next{opacity:var(--symbol-next,0);transform:scale(var(--next-scale,.84))}
:host([data-motion-paused]) *{transition:none!important}
`;
