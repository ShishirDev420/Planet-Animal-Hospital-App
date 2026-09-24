import { ambientMarkup, motionStyles } from './planet-art.js';
import { soulMarkup, soulStyles } from './soul-art.js';

/** Identical renderer for the bio hero and hospital loader. No minimum duration. */
export function mountPlanetMotion(host, logoSrc, { words = [], ambientContainer = host.parentElement, motionControl = null, ambient = true } = {}) {
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${motionStyles}\n${soulStyles}</style>${soulMarkup}`;
  const fieldHost = document.createElement("div");
  fieldHost.style.display = "block";
  const field = fieldHost.attachShadow({ mode: "open" });
  field.innerHTML = ambient ? `<style>${motionStyles}\n.orb-field{opacity:.2}.dance-orbs{display:none}</style>${ambientMarkup}` : '';
  if (ambient) ambientContainer.prepend(fieldHost);
  const stage = root.querySelector('.hero-logo-orbit');
  root.querySelector('.brand-logo').src = logoSrc;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  // Respect the system initially; a deliberate tap can enable motion on this page.
  let userMotion = null;
  const motionEnabled = () => userMotion === null ? !media.matches : userMotion;
  const arms = ['earth', 'moon', 'vet'].map((name, i) => ({
    element: root.querySelector(`.orbit-arm-${name}`), phase: i * Math.PI * 2 / 3,
  }));
  const dances = [...field.querySelectorAll('.dance-orb')];
  const faceOrder = ['golden', 'rabbit', 'cat', 'hamster', 'dog', 'guinea-pig'];
  let frame = 0, last = null, elapsed = 0, visible = true, disposed = false;
  let width = 0, height = 0, centerX = 0, centerY = 0;
  let wordIndex = 0;
  const measure = () => {
    const rect = stage.getBoundingClientRect();
    width = rect.width; height = rect.height;
    centerX = rect.left + width / 2; centerY = rect.top + height / 2;
    draw();
  };
  function draw() {
    const angle = elapsed / 56000 * Math.PI * 2 - Math.PI / 4;
    // Equal angular speed and 120-degree spacing prevent the old icon collisions.
    arms.forEach(({ element, phase }) => {
      const a = angle + phase;
      const x = width * .37 * Math.cos(a), y = height * .36 * Math.sin(a);
      const tilt = -Math.PI / 15;
      element.style.transform = `translate3d(${(x * Math.cos(tilt) - y * Math.sin(tilt)).toFixed(2)}px,${(x * Math.sin(tilt) + y * Math.cos(tilt)).toFixed(2)}px,0) scale(${(.9 + .1 * Math.sin(a)).toFixed(3)})`;
    });
    dances.forEach((element, i) => {
      const a = elapsed / 40000 * Math.PI * 2 + i * Math.PI * 2 / 3;
      const rx = Math.min(innerWidth * .32, 360);
      element.style.transform = `translate3d(${(centerX + rx * Math.cos(a)).toFixed(2)}px,${(centerY + Math.max(rx * .52, 120) * Math.sin(a)).toFixed(2)}px,0)`;
    });
    // Characters crossfade directly; never leave an empty orb between faces.
    const faceAt = (time, offset) => faceOrder[(Math.floor(time / 6000) + offset) % faceOrder.length];
    // Match each glow to its visible character.
    stage.dataset.earthTone = faceOrder[Math.floor(elapsed / 6000) % faceOrder.length];
    stage.dataset.moonTone = faceOrder[(Math.floor((elapsed + 1800) / 6000) + 1) % faceOrder.length];
    stage.dataset.morph = faceAt(elapsed, 0);
    stage.dataset.moon = faceAt(elapsed + 1800, 1);
    stage.dataset.vetMorph = Math.floor(elapsed / 4800) % 2 ? 'heart' : 'paw';
    if (words.length) {
      const next = Math.floor(elapsed / 3000) % words.length;
      if (next !== wordIndex) {
        words[wordIndex].classList.remove('is-active');
        words[next].classList.add('is-active');
        wordIndex = next;
      }
    }
  }
  const active = () => !disposed && visible && !document.hidden && motionEnabled();
  function tick(now) {
    frame = 0;
    if (!active()) return;
    if (last !== null) elapsed += Math.min(now - last, 100);
    last = now;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function reconcile() {
    cancelAnimationFrame(frame); frame = 0; last = null;
    host.toggleAttribute('data-motion-paused', !active());
    fieldHost.toggleAttribute('data-motion-paused', !active());
    host.toggleAttribute('data-motion-enabled', motionEnabled());
    fieldHost.toggleAttribute('data-motion-enabled', motionEnabled());
    if (motionControl) {
      motionControl.hidden = false;
      motionControl.textContent = motionEnabled() ? 'Pause animation' : 'Play animation';
      motionControl.setAttribute('aria-pressed', String(motionEnabled()));
    }
    if (active()) frame = requestAnimationFrame(tick);
  }
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting; reconcile();
  }) : null;
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  observer?.observe(stage); resize?.observe(stage);
  const toggleMotion = () => { userMotion = !motionEnabled(); measure(); reconcile(); };
  const preferenceChanged = () => { userMotion = null; reconcile(); };
  const resume = () => { measure(); reconcile(); };
  motionControl?.addEventListener('click', toggleMotion);
  document.addEventListener('visibilitychange', reconcile);
  if (media.addEventListener) media.addEventListener('change', preferenceChanged);
  else media.addListener(preferenceChanged);
  window.addEventListener('pageshow', resume);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', measure, { passive: true });
  measure(); reconcile();
  return () => {
    disposed = true; cancelAnimationFrame(frame);
    observer?.disconnect(); resize?.disconnect();
    motionControl?.removeEventListener('click', toggleMotion);
    document.removeEventListener('visibilitychange', reconcile);
    if (media.removeEventListener) media.removeEventListener('change', preferenceChanged);
    else media.removeListener(preferenceChanged);
    window.removeEventListener('pageshow', resume);
    window.removeEventListener('resize', measure);
    window.removeEventListener('scroll', measure);
    fieldHost.remove();
    root.replaceChildren();
  };
}
