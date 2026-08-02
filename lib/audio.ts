/**
 * lib/audio.ts
 *
 * Browser-native Web Audio API micro-interaction sound synthesizer.
 *
 * DESIGN PRINCIPLES
 * ─────────────────
 * • Zero external asset dependencies — all sounds are synthesized programmatically
 *   from OscillatorNodes, GainNodes, and BiquadFilterNodes.
 * • Lazy AudioContext initialization on first call (respects browser autoplay policy).
 * • Each function is fire-and-forget: it creates a short-lived node graph, schedules
 *   the full envelope, then lets the nodes auto-disconnect via onended.
 * • All sounds are subtle: gain values are kept low (≤0.15) to avoid startling users.
 * • Guard against SSR: all calls no-op on the server.
 *
 * SOUNDS
 * ──────
 * playHoverSound()      — Soft high-frequency click for node/button hover.
 * playSelectSound()     — Crisp two-tone chime for node click / Speed Run trigger.
 * playTransitionSound() — Low pitch-sweep for camera pans and mode shifts.
 */

// ---------------------------------------------------------------------------
// AudioContext singleton
// ---------------------------------------------------------------------------

let _ctx: AudioContext | null = null;

/** Lazily create (or resume) the shared AudioContext on first call. */
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!_ctx) {
    try {
      _ctx = new AudioContext();
    } catch {
      return null;
    }
  }

  // Resume if suspended by browser autoplay policy (requires prior user gesture)
  if (_ctx.state === "suspended") {
    void _ctx.resume();
  }

  return _ctx;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Creates an OscillatorNode + GainNode chain with an attack/decay/release
 * amplitude envelope. Cleans up automatically when the envelope finishes.
 *
 * @param frequency  Starting oscillator frequency in Hz
 * @param type       OscillatorType ('sine' | 'square' | 'sawtooth' | 'triangle')
 * @param peakGain   Peak amplitude (0–1)
 * @param attack     Attack duration in seconds
 * @param decay      Decay duration in seconds
 * @param sustain    Sustain level (fraction of peakGain)
 * @param release    Release duration in seconds
 * @returns          The OscillatorNode (for further scheduling) or null on error
 */
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

    // ADSR envelope
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t1);
    gain.gain.linearRampToValueAtTime(sustainLevel, t2);
    gain.gain.setValueAtTime(sustainLevel, t2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t3);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(t0);
    osc.stop(t3 + 0.01);

    // Auto-cleanup
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    return osc;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * playHoverSound()
 *
 * A soft, high-frequency transient click — used when the cursor enters a
 * project node or HUD button. Subtle enough to not break focus but present
 * enough to confirm interactivity.
 *
 * Design: short sine burst at 1200 Hz with a near-instant attack/release.
 */
export function playHoverSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  // Soft high-freq sine click
  scheduleEnvelope(
    ctx,
    ctx.destination,
    1200,       // frequency: high for a crisp click feeling
    "sine",
    0.06,       // peakGain: very quiet
    0.002,      // attack: near-instant
    0.03,       // decay: short
    0.0,        // sustain: none
    0.04        // release: quick fade
  );

  // Optional sub-tick: a very faint triangle at half frequency for body
  scheduleEnvelope(
    ctx,
    ctx.destination,
    600,
    "triangle",
    0.02,
    0.001,
    0.02,
    0.0,
    0.03
  );
}

/**
 * playSelectSound()
 *
 * A crisp two-tone chime — used when clicking a project node or triggering
 * the Speed Run mode. The two tones are spaced 150 ms apart for a classic
 * "confirmation" feel.
 *
 * Design: fundamental at 880 Hz (A5) + second tone at 1320 Hz (E6, perfect fifth).
 */
export function playSelectSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  // First tone: A5
  const osc1 = scheduleEnvelope(
    ctx,
    ctx.destination,
    880,
    "sine",
    0.12,
    0.005,
    0.06,
    0.2,
    0.15
  );

  // Second tone: E6 (perfect fifth above A5), delayed 140 ms
  if (osc1 && ctx) {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, ctx.currentTime);

    const t0 = ctx.currentTime + 0.14; // delayed start
    const t1 = t0 + 0.005;
    const t2 = t1 + 0.08;
    const t3 = t2 + 0.2;

    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0, t0);
    gain2.gain.linearRampToValueAtTime(0.1, t1);
    gain2.gain.linearRampToValueAtTime(0.02, t2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t3);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t3 + 0.01);
    osc2.onended = () => { osc2.disconnect(); gain2.disconnect(); };
  }
}

/**
 * playTransitionSound()
 *
 * A low downward pitch-sweep — used for camera pans between nodes and mode
 * shifts (e.g., idle → inspection, inspection → exitActionHub). Creates a
 * sense of spatial movement and state change.
 *
 * Design: sawtooth at 220 Hz sweeping down to 80 Hz over 400 ms,
 * filtered with a lowpass BiquadFilter to remove harshness.
 */
export function playTransitionSound(): void {
  const ctx = getCtx();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";

    // Lowpass filter to soften the sawtooth harshness
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const t0 = ctx.currentTime;
    const t1 = t0 + 0.01;  // attack
    const t2 = t1 + 0.35;  // sustain end
    const t3 = t2 + 0.2;   // release end

    // Pitch sweep: 220 Hz → 80 Hz
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(80, t2);

    // Filter cutoff also sweeps down for a "whooshing" quality
    filter.frequency.setValueAtTime(800, t0);
    filter.frequency.exponentialRampToValueAtTime(180, t2);

    // Amplitude envelope
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.1, t1);
    gain.gain.setValueAtTime(0.1, t2);
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
    // Silently fail — audio is non-critical
  }
}
