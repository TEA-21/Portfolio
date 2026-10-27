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
 * 4. Frame-Rate Independent Damping: `Math.pow(0.965, dt * 60)` with `Math.min(dt, 0.032)` cap.
 * 5. Click vs Drag Detection: Threshold of 6px total movement.
 * 6. Edge-Aware HUD & Speech Bubble: Flips inward dynamically to prevent off-screen clipping.
 * 7. Debounced Section Tips: `IntersectionObserver(threshold: 0.4)` with 800ms dwell timer.
 * 8. Stardust Hunt Mini-Game & Throttled 8-bit Audio.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PixelAstronaut, AstronautPose } from "./PixelAstronaut";
import { usePortfolioStore } from "@/lib/store";
import {
  playRetroThrusterSound,
  playRetroJumpSound,
  playRetroBounceSound,
  playRetroCoinSound,
  playRetroSomersaultSound,
  playRetroMenuSound,
  toggleAudioMute,
  getAudioMuted,
} from "@/lib/audio";

interface StardustGem {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

const SECTION_TIPS: Record<string, string> = {
  hero: "Welcome to Taanush's Stellar Observatory! Scroll down or drag me around!",
  bio: "Dossier area: AI/LLM engineering, micro-SLMs on ESP32, and deep-space tech.",
  projects: "3D Planetary Solar System online! Click any revolving planet to inspect.",
};

export function FlyingMascotCompanion() {
  const [isReady, setIsReady] = useState(false);
  const [pose, setPose] = useState<AstronautPose>("idle");
  const [isHUDOpen, setIsHUDOpen] = useState(false);
  const [speechText, setSpeechText] = useState<string>(SECTION_TIPS.hero);
  const [isSpeechVisible, setIsSpeechVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Stardust mini-game state
  const [isHuntActive, setIsHuntActive] = useState(false);
  const [gems, setGems] = useState<StardustGem[]>([]);
  const gemsRef = useRef<StardustGem[]>([]);

  // Edge awareness positioning
  const [isNearRight, setIsNearRight] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // DOM refs for zero-re-render animation
  const astronautRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Kinematic state in refs
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, posX: 0, posY: 0 });
  const totalDragDistanceRef = useRef(0);
  const dragVelocityHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([]);
  const lastTimeRef = useRef(0);
  const isSpinningRef = useRef(false);
  const spinAngleRef = useRef(0);

  // Particle pool for jetpack exhaust
  const particlesRef = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>
  >([]);

  // Store actions for tours
  const startSpeedRunTour = usePortfolioStore((s) => s.startSpeedRunTour);

  // Dwell timer for IntersectionObserver
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------------------
  // 1. SSR-Safe Initialization
  // -------------------------------------------------------------------------
  useEffect(() => {
    const defaultX = Math.max(20, window.innerWidth - 100);
    const defaultY = Math.max(20, window.innerHeight - 150);
    posRef.current = { x: defaultX, y: defaultY };
    setIsNearRight(defaultX > window.innerWidth / 2);
    setIsNearBottom(defaultY > window.innerHeight / 2);
    setIsMuted(getAudioMuted());
    setIsReady(true);
    lastTimeRef.current = performance.now();

    // Window resize handler: clamp within visible screen
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
  // 2. Listen for AI Transmitting State from MascotChat
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleTransmitting = (e: Event) => {
      const isTransmitting = (e as CustomEvent).detail;
      if (isTransmitting) {
        setPose("transmitting");
        setSpeechText("Routing neural telemetry through deep-space relay...");
        setIsSpeechVisible(true);
      } else if (!isDraggingRef.current && !isSpinningRef.current) {
        setPose("idle");
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
        setPose("thrust");
        setSpeechText("Reporting to Astronomical Dossier! All systems nominal!");
        setIsSpeechVisible(true);
        setTimeout(() => setPose("wave"), 1100);
        setTimeout(() => setPose("idle"), 2400);
      }
    };

    window.addEventListener("summon-mascot-to-bio", handleSummonToBio);
    return () => {
      window.removeEventListener("mascot-transmitting", handleTransmitting);
      window.removeEventListener("summon-mascot-to-bio", handleSummonToBio);
    };
  }, []);

  // -------------------------------------------------------------------------
  // 3. Debounced IntersectionObserver for Section Tips (800ms dwell)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const sectionMap: Record<string, string> = {
      "hero-section": SECTION_TIPS.hero,
      "bio-details-section": SECTION_TIPS.bio,
      "interactive-project-web": SECTION_TIPS.projects,
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const sectionId = entry.target.id;
            const newTip = sectionMap[sectionId];
            if (newTip) {
              if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
              dwellTimerRef.current = setTimeout(() => {
                setSpeechText(newTip);
                setIsSpeechVisible(true);
              }, 800);
            }
          }
        });
      },
      { threshold: [0.35, 0.5] }
    );

    const targetIds = ["hero-section", "bio-details-section", "interactive-project-web"];
    targetIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      observer.disconnect();
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

      // Capped dt (prevents physics explosions after background tab switch)
      const rawDt = (now - lastTimeRef.current) / 1000;
      const dt = Math.min(rawDt, 0.032);
      lastTimeRef.current = now;

      const pos = posRef.current;
      const vel = velRef.current;
      const maxX = Math.max(20, window.innerWidth - 75);
      const maxY = Math.max(20, window.innerHeight - 85);

      if (!isDraggingRef.current) {
        // Frame-rate independent velocity damping
        const damping = Math.pow(0.965, dt * 60);
        vel.vx *= damping;
        vel.vy *= damping;

        // Apply velocities
        pos.x += vel.vx * dt * 60;
        pos.y += vel.vy * dt * 60;

        // Viewport boundary collision & bounce
        let bounced = false;
        if (pos.x <= 15) {
          pos.x = 15;
          vel.vx = -vel.vx * 0.65;
          bounced = true;
        } else if (pos.x >= maxX) {
          pos.x = maxX;
          vel.vx = -vel.vx * 0.65;
          bounced = true;
        }

        if (pos.y <= 15) {
          pos.y = 15;
          vel.vy = -vel.vy * 0.65;
          bounced = true;
        } else if (pos.y >= maxY) {
          pos.y = maxY;
          vel.vy = -vel.vy * 0.65;
          bounced = true;
        }

        if (bounced && (Math.abs(vel.vx) > 1.5 || Math.abs(vel.vy) > 1.5)) {
          playRetroBounceSound();
        }

        // Emit jetpack particles when flying with speed
        const speed = Math.hypot(vel.vx, vel.vy);
        if (speed > 1.8) {
          playRetroThrusterSound();
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

      // Check collision with collectible stardust gems
      if (gemsRef.current.length > 0) {
        let stateChanged = false;
        gemsRef.current.forEach((gem) => {
          if (!gem.collected) {
            const dist = Math.hypot(pos.x + 28 - gem.x, pos.y + 28 - gem.y);
            if (dist < 42) {
              gem.collected = true;
              stateChanged = true;
              playRetroCoinSound();
              // Spawn victory burst particles
              for (let i = 0; i < 8; i++) {
                particlesRef.current.push({
                  x: gem.x,
                  y: gem.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  life: 1.0,
                  color: "#fbbf24",
                });
              }
            }
          }
        });
        if (stateChanged) {
          setGems([...gemsRef.current]);
        }
      }

      // Compute banking tilt
      let tiltDeg = 0;
      if (isSpinningRef.current) {
        spinAngleRef.current += dt * 720;
        tiltDeg = spinAngleRef.current;
        if (spinAngleRef.current >= 360) {
          isSpinningRef.current = false;
          spinAngleRef.current = 0;
          setPose("idle");
        }
      } else {
        tiltDeg = Math.min(Math.max(vel.vx * 2.8, -24), 24);
      }

      // Update DOM transform directly
      if (astronautRef.current) {
        astronautRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0px) rotate(${tiltDeg}deg)`;
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
  // 5. Pointer Drag & Fling Handling (Distinguish Drag vs Click < 6px)
  // -------------------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: posRef.current.x,
      posY: posRef.current.y,
    };
    totalDragDistanceRef.current = 0;
    dragVelocityHistoryRef.current = [{ x: e.clientX, y: e.clientY, time: performance.now() }];
    velRef.current = { vx: 0, vy: 0 };
    setPose("drag");
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
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Guardrail 2: Distinguish Click vs Drag (< 6px movement)
    if (totalDragDistanceRef.current < 6) {
      // It's a CLICK! Toggle Radial Action HUD
      playRetroMenuSound();
      setIsHUDOpen((prev) => !prev);
      setPose("idle");
      // Update edge awareness for menu positioning
      setIsNearRight(posRef.current.x > window.innerWidth / 2);
      setIsNearBottom(posRef.current.y > window.innerHeight / 2);
      return;
    }

    // It was a DRAG/FLING! Compute release velocity
    const history = dragVelocityHistoryRef.current;
    if (history.length >= 2) {
      const oldest = history[0];
      const latest = history[history.length - 1];
      const elapsed = Math.max(16, latest.time - oldest.time);
      const vx = ((latest.x - oldest.x) / elapsed) * 22;
      const vy = ((latest.y - oldest.y) / elapsed) * 22;

      // Cap maximum fling velocity
      velRef.current = {
        vx: Math.max(-28, Math.min(28, vx)),
        vy: Math.max(-28, Math.min(28, vy)),
      };

      if (Math.hypot(vx, vy) > 2) {
        playRetroJumpSound();
        setPose("thrust");
        setTimeout(() => {
          if (!isSpinningRef.current) setPose("idle");
        }, 1400);
      } else {
        setPose("idle");
      }
    } else {
      setPose("idle");
    }

    // Update edge awareness
    setIsNearRight(posRef.current.x > window.innerWidth / 2);
    setIsNearBottom(posRef.current.y > window.innerHeight / 2);
  };

  // -------------------------------------------------------------------------
  // 6. Action Handlers (Ask AI, Tour, Flip, Stardust Hunt, Mute, Re-Dock)
  // -------------------------------------------------------------------------
  const handleOpenAIChat = () => {
    playRetroMenuSound();
    setIsHUDOpen(false);
    window.dispatchEvent(new CustomEvent("open-mascot-chat"));
  };

  const handleStartTour = () => {
    playRetroMenuSound();
    playRetroJumpSound();
    setIsHUDOpen(false);
    startSpeedRunTour("AI Infrastructure & High-Perf Systems");

    // Fling astronaut toward bottom project section
    velRef.current = { vx: 0, vy: 14 };
    setPose("thrust");

    const el = document.getElementById("interactive-project-web");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSomersault = () => {
    playRetroSomersaultSound();
    isSpinningRef.current = true;
    spinAngleRef.current = 0;
    setPose("spin");
    setIsHUDOpen(false);
  };

  const handleToggleMute = () => {
    const muted = toggleAudioMute();
    setIsMuted(muted);
    if (!muted) playRetroMenuSound();
  };

  const handleToggleStardustHunt = () => {
    playRetroCoinSound();
    setIsHUDOpen(false);

    if (isHuntActive) {
      setIsHuntActive(false);
      setGems([]);
      gemsRef.current = [];
      setSpeechText("Stardust collection paused! Click me anytime to resume.");
      return;
    }

    // Spawn 5 collectible gems across safe screen margin
    const w = window.innerWidth;
    const h = window.innerHeight;
    const newGems: StardustGem[] = [
      { id: 1, x: w * 0.25, y: h * 0.3, collected: false },
      { id: 2, x: w * 0.75, y: h * 0.25, collected: false },
      { id: 3, x: w * 0.5, y: h * 0.55, collected: false },
      { id: 4, x: w * 0.18, y: h * 0.72, collected: false },
      { id: 5, x: w * 0.82, y: h * 0.68, collected: false },
    ];
    setGems(newGems);
    gemsRef.current = newGems;
    setIsHuntActive(true);
    setSpeechText("★ STARDUST HUNT: Drag and fling me into the 5 golden celestial gems!");
    setIsSpeechVisible(true);
  };

  const handleReDock = () => {
    playRetroJumpSound();
    setIsHUDOpen(false);
    const targetX = Math.max(20, window.innerWidth - 100);
    const targetY = Math.max(20, window.innerHeight - 150);

    // Smooth glide back to dock position
    const dx = targetX - posRef.current.x;
    const dy = targetY - posRef.current.y;
    velRef.current = { vx: dx * 0.08, vy: dy * 0.08 };
    setPose("thrust");
    setTimeout(() => {
      setPose("idle");
    }, 1200);
  };

  if (!isReady) return null;

  const collectedCount = gems.filter((g) => g.collected).length;

  return (
    <>
      {/* ── Background Particle Canvas (Zero-Re-Render Exhaust) ─── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[99997]"
      />

      {/* ── Collectible Stardust Gems (Mini-Game) ───────────────── */}
      {isHuntActive &&
        gems.map((gem) => {
          if (gem.collected) return null;
          return (
            <div
              key={gem.id}
              className="fixed pointer-events-none z-[99998] transition-transform duration-300 animate-pulse"
              style={{
                left: gem.x - 12,
                top: gem.y - 12,
              }}
            >
              <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-starlight-gold/20 border border-starlight-gold shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                <span className="font-mono text-sm text-starlight-gold font-black">✦</span>
              </div>
            </div>
          );
        })}

      {/* ── Floating Astronaut Hitbox & HUD Controller ─────────── */}
      <div
        ref={astronautRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="fixed top-0 left-0 z-[99999] pointer-events-auto touch-action-none select-none cursor-grab active:cursor-grabbing will-change-transform"
        style={{
          width: 58,
          height: 58,
        }}
        title="ARIA Cadet — Click to interact, drag & fling in zero-G!"
      >
        {/* Pixel Astronaut Character Sprite */}
        <PixelAstronaut pose={pose} size={58} />

        {/* ── Contextual Speech Bubble (Edge-Aware) ─────────────── */}
        {isSpeechVisible && !isHUDOpen && (
          <div
            className={`absolute whitespace-normal w-56 sm:w-64 rounded-xl border border-cyan-400/40 bg-void-card/95 p-3 font-mono text-[11px] text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-xl animate-fade-in pointer-events-auto transition-all ${
              isNearRight ? "right-full mr-3" : "left-full ml-3"
            } ${isNearBottom ? "bottom-0" : "top-0"}`}
          >
            <div className="flex items-center justify-between border-b border-cyan-400/20 pb-1.5 mb-1.5">
              <span className="text-[9px] uppercase tracking-widest text-starlight-gold font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                ARIA CADET
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSpeechVisible(false);
                }}
                className="text-[10px] text-slate-400 hover:text-white px-1"
                aria-label="Dismiss tip"
              >
                ✕
              </button>
            </div>
            <p className="leading-snug">{speechText}</p>
            {isHuntActive && (
              <div className="mt-2 text-[10px] font-bold text-starlight-gold border-t border-white/10 pt-1">
                STARDUST HUNT: {collectedCount}/5 GEMS
              </div>
            )}
          </div>
        )}

        {/* ── Radial Action HUD Menu (Edge-Aware) ────────────────── */}
        {isHUDOpen && (
          <div
            className={`absolute w-60 rounded-2xl border border-nebula-violet/50 bg-void-card/95 p-3.5 shadow-[0_0_35px_rgba(139,92,246,0.4)] backdrop-blur-2xl flex flex-col gap-2 font-mono text-xs z-50 pointer-events-auto transition-all ${
              isNearRight ? "right-full mr-3" : "left-full ml-3"
            } ${isNearBottom ? "bottom-0" : "top-0"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-starlight-gold">
                // ARIA COMMAND PROTOCOLS
              </span>
              <button
                onClick={() => setIsHUDOpen(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleOpenAIChat}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/25 transition-all active:scale-95 text-[11px] font-bold"
            >
              <span>[ 💬 ASK ARIA AI ]</span>
              <span className="text-[10px] text-cyan-400">➔</span>
            </button>

            <button
              onClick={handleStartTour}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-nebula-violet/20 border border-nebula-violet/50 text-nebula-lavender hover:bg-nebula-violet/35 transition-all active:scale-95 text-[11px] font-bold"
            >
              <span>[ 🚀 GUIDED TOUR ]</span>
              <span className="text-[10px] text-starlight-gold">✦</span>
            </button>

            <button
              onClick={handleToggleStardustHunt}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-starlight-gold/15 border border-starlight-gold/40 text-starlight-gold hover:bg-starlight-gold/25 transition-all active:scale-95 text-[11px] font-bold"
            >
              <span>{isHuntActive ? "[ ⭐ PAUSE HUNT ]" : "[ ⭐ STARDUST HUNT ]"}</span>
              <span className="text-[10px]">🎮</span>
            </button>

            <button
              onClick={handleSomersault}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25 transition-all active:scale-95 text-[11px] font-bold"
            >
              <span>[ 🔄 SOMERSAULT FLIP ]</span>
              <span className="text-[10px]">360°</span>
            </button>

            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
              <button
                onClick={handleToggleMute}
                className="text-slate-400 hover:text-white flex items-center gap-1 py-1"
              >
                <span>{isMuted ? "🔇 UNMUTE AUDIO" : "🔊 MUTE AUDIO"}</span>
              </button>
              <button
                onClick={handleReDock}
                className="text-slate-400 hover:text-starlight-gold flex items-center gap-1 py-1"
              >
                <span>⚓ DOCK</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
