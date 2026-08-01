"use client";

/**
 * components/canvas/SpeedRunController.tsx
 *
 * A renderless R3F component that orchestrates the Speed Run automated tour.
 *
 * ARCHITECTURE
 * ────────────
 * This component renders NO meshes. It lives inside the R3F <Canvas> and uses
 * useFrame to access the GL render loop — giving it per-frame access to delta
 * time for an accurate countdown timer without setInterval drift.
 *
 * TIMER LOGIC
 * ───────────
 * While the Speed Run tour is active (activeRole set, mode is 'inspection',
 * currentStepIndex < speedRunSequence.length), a ref-based elapsed-time
 * accumulator is incremented each frame by `delta` (seconds).
 *
 * When elapsed ≥ DWELL_TIME_SECONDS (8 s), it calls advanceSpeedRun() and
 * resets the timer. The timer is also reset whenever currentStepIndex changes
 * so that manually clicking "Next" via the HUD button restarts the countdown.
 *
 * CAMERA LERP
 * ───────────
 * Camera lerping is already handled by IsometricCamera.tsx which reads
 * store.camera and store.zoom every frame. SpeedRunController only writes to
 * those store values (via advanceSpeedRun). IsometricCamera's lerp factor of
 * 0.08/frame produces a smooth ~0.5-second glide to each new node position.
 *
 * GUARD CONDITIONS
 * ────────────────
 * - No-ops if activeRole is null (not in a tour)
 * - No-ops if mode is not 'inspection' (user closed overlay, modal up, etc.)
 * - No-ops if speedRunSequence is empty
 * - No-ops if currentStepIndex >= speedRunSequence.length (tour finished)
 */

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { usePortfolioStore } from "@/lib/store";

/** Seconds to dwell on each node before auto-advancing. */
const DWELL_TIME_SECONDS = 8;

export function SpeedRunController() {
  // Read active tour state from Zustand
  const activeRole = usePortfolioStore((s) => s.activeRole);
  const mode = usePortfolioStore((s) => s.mode);
  const speedRunSequence = usePortfolioStore((s) => s.speedRunSequence);
  const currentStepIndex = usePortfolioStore((s) => s.currentStepIndex);
  const advanceSpeedRun = usePortfolioStore((s) => s.advanceSpeedRun);

  /**
   * Mutable elapsed-time accumulator (seconds).
   * Stored in a ref to avoid triggering re-renders on every frame.
   */
  const elapsed = useRef(0);

  /**
   * Track the last seen stepIndex so we can reset the timer whenever the
   * step changes — either from this component's auto-advance or from the
   * user clicking "NEXT PROJECT IN TOUR" in InspectionOverlay.
   */
  const lastStepIndex = useRef(currentStepIndex);

  // Reset timer when the step index changes externally
  useEffect(() => {
    if (currentStepIndex !== lastStepIndex.current) {
      elapsed.current = 0;
      lastStepIndex.current = currentStepIndex;
    }
  }, [currentStepIndex]);

  // Reset timer when a fresh tour starts (activeRole changes)
  useEffect(() => {
    elapsed.current = 0;
    lastStepIndex.current = 0;
  }, [activeRole]);

  useFrame((_, delta) => {
    // Guard: only run during an active tour while in inspection mode
    const isTourActive =
      activeRole !== null &&
      mode === "inspection" &&
      speedRunSequence.length > 0 &&
      currentStepIndex < speedRunSequence.length;

    if (!isTourActive) {
      // Keep timer in sync even when paused so it doesn't burst on resume
      if (elapsed.current !== 0) {
        elapsed.current = 0;
      }
      return;
    }

    // Accumulate delta time (seconds)
    elapsed.current += delta;

    // Auto-advance when dwell time is reached
    if (elapsed.current >= DWELL_TIME_SECONDS) {
      elapsed.current = 0;
      lastStepIndex.current = currentStepIndex + 1;
      advanceSpeedRun();
    }
  });

  // No visual output — purely a controller
  return null;
}
