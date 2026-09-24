// Neutral chibi companions; the original brand logo remains untouched.
const faces = [
  ['golden', new URL('./chibi-golden.webp', import.meta.url).href],
  ['dog', new URL('./chibi-dog.webp', import.meta.url).href],
  ['cat', new URL('./chibi-cat.webp', import.meta.url).href],
  ['rabbit', new URL('./chibi-rabbit.webp', import.meta.url).href],
  ['hamster', new URL('./chibi-hamster.webp', import.meta.url).href],
  ['guinea-pig', new URL('./chibi-guinea-pig.webp', import.meta.url).href],
];
const tones = { rabbit: ['#fffaf2', '#ecdace', '#bda8a1'], hamster: ['#fff1d1', '#d9a061', '#8a6244'], 'guinea-pig': ['#fff3e3', '#c18b65', '#75503e'], golden: ['#fff0cb', '#dfad66', '#806044'], dog: ['#fff8e8', '#e8d0a7', '#a48a70'], cat: ['#f3ede8', '#b9b2ae', '#77757d'] };
const lights = faces.map(([name]) => `<span class="companion-tint tint-${name}"><span class="companion-halo"></span><span class="companion-light"></span></span>`).join('');
const portraits = faces.map(([name,src]) => `<img class="pet-face pet-${name}" src="${src}" alt="" width="320" height="320" decoding="async" />`).join('');

export const soulMarkup = `<div class="hero-logo-orbit soul-stage" aria-label="Planet Animal Hospital — care that stays with you">
  <div class="soul-aura" aria-hidden="true"></div>
  <div class="orbit-ring orbit-ring-earth" aria-hidden="true"></div>
  <div class="orbit-arm orbit-arm-earth" aria-hidden="true"><div class="soul-companion">${lights}${portraits}</div></div>
  <div class="orbit-arm orbit-arm-moon" aria-hidden="true"><div class="soul-companion">${lights}${portraits}</div></div>
  <div class="orbit-arm orbit-arm-vet" aria-hidden="true"><div class="soul-satellite"><span class="satellite-heart">♥</span><span class="satellite-family">👨‍👩‍👧</span></div></div>
  <img class="brand-logo" alt="Planet Animal Hospital" width="128" height="128" decoding="sync" fetchpriority="high" />
</div>`;

export const soulStyles = `
:host{display:block; width:100%; min-width:0}
.soul-stage{position:relative;width:100%;max-width:460px;height:auto;aspect-ratio:1.15;margin:0 auto;isolation:isolate;container-type:inline-size}
.soul-stage .brand-logo{width:31%;z-index:5;filter:none}
.soul-stage .orbit-ring-earth{width:74%;height:72%;border:1px solid #fec70824;box-shadow:none;transform:translate(-50%,-50%) rotate(-12deg)}
.soul-aura{position:absolute;inset:18%;border-radius:50%;background:radial-gradient(ellipse,#fec7080b,transparent 65%);pointer-events:none}
.soul-stage .orbit-arm{z-index:6}
.soul-companion{position:absolute;width:18cqw;max-width:80px;aspect-ratio:1;transform:translate(-50%,-50%);animation:chibi-nod 7s ease-in-out infinite}
.orbit-arm-moon .soul-companion{animation-delay:-3.5s}
@keyframes chibi-nod{0%,100%{transform:translate(-50%,-50%) rotate(-2deg)}50%{transform:translate(-50%,calc(-50% - 2px)) rotate(2deg)}}
.pet-face{z-index:1;position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transform:scale(.76) translateY(4px);transition:opacity 1.3s ease-in-out,transform 1.8s cubic-bezier(.22,1,.36,1);filter:none}
${faces.flatMap(([name]) => [`.soul-stage[data-morph="${name}"] .orbit-arm-earth .pet-${name}`, `.soul-stage[data-moon="${name}"] .orbit-arm-moon .pet-${name}`]).join(',')}{opacity:1;transform:scale(1) translateY(0)}
.companion-tint{position:absolute;inset:0;opacity:0;transition:opacity 1.3s ease-in-out;pointer-events:none}
${faces.map(([name]) => `.tint-${name}{--shine:${tones[name][0]};--coat:${tones[name][1]};--shade:${tones[name][2]}}`).join('')}
${faces.flatMap(([name]) => [`.soul-stage[data-earth-tone="${name}"] .orbit-arm-earth .tint-${name}`, `.soul-stage[data-moon-tone="${name}"] .orbit-arm-moon .tint-${name}`]).join(',')}{opacity:1}
.companion-halo{position:absolute;inset:-12%;border-radius:50%;background:radial-gradient(circle,var(--coat) 0%,transparent 68%);opacity:.22}
.companion-light{position:absolute;inset:34%;border-radius:50%;opacity:0;background:radial-gradient(circle at 32% 28%,var(--shine),var(--coat) 30%,var(--shade) 75%);transition:opacity 1s ease-in-out,transform 1.4s ease-in-out;transform:scale(.6)}
.soul-stage[data-morph="globe"] .orbit-arm-earth .companion-light,.soul-stage[data-moon="globe"] .orbit-arm-moon .companion-light{opacity:.9;transform:scale(1)}
.soul-satellite{position:absolute;width:28px;aspect-ratio:1;transform:translate(-50%,-50%)}
.soul-satellite span{position:absolute;inset:0;display:grid;place-items:center;font-size:22px;line-height:1;opacity:0;transition:opacity 1.3s ease-in-out}
.satellite-heart{color:#edb8a6}
.soul-stage[data-vet-morph="heart"] .satellite-heart,.soul-stage[data-vet-morph="paw"] .satellite-family{opacity:1}
:host([data-motion-paused]) *, :host([data-motion-paused]) *::before, :host([data-motion-paused]) *::after{animation-play-state:paused!important;transition:none!important}
@media(prefers-reduced-motion:reduce){:host(:not([data-motion-enabled])) *{animation:none!important;transition:none!important}}
`;
