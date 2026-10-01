import { soulMarkup, soulStyles } from './soul-art.js';

/** Shared care animation. One clock drives orbit, icon transitions and energy. */
export function mountPlanetMotion(host, logoSrc, { words = [], motionControl = null } = {}) {
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${soulStyles}</style>${soulMarkup}`;
  const stage = root.querySelector('.soul-stage');
  root.querySelector('.brand-logo').src = logoSrc;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const arms = ['earth', 'moon', 'vet'].map((name, i) => ({element: root.querySelector(`.orbit-arm-${name}`), phase: i * Math.PI * 2 / 3, offset: i * 1500}));
  const warp = root.querySelector('.care-warp');
  const trail = root.querySelector('.care-orbit-trail');
  let userMotion = null, frame = 0, last = null, elapsed = 0, visible = true, disposed = false, width = 0, height = 0, wordIndex = 0;
  const motionEnabled = () => userMotion === null ? !media.matches : userMotion;
  function draw() {
    const angle = elapsed / 28000 * Math.PI * 2 - Math.PI / 4;
    arms.forEach(({element, phase, offset}) => {
      const a = angle + phase;
      element.style.transform = `translate3d(${(width * .355 * Math.cos(a)).toFixed(2)}px,${(height * .335 * Math.sin(a)).toFixed(2)}px,0)`;
      const pulse = (Math.sin(elapsed / 1700 + phase) + 1) / 2;
      element.style.setProperty('--energy-scale', (.92 + pulse * .23).toFixed(3));
      element.style.setProperty('--energy-opacity', (.06 + pulse * .12).toFixed(3));
      element.style.setProperty('--energy-angle', `${elapsed / 140 + phase * 57.3}deg`);
      // A continuous shaped crossfade keeps both drawn symbols legible in transition.
      const cycle = ((elapsed + offset) % 12000) / 12000;
      const next = cycle < .4 ? 0 : cycle < .5 ? (cycle - .4) * 10 : cycle < .9 ? 1 : (1 - cycle) * 10;
      const eased = next * next * (3 - 2 * next);
      element.style.setProperty('--symbol-first', String(1 - eased));
      element.style.setProperty('--symbol-next', String(eased));
      element.style.setProperty('--symbol-scale', String(1 - .16 * eased));
      element.style.setProperty('--next-scale', String(.84 + .16 * eased));
    });
    warp.style.transform = `rotate(${Math.sin(elapsed / 5500) * 3}deg) scale(${1 + .015 * Math.sin(elapsed / 1700)})`;
    trail.style.strokeDashoffset = String(-elapsed / 38);
    if (words.length) {
      const next = Math.floor(elapsed / 3000) % words.length;
      if (next !== wordIndex) { words[wordIndex].classList.remove('is-active'); words[next].classList.add('is-active'); wordIndex = next; }
    }
  }
  const measure = () => { const rect = stage.getBoundingClientRect(); width = rect.width; height = rect.height; draw(); };
  const active = () => !disposed && visible && !document.hidden && motionEnabled();
  function tick(now) { frame = 0; if (!active()) return; if (last !== null) elapsed += Math.min(now - last, 100); last = now; draw(); frame = requestAnimationFrame(tick); }
  function reconcile() {
    cancelAnimationFrame(frame); frame = 0; last = null;
    host.toggleAttribute('data-motion-paused', !active());
    host.toggleAttribute('data-motion-enabled', motionEnabled());
    if (motionControl) { motionControl.hidden = false; motionControl.textContent = motionEnabled() ? 'Pause animation' : 'Play animation'; motionControl.setAttribute('aria-pressed', String(motionEnabled())); }
    if (active()) frame = requestAnimationFrame(tick);
  }
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reconcile(); }) : null;
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  observer?.observe(stage); resize?.observe(stage);
  const toggleMotion = () => { userMotion = !motionEnabled(); measure(); reconcile(); };
  const preferenceChanged = () => { userMotion = null; reconcile(); };
  const resume = () => { measure(); reconcile(); };
  motionControl?.addEventListener('click', toggleMotion);
  document.addEventListener('visibilitychange', reconcile);
  if (media.addEventListener) media.addEventListener('change', preferenceChanged); else media.addListener(preferenceChanged);
  window.addEventListener('pageshow', resume); window.addEventListener('resize', measure, {passive:true});
  measure(); reconcile();
  return () => {
    disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); resize?.disconnect();
    motionControl?.removeEventListener('click', toggleMotion); document.removeEventListener('visibilitychange', reconcile);
    if (media.removeEventListener) media.removeEventListener('change', preferenceChanged); else media.removeListener(preferenceChanged);
    window.removeEventListener('pageshow', resume); window.removeEventListener('resize', measure); root.replaceChildren();
  };
}
