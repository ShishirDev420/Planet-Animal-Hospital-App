import { stageMarkup, ambientMarkup, motionStyles } from './planet-art.js';

/** Identical renderer for the bio hero and hospital loader. No minimum duration. */
export function mountPlanetMotion(host, logoSrc, { words = [], ambientContainer = host.parentElement } = {}) {
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${motionStyles}</style>${stageMarkup}`;
  const fieldHost = document.createElement("div");
  fieldHost.style.display = "contents";
  const field = fieldHost.attachShadow({ mode: "open" });
  field.innerHTML = `<style>${motionStyles}</style>${ambientMarkup}`;
  ambientContainer.prepend(fieldHost);
  const stage = root.querySelector('.hero-logo-orbit');
  root.querySelector('.brand-logo').src = logoSrc;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const arms = ['earth', 'moon', 'vet'].map((name, i) => ({
    element: root.querySelector(`.orbit-arm-${name}`), phase: i * Math.PI * 2 / 3,
  }));
  const dances = [...field.querySelectorAll('.dance-orb')];
  const earthStates = ['globe', 'heart', 'globe', 'shiba', 'globe', 'poodle', 'globe', 'cat', 'globe'];
  const moonStates = ['globe', 'heart', 'dog', 'cat', 'family'];
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
    const angle = elapsed / 24000 * Math.PI * 2 - Math.PI / 2;
    // Equal angular speed and 120-degree spacing prevent the old icon collisions.
    arms.forEach(({ element, phase }) => {
      const a = angle + phase;
      element.style.transform = `translate3d(${(width * .41 * Math.cos(a)).toFixed(2)}px,${(height * .275 * Math.sin(a)).toFixed(2)}px,0)`;
    });
    dances.forEach((element, i) => {
      const a = elapsed / 40000 * Math.PI * 2 + i * Math.PI * 2 / 3;
      const rx = Math.min(innerWidth * .32, 360);
      element.style.transform = `translate3d(${(centerX + rx * Math.cos(a)).toFixed(2)}px,${(centerY + Math.max(rx * .52, 120) * Math.sin(a)).toFixed(2)}px,0)`;
    });
    stage.dataset.morph = earthStates[Math.floor(elapsed / 3000) % earthStates.length];
    stage.dataset.moon = moonStates[Math.floor(elapsed / 3600) % moonStates.length];
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
  const active = () => !disposed && visible && !document.hidden && !media.matches;
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
    if (active()) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting; reconcile();
  });
  const resize = new ResizeObserver(measure);
  observer.observe(stage); resize.observe(stage);
  document.addEventListener('visibilitychange', reconcile);
  media.addEventListener('change', reconcile);
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('scroll', measure, { passive: true });
  measure(); reconcile();
  return () => {
    disposed = true; cancelAnimationFrame(frame);
    observer.disconnect(); resize.disconnect();
    document.removeEventListener('visibilitychange', reconcile);
    media.removeEventListener('change', reconcile);
    window.removeEventListener('resize', measure);
    window.removeEventListener('scroll', measure);
    fieldHost.remove();
    root.replaceChildren();
  };
}
