/**
 * lib/audio.ts
 *
 * Browser-native Web Audio API micro-interaction sound synthesizer.
 * Tuned to deep celestial resonance and starlight sine chimes.
 *
 * DESIGN PRINCIPLES
 * ─────────────────
 * • Zero external asset dependencies — all sounds are synthesized programmatically
 *   from OscillatorNodes, GainNodes, and BiquadFilterNodes.
 * • Lazy AudioContext initialization on first call (respects browser autoplay policy).
 * • Pure ethereal sine waves for cosmic tranquility without harsh metallic artifacts.
 * • Guard against SSR: all calls no-op on the server.
 */

let _ctx: AudioContext | null = null;
let isAudioMuted = typeof window !== "undefined" ? localStorage.getItem("portfolio_audio_muted") === "true" : false;

/** Ensure AudioContext is resumed upon direct user gesture (touch/click). */
export function ensureAudioResumed(): void {
  if (typeof window === "undefined" || isAudioMuted) return;
  if (!_ctx) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      _ctx = new AudioCtx();
    } catch {
      return;
    }
  }
  if (_ctx && _ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
}

/** Toggle global audio mute state */
export function toggleAudioMute(): boolean {
  isAudioMuted = !isAudioMuted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("portfolio_audio_muted", String(isAudioMuted));
    } catch {}
  }
  return isAudioMuted;
}

/** Explicitly set mute state */
export function setAudioMutedState(muted: boolean): void {
  isAudioMuted = muted;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("portfolio_audio_muted", String(muted));
    } catch {}
  }
}

/** Get global audio mute state */
export function getAudioMuted(): boolean {
  return isAudioMuted;
}

/** Lazily create (or resume) the shared AudioContext on user interaction. */
function getCtx(): AudioContext | null {
  if (typeof window === "undefined" || isAudioMuted) return null;

  if (!_ctx) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      _ctx = new AudioCtx();
    } catch {
      return null;
    }
  }

  if (_ctx.state === "suspended") {
    void _ctx.resume();
  }

  return _ctx;
}

function scheduleEnvelope(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  type: OscillatorType,
  peakGain: number,
  attack: number,
  decay: number,
  sustain: number,
  release: number
): OscillatorNode | null {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    const t0 = ctx.currentTime;
    const t1 = t0 + attack;
    const t2 = t1 + decay;
    const sustainLevel = peakGain * sustain;
    const t3 = t2 + release;

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t1);
    gain.gain.linearRampToValueAtTime(sustainLevel, t2);
    gain.gain.setValueAtTime(sustainLevel, t2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t3);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(t0);
    osc.stop(t3 + 0.01);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    return osc;
  } catch {
    return null;
  }
}

/**
 * playHoverSound()
 * Ethereal celestial starlight chime — soft high-frequency bell tick.
 */
export function playHoverSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  scheduleEnvelope(
    ctx,
    ctx.destination,
    1320,       // Frequency: E6 celestial chime
    "sine",
    0.04,       // Soft amplitude
    0.003,
    0.04,
    0.0,
    0.05
  );

  scheduleEnvelope(
    ctx,
    ctx.destination,
    2640,       // Starlight harmonic overtone
    "sine",
    0.015,
    0.002,
    0.02,
    0.0,
    0.03
  );
}

/**
 * playSelectSound()
 * Resonant cosmic chord — 528 Hz into 1056 Hz harmonic affirmation.
 */
export function playSelectSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const osc1 = scheduleEnvelope(
    ctx,
    ctx.destination,
    528,        // Solfeggio 528 Hz resonant tone
    "sine",
    0.09,
    0.006,
    0.08,
    0.15,
    0.2
  );

  if (osc1 && ctx) {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1056, ctx.currentTime);

    const t0 = ctx.currentTime + 0.09;
    const t1 = t0 + 0.006;
    const t2 = t1 + 0.09;
    const t3 = t2 + 0.25;

    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0, t0);
    gain2.gain.linearRampToValueAtTime(0.08, t1);
    gain2.gain.linearRampToValueAtTime(0.015, t2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t3 + 0.01);
    osc2.onended = () => {
      osc2.disconnect();
      gain2.disconnect();
    };
  }
}

/**
 * playTransitionSound()
 * Deep interstellar sine resonance sweep for planetary camera transitions.
 */
export function playTransitionSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const t0 = ctx.currentTime;
    const t1 = t0 + 0.02;
    const t2 = t1 + 0.3;
    const t3 = t2 + 0.2;

    osc.frequency.setValueAtTime(264, t0);
    osc.frequency.exponentialRampToValueAtTime(88, t2);

    filter.frequency.setValueAtTime(600, t0);
    filter.frequency.exponentialRampToValueAtTime(150, t2);

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.08, t1);
    gain.gain.setValueAtTime(0.08, t2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t3 + 0.01);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  } catch {
    // Silently fail
  }
}

// ---------------------------------------------------------------------------
// 8-Bit Retro Synthesizers for Pixel Astronaut Companion
// ---------------------------------------------------------------------------

let lastBounceTimestamp = 0;
let lastThrusterTimestamp = 0;

/**
 * playRetroThrusterSound()
 * Filtered white noise with low square pulse.
 * Throttled to minimum 110ms interval.
 */
export function playRetroThrusterSound(): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastThrusterTimestamp < 110) return;
  lastThrusterTimestamp = now;

  const ctx = getCtx();
  if (!ctx) return;

  try {
    const bufferSize = ctx.sampleRate * 0.08; // 80ms buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(380, ctx.currentTime);
    filter.Q.setValueAtTime(3.0, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.045, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.075);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore audio errors
  }
}

/**
 * playRetroJumpSound()
 * Pitch-swept square wave ascending from 180Hz to 680Hz (zero-G fling/launch).
 */
export function playRetroJumpSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    const t0 = ctx.currentTime;
    osc.frequency.setValueAtTime(180, t0);
    osc.frequency.exponentialRampToValueAtTime(680, t0 + 0.12);

    gain.gain.setValueAtTime(0.04, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.13);
  } catch {
    // Ignore
  }
}

/**
 * playRetroBounceSound()
 * Throttled to 120ms cooldown to prevent wall-corner buzz.
 * Low 85Hz damped triangle pulse.
 */
export function playRetroBounceSound(): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastBounceTimestamp < 120) return;
  lastBounceTimestamp = now;

  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    const t0 = ctx.currentTime;
    osc.frequency.setValueAtTime(85, t0);
    osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.09);

    gain.gain.setValueAtTime(0.07, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.1);
  } catch {
    // Ignore
  }
}

/**
 * playRetroCoinSound()
 * Classic chiptune B5 (987.77Hz) -> E6 (1318.51Hz) pickup arpeggio.
 */
export function playRetroCoinSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    const t0 = ctx.currentTime;
    osc.frequency.setValueAtTime(987.77, t0);
    osc.frequency.setValueAtTime(1318.51, t0 + 0.065);

    gain.gain.setValueAtTime(0.045, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.23);
  } catch {
    // Ignore
  }
}

/**
 * playRetroSomersaultSound()
 * Chiptune 4-note ascending burst (C6, E6, G6, C7).
 */
export function playRetroSomersaultSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const notes = [1046.5, 1318.51, 1567.98, 2093.0];
    const t0 = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t0 + idx * 0.045;

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.03, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.08);
    });
  } catch {
    // Ignore
  }
}

/**
 * playRetroMenuSound()
 * Crisp 8-bit blip for UI menu toggle.
 */
export function playRetroMenuSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const t0 = ctx.currentTime;
    osc.frequency.setValueAtTime(659.25, t0); // E5
    osc.frequency.setValueAtTime(880.0, t0 + 0.035); // A5

    gain.gain.setValueAtTime(0.035, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.09);
  } catch {
    // Ignore
  }
}

/**
 * playRetroExplosionSound()
 * Deep low-frequency noise burst for asteroid impact.
 */
export function playRetroExplosionSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t0);
    osc.frequency.exponentialRampToValueAtTime(30, t0 + 0.28);

    gain.gain.setValueAtTime(0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.31);
  } catch {
    // Ignore
  }
}

/**
 * playRetroLaserSound()
 * High-to-low fast chiptune laser chirp.
 */
export function playRetroLaserSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.exponentialRampToValueAtTime(110, t0 + 0.12);

    gain.gain.setValueAtTime(0.04, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + 0.14);
  } catch {
    // Ignore
  }
}

/**
 * playGameOverSound()
 * Descending dissonant chiptune arpeggio.
 */
export function playGameOverSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23]; // A4, G#4, G4, F4

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t0 + i * 0.12;

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.05, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.19);
    });
  } catch {
    // Ignore
  }
}

/**
 * playVictoryFanfare()
 * Ascending triumphal chiptune fanfare.
 */
export function playVictoryFanfare(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t0 + i * 0.09;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.06, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.23);
    });
  } catch {
    // Ignore
  }
}

/**
 * playRetroSpeechBlip()
 * Soft, pleasant 2-tone chiptune blip for mascot dialogue popups and cycles.
 */
export function playRetroSpeechBlip(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const notes = [587.33, 880.0]; // D5 -> A5 micro-chirp

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t0 + i * 0.045;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.04, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.07);
    });
  } catch {
    // Ignore
  }
}

/**
 * playWarpJumpSound()
 * Pitch-bending sci-fi wormhole warp oscillator (ascending sweep with filter modulation and cosmic delay resonance).
 */
export function playWarpJumpSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    const dur = 0.65;

    // Dual oscillators: Sawtooth + Sine for rich harmonic space warp
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "sine";

    // Ascending exponential pitch sweep from deep bass to celestial shimmer
    osc1.frequency.setValueAtTime(110, t0);
    osc1.frequency.exponentialRampToValueAtTime(1760, t0 + dur);

    osc2.frequency.setValueAtTime(165, t0);
    osc2.frequency.exponentialRampToValueAtTime(2640, t0 + dur);

    // Resonant bandpass filter sweeping upward with the warp
    filter.type = "bandpass";
    filter.Q.setValueAtTime(4.5, t0);
    filter.frequency.setValueAtTime(260, t0);
    filter.frequency.exponentialRampToValueAtTime(3400, t0 + dur);

    // Dynamic gain envelope: smooth swell then collapse
    gain.gain.setValueAtTime(0.01, t0);
    gain.gain.linearRampToValueAtTime(0.08, t0 + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t0);
    osc2.start(t0);
    osc1.stop(t0 + dur);
    osc2.stop(t0 + dur);
  } catch {
    // Ignore
  }
}

/**
 * playWallImpactSound()
 * Crisp, punchy 8-bit wall thud with metallic snap.
 */
export function playWallImpactSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;

    // Body thud: fast downward pitch triangle
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = "triangle";
    thud.frequency.setValueAtTime(280, t0);
    thud.frequency.exponentialRampToValueAtTime(40, t0 + 0.08);

    thudGain.gain.setValueAtTime(0.08, t0);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);

    thud.connect(thudGain);
    thudGain.connect(ctx.destination);

    thud.start(t0);
    thud.stop(t0 + 0.09);

    // Metallic snap / transient click: high frequency square chirp
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = "square";
    snap.frequency.setValueAtTime(1500, t0);
    snap.frequency.exponentialRampToValueAtTime(280, t0 + 0.025);

    snapGain.gain.setValueAtTime(0.045, t0);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.03);

    snap.connect(snapGain);
    snapGain.connect(ctx.destination);

    snap.start(t0);
    snap.stop(t0 + 0.03);
  } catch {
    // Ignore
  }
}

/**
 * playPowerupSound()
 * Joyful multi-tone arpeggio fanfare for magnet / freeze pickups.
 */
export function playPowerupSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const t0 = ctx.currentTime;
    // Bright ascending major arpeggio: G5, B5, D6, G6
    const freqs = [783.99, 987.77, 1174.66, 1567.98];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t0 + idx * 0.045;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.055, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    });
  } catch {
    // Ignore
  }
}

// ---------------------------------------------------------------------------
// Phase 38: Cinematic Cutscene Audio Synthesizer & Centralized Cleanup
// ---------------------------------------------------------------------------

const activeCutsceneStoppers: Set<() => void> = new Set();

/**
 * stopCutsceneAudio()
 * Centralized cleanup stopping all active cutscene audio nodes with a 30ms linear gain fadeout.
 */
export function stopCutsceneAudio(): void {
  const stoppers = Array.from(activeCutsceneStoppers);
  activeCutsceneStoppers.clear();
  stoppers.forEach((stop) => {
    try {
      stop();
    } catch {
      // Ignore
    }
  });
}

function createCutsceneStopper(
  ctx: AudioContext,
  masterGain: GainNode,
  nodes: (OscillatorNode | AudioNode)[]
): () => void {
  let stopped = false;
  const stopper = () => {
    if (stopped) return;
    stopped = true;
    activeCutsceneStoppers.delete(stopper);
    try {
      const t = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(t);
      masterGain.gain.setValueAtTime(masterGain.gain.value, t);
      masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.03);
      setTimeout(() => {
        try {
          nodes.forEach((node) => {
            if ("stop" in node && typeof (node as { stop: () => void }).stop === "function") {
              (node as { stop: () => void }).stop();
            }
            node.disconnect();
          });
          masterGain.disconnect();
        } catch {
          // Ignore
        }
      }, 35);
    } catch {
      // Ignore
    }
  };
  activeCutsceneStoppers.add(stopper);
  return stopper;
}

/**
 * playBlackHoleSuctionSound()
 * Gravitational sub-bass drone (55Hz) with flanger modulation and rising suction sweep.
 * Returns a stopper callback.
 */
export function playBlackHoleSuctionSound(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  try {
    const t0 = ctx.currentTime;
    const dur = 4.0;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t0);
    masterGain.gain.linearRampToValueAtTime(0.12, t0 + 0.2);
    masterGain.gain.linearRampToValueAtTime(0.16, t0 + dur);
    masterGain.connect(ctx.destination);

    // 1. Gravitational sub-bass drone (55Hz - A1)
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    droneOsc.type = "sine";
    droneOsc.frequency.setValueAtTime(55, t0);
    droneGain.gain.setValueAtTime(0.09, t0);
    droneOsc.connect(droneGain);
    droneGain.connect(masterGain);

    // 2. Rising cosmic suction sweep (sawtooth 70Hz -> 520Hz)
    const suctionOsc = ctx.createOscillator();
    suctionOsc.type = "sawtooth";
    suctionOsc.frequency.setValueAtTime(70, t0);
    suctionOsc.frequency.exponentialRampToValueAtTime(520, t0 + dur);

    // Flanger-like resonant lowpass filter modulated by LFO
    const flangerFilter = ctx.createBiquadFilter();
    flangerFilter.type = "lowpass";
    flangerFilter.Q.setValueAtTime(4.0, t0);
    flangerFilter.frequency.setValueAtTime(280, t0);

    const flangerLFO = ctx.createOscillator();
    const flangerLFOGain = ctx.createGain();
    flangerLFO.type = "sine";
    flangerLFO.frequency.setValueAtTime(1.5, t0);
    flangerLFOGain.gain.setValueAtTime(160, t0); // swings +/- 160Hz around 280Hz
    flangerLFO.connect(flangerFilter.frequency);

    const suctionGain = ctx.createGain();
    suctionGain.gain.setValueAtTime(0.065, t0);

    suctionOsc.connect(flangerFilter);
    flangerFilter.connect(suctionGain);
    suctionGain.connect(masterGain);

    droneOsc.start(t0);
    suctionOsc.start(t0);
    flangerLFO.start(t0);

    const nodes = [droneOsc, suctionOsc, flangerLFO, droneGain, suctionGain, flangerFilter, flangerLFOGain];
    return createCutsceneStopper(ctx, masterGain, nodes);
  } catch {
    return () => {};
  }
}

/**
 * playPanicThrusterSound()
 * Stuttering reverse thruster bursts (square wave pulsing at 18Hz).
 * Returns a stopper callback.
 */
export function playPanicThrusterSound(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  try {
    const t0 = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t0);
    masterGain.gain.linearRampToValueAtTime(0.085, t0 + 0.05);
    masterGain.connect(ctx.destination);

    // Sputtering thruster engine carrier (110Hz square)
    const carrier = ctx.createOscillator();
    carrier.type = "square";
    carrier.frequency.setValueAtTime(110, t0);

    // 18Hz stutter pulse modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "square";
    lfo.frequency.setValueAtTime(18, t0);
    lfoGain.gain.setValueAtTime(0.48, t0);

    const pulseGain = ctx.createGain();
    pulseGain.gain.setValueAtTime(0.5, t0);
    lfo.connect(lfoGain);
    lfoGain.connect(pulseGain.gain);

    // Resonant bandpass filter for rocket burn hiss/chuff
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(750, t0);
    filter.Q.setValueAtTime(2.2, t0);

    carrier.connect(pulseGain);
    pulseGain.connect(filter);
    filter.connect(masterGain);

    carrier.start(t0);
    lfo.start(t0);

    const nodes = [carrier, lfo, pulseGain, lfoGain, filter];
    return createCutsceneStopper(ctx, masterGain, nodes);
  } catch {
    return () => {};
  }
}

/**
 * playRickMortyPortalSound()
 * High-energy cosmic dimensional portal sound effect:
 * 1. Initial space-time rip transient (1600Hz -> 320Hz laser-plasma sweep).
 * 2. Swirling chorused vortex core with 14Hz resonant filter modulation.
 * 3. Shimmering crystalline high-frequency harmonic aura.
 * Returns a stopper callback.
 */
export function playRickMortyPortalSound(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  try {
    const t0 = ctx.currentTime;
    const dur = 2.4;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t0);
    masterGain.gain.linearRampToValueAtTime(0.15, t0 + 0.04);
    masterGain.gain.setValueAtTime(0.15, t0 + 1.2);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    masterGain.connect(ctx.destination);

    // 1. Initial Dimensional Tear Transient (1600Hz -> 320Hz plasma rip)
    const tearOsc = ctx.createOscillator();
    const tearGain = ctx.createGain();
    const tearFilter = ctx.createBiquadFilter();
    tearOsc.type = "sawtooth";
    tearOsc.frequency.setValueAtTime(1600, t0);
    tearOsc.frequency.exponentialRampToValueAtTime(320, t0 + 0.22);
    tearFilter.type = "bandpass";
    tearFilter.Q.setValueAtTime(4.0, t0);
    tearFilter.frequency.setValueAtTime(2200, t0);
    tearFilter.frequency.exponentialRampToValueAtTime(650, t0 + 0.22);
    tearGain.gain.setValueAtTime(0.18, t0);
    tearGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    tearOsc.connect(tearFilter);
    tearFilter.connect(tearGain);
    tearGain.connect(masterGain);
    tearOsc.start(t0);
    tearOsc.stop(t0 + 0.3);

    // 2. Swirling Cosmic Vortex Core (Dual detuned oscillators with LFO filter sweep)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(210, t0);
    osc1.frequency.exponentialRampToValueAtTime(155, t0 + dur);
    osc2.frequency.setValueAtTime(215, t0);
    osc2.frequency.exponentialRampToValueAtTime(159, t0 + dur);

    const vortexFilter = ctx.createBiquadFilter();
    vortexFilter.type = "bandpass";
    vortexFilter.Q.setValueAtTime(4.5, t0);
    vortexFilter.frequency.setValueAtTime(950, t0);
    vortexFilter.frequency.exponentialRampToValueAtTime(380, t0 + dur);

    // 14Hz LFO modulating vortex filter frequency for pulsing spatial swirl
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(14, t0);
    lfoGain.gain.setValueAtTime(380, t0);
    lfoGain.gain.linearRampToValueAtTime(120, t0 + dur);
    lfo.connect(lfoGain);
    lfoGain.connect(vortexFilter.frequency);

    const coreGain = ctx.createGain();
    coreGain.gain.setValueAtTime(0.14, t0);
    osc1.connect(vortexFilter);
    osc2.connect(vortexFilter);
    vortexFilter.connect(coreGain);
    coreGain.connect(masterGain);

    osc1.start(t0);
    osc2.start(t0);
    lfo.start(t0);

    // 3. Shimmering Crystalline Aura (1760Hz with gentle 7Hz vibrato)
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = "sine";
    shimmerOsc.frequency.setValueAtTime(1760, t0);
    shimmerGain.gain.setValueAtTime(0.001, t0);
    shimmerGain.gain.linearRampToValueAtTime(0.04, t0 + 0.1);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerOsc.start(t0);

    const nodes = [
      tearOsc,
      tearFilter,
      tearGain,
      osc1,
      osc2,
      vortexFilter,
      lfo,
      lfoGain,
      coreGain,
      shimmerOsc,
      shimmerGain,
    ];
    return createCutsceneStopper(ctx, masterGain, nodes);
  } catch {
    return () => {};
  }
}

/**
 * playComedicEjectSound()
 * Cartoon pop transient and whistle drop for ARIA tumbling out of portal.
 * Returns a stopper callback.
 */
export function playComedicEjectSound(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  try {
    const t0 = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.09, t0);
    masterGain.connect(ctx.destination);

    // 1. Cartoon pop transient (200Hz -> 880Hz upward chirp)
    const pop = ctx.createOscillator();
    const popGain = ctx.createGain();
    pop.type = "sine";
    pop.frequency.setValueAtTime(200, t0);
    pop.frequency.exponentialRampToValueAtTime(880, t0 + 0.025);
    popGain.gain.setValueAtTime(0.12, t0);
    popGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.035);
    pop.connect(popGain);
    popGain.connect(masterGain);

    // 2. Comedic whistle drop (1250Hz -> 180Hz slide)
    const whistle = ctx.createOscillator();
    const whistleGain = ctx.createGain();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(1250, t0);
    whistle.frequency.exponentialRampToValueAtTime(180, t0 + 0.45);
    whistleGain.gain.setValueAtTime(0.08, t0);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
    whistle.connect(whistleGain);
    whistleGain.connect(masterGain);

    pop.start(t0);
    pop.stop(t0 + 0.04);
    whistle.start(t0);
    whistle.stop(t0 + 0.5);

    const nodes = [pop, popGain, whistle, whistleGain];
    return createCutsceneStopper(ctx, masterGain, nodes);
  } catch {
    return () => {};
  }
}

/**
 * playComedicRetchSound()
 * 8-bit comedic cartoon gag/retch sound (low-frequency bubbling carrier 90Hz -> 60Hz square/sawtooth
 * with 22Hz AM squelch modulation through a resonant 420Hz -> 180Hz bandpass filter, followed by
 * a short cartoon splat noise burst).
 * Registers in active cutscene stoppers and returns stopper closure.
 */
export function playComedicRetchSound(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  try {
    const t0 = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t0);
    masterGain.gain.linearRampToValueAtTime(0.12, t0 + 0.04);
    masterGain.connect(ctx.destination);

    // 1. Low-frequency bubbling carrier (90Hz -> 60Hz sawtooth)
    const carrier = ctx.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(90, t0);
    carrier.frequency.exponentialRampToValueAtTime(60, t0 + 0.45);

    // 22Hz AM squelch modulation
    const amLfo = ctx.createOscillator();
    amLfo.type = "sine";
    amLfo.frequency.setValueAtTime(22, t0);

    const amLfoGain = ctx.createGain();
    amLfoGain.gain.setValueAtTime(0.4, t0);

    const retchAmpGain = ctx.createGain();
    retchAmpGain.gain.setValueAtTime(0.5, t0);

    amLfo.connect(amLfoGain);
    amLfoGain.connect(retchAmpGain.gain);

    // Resonant bandpass filter (420Hz -> 180Hz, Q: 3.5)
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.setValueAtTime(3.5, t0);
    filter.frequency.setValueAtTime(420, t0);
    filter.frequency.exponentialRampToValueAtTime(180, t0 + 0.45);

    carrier.connect(retchAmpGain);
    retchAmpGain.connect(filter);

    const retchGain = ctx.createGain();
    retchGain.gain.setValueAtTime(0.1, t0);
    retchGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
    filter.connect(retchGain);
    retchGain.connect(masterGain);

    carrier.start(t0);
    carrier.stop(t0 + 0.5);
    amLfo.start(t0);
    amLfo.stop(t0 + 0.5);

    // 2. Short cartoon splat noise burst at t0 + 0.36s
    const splatLen = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * splatLen);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const splatFilter = ctx.createBiquadFilter();
    splatFilter.type = "lowpass";
    splatFilter.frequency.setValueAtTime(800, t0 + 0.35);
    splatFilter.frequency.exponentialRampToValueAtTime(120, t0 + 0.35 + splatLen);
    splatFilter.Q.setValueAtTime(2.0, t0 + 0.35);

    const splatGain = ctx.createGain();
    splatGain.gain.setValueAtTime(0.001, t0);
    splatGain.gain.setValueAtTime(0.14, t0 + 0.36);
    splatGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.36 + splatLen);

    noiseNode.connect(splatFilter);
    splatFilter.connect(splatGain);
    splatGain.connect(masterGain);

    noiseNode.start(t0 + 0.36);
    noiseNode.stop(t0 + 0.36 + splatLen);

    const nodes = [carrier, amLfo, amLfoGain, retchAmpGain, filter, retchGain, noiseNode, splatFilter, splatGain];
    return createCutsceneStopper(ctx, masterGain, nodes);
  } catch {
    return () => {};
  }
}

/**
 * playCartoonSlurpSound()
 * Comedic vacuum "schluuurp" with resonant frequency glide (200Hz to 950Hz with high Q)
 * and descending pitch scream (gliding down from 1100Hz to 140Hz over 1100ms) with a high-pitched snap pop.
 * Registers in active cutscene stoppers and returns stopper closure.
 */
export function playCartoonSlurpSound(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  try {
    const t0 = ctx.currentTime;
    const dur = 1.3;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, t0);
    masterGain.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
    masterGain.gain.setValueAtTime(0.18, t0 + 0.95);
    masterGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    masterGain.connect(ctx.destination);

    // 1. Vacuum "schluuurp" suction carrier with resonant frequency glide (200Hz -> 950Hz, Q: 9.0)
    const slurpCarrier = ctx.createOscillator();
    slurpCarrier.type = "sawtooth";
    slurpCarrier.frequency.setValueAtTime(120, t0);
    slurpCarrier.frequency.exponentialRampToValueAtTime(360, t0 + 0.9);

    const slurpFilter = ctx.createBiquadFilter();
    slurpFilter.type = "bandpass";
    slurpFilter.Q.setValueAtTime(9.0, t0);
    slurpFilter.frequency.setValueAtTime(200, t0);
    slurpFilter.frequency.exponentialRampToValueAtTime(950, t0 + 0.9);

    const slurpGain = ctx.createGain();
    slurpGain.gain.setValueAtTime(0.01, t0);
    slurpGain.gain.linearRampToValueAtTime(0.15, t0 + 0.25);
    slurpGain.gain.setValueAtTime(0.15, t0 + 0.85);
    slurpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.95);

    slurpCarrier.connect(slurpFilter);
    slurpFilter.connect(slurpGain);
    slurpGain.connect(masterGain);

    slurpCarrier.start(t0);
    slurpCarrier.stop(t0 + 1.0);

    // 2. Descending pitch scream: ARIA rubbery stretch slide (1100Hz -> 140Hz over 1100ms)
    const screamOsc = ctx.createOscillator();
    screamOsc.type = "sine";
    screamOsc.frequency.setValueAtTime(1100, t0);
    screamOsc.frequency.exponentialRampToValueAtTime(140, t0 + 1.1);

    // Vibrato LFO for cartoon comedy wobble
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(14, t0);
    vibratoGain.gain.setValueAtTime(28, t0);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(screamOsc.frequency);

    const screamGain = ctx.createGain();
    screamGain.gain.setValueAtTime(0.001, t0);
    screamGain.gain.linearRampToValueAtTime(0.12, t0 + 0.08);
    screamGain.gain.setValueAtTime(0.12, t0 + 0.8);
    screamGain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.15);

    screamOsc.connect(screamGain);
    screamGain.connect(masterGain);

    screamOsc.start(t0);
    screamOsc.stop(t0 + 1.15);
    vibrato.start(t0);
    vibrato.stop(t0 + 1.15);

    // 3. High-pitched snap pop as ARIA gets slurped past the event horizon
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = "sine";
    const tPop = t0 + 0.95;
    popOsc.frequency.setValueAtTime(1800, tPop);
    popOsc.frequency.exponentialRampToValueAtTime(260, tPop + 0.045);

    popGain.gain.setValueAtTime(0.001, t0);
    popGain.gain.setValueAtTime(0.18, tPop);
    popGain.gain.exponentialRampToValueAtTime(0.001, tPop + 0.05);

    popOsc.connect(popGain);
    popGain.connect(masterGain);

    popOsc.start(tPop);
    popOsc.stop(tPop + 0.06);

    const nodes = [
      slurpCarrier,
      slurpFilter,
      slurpGain,
      screamOsc,
      vibrato,
      vibratoGain,
      screamGain,
      popOsc,
      popGain,
    ];
    return createCutsceneStopper(ctx, masterGain, nodes);
  } catch {
    return () => {};
  }
}





