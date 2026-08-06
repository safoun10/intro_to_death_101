/* Simple ambient drone using the Web Audio API.
   No external assets are used — generated in-browser.
   The AudioContext is created on user gesture (toggle click) to satisfy browser autoplay policies.
*/

let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let nodes = {};

function createDrone() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0; // will fade in
  masterGain.connect(audioCtx.destination);

  // Low warm oscillator cluster
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 36; // low fundamental

  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = 45;

  const g1 = audioCtx.createGain();
  g1.gain.value = 0.45;
  const g2 = audioCtx.createGain();
  g2.gain.value = 0.28;

  // Slight detune for unpleasant beating
  osc2.detune.value = 12;

  // Filter to keep it rumbling
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.Q.value = 0.9;

  // Slow LFO to modulate filter cutoff
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.03;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 260; // depth
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  osc1.connect(g1); g1.connect(filter);
  osc2.connect(g2); g2.connect(filter);

  // Low-volume noise for texture
  const bufferSize = audioCtx.sampleRate * 2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.03;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.12;
  noise.connect(noiseGain);
  noiseGain.connect(filter);

  // Slight high-pass on master to remove sub rumble
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 20;
  filter.connect(hp);
  hp.connect(masterGain);

  // store nodes for shutdown
  nodes = { osc1, osc2, g1, g2, filter, lfo, lfoGain, noise, noiseGain, hp };

  // start sources
  const now = audioCtx.currentTime;
  osc1.start(now);
  osc2.start(now);
  lfo.start(now);
  noise.start(now);

  // fade in master
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.38, now + 4);

  isPlaying = true;
}

function stopDrone() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(0, now + 2.2);

  // stop oscillators and noise after fade
  setTimeout(() => {
    try {
      nodes.osc1.stop();
      nodes.osc2.stop();
      nodes.lfo.stop();
      nodes.noise.stop();
    } catch (e) {
      // ignore if already stopped
    }
    // close audio context
    audioCtx.close();
    audioCtx = null;
    nodes = {};
    isPlaying = false;
  }, 2300);
}

export function initAudioToggle(buttonId = 'audio-toggle') {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    // If context exists and playing, stop. Otherwise start.
    if (!audioCtx) {
      // create/resume on user gesture
      createDrone();
      btn.textContent = 'Stop sound';
      btn.setAttribute('aria-pressed', 'true');
    } else {
      stopDrone();
      btn.textContent = 'Play sound';
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // expose a programmatic control on the button via dataset
  btn.dataset.playing = 'false';
}

export function isAudioPlaying() {
  return isPlaying;
}
