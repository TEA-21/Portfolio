"use client";

/**
 * components/ui/FlyingMascotCompanion.tsx
 *
 * Interactive Flying 16-Bit Pixel-Art Astronaut Companion ("ARIA Cadet").
 *
 * KEY ARCHITECTURE & GUARDRAILS:
 * ──────────────────────────────
 * 1. Non-Blocking Pointer Events: Outer container is `fixed inset-0 pointer-events-none z-[99998]`.
 *    `pointer-events-auto` applied strictly to interactive hitboxes.
 * 2. SSR-Safe Window Access: `posRef` initialized safely and set inside `useEffect`.
 * 3. Zero-Re-Render Physics: `useRef` for kinematics + direct DOM `translate3d` transforms.
 * 4. Direct Mascot Click: Opens the 3-option ARIA Command HUD immediately (no flyby).
 * 5. Global Click-and-Hold Summon (450ms):
 *    - Collapsing circular targeting reticle contracts around cursor.
 *    - Canceled cleanly if pointer releases early or drags > 8px.
 *    - Suppressed on interactive UI elements (buttons, links, Three.js canvas, modals).
 *    - On lock-in (450ms): Mascot rushes to target, executes orbital flyby, performs 360 somersault,
 *      and comes to dead stop (HUD remains closed until mascot is clicked).
 * 6. Simplified 3-Option Command Window: Speed Run, Chat, Mini Game.
 * 7. Modal Avoidance: Keeps mascot strictly outside `#project-detail-modal-panel`.
 */

import React, { useState, useEffect, useRef } from "react";
import { PixelAstronaut, AstronautPose } from "./PixelAstronaut";
import {
  usePortfolioStore,
  usePortfolioStoreApi,
  SPEED_RUN_PROJECTS,
  SPEED_RUN_ONELINERS,
} from "@/lib/store";
import {
  playRetroJumpSound,
  playRetroBounceSound,
  playRetroCoinSound,
  playRetroMenuSound,
  playRetroSpeechBlip,
  ensureAudioResumed,
} from "@/lib/audio";
import { MascotSpeechBubble } from "./MascotSpeechBubble";
import { DialogueShuffleBag, DialogueItem } from "@/lib/mascot-dialogues";
import { sampleFlightSwoop } from "./mascotFlightRoute";

interface AcrobaticRoutine {
  phase: "none" | "turn" | "approach" | "flyby";
  approachSide: "left" | "right";
  targetX: number;
  targetY: number;
  radius: number;
  elapsed: number;
  duration: number;
  startP: number;
  tilt: number;
  handoffPos: { x: number; y: number };
  handoffTilt: number;
  startTilt: number;
  targetTilt: number;
  turnElapsed: number;
  turnDuration: number;
  nextPhase?: "approach" | "flyby";
}

type StuntType = "none" | "path_loop" | "barrel_roll" | "turbo_boost" | "slingshot_surge";

interface ScheduledStunt {
  type: StuntType;
  triggerProgress: number;
  triggered: boolean;
}

interface PathLoopState {
  active: boolean;
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number;
  direction: 1 | -1;
  elapsed: number;
  duration: number;
  tiltOffset: number;
}

interface SurgeState {
  active: boolean;
  elapsed: number;
  duration: number;
  deflectionDir: 1 | -1;
}

interface TurboState {
  active: boolean;
  elapsed: number;
  duration: number;
}

interface RoamKinematics {
  active: boolean;
  phase: "resting" | "flying";
  restDuration: number;
  restElapsed: number;
  flightElapsed: number;
  flightMaxDuration: number;
  targetX: number;
  targetY: number;
  speed: number;
  baseSpeed: number;
  curvature: number;
  curveDirection: 1 | -1;
  isSCurve: boolean;
  inflectionTriggered: boolean;
  inflectionThreshold: number;
  stunts: ScheduledStunt[];
  pathLoop: PathLoopState;
  surge: SurgeState;
  turbo: TurboState;
  isSpinning: boolean;
  spinAngle: number;
  spinElapsed: number;
  spinDuration: number;
  spinDirection: 1 | -1;
}

export function FlyingMascotCompanion() {
  const [isReady, setIsReady] = useState(false);
  const [pose, setPose] = useState<AstronautPose>("idle");
  const poseRef = useRef<AstronautPose>("idle");

  // Zero-re-render pose updater (Refinement 4)
  const updatePose = (newPose: AstronautPose) => {
    if (poseRef.current !== newPose) {
      poseRef.current = newPose;
      setPose(newPose);
    }
  };

  const [isHUDOpen, setIsHUDOpen] = useState(false);

  // Store bindings
  const storeApi = usePortfolioStoreApi();
  const startSolarTour = usePortfolioStore((s) => s.startSolarTour);
  const setMinigameOpen = usePortfolioStore((s) => s.setMinigameOpen);
  const isSpeedRunActive = usePortfolioStore((s) => s.isSpeedRunActive);
  const speedRunStepIndex = usePortfolioStore((s) => s.speedRunStepIndex);
  const speedRunProjects = usePortfolioStore((s) => s.speedRunProjects);
  const startSpeedRunTour = usePortfolioStore((s) => s.startSpeedRunTour);
  const endSpeedRunTour = usePortfolioStore((s) => s.endSpeedRunTour);
  const setSelectedProjectId = usePortfolioStore((s) => s.setSelectedProjectId);

  // Speed Run Tour state
  const tourRef = useRef<{
    phase: "idle" | "descent" | "oneliner" | "homing" | "report-open" | "celebrating";
    currentProjectId: string | null;
    speechText: string | null;
    settleCheckCount: number;
    lastSectionTop: number;
  }>({
    phase: "idle",
    currentProjectId: null,
    speechText: null,
    settleCheckCount: 0,
    lastSectionTop: 0,
  });

  const [tourSpeech, setTourSpeech] = useState<string | null>(null);
  const tourTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  const clearTourTimeouts = () => {
    tourTimeoutRef.current.forEach((t) => clearTimeout(t));
    tourTimeoutRef.current = [];
  };

  // Edge awareness positioning
  const [isNearRight, setIsNearRight] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // ── Mascot Cartoon Speech Bubble Controller ─────────────────────────
  const shuffleBagRef = useRef<DialogueShuffleBag | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueItem | null>(null);
  const [isSpeechBubbleVisible, setIsSpeechBubbleVisible] = useState(false);
  const [isMascotWiggling, setIsMascotWiggling] = useState(false);
  const bubbleHoveredRef = useRef(false);
  const speechDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef(0);

  useEffect(() => {
    shuffleBagRef.current = new DialogueShuffleBag();
  }, []);

  const triggerDialogueDuringBreak = () => {
    const state = storeApi.getState();
    const now = performance.now();
    // Cooldown check: at least 14 seconds between dialogues unless triggered manually
    if (now - lastSpeechTimeRef.current < 14000) return;

    if (
      isHUDOpen ||
      state.isSpeedRunActive ||
      state.isMinigameOpen ||
      state.isSolarTourActive ||
      isDraggingRef.current ||
      isHoveredRef.current ||
      acrobatRef.current.phase !== "none"
    ) {
      return;
    }

    if (!shuffleBagRef.current) return;
    const nextItem = shuffleBagRef.current.next();
    setActiveDialogue(nextItem);
    setIsSpeechBubbleVisible(true);
    lastSpeechTimeRef.current = now;
    playRetroSpeechBlip();

    setIsMascotWiggling(true);
    setTimeout(() => setIsMascotWiggling(false), 500);

    const durationMs = Math.min(11000, Math.max(6000, nextItem.text.length * 85));
    // Keep ARIA resting during speech
    roamRef.current.restDuration = Math.max(
      roamRef.current.restDuration,
      roamRef.current.restElapsed + durationMs / 1000 + 2.5
    );

    if (speechDurationTimerRef.current) clearTimeout(speechDurationTimerRef.current);
    speechDurationTimerRef.current = setTimeout(() => {
      if (!bubbleHoveredRef.current) {
        setIsSpeechBubbleVisible(false);
      }
    }, durationMs);
  };

  // Initial welcome speech on load
  useEffect(() => {
    if (!isReady) return;
    const initialTimer = setTimeout(triggerDialogueDuringBreak, 2500);
    return () => {
      clearTimeout(initialTimer);
      if (speechDurationTimerRef.current) clearTimeout(speechDurationTimerRef.current);
    };
  }, [isReady]);

  const handleCycleDialogue = () => {
    if (!shuffleBagRef.current) return;
    const nextItem = shuffleBagRef.current.next();
    setActiveDialogue(nextItem);
    lastSpeechTimeRef.current = performance.now();
    playRetroSpeechBlip();

    const durationMs = Math.min(11000, Math.max(6000, nextItem.text.length * 85));
    roamRef.current.restDuration = Math.max(
      roamRef.current.restDuration,
      roamRef.current.restElapsed + durationMs / 1000 + 2.5
    );

    if (speechDurationTimerRef.current) clearTimeout(speechDurationTimerRef.current);
    speechDurationTimerRef.current = setTimeout(() => {
      if (!bubbleHoveredRef.current) {
        setIsSpeechBubbleVisible(false);
      }
    }, durationMs);
  };

  const handleDismissSpeech = () => {
    setIsSpeechBubbleVisible(false);
    if (speechDurationTimerRef.current) clearTimeout(speechDurationTimerRef.current);
  };

  // DOM refs for zero-re-render animation
  const astronautRef = useRef<HTMLDivElement>(null);
  const spriteWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reticle DOM refs (Zero-re-render collapsing circle)
  const reticleRef = useRef<HTMLDivElement>(null);
  const reticleCircleRef = useRef<SVGCircleElement>(null);
  const reticleLabelRef = useRef<HTMLDivElement>(null);

  // Kinematic state in refs
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const flipXRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const idleTimeRef = useRef(0);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, posX: 0, posY: 0 });
  const totalDragDistanceRef = useRef(0);
  const dragVelocityHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const lastTimeRef = useRef(0);
  const isSpinningRef = useRef(false);
  const spinAngleRef = useRef(0);

  // Click-and-Hold Summon state machine
  const holdStateRef = useRef<{
    active: boolean;
    startTime: number;
    startX: number;
    startY: number;
    locked: boolean;
    lockTime: number;
  }>({
    active: false,
    startTime: 0,
    startX: 0,
    startY: 0,
    locked: false,
    lockTime: 0,
  });

  // Cinematic Acrobatic Flyby state machine
  const acrobatRef = useRef<AcrobaticRoutine>({
    phase: "none",
    approachSide: "left",
    targetX: 0,
    targetY: 0,
    radius: 72,
    elapsed: 0,
    duration: 1.6,
    startP: 0,
    tilt: 0,
    handoffPos: { x: 0, y: 0 },
    handoffTilt: 0,
    startTilt: 0,
    targetTilt: 0,
    turnElapsed: 0,
    turnDuration: 0.18,
    nextPhase: "approach",
  });

  // Timestamp for audio bounce cooldown (150ms debounce) (Refinement 3)
  const lastBounceTimeRef = useRef(0);

  // Autonomous Roaming Kinematics state machine
  const roamRef = useRef<RoamKinematics>({
    active: false,
    phase: "resting",
    restDuration: 12.0,
    restElapsed: 0,
    flightElapsed: 0,
    flightMaxDuration: 3.5,
    targetX: 0,
    targetY: 0,
    speed: 5.0,
    baseSpeed: 5.0,
    curvature: 0.5,
    curveDirection: 1,
    isSCurve: false,
    inflectionTriggered: false,
    inflectionThreshold: 0.5,
    stunts: [],
    pathLoop: {
      active: false,
      centerX: 0,
      centerY: 0,
      radius: 70,
      startAngle: 0,
      direction: 1,
      elapsed: 0,
      duration: 0.75,
      tiltOffset: 0,
    },
    surge: {
      active: false,
      elapsed: 0,
      duration: 0.50,
      deflectionDir: 1,
    },
    turbo: {
      active: false,
      elapsed: 0,
      duration: 0.65,
    },
    isSpinning: false,
    spinAngle: 0,
    spinElapsed: 0,
    spinDuration: 0.38,
    spinDirection: 1,
  });

  // Clean Guardrail Interruption Reset (Refinement 5)
  const resetRoamToIdle = (roam: RoamKinematics) => {
    roam.phase = "resting";
    roam.restElapsed = 0;
    roam.flightElapsed = 0;
    roam.isSpinning = false;
    roam.spinAngle = 0;
    roam.spinElapsed = 0;
    roam.pathLoop.active = false;
    roam.surge.active = false;
    roam.turbo.active = false;
    roam.stunts = [];
    isSpinningRef.current = false;
    spinAngleRef.current = 0;
    if (poseRef.current === "thrust" && !isDraggingRef.current && acrobatRef.current.phase === "none") {
      updatePose("idle");
    }
    setTimeout(triggerDialogueDuringBreak, 900);
  };

  // Particle pool for jetpack exhaust
  const particlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>
  >([]);

  // -------------------------------------------------------------------------
  // 1. SSR-Safe Initialization
  // -------------------------------------------------------------------------
  useEffect(() => {
    const defaultX = Math.max(20, window.innerWidth - 100);
    const defaultY = Math.max(20, window.innerHeight - 150);
    posRef.current = { x: defaultX, y: defaultY };
    setIsNearRight(defaultX > window.innerWidth / 2);
    setIsNearBottom(defaultY > window.innerHeight / 2);
    setIsReady(true);
    lastTimeRef.current = performance.now();

    const handleResize = () => {
      const maxX = Math.max(20, window.innerWidth - 80);
      const maxY = Math.max(20, window.innerHeight - 90);
      posRef.current.x = Math.min(Math.max(20, posRef.current.x), maxX);
      posRef.current.y = Math.min(Math.max(20, posRef.current.y), maxY);
      setIsNearRight(posRef.current.x > window.innerWidth / 2);
      setIsNearBottom(posRef.current.y > window.innerHeight / 2);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // -------------------------------------------------------------------------
  // 2. Global Click-and-Hold Summon Listener (450ms)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;

    const isInteractiveElement = (target: EventTarget | null): boolean => {
      if (!target || typeof (target as Element).closest !== "function") return false;
      return !!(target as Element).closest(
        'button, a, input, textarea, select, [role="button"], [title*="ARIA Cadet"], #interactive-project-web canvas, #project-detail-modal-panel'
      );
    };

    const handleGlobalPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const target = e.target as HTMLElement | null;
      if (isInteractiveElement(target)) return;

      const state = storeApi.getState();
      if (state.isMinigameOpen || state.isSolarTourActive) return;

      // Clean Guardrail Interruption Reset (Refinement 5)
      resetRoamToIdle(roamRef.current);
      setIsSpeechBubbleVisible(false);

      if (state.isSpeedRunActive) {
        state.endSpeedRunTour();
        clearTourTimeouts();
        setTourSpeech(null);
        tourRef.current.phase = "idle";
      }

      holdStateRef.current = {
        active: true,
        startTime: performance.now(),
        startX: e.clientX,
        startY: e.clientY,
        locked: false,
        lockTime: 0,
      };
    };

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!holdStateRef.current.active) return;
      const dx = e.clientX - holdStateRef.current.startX;
      const dy = e.clientY - holdStateRef.current.startY;
      if (Math.hypot(dx, dy) > 8) {
        // Drag detected: cancel summon hold
        holdStateRef.current.active = false;
        if (reticleRef.current) reticleRef.current.style.display = "none";
      }
    };

    const handleGlobalPointerUp = () => {
      if (holdStateRef.current.active) {
        // Released before 450ms: cancel summon hold
        holdStateRef.current.active = false;
        if (reticleRef.current) reticleRef.current.style.display = "none";
      }
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [isReady, storeApi]);

  // -------------------------------------------------------------------------
  // 3. Listen for AI Transmitting State from MascotChat
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleTransmitting = (e: Event) => {
      const isTransmitting = (e as CustomEvent).detail;
      if (isTransmitting) {
        updatePose("transmitting");
      } else if (!isDraggingRef.current && !isSpinningRef.current && acrobatRef.current.phase === "none") {
        updatePose("idle");
      }
    };

    window.addEventListener("mascot-transmitting", handleTransmitting);

    const handleSummonToBio = () => {
      const el = document.getElementById("bio-details-section");
      if (el) {
        const rect = el.getBoundingClientRect();
        const targetX = Math.max(30, Math.min(window.innerWidth - 100, rect.left + 80));
        const targetY = Math.max(40, Math.min(window.innerHeight - 120, rect.top + 160));
        const dx = targetX - posRef.current.x;
        const dy = targetY - posRef.current.y;
        velRef.current = { vx: dx * 0.08, vy: dy * 0.08 };
        playRetroJumpSound();
        updatePose("thrust");
        setTimeout(() => updatePose("idle"), 2000);
      }
    };

    window.addEventListener("summon-mascot-to-bio", handleSummonToBio);
    return () => {
      window.removeEventListener("mascot-transmitting", handleTransmitting);
      window.removeEventListener("summon-mascot-to-bio", handleSummonToBio);
    };
  }, []);

  // -------------------------------------------------------------------------
  // 3b. Speed Run Tour: Step Watcher & Completion Handler
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isSpeedRunActive) {
      clearTourTimeouts();
      setTourSpeech(null);
      tourRef.current.phase = "idle";
      return;
    }

    const pList = speedRunProjects.length > 0 ? speedRunProjects : SPEED_RUN_PROJECTS;
    const projectId = pList[speedRunStepIndex] || pList[0];
    const oneliner = SPEED_RUN_ONELINERS[projectId] || `Inspecting project: ${projectId}`;

    // If we are already descended or progressing through subsequent steps:
    if (tourRef.current.phase !== "descent") {
      clearTourTimeouts();
      tourRef.current.phase = "oneliner";
      tourRef.current.currentProjectId = projectId;
      setTourSpeech(oneliner);
      updatePose("idle");

      const t = setTimeout(() => {
        setTourSpeech(null);
        tourRef.current.phase = "homing";
        updatePose("thrust");
      }, 1800);
      tourTimeoutRef.current.push(t);
    }
  }, [isSpeedRunActive, speedRunStepIndex, speedRunProjects]);

  useEffect(() => {
    const handleTourFinished = () => {
      clearTourTimeouts();
      tourRef.current.phase = "celebrating";
      setTourSpeech("Speed run complete! Explore any node or ask ARIA in chat.");
      updatePose("idle");
      const t = setTimeout(() => {
        setTourSpeech(null);
        tourRef.current.phase = "idle";
      }, 3500);
      tourTimeoutRef.current.push(t);
    };

    window.addEventListener("tour-finished", handleTourFinished);
    return () => {
      window.removeEventListener("tour-finished", handleTourFinished);
    };
  }, []);

  // -------------------------------------------------------------------------
  // 4. Zero-Re-Render Physics & Particle Animation Loop (rAF)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isReady) return;

    let animId: number;

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);

      // Safeguard 1: Pause physics if minigame is open
      const storeState = storeApi.getState();
      if (storeState.isMinigameOpen) {
        lastTimeRef.current = now;
        return;
      }

      // Capped dt (prevents physics explosions after background tab switch)
      const rawDt = (now - lastTimeRef.current) / 1000;
      const dt = Math.min(rawDt, 0.032);
      lastTimeRef.current = now;

      const pos = posRef.current;
      const vel = velRef.current;
      const maxX = Math.max(20, window.innerWidth - 75);
      const maxY = Math.max(20, window.innerHeight - 85);
      const acrobat = acrobatRef.current;
      const hold = holdStateRef.current;

      // ── Animate Collapsing Reticle Ring on Click-and-Hold ────────
      if (hold.active) {
        const elapsed = now - hold.startTime;
        const progress = Math.min(elapsed / 450, 1.0);
        // Radius collapses from 44px down to 10px
        const currentRadius = 44 - progress * (44 - 10);

        if (reticleRef.current) {
          reticleRef.current.style.display = "block";
          reticleRef.current.style.transform = `translate3d(${hold.startX}px, ${hold.startY}px, 0px) translate(-50%, -50%)`;
        }
        if (reticleCircleRef.current) {
          reticleCircleRef.current.setAttribute("r", String(Math.max(8, currentRadius)));
          reticleCircleRef.current.setAttribute("stroke", "#38bdf8");
        }
        if (reticleLabelRef.current) {
          reticleLabelRef.current.innerText = `SUMMONING (${Math.round(progress * 100)}%)`;
          reticleLabelRef.current.className = "absolute top-full left-1/2 -translate-x-1/2 mt-1.5 font-mono text-[9px] uppercase tracking-widest text-cyan-300 font-bold whitespace-nowrap bg-void-card/90 px-1.5 py-0.5 rounded border border-cyan-400/30";
        }

        // Full collapse completed at 450ms: Trigger lock-on and summon
        if (elapsed >= 450) {
          hold.active = false;
          hold.locked = true;
          hold.lockTime = now;

          ensureAudioResumed();
          playRetroCoinSound();

          if (reticleCircleRef.current) {
            reticleCircleRef.current.setAttribute("r", "16");
            reticleCircleRef.current.setAttribute("stroke", "#fbbf24");
          }
          if (reticleLabelRef.current) {
            reticleLabelRef.current.innerText = "TARGET LOCKED";
            reticleLabelRef.current.className = "absolute top-full left-1/2 -translate-x-1/2 mt-1.5 font-mono text-[9px] uppercase tracking-widest text-starlight-gold font-bold whitespace-nowrap bg-void-card/90 px-1.5 py-0.5 rounded border border-starlight-gold/40 animate-pulse";
          }

          // Lock flipXRef to false throughout summon (Refinement 6)
          flipXRef.current = false;

          // Launch mascot toward summoned coordinates
          const targetX = Math.max(20, Math.min(maxX, hold.startX - 29));
          const targetY = Math.max(20, Math.min(maxY, hold.startY - 29));

          const approachSide: "left" | "right" = pos.x < targetX ? "left" : "right";

          // Directional Edge-Safety Clamping (Refinement 4)
          const PAD = 30;
          const baseRadius = 72;
          let maxR = baseRadius;

          if (approachSide === "left") {
            const maxRadiusTop = (targetY - PAD) / 1.25;
            const maxRadiusRight = (window.innerWidth - PAD - targetX) / 1.20;
            const maxRadiusBottom = (window.innerHeight - PAD - targetY) / 1.20;
            maxR = Math.min(baseRadius, maxRadiusTop, maxRadiusRight, maxRadiusBottom);
          } else {
            const maxRadiusTop = (targetY - PAD) / 1.15;
            const maxRadiusLeft = (targetX - PAD) / 1.15;
            const maxRadiusBottom = (window.innerHeight - PAD - targetY) / 1.20;
            maxR = Math.min(baseRadius, maxRadiusTop, maxRadiusLeft, maxRadiusBottom);
          }
          let radius = Math.min(80, Math.max(36, maxR));

          // Short-Distance Summon Guard (Refinement 5)
          const distToTarget = Math.hypot(pos.x - targetX, pos.y - targetY);
          if (distToTarget < radius * 1.25) {
            const scaleRatio = Math.max(0.4, distToTarget / (radius * 1.25));
            radius = Math.max(28, radius * scaleRatio);
          }

          // Delta-Time Independence & Radius-Scaled Duration (Refinement 2)
          const baseDuration = 1.15;
          const fullDuration = baseDuration * (0.6 + 0.4 * (radius / baseRadius));

          const currentTilt = acrobat.tilt;

          let flightHeading = 0;
          let nextPhase: "approach" | "flyby" = "approach";
          let startP = 0;
          let duration = fullDuration;

          if (distToTarget < 45) {
            // Very close: bypass outer loop, start directly into upward deceleration pull
            startP = 0.72;
            duration = fullDuration * (1.0 - startP);
            nextPhase = "flyby";

            const sample = sampleFlightSwoop(approachSide, startP, radius);
            flightHeading = sample.tilt;
          } else {
            nextPhase = "approach";
            const entry = sampleFlightSwoop(approachSide, 0, radius);
            const entryX = Math.min(Math.max(30, targetX + entry.relX), window.innerWidth - 30);
            const entryY = Math.min(Math.max(30, targetY + entry.relY), window.innerHeight - 30);
            flightHeading = (Math.atan2(entryY - pos.y, entryX - pos.x) * 180) / Math.PI + 90;
          }

          while (flightHeading > 180) flightHeading -= 360;
          while (flightHeading <= -180) flightHeading += 360;

          // Pre-Flight "Turn-to-Face" phase (180ms in-place orientation)
          acrobatRef.current = {
            phase: "turn",
            approachSide,
            targetX,
            targetY,
            radius,
            elapsed: 0,
            duration,
            startP,
            tilt: currentTilt,
            handoffPos: { x: pos.x, y: pos.y },
            handoffTilt: currentTilt,
            startTilt: currentTilt,
            targetTilt: flightHeading,
            turnElapsed: 0,
            turnDuration: 0.18,
            nextPhase,
          };

          // Zero out residual velocities during turn
          vel.vx = 0;
          vel.vy = 0;
          updatePose("thrust");
        }
      } else if (hold.locked) {
        // Flash target locked reticle briefly for 220ms then hide
        if (now - hold.lockTime > 220) {
          hold.locked = false;
          if (reticleRef.current) reticleRef.current.style.display = "none";
        }
      }

      // ── Handle Acrobatic Click Sequence (dual single-swoop trajectories from Flight route.png)
      if (acrobat.phase !== "none") {
        idleTimeRef.current = 0;
        // Sprite Mirroring (Refinement 6): Locked to scaleX = 1, zero horizontal flips during summon
        flipXRef.current = false;

        if (acrobat.phase === "turn") {
          acrobat.turnElapsed += dt;
          const u = Math.min(acrobat.turnElapsed / acrobat.turnDuration, 1.0);
          const h = 3 * u * u - 2 * u * u * u;

          // Shortest-arc angular interpolation
          let dTilt = acrobat.targetTilt - acrobat.startTilt;
          while (dTilt > 180) dTilt -= 360;
          while (dTilt < -180) dTilt += 360;
          acrobat.tilt = acrobat.startTilt + dTilt * h;

          // Zero out velocities - mascot does NOT translate during turn
          vel.vx = 0;
          vel.vy = 0;

          // Emit energetic sparks from boots during turn
          if (particlesRef.current.length < 24) {
            particlesRef.current.push({
              x: pos.x + 28,
              y: pos.y + 44,
              vx: (Math.random() - 0.5) * 2.5,
              vy: Math.random() * 2.0 + 1.0,
              life: 0.7,
              color: Math.random() > 0.3 ? "#38bdf8" : "#fbbf24",
            });
          }

          if (u >= 1.0) {
            acrobat.phase = acrobat.nextPhase || "approach";
            acrobat.elapsed = 0;
            acrobat.handoffPos = { x: pos.x, y: pos.y };
            acrobat.handoffTilt = acrobat.tilt;
            playRetroJumpSound();
          }
        } else if (acrobat.phase === "approach") {
          // Directional edge-safety clamped entry point (Refinement 4)
          const entry = sampleFlightSwoop(acrobat.approachSide, 0, acrobat.radius);
          const entryX = Math.min(Math.max(30, acrobat.targetX + entry.relX), window.innerWidth - 30);
          const entryY = Math.min(Math.max(30, acrobat.targetY + entry.relY), window.innerHeight - 30);

          const dx = entryX - pos.x;
          const dy = entryY - pos.y;
          const dist = Math.hypot(dx, dy);

          // Delta-time independent approach movement (Refinement 2)
          const approachSpeed = 480; // px/sec
          const step = approachSpeed * dt;

          // True Tangent Head-First Flight: Tilt strictly matches velocity vector
          let targetTilt = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          while (targetTilt > 180) targetTilt -= 360;
          while (targetTilt <= -180) targetTilt += 360;
          acrobat.tilt = targetTilt;

          // Seamless Phase Handoff (Refinement 1): Transition when reaching entry point within current frame
          if (dist <= step) {
            pos.x = entryX;
            pos.y = entryY;
            acrobat.phase = "flyby";
            acrobat.elapsed = 0;
            acrobat.startP = 0;
            // Record handoff state for C^1 Hermite blend over initial localTau in [0, 0.15]
            acrobat.handoffPos = { x: pos.x, y: pos.y };
            acrobat.handoffTilt = acrobat.tilt;
            updatePose("thrust");
          } else {
            vel.vx = (dx / dist) * approachSpeed;
            vel.vy = (dy / dist) * approachSpeed;
            pos.x += (dx / dist) * step;
            pos.y += (dy / dist) * step;

            if (particlesRef.current.length < 24) {
              particlesRef.current.push({
                x: pos.x + 28,
                y: pos.y + 44,
                vx: -vel.vx * 0.05 + (Math.random() - 0.5) * 2,
                vy: -vel.vy * 0.05 + (Math.random() - 0.5) * 2,
                life: 0.85,
                color: Math.random() > 0.4 ? "#f97316" : "#fbbf24",
              });
            }
          }
        } else if (acrobat.phase === "flyby") {
          acrobat.elapsed += dt;
          const localTau = Math.min(acrobat.elapsed / acrobat.duration, 1.0);

          let p: number;
          if (acrobat.startP > 0) {
            // Short-distance bypass: direct ease-out deceleration segment [startP, 1.0]
            const sigma = localTau;
            p = acrobat.startP + (1.0 - acrobat.startP) * (-Math.pow(sigma, 3) + Math.pow(sigma, 2) + sigma);
          } else {
            // Slingshot velocity curve: accelerates into turn around click area (up to 1.6x speed), then eases smoothly into vertical dead stop
            if (localTau <= 0.20) {
              const dt0 = localTau;
              p = 3.1765 * dt0 * dt0 * dt0 - 0.1353 * dt0 * dt0 + 1.0 * dt0;
            } else if (localTau <= 0.55) {
              const dt1 = localTau - 0.20;
              p = -3.5305 * dt1 * dt1 * dt1 + 1.7706 * dt1 * dt1 + 1.3271 * dt1 + 0.22;
            } else {
              const dt2 = localTau - 0.55;
              p = 0.7798 * dt2 * dt2 * dt2 - 1.9364 * dt2 * dt2 + 1.2690 * dt2 + 0.75;
            }
          }
          p = Math.min(Math.max(p, 0), 1.0);

          const sample = sampleFlightSwoop(acrobat.approachSide, p, acrobat.radius);
          const curveX = acrobat.targetX + sample.relX;
          const curveY = acrobat.targetY + sample.relY;

          // C^1 Hermite blend over initial window for seamless handoff without snapping (Refinement 1)
          let nextX = curveX;
          let nextY = curveY;
          let currentTilt = sample.tilt;

          const blendWindow = acrobat.startP > 0 ? 0.25 : 0.15;
          if (localTau < blendWindow) {
            const u = localTau / blendWindow;
            const h = 3 * u * u - 2 * u * u * u;
            nextX = acrobat.handoffPos.x * (1 - h) + curveX * h;
            nextY = acrobat.handoffPos.y * (1 - h) + curveY * h;
            let dTilt = sample.tilt - acrobat.handoffTilt;
            while (dTilt > 180) dTilt -= 360;
            while (dTilt < -180) dTilt += 360;
            currentTilt = acrobat.handoffTilt + dTilt * h;
          }

          while (currentTilt > 180) currentTilt -= 360;
          while (currentTilt <= -180) currentTilt += 360;

          const prevX = pos.x;
          const prevY = pos.y;
          pos.x = nextX;
          pos.y = nextY;
          vel.vx = (pos.x - prevX) / (dt || 0.016);
          vel.vy = (pos.y - prevY) / (dt || 0.016);
          acrobat.tilt = currentTilt;

          // Thruster Polish (Refinement 6): Downward boot thrusters (vy > 0) primarily during bottom turn and vertical upward pull (p in [0.6, 0.98])
          if (particlesRef.current.length < 36) {
            if (p >= 0.6 && p <= 0.98) {
              // Left boot nozzle
              particlesRef.current.push({
                x: pos.x + 21,
                y: pos.y + 48,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 2.8 + 2.2,
                life: 0.65,
                color: Math.random() > 0.3 ? "#38bdf8" : "#fbbf24",
              });
              // Right boot nozzle
              particlesRef.current.push({
                x: pos.x + 37,
                y: pos.y + 48,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 2.8 + 2.2,
                life: 0.65,
                color: Math.random() > 0.3 ? "#38bdf8" : "#fbbf24",
              });
            } else {
              particlesRef.current.push({
                x: pos.x + 28,
                y: pos.y + 36,
                vx: -vel.vx * 0.04 + (Math.random() - 0.5) * 1.5,
                vy: -vel.vy * 0.04 + (Math.random() - 0.5) * 1.5,
                life: 0.65,
                color: "#38bdf8",
              });
            }
          }

          // Once mascot center reaches cursor: dead stop (0.0° upright)
          if (localTau >= 1.0 || p >= 1.0) {
            acrobat.phase = "none";
            pos.x = acrobat.targetX;
            pos.y = acrobat.targetY;
            vel.vx = 0;
            vel.vy = 0;
            acrobat.tilt = 0;
            flipXRef.current = false;
            idleTimeRef.current = -3.5;
            updatePose("idle");
            playRetroMenuSound();
            setIsNearRight(pos.x > window.innerWidth / 2);
            setIsNearBottom(pos.y > window.innerHeight / 2);
            setIsHUDOpen(false);
          }
        }
      } else if (!isDraggingRef.current) {
        // -------------------------------------------------------------------
        // Speed Run Tour Flight & Homing Controller
        // -------------------------------------------------------------------
        if (tourRef.current.phase === "descent") {
          const sectionEl = document.getElementById("interactive-project-web");
          if (sectionEl) {
            const rect = sectionEl.getBoundingClientRect();
            const deltaScroll = Math.abs(rect.top - tourRef.current.lastSectionTop);
            tourRef.current.lastSectionTop = rect.top;

            const targetX = window.innerWidth / 2;
            const targetY = Math.max(80, Math.min(window.innerHeight - 150, rect.top + 140));

            const dx = targetX - pos.x;
            const dy = targetY - pos.y;
            pos.x += dx * Math.min(1.0, 5.0 * dt);
            pos.y += dy * Math.min(1.0, 5.0 * dt);
            vel.vx = 0;
            vel.vy = 0;
            acrobat.tilt = 0;

            // Wait for scroll to settle (deltaScroll < 1.0px for 12 consecutive frames and rect.top <= 140)
            if (deltaScroll < 1.0 && rect.top <= 140) {
              tourRef.current.settleCheckCount += 1;
              if (tourRef.current.settleCheckCount > 12) {
                // Scroll is settled! Transition to Step 0 oneliner
                const pList = storeState.speedRunProjects && storeState.speedRunProjects.length > 0
                  ? storeState.speedRunProjects
                  : SPEED_RUN_PROJECTS;
                const pId = pList[0];
                tourRef.current.phase = "oneliner";
                tourRef.current.currentProjectId = pId;
                updatePose("idle");
                setTourSpeech(SPEED_RUN_ONELINERS[pId]);

                clearTourTimeouts();
                const t = setTimeout(() => {
                  setTourSpeech(null);
                  tourRef.current.phase = "homing";
                  updatePose("thrust");
                }, 1800);
                tourTimeoutRef.current.push(t);
              }
            } else {
              tourRef.current.settleCheckCount = 0;
            }
          }
        } else if (tourRef.current.phase === "homing") {
          // Dynamic homing on live screen coordinates of the orbiting moon
          const activeProj = tourRef.current.currentProjectId;
          let targetX = window.innerWidth / 2;
          let targetY = window.innerHeight / 2;

          const moonEl = activeProj ? document.querySelector(`[data-project-moon="${activeProj}"]`) : null;
          if (moonEl) {
            const mRect = moonEl.getBoundingClientRect();
            if (mRect.width > 0 && mRect.height > 0) {
              targetX = mRect.left + mRect.width / 2;
              targetY = mRect.top + mRect.height / 2;
            }
          } else {
            const sEl = document.getElementById("interactive-project-web");
            if (sEl) {
              const sRect = sEl.getBoundingClientRect();
              targetX = sRect.left + sRect.width / 2;
              targetY = sRect.top + sRect.height / 2;
            }
          }

          const dx = targetX - pos.x;
          const dy = targetY - pos.y;
          const dist = Math.hypot(dx, dy);

          // Face moving target
          const targetHeading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          acrobat.tilt += (targetHeading - acrobat.tilt) * Math.min(1.0, 8.0 * dt);

          if (dist > 35) {
            const speed = Math.min(dist * 5.0, 480);
            pos.x += (dx / dist) * speed * dt;
            pos.y += (dy / dist) * speed * dt;
            vel.vx = 0;
            vel.vy = 0;

            // Spawn gentle jetpack particles while flying
            if (Math.random() < 0.4) {
              particlesRef.current.push({
                x: pos.x,
                y: pos.y + 15,
                vx: (Math.random() - 0.5) * 2 - (dx / dist) * 2,
                vy: (Math.random() - 0.5) * 2 - (dy / dist) * 2,
                life: 1.0,
                color: "#38bdf8",
              });
            }
          } else {
            // Arrived at planet moon!
            pos.x = targetX;
            pos.y = targetY;
            acrobat.tilt = 0;
            updatePose("idle");
            tourRef.current.phase = "report-open";
            playRetroMenuSound();
            if (activeProj) {
              setSelectedProjectId(activeProj);
            }
          }
        } else if (
          tourRef.current.phase === "oneliner" ||
          tourRef.current.phase === "report-open" ||
          tourRef.current.phase === "celebrating"
        ) {
          // Hover gently in place
          vel.vx *= 0.8;
          vel.vy *= 0.8;
          pos.x += vel.vx * dt * 60;
          pos.y += vel.vy * dt * 60;
        } else {
          // Autonomous Roaming, Decoupled Steering Kinematics & Physics
          const roam = roamRef.current;
          const isProjectModalOpen = !!storeState.selectedProjectId;
          const isInterruptActive =
            isHoveredRef.current ||
            isHUDOpen ||
            isDraggingRef.current ||
            hold.active ||
            acrobat.phase !== "none" ||
            storeState.isSpeedRunActive ||
            storeState.isMinigameOpen ||
            storeState.isSolarTourActive;

          if (isInterruptActive) {
            // Clean Guardrail Interruption Reset (Refinement 5)
            resetRoamToIdle(roam);
            const damping = Math.pow(0.92, dt * 60);
            vel.vx *= damping;
            vel.vy *= damping;
          } else {
            if (roam.phase === "resting") {
              roam.restElapsed += dt;
              const damping = Math.pow(0.92, dt * 60);
              vel.vx *= damping;
              vel.vy *= damping;

              if (roam.restElapsed >= roam.restDuration) {
                // Transition to active roam flight: auto-hide any speech bubble
                setIsSpeechBubbleVisible(false);
                roam.phase = "flying";
                roam.flightElapsed = 0;
                roam.isSpinning = false;
                roam.spinAngle = 0;
                roam.spinElapsed = 0;
                roam.pathLoop.active = false;
                roam.surge.active = false;
                roam.turbo.active = false;

                // 1. Power-Law Duration Decay (Shorter flights much more common)
                // Math.pow(Math.random(), 2.2) heavily biases progress toward 0.
                // Result: ~65% short darts (1.0s–2.5s), ~25% medium wanders (2.5s–5.0s), ~10% rare marathons (5.0s–8.0s)
                const durationSkew = Math.pow(Math.random(), 2.2);
                roam.flightMaxDuration = 1.0 + durationSkew * 7.0;

                // Slow Ambient Mascot: all breaks lengthened to 8s–20s
                if (roam.flightMaxDuration < 2.5) {
                  roam.restDuration = 8.0 + Math.random() * 5.0; // 8s - 13s break
                } else if (roam.flightMaxDuration < 5.0) {
                  roam.restDuration = 11.0 + Math.random() * 5.0; // 11s - 16s break
                } else {
                  roam.restDuration = 14.0 + Math.random() * 6.0; // 14s - 20s deep break
                }

                // Dynamic base speed based on burst length
                if (roam.flightMaxDuration < 2.5) {
                  roam.baseSpeed = 4.2 + Math.random() * 1.5;
                } else if (roam.flightMaxDuration < 5.0) {
                  roam.baseSpeed = 5.2 + Math.random() * 2.0;
                } else {
                  roam.baseSpeed = 6.5 + Math.random() * 2.5;
                }
                roam.speed = roam.baseSpeed;
                roam.curvature = 0.45 + Math.random() * 0.55;
                roam.curveDirection = Math.random() > 0.5 ? 1 : -1;

                // True S-Curve option for flights > 2.2s (60% probability)
                roam.isSCurve = roam.flightMaxDuration > 2.2 && Math.random() < 0.6;
                roam.inflectionTriggered = false;
                roam.inflectionThreshold = 0.40 + Math.random() * 0.20;

                // 2. Scaled Target Distance (Local curious roaming for short flights, cross-screen for marathons)
                const travelAngle = Math.random() * Math.PI * 2;
                let travelDist: number;
                if (roam.flightMaxDuration < 2.5) {
                  travelDist = 200 + Math.random() * 320; // 200px - 520px
                } else if (roam.flightMaxDuration < 5.0) {
                  travelDist = 500 + Math.random() * 500; // 500px - 1000px
                } else {
                  travelDist = 800 + Math.random() * 800; // 800px - 1600px
                }
                let candX = pos.x + Math.cos(travelAngle) * travelDist;
                let candY = pos.y + Math.sin(travelAngle) * travelDist;

                // If project modal is open, keep clear of the center
                if (isProjectModalOpen) {
                  const modalLeft = (window.innerWidth - 576) / 2;
                  const modalRight = (window.innerWidth + 576) / 2;
                  if (candX >= modalLeft - 60 && candX <= modalRight + 30) {
                    candX = Math.random() > 0.5 ? Math.max(25, modalLeft - 85) : Math.min(maxX - 20, modalRight + 25);
                  }
                }
                roam.targetX = candX;
                roam.targetY = candY;

                // 3. Dynamic Stunt Event Stacking tailored to duration
                const stuntList: ScheduledStunt[] = [];
                const fullStuntTypes: StuntType[] = ["path_loop", "barrel_roll", "turbo_boost", "slingshot_surge"];
                const microStuntTypes: StuntType[] = ["barrel_roll", "turbo_boost"];

                if (roam.flightMaxDuration < 2.5) {
                  // Short burst: 45% chance of 1 quick micro-stunt (roll or turbo boost)
                  if (Math.random() < 0.45) {
                    const pick = microStuntTypes[Math.floor(Math.random() * microStuntTypes.length)];
                    stuntList.push({ type: pick, triggerProgress: 0.30 + Math.random() * 0.30, triggered: false });
                  }
                } else if (roam.flightMaxDuration < 5.0) {
                  // Medium burst: 1 or 2 stunts from full suite
                  const count = Math.random() < 0.4 ? 1 : 2;
                  const shuffled = [...fullStuntTypes].sort(() => Math.random() - 0.5);
                  for (let i = 0; i < count; i++) {
                    stuntList.push({
                      type: shuffled[i],
                      triggerProgress: 0.25 + i * 0.35 + Math.random() * 0.15,
                      triggered: false,
                    });
                  }
                } else {
                  // Long marathon burst (>5s): 2 or 3 stacked stunts
                  const count = Math.random() < 0.4 ? 2 : 3;
                  const shuffled = [...fullStuntTypes].sort(() => Math.random() - 0.5);
                  for (let i = 0; i < count; i++) {
                    stuntList.push({
                      type: shuffled[i % shuffled.length],
                      triggerProgress: 0.20 + i * 0.26 + Math.random() * 0.10,
                      triggered: false,
                    });
                  }
                }
                roam.stunts = stuntList;
                updatePose("thrust");
              }
            } else {
              // -------------------------------------------------------------
              // Roam Phase === "flying"
              // -------------------------------------------------------------
              roam.flightElapsed += dt;
              const progress = Math.min(1.0, roam.flightElapsed / roam.flightMaxDuration);

              // 1. S-Curve Inflection Check
              if (roam.isSCurve && !roam.inflectionTriggered && progress >= roam.inflectionThreshold) {
                roam.curveDirection = (roam.curveDirection * -1) as 1 | -1;
                roam.inflectionTriggered = true;
              }

              // 2. Check and Trigger Scheduled Stunts
              if (!roam.pathLoop.active && !roam.surge.active) {
                for (const stunt of roam.stunts) {
                  if (!stunt.triggered && progress >= stunt.triggerProgress) {
                    stunt.triggered = true;

                    if (stunt.type === "path_loop") {
                      // Ensure sufficient border clearance before initiating a loop
                      const canDoLoop = pos.x > 85 && pos.x < maxX - 85 && pos.y > 85 && pos.y < maxY - 85;
                      if (!canDoLoop) {
                        stunt.type = Math.random() > 0.5 ? "slingshot_surge" : "turbo_boost";
                      }
                    }

                    if (stunt.type === "path_loop") {
                      // Trigger Full 360° Geometric Path Loop
                      const loopRadius = Math.min(80, Math.max(50, 55 + Math.random() * 25));
                      const curSpeed = Math.max(4.0, Math.hypot(vel.vx, vel.vy));
                      const theta0 = Math.atan2(vel.vy, vel.vx);
                      const loopDir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

                      // Circle center perpendicular to current velocity vector
                      let cx: number;
                      let cy: number;
                      let startAlpha: number;
                      if (loopDir === 1) {
                        cx = pos.x - (vel.vy / curSpeed) * loopRadius;
                        cy = pos.y + (vel.vx / curSpeed) * loopRadius;
                        startAlpha = theta0 - Math.PI / 2;
                      } else {
                        cx = pos.x + (vel.vy / curSpeed) * loopRadius;
                        cy = pos.y - (vel.vx / curSpeed) * loopRadius;
                        startAlpha = theta0 + Math.PI / 2;
                      }

                      roam.pathLoop = {
                        active: true,
                        centerX: cx,
                        centerY: cy,
                        radius: loopRadius,
                        startAngle: startAlpha,
                        direction: loopDir,
                        elapsed: 0,
                        duration: 0.70,
                        tiltOffset: 0,
                      };
                    } else if (stunt.type === "barrel_roll") {
                      // Trigger In-Flight Barrel Roll (additive tilt, smoothstep)
                      roam.isSpinning = true;
                      roam.spinElapsed = 0;
                      roam.spinDuration = 0.38;
                      roam.spinDirection = Math.random() > 0.5 ? 1 : -1;
                      for (let i = 0; i < 8; i++) {
                        particlesRef.current.push({
                          x: pos.x + 28,
                          y: pos.y + 44,
                          vx: (Math.random() - 0.5) * 4,
                          vy: (Math.random() - 0.5) * 4,
                          life: 0.8,
                          color: Math.random() > 0.4 ? "#38bdf8" : "#fbbf24",
                        });
                      }
                    } else if (stunt.type === "turbo_boost") {
                      // Trigger Turbo Jetpack Boost
                      roam.turbo.active = true;
                      roam.turbo.elapsed = 0;
                      roam.turbo.duration = 0.65;
                      playRetroJumpSound();
                    } else if (stunt.type === "slingshot_surge") {
                      // Trigger Centrifugal Slingshot Surge (maintains continuous momentum)
                      roam.surge.active = true;
                      roam.surge.elapsed = 0;
                      roam.surge.duration = 0.50;
                      roam.surge.deflectionDir = Math.random() > 0.5 ? 1 : -1;
                      playRetroJumpSound();
                      for (let i = 0; i < 8; i++) {
                        particlesRef.current.push({
                          x: pos.x + 28,
                          y: pos.y + 44,
                          vx: (Math.random() - 0.5) * 5,
                          vy: (Math.random() - 0.5) * 5,
                          life: 0.8,
                          color: "#38bdf8",
                        });
                      }
                    }
                    break;
                  }
                }
              }

              // 3. Process Active Stunts
              if (roam.pathLoop.active) {
                // Execute Geometric Path Loop (x, y circular trajectory)
                const loop = roam.pathLoop;
                loop.elapsed += dt;
                const loopTau = Math.min(1.0, loop.elapsed / loop.duration);
                const currentAngle = loop.startAngle + loop.direction * (loopTau * Math.PI * 2);

                pos.x = loop.centerX + Math.cos(currentAngle) * loop.radius;
                pos.y = loop.centerY + Math.sin(currentAngle) * loop.radius;

                // Tangent heading strictly matches tangent on circle
                const tangentAngle = currentAngle + loop.direction * (Math.PI / 2);
                let tangentDeg = (tangentAngle * 180) / Math.PI + 90;
                while (tangentDeg > 180) tangentDeg -= 360;
                while (tangentDeg <= -180) tangentDeg += 360;
                loop.tiltOffset = tangentDeg;

                // Emit sparks around loop perimeter
                if (Math.random() < 0.65 && particlesRef.current.length < 32) {
                  particlesRef.current.push({
                    x: pos.x + 28,
                    y: pos.y + 44,
                    vx: (Math.random() - 0.5) * 2.5,
                    vy: (Math.random() - 0.5) * 2.5,
                    life: 0.75,
                    color: Math.random() > 0.3 ? "#38bdf8" : "#fbbf24",
                  });
                }

                if (loopTau >= 1.0) {
                  loop.active = false;
                  // Exit loop with high forward velocity matching exit tangent
                  vel.vx = Math.cos(tangentAngle) * Math.max(roam.speed, 5.0);
                  vel.vy = Math.sin(tangentAngle) * Math.max(roam.speed, 5.0);
                }
              } else if (roam.surge.active) {
                // Execute Slingshot Surge (forward acceleration + lateral centrifugal whip)
                roam.surge.elapsed += dt;
                const surgeProgress = Math.min(1.0, roam.surge.elapsed / roam.surge.duration);
                const curSpeed = Math.hypot(vel.vx, vel.vy) || roam.speed;
                const forwardNormX = vel.vx / curSpeed;
                const forwardNormY = vel.vy / curSpeed;
                const perpX = -forwardNormY * roam.surge.deflectionDir;
                const perpY = forwardNormX * roam.surge.deflectionDir;
                const whipForce = Math.sin(surgeProgress * Math.PI) * 3.5;

                vel.vx = forwardNormX * roam.baseSpeed * 1.5 + perpX * whipForce;
                vel.vy = forwardNormY * roam.baseSpeed * 1.5 + perpY * whipForce;

                if (Math.random() < 0.7 && particlesRef.current.length < 32) {
                  particlesRef.current.push({
                    x: pos.x + 28,
                    y: pos.y + 44,
                    vx: -vel.vx * 0.25 + (Math.random() - 0.5) * 2,
                    vy: -vel.vy * 0.25 + (Math.random() - 0.5) * 2,
                    life: 0.8,
                    color: "#38bdf8",
                  });
                }
                if (surgeProgress >= 1.0) {
                  roam.surge.active = false;
                }
              } else {
                // Normal Steered Flight (with Turbo Boost if active)
                if (roam.turbo.active) {
                  roam.turbo.elapsed += dt;
                  roam.speed = roam.baseSpeed * 1.85;
                  if (particlesRef.current.length < 32) {
                    particlesRef.current.push({
                      x: pos.x + 28,
                      y: pos.y + 44,
                      vx: -vel.vx * 0.25 + (Math.random() - 0.5) * 2,
                      vy: -vel.vy * 0.25 + (Math.random() - 0.5) * 2,
                      life: 0.9,
                      color: Math.random() > 0.4 ? "#38bdf8" : "#f97316",
                    });
                  }
                  if (roam.turbo.elapsed >= roam.turbo.duration) {
                    roam.turbo.active = false;
                    roam.speed = roam.baseSpeed;
                  }
                }

                // Process Barrel Roll spin (Hermite smoothstep for seamless 0 -> 360 transition)
                if (roam.isSpinning) {
                  roam.spinElapsed += dt;
                  const tau = Math.min(1.0, roam.spinElapsed / roam.spinDuration);
                  const h = 3 * tau * tau - 2 * tau * tau * tau;
                  roam.spinAngle = h * 360 * roam.spinDirection;
                  if (tau >= 1.0) {
                    roam.isSpinning = false;
                    roam.spinAngle = 0;
                  }
                }

                const dx = roam.targetX - pos.x;
                const dy = roam.targetY - pos.y;
                const distance = Math.hypot(dx, dy);

                // Waypoint extension: project new waypoint ahead if reached mid-flight
                if (distance < 90 && progress < 0.92) {
                  const currentHeading = Math.atan2(vel.vy, vel.vx);
                  const nextAngle = currentHeading + (Math.random() - 0.5) * (Math.PI / 2.5);
                  roam.targetX = pos.x + Math.cos(nextAngle) * (600 + Math.random() * 600);
                  roam.targetY = pos.y + Math.sin(nextAngle) * (600 + Math.random() * 600);
                }

                // Flight burst completed on timer
                if (progress >= 1.0) {
                  resetRoamToIdle(roam);
                } else {
                  // Normalized Steering Vectors
                  const safeDist = Math.max(distance, 0.001);
                  const uX = dx / safeDist;
                  const uY = dy / safeDist;

                  // Curvature attenuation within 180px
                  const distFactor = Math.min(1.0, distance / 180);
                  const activeCurvature = roam.curvature * (1 - progress * 0.85) * distFactor;

                  const latX = -uY * roam.curveDirection * activeCurvature;
                  const latY = uX * roam.curveDirection * activeCurvature;

                  const desiredX = (uX + latX) * roam.speed;
                  const desiredY = (uY + latY) * roam.speed;

                  const steerStrength = Math.min(1.0, 5.0 * dt);
                  vel.vx += (desiredX - vel.vx) * steerStrength;
                  vel.vy += (desiredY - vel.vy) * steerStrength;

                  // Maintain momentum floor: prevent steering from decaying velocity below 92% of target speed
                  const curFlightSpeed = Math.hypot(vel.vx, vel.vy);
                  const minSpeedFloor = roam.speed * 0.92;
                  if (curFlightSpeed < minSpeedFloor && curFlightSpeed > 0.01) {
                    vel.vx = (vel.vx / curFlightSpeed) * minSpeedFloor;
                    vel.vy = (vel.vy / curFlightSpeed) * minSpeedFloor;
                  }
                }
              }
            }
          }

          // Apply velocities (when not in pathLoop which drives pos directly)
          if (!roamRef.current.pathLoop.active) {
            pos.x += vel.vx * dt * 60;
            pos.y += vel.vy * dt * 60;
          }

          // Modal Exclusion: Keep mascot strictly outside the project description panel
          if (isProjectModalOpen) {
            const modalEl = document.getElementById("project-detail-modal-panel");
            let modalLeft = (window.innerWidth - 576) / 2;
            let modalRight = (window.innerWidth + 576) / 2;

            if (modalEl) {
              const rect = modalEl.getBoundingClientRect();
              modalLeft = rect.left;
              modalRight = rect.right;
            }

            const safetyBuffer = 75;
            const exLeft = modalLeft - safetyBuffer;
            const exRight = modalRight + 20;

            if (pos.x >= exLeft && pos.x <= exRight) {
              if (pos.x < window.innerWidth / 2) {
                pos.x = Math.max(20, exLeft - 10);
                vel.vx = -Math.abs(vel.vx || 3);
                if (roam.phase === "flying") roam.targetX = Math.max(25, exLeft - 80);
              } else {
                pos.x = Math.min(maxX, exRight + 10);
                vel.vx = Math.abs(vel.vx || 3);
                if (roam.phase === "flying") roam.targetX = Math.min(maxX - 20, exRight + 80);
              }
            }
          }

          // Viewport boundary collision & High-Energy Pinball Ricochet
          let bounced = false;
          if (pos.x <= 15) {
            pos.x = 16;
            vel.vx = Math.abs(vel.vx || 4.5) * 0.98;
            if (roam.phase === "flying") {
              roam.targetX = pos.x + 200 + Math.random() * 300;
              roam.curveDirection = (roam.curveDirection * -1) as 1 | -1;
            }
            bounced = true;
          } else if (pos.x >= maxX) {
            pos.x = maxX - 1;
            vel.vx = -Math.abs(vel.vx || 4.5) * 0.98;
            if (roam.phase === "flying") {
              roam.targetX = pos.x - 200 - Math.random() * 300;
              roam.curveDirection = (roam.curveDirection * -1) as 1 | -1;
            }
            bounced = true;
          }

          if (pos.y <= 15) {
            pos.y = 16;
            vel.vy = Math.abs(vel.vy || 4.5) * 0.98;
            if (roam.phase === "flying") {
              roam.targetY = pos.y + 180 + Math.random() * 250;
              roam.curveDirection = (roam.curveDirection * -1) as 1 | -1;
            }
            bounced = true;
          } else if (pos.y >= maxY) {
            pos.y = maxY - 1;
            vel.vy = -Math.abs(vel.vy || 4.5) * 0.98;
            if (roam.phase === "flying") {
              roam.targetY = pos.y - 180 - Math.random() * 250;
              roam.curveDirection = (roam.curveDirection * -1) as 1 | -1;
            }
            bounced = true;
          }

          if (bounced) {
            // High-energy pinball impact sparks
            if (particlesRef.current.length < 32) {
              for (let i = 0; i < 6; i++) {
                particlesRef.current.push({
                  x: pos.x + 28,
                  y: pos.y + 28,
                  vx: (Math.random() - 0.5) * 5 + vel.vx * 0.1,
                  vy: (Math.random() - 0.5) * 5 + vel.vy * 0.1,
                  life: 0.7,
                  color: Math.random() > 0.4 ? "#38bdf8" : "#fbbf24",
                });
              }
            }
            if (now - lastBounceTimeRef.current > 150) {
              lastBounceTimeRef.current = now;
              playRetroBounceSound();
            }
          }

          // Emit jetpack particles when flying with speed
          const speed = Math.hypot(vel.vx, vel.vy);
          if (speed > 1.8 && !roamRef.current.pathLoop.active) {
            if (particlesRef.current.length < 24) {
              particlesRef.current.push({
                x: pos.x + 28,
                y: pos.y + 44,
                vx: -vel.vx * 0.2 + (Math.random() - 0.5) * 1.5,
                vy: -vel.vy * 0.2 + (Math.random() - 0.5) * 1.5,
                life: 1.0,
                color: Math.random() > 0.4 ? "#f97316" : "#fbbf24",
              });
            }
          }
        }
      }

      // Compute banking and true tangent head-first tilt kinematics
      const speed = Math.hypot(vel.vx, vel.vy);
      let tiltDeg = 0;

      let headingDeg = 0;
      if (speed > 0.8) {
        headingDeg = (Math.atan2(vel.vy, vel.vx) * 180) / Math.PI + 90;
        while (headingDeg > 180) headingDeg -= 360;
        while (headingDeg <= -180) headingDeg += 360;
      }

      if (isSpinningRef.current) {
        tiltDeg = spinAngleRef.current;
      } else if (roamRef.current.isSpinning) {
        tiltDeg = headingDeg + roamRef.current.spinAngle;
        flipXRef.current = false;
        acrobatRef.current.tilt = tiltDeg;
      } else if (roamRef.current.pathLoop.active) {
        tiltDeg = roamRef.current.pathLoop.tiltOffset;
        flipXRef.current = false;
      } else if (
        acrobatRef.current.phase === "turn" ||
        acrobatRef.current.phase === "flyby" ||
        acrobatRef.current.phase === "approach"
      ) {
        tiltDeg = acrobatRef.current.tilt;
        flipXRef.current = false;
      } else if (speed > 0.8) {
        tiltDeg = headingDeg;
        flipXRef.current = false;
        acrobatRef.current.tilt = tiltDeg;
      } else {
        tiltDeg = 0;
        acrobatRef.current.tilt = 0;
      }

      // Subtle zero-G harmonic hover when idling / resting
      const hoverOffset = (speed < 0.8 && !isDraggingRef.current && acrobatRef.current.phase === "none" && roamRef.current.phase === "resting")
        ? Math.sin(now * 0.0025) * 4
        : 0;

      // Update DOM transform with decoupled hierarchy
      if (astronautRef.current) {
        astronautRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y + hoverOffset}px, 0px)`;
      }
      if (spriteWrapperRef.current) {
        spriteWrapperRef.current.style.transform = `scaleX(${flipXRef.current ? -1 : 1}) rotate(${tiltDeg}deg)`;
      }

      // Render Canvas Particles
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const activeParticles: typeof particlesRef.current = [];
          for (const p of particlesRef.current) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 2.8;
            if (p.life > 0) {
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.life;
              ctx.fillRect(p.x, p.y, 4, 4);
              activeParticles.push(p);
            }
          }
          particlesRef.current = activeParticles;
          ctx.globalAlpha = 1.0;
        }
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isReady]);

  // Sync canvas size with window
  useEffect(() => {
    if (!isReady || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isReady]);

  // -------------------------------------------------------------------------
  // 5. Pointer Drag & Fling Handling (Direct Click on Mascot -> ARIA HUD)
  // -------------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    resetRoamToIdle(roamRef.current);
    clearTourTimeouts();
    setTourSpeech(null);
    setIsSpeechBubbleVisible(false);
    if (storeApi.getState().isSpeedRunActive) {
      storeApi.getState().endSpeedRunTour();
    }
    tourRef.current.phase = "idle";
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
    isDraggingRef.current = true;
    acrobatRef.current.phase = "none";
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
    totalDragDistanceRef.current = 0;
    dragVelocityHistoryRef.current = [{ x: e.clientX, y: e.clientY, time: performance.now() }];
    velRef.current = { vx: 0, vy: 0 };
    updatePose("drag");
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;
    totalDragDistanceRef.current = Math.hypot(deltaX, deltaY);

    const newX = dragStartRef.current.posX + deltaX;
    const newY = dragStartRef.current.posY + deltaY;
    posRef.current.x = newX;
    posRef.current.y = newY;

    // Track velocity history for fling
    const now = performance.now();
    dragVelocityHistoryRef.current.push({ x: e.clientX, y: e.clientY, time: now });
    if (dragVelocityHistoryRef.current.length > 5) {
      dragVelocityHistoryRef.current.shift();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // DIRECT CLICK ON MASCOT (< 6px movement):
    // Directly opens / toggles the 3-option ARIA Command HUD without any acrobatics!
    if (totalDragDistanceRef.current < 6) {
      ensureAudioResumed();
      playRetroMenuSound();
      setIsSpeechBubbleVisible(false);
      setIsHUDOpen((prev) => {
        const next = !prev;
        if (next) {
          velRef.current = { vx: 0, vy: 0 };
        }
        return next;
      });
      updatePose("idle");
      setIsNearRight(posRef.current.x > window.innerWidth / 2);
      setIsNearBottom(posRef.current.y > window.innerHeight / 2);
      return;
    }

    // It was a DRAG/FLING: Compute release velocity
    const history = dragVelocityHistoryRef.current;
    if (history.length >= 2) {
      const oldest = history[0];
      const latest = history[history.length - 1];
      const elapsed = Math.max(16, latest.time - oldest.time);
      const vx = ((latest.x - oldest.x) / elapsed) * 22;
      const vy = ((latest.y - oldest.y) / elapsed) * 22;

      velRef.current = {
        vx: Math.max(-28, Math.min(28, vx)),
        vy: Math.max(-28, Math.min(28, vy)),
      };

      if (Math.hypot(vx, vy) > 2) {
        playRetroJumpSound();
        updatePose("thrust");
        setTimeout(() => {
          if (!isSpinningRef.current && acrobatRef.current.phase === "none") updatePose("idle");
        }, 1400);
      } else {
        updatePose("idle");
      }
    } else {
      updatePose("idle");
    }

    setIsNearRight(posRef.current.x > window.innerWidth / 2);
    setIsNearBottom(posRef.current.y > window.innerHeight / 2);
  };

  // -------------------------------------------------------------------------
  // 6. Action Handlers (Speed Run, Chat, Mini Game)
  // -------------------------------------------------------------------------
  const handleOpenAIChat = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    resetRoamToIdle(roamRef.current);
    playRetroMenuSound();
    setIsHUDOpen(false);
    window.dispatchEvent(new CustomEvent("open-mascot-chat"));
  };

  const handleStartTour = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    resetRoamToIdle(roamRef.current);
    ensureAudioResumed();
    playRetroMenuSound();
    playRetroJumpSound();
    setIsHUDOpen(false);
    clearTourTimeouts();

    // Start Speed Run Tour in Zustand store
    startSpeedRunTour();

    tourRef.current = {
      phase: "descent",
      currentProjectId: SPEED_RUN_PROJECTS[0],
      speechText: null,
      settleCheckCount: 0,
      lastSectionTop: 0,
    };
    updatePose("thrust");
    velRef.current = { vx: 0, vy: 16 };

    const el = document.getElementById("interactive-project-web");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenMinigame = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    resetRoamToIdle(roamRef.current);
    ensureAudioResumed();
    playRetroCoinSound();
    setIsHUDOpen(false);
    setMinigameOpen(true);
  };

  if (!isReady) return null;

  return (
    <>
      {/* ── Background Particle Canvas (Zero-Re-Render Exhaust) ─── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[99997]"
      />

      {/* ── Zero-Re-Render Collapsing Reticle Ring on Click-and-Hold ─ */}
      <div
        ref={reticleRef}
        className="fixed top-0 left-0 pointer-events-none z-[99996] will-change-transform hidden"
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className="overflow-visible"
        >
          <circle
            ref={reticleCircleRef}
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="6 4"
            style={{
              filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.75))",
            }}
          />
          <circle cx="50" cy="50" r="3.5" fill="#38bdf8" />
        </svg>
        <div
          ref={reticleLabelRef}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 font-mono text-[9px] uppercase tracking-widest text-cyan-300 font-bold whitespace-nowrap bg-void-card/90 px-1.5 py-0.5 rounded border border-cyan-400/30"
        >
          SUMMONING (0%)
        </div>
      </div>

      {/* ── Floating Astronaut Hitbox & HUD Controller ─────────── */}
      <div
        ref={astronautRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerEnter={() => {
          isHoveredRef.current = true;
          resetRoamToIdle(roamRef.current);
        }}
        onPointerLeave={() => { isHoveredRef.current = false; }}
        className="fixed top-0 left-0 z-[99999] pointer-events-auto touch-action-none select-none cursor-grab active:cursor-grabbing will-change-transform"
        style={{
          width: 58,
          height: 58,
        }}
        title="ARIA Cadet — Click for protocols, hold anywhere on screen to summon!"
      >
        {/* Decoupled Inner Sprite Wrapper for Flip & Ironman Tilt */}
        <div
          ref={spriteWrapperRef}
          className={`w-full h-full flex items-center justify-center will-change-transform origin-center ${
            isMascotWiggling ? "animate-bounce" : ""
          }`}
        >
          <PixelAstronaut pose={pose} size={58} />
        </div>

        {/* ── Interactive Mascot Cartoon Speech Bubble (Direct Parent Attached - Sticks to ARIA) ── */}
        <MascotSpeechBubble
          dialogue={activeDialogue}
          visible={isSpeechBubbleVisible && !isHUDOpen && !tourSpeech}
          mascotX={posRef.current.x}
          mascotY={posRef.current.y}
          onCycle={handleCycleDialogue}
          onDismiss={handleDismissSpeech}
          onPointerEnter={() => { bubbleHoveredRef.current = true; }}
          onPointerLeave={() => {
            bubbleHoveredRef.current = false;
            if (activeDialogue) {
              const dur = Math.min(11000, Math.max(6000, activeDialogue.text.length * 85));
              if (speechDurationTimerRef.current) clearTimeout(speechDurationTimerRef.current);
              speechDurationTimerRef.current = setTimeout(() => {
                if (!bubbleHoveredRef.current) {
                  setIsSpeechBubbleVisible(false);
                }
              }, dur);
            }
          }}
        />

        {/* ── Dynamic Speech Bubble for Tour Oneliners & Celebrations ── */}
        {tourSpeech && (
          <div
            className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 z-[100001] w-64 p-3.5 rounded-2xl bg-[#090d16]/95 border-2 border-cyan-400/90 shadow-[0_0_25px_rgba(56,189,248,0.4)] backdrop-blur-xl pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-cyan-400/20 font-mono text-[9px] uppercase tracking-widest text-starlight-gold font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              ARIA // PROTOCOL
            </div>
            <p className="font-mono text-[11px] text-cyan-100 leading-snug font-medium">
              "{tourSpeech}"
            </p>
            {/* Downward pointing triangle pointer */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-cyan-400/90" />
          </div>
        )}

        {/* ── Action Window with EXACTLY 3 Options (Retro Cosmic Comic Style) ───── */}
        {isHUDOpen && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={`absolute w-60 rounded-2xl border-2 border-cyan-400/90 bg-[#090d16]/95 p-3.5 shadow-[0_0_35px_rgba(56,189,248,0.4)] backdrop-blur-2xl flex flex-col gap-2.5 font-mono text-xs z-50 pointer-events-auto transition-all ${
              isNearRight ? "right-full mr-3.5" : "left-full ml-3.5"
            } ${isNearBottom ? "bottom-0" : "top-0"}`}
          >
            {/* Cartoon Tail Pointer for Menu */}
            <div
              className={`absolute top-4 w-3.5 h-3.5 pointer-events-none ${
                isNearRight ? "-right-[9px]" : "-left-[9px]"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" className="overflow-visible">
                {isNearRight ? (
                  <polygon
                    points="0,0 12,7 0,14"
                    fill="#090d16"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                ) : (
                  <polygon
                    points="14,0 2,7 14,14"
                    fill="#090d16"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-400/20 pb-2 mb-0.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-cyan-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                ARIA COMMAND
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHUDOpen(false);
                }}
                className="text-[11px] text-slate-400 hover:text-white cursor-pointer px-1 minigame-cursor-native leading-none"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Exactly 3 Options: Speed Run, Chat, Mini Game */}
            <button
              onClick={(e) => handleStartTour(e)}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-nebula-violet/25 border border-nebula-violet/60 text-nebula-lavender hover:bg-nebula-violet/40 hover:border-nebula-violet/80 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all active:scale-95 text-[11px] font-bold cursor-pointer minigame-cursor-native"
            >
              <span className="flex items-center gap-2">
                <span>🚀</span>
                <span>Speed Run</span>
              </span>
              <span className="text-[10px] text-starlight-gold">✦</span>
            </button>

            <button
              onClick={(e) => handleOpenAIChat(e)}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 hover:bg-cyan-500/35 hover:border-cyan-400/80 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all active:scale-95 text-[11px] font-bold cursor-pointer minigame-cursor-native"
            >
              <span className="flex items-center gap-2">
                <span>💬</span>
                <span>Chat</span>
              </span>
              <span className="text-[10px] text-cyan-400">➔</span>
            </button>

            <button
              onClick={(e) => handleOpenMinigame(e)}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-starlight-gold/20 border border-starlight-gold/50 text-starlight-gold hover:bg-starlight-gold/35 hover:border-starlight-gold/80 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all active:scale-95 text-[11px] font-bold cursor-pointer minigame-cursor-native"
            >
              <span className="flex items-center gap-2">
                <span>🎮</span>
                <span>Mini Game</span>
              </span>
              <span className="text-[10px]">⭐</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
