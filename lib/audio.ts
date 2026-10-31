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


