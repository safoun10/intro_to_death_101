import { renderContent, initRevealObserver } from './render.js';
import { initAudioToggle } from './audio.js';

async function init() {
    try {
        const response = await fetch('data/content.json');
        const data = await response.json();
        
        renderContent(data);
        initRevealObserver();
        // initialize ambient audio toggle (AudioContext created on user gesture)
        initAudioToggle();

    } catch (err) {
        console.error('Failed to load content:', err);
    }
}

document.addEventListener('DOMContentLoaded', init);

// Scroll to top handler
document.getElementById('scroll-top')?.addEventListener('click', () => {
  lenis.scrollTo(0, { duration: 1.5 });
});

// Lenis initialization
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

