/* Audio module
   - Allows user to load an audio file (music) via file picker, or falls back to generated drone.
   - The fixed corner button toggles play/pause and, on first use, prompts to choose a music file.
   - Uses <audio> element for file playback (looped) and WebAudio drone as fallback.
*/

let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let nodes = {};
let audioEl = null;
let audioUrl = null;

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

function playAudioFileFromBlob(blob) {
  // stop any existing drone
  if (audioCtx) {
    stopDrone();
  }
  if (audioEl) {
    stopAudioFile();
  }

  audioUrl = URL.createObjectURL(blob);
  audioEl = new Audio(audioUrl);
  audioEl.loop = true;
  audioEl.volume = 0.45;
  audioEl.play().catch(() => { /* autoplay may be blocked without gesture */ });
  isPlaying = true;
}

function stopAudioFile() {
  if (!audioEl) return;
  audioEl.pause();
  audioEl.currentTime = 0;
  try { URL.revokeObjectURL(audioUrl); } catch (e) {}
  audioEl = null;
  audioUrl = null;
  isPlaying = false;
}

export function initAudioToggle(buttonId = 'audio-toggle-fixed', fileInputId = 'audio-file-input') {
  const btn = document.getElementById(buttonId);
  const fileInput = document.getElementById(fileInputId);
  if (!btn) return;

  btn.addEventListener('click', async (e) => {
    // if playing from audioEl, stop it
    if (audioEl && !audioEl.paused) {
      stopAudioFile();
      btn.setAttribute('aria-pressed', 'false');
      return;
    }

    // if drone is running, stop it
    if (audioCtx) {
      stopDrone();
      btn.setAttribute('aria-pressed', 'false');
      return;
    }

    // If a file is already loaded but paused, play it
    if (audioEl && audioEl.paused) {
      audioEl.play();
      btn.setAttribute('aria-pressed', 'true');
      return;
    }

    // No audio: prompt user to pick a music file
    if (fileInput) {
      const handleFile = () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.removeEventListener('change', handleFile);
        if (file) {
          playAudioFileFromBlob(file);
          btn.setAttribute('aria-pressed', 'true');
        } else {
          // If user cancelled, fallback to drone
          createDrone();
          btn.setAttribute('aria-pressed', 'true');
        }
      };
      fileInput.addEventListener('change', handleFile);
      fileInput.click();
    } else {
      // If no file input available, start drone
      createDrone();
      btn.setAttribute('aria-pressed', 'true');
    }
  });

  // keyboard accessibility: space/enter toggles
  btn.addEventListener('keydown', (ev) => {
    if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault();
      btn.click();
    }
  });
}

export function isAudioPlaying() {
  return isPlaying;
}
