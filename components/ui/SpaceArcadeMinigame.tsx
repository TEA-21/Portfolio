"use client";

/**
 * components/ui/SpaceArcadeMinigame.tsx
 *
 * Retro Cyberpunk Space Arcade Mini-Game: "ARIA CADET: ORBITAL DEFENSE".
 *
 * 1. Normalized Delta-Time Physics:
 *    dt = Math.min((now - lastTime) / 1000, 0.05); all movements scaled with dt * 60.
 * 2. Multi-Input Support:
 *    Touch (touch-action: none), Mouse Pointer, and Keyboard (WASD / Arrows).
 * 3. SSR-Safe LocalStorage:
 *    Guarded with typeof window !== "undefined".
 * 4. Audio & Centralized Zustand Store:
 *    Web Audio API lazy-resumed on click/touch; audio mute synchronized with portfolio store.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { usePortfolioStore } from "@/lib/store";
import {
  ensureAudioResumed,
  playRetroCoinSound,
  playRetroExplosionSound,
  playGameOverSound,
  playVictoryFanfare,
  playRetroMenuSound,
} from "@/lib/audio";

interface Asteroid {
  id: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  vx: number;
  rot: number;
  rotSpeed: number;
}

interface StardustGem {
  id: number;
  x: number;
  y: number;
  radius: number;
  vy: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function SpaceArcadeMinigame() {
  const isMinigameOpen = usePortfolioStore((s) => s.isMinigameOpen);
  const setMinigameOpen = usePortfolioStore((s) => s.setMinigameOpen);
  const isAudioMuted = usePortfolioStore((s) => s.isAudioMuted);
  const toggleAudioMuted = usePortfolioStore((s) => s.toggleAudioMuted);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game UI state
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover" | "victory">("ready");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [shields, setShields] = useState(3);
  const [combo, setCombo] = useState(0);

  // Kinematic state stored in refs to avoid React re-render lag
  const playerRef = useRef({ x: 300, y: 350, vx: 0, vy: 0, width: 28, height: 32 });
  const targetRef = useRef({ x: 300, y: 350, active: false });
  const keysRef = useRef<Record<string, boolean>>({});
  const asteroidsRef = useRef<Asteroid[]>([]);
  const gemsRef = useRef<StardustGem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const scoreRef = useRef(0);
  const shieldsRef = useRef(3);
  const timerRef = useRef(30);
  const comboRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Load high score safely on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("space_arcade_high_score");
        if (saved) setHighScore(parseInt(saved, 10));
      } catch {}
    }
  }, []);

  const saveHighScore = useCallback((newScore: number) => {
    if (typeof window !== "undefined") {
      try {
        const currentHigh = parseInt(localStorage.getItem("space_arcade_high_score") || "0", 10);
        if (newScore > currentHigh) {
          localStorage.setItem("space_arcade_high_score", String(newScore));
          setHighScore(newScore);
        }
      } catch {}
    }
  }, []);

  // -------------------------------------------------------------------------
  // Start / Reset Game
  // -------------------------------------------------------------------------
  const startGame = useCallback(() => {
    ensureAudioResumed();
    playRetroMenuSound();

    const canvas = canvasRef.current;
    const startX = canvas ? canvas.width / 2 : 300;
    const startY = canvas ? canvas.height * 0.75 : 350;

    playerRef.current = { x: startX, y: startY, vx: 0, vy: 0, width: 28, height: 32 };
    targetRef.current = { x: startX, y: startY, active: false };
    asteroidsRef.current = [];
    gemsRef.current = [];
    particlesRef.current = [];
    spawnTimerRef.current = 0;
    scoreRef.current = 0;
    shieldsRef.current = 3;
    timerRef.current = 30;
    comboRef.current = 0;

    setScore(0);
    setShields(3);
    setTimeLeft(30);
    setCombo(0);
    setGameState("playing");
    lastTimeRef.current = performance.now();
  }, []);

  // -------------------------------------------------------------------------
  // Input Listeners
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isMinigameOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMinigameOpen(false);
        return;
      }
      keysRef.current[e.code] = true;
      targetRef.current.active = false;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isMinigameOpen, setMinigameOpen]);

  // Pointer / Touch controller for Canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ensureAudioResumed();
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = e.currentTarget.width / rect.width;
    const scaleY = e.currentTarget.height / rect.height;
    targetRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      active: true,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ensureAudioResumed();
    handlePointerMove(e);
  };

  // -------------------------------------------------------------------------
  // Main Game Loop (Delta-Time Normalized)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isMinigameOpen || gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(loop);

      // Delta time normalized, clamped to max 50ms (0.05s) to avoid jumps
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const w = canvas.width;
      const h = canvas.height;

      // Update Timer
      timerRef.current -= dt;
      setTimeLeft(Math.max(0, Math.ceil(timerRef.current)));

      if (timerRef.current <= 0) {
        saveHighScore(scoreRef.current);
        playVictoryFanfare();
        setGameState("victory");
        return;
      }

      // ── 1. Update Player Movement ──
      const p = playerRef.current;
      const keys = keysRef.current;
      const target = targetRef.current;

      let ax = 0;
      let ay = 0;

      if (target.active) {
        // Smooth lerp to pointer destination
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        p.x += dx * Math.min(1.0, 12 * dt);
        p.y += dy * Math.min(1.0, 12 * dt);
        p.vx = dx * 8 * dt;
        p.vy = dy * 8 * dt;
      } else {
        // Keyboard controls (WASD / Arrows)
        const moveSpeed = 400 * dt;
        if (keys["ArrowLeft"] || keys["KeyA"]) ax -= moveSpeed;
        if (keys["ArrowRight"] || keys["KeyD"]) ax += moveSpeed;
        if (keys["ArrowUp"] || keys["KeyW"]) ay -= moveSpeed;
        if (keys["ArrowDown"] || keys["KeyS"]) ay += moveSpeed;

        p.vx = (p.vx + ax) * Math.pow(0.85, dt * 60);
        p.vy = (p.vy + ay) * Math.pow(0.85, dt * 60);

        p.x += p.vx;
        p.y += p.vy;
      }

      // Clamp player within visible canvas area
      p.x = Math.max(16, Math.min(w - 16, p.x));
      p.y = Math.max(20, Math.min(h - 24, p.y));

      // Emit thruster particle trail
      if (Math.random() < 0.6) {
        particlesRef.current.push({
          x: p.x + (Math.random() - 0.5) * 8,
          y: p.y + 14,
          vx: (Math.random() - 0.5) * 40 * dt,
          vy: 80 * dt,
          life: 0.5,
          color: Math.random() > 0.4 ? "#f97316" : "#38bdf8",
        });
      }

      // ── 2. Spawner Logic (Asteroids & Stardust) ──
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current > 0.45) {
        spawnTimerRef.current = 0;

        // Spawn Asteroid
        if (Math.random() < 0.75) {
          asteroidsRef.current.push({
            id: Math.random(),
            x: Math.random() * (w - 40) + 20,
            y: -25,
            radius: Math.random() * 12 + 10,
            speed: (Math.random() * 120 + 100) * dt * 60,
            vx: (Math.random() - 0.5) * 40 * dt * 60,
            rot: 0,
            rotSpeed: (Math.random() - 0.5) * 4 * dt,
          });
        }

        // Spawn Golden Stardust Gem
        if (Math.random() < 0.6) {
          gemsRef.current.push({
            id: Math.random(),
            x: Math.random() * (w - 40) + 20,
            y: -15,
            radius: 8,
            vy: (Math.random() * 80 + 90) * dt * 60,
            collected: false,
          });
        }
      }

      // ── 3. Update Asteroids & Collisions ──
      const aliveAsteroids: Asteroid[] = [];
      for (const ast of asteroidsRef.current) {
        ast.y += ast.speed * dt;
        ast.x += ast.vx * dt;
        ast.rot += ast.rotSpeed;

        // Player collision
        const dist = Math.hypot(p.x - ast.x, p.y - ast.y);
        if (dist < ast.radius + 12) {
          playRetroExplosionSound();
          shieldsRef.current -= 1;
          setShields(shieldsRef.current);
          comboRef.current = 0;
          setCombo(0);

          // Impact burst particles
          for (let i = 0; i < 14; i++) {
            particlesRef.current.push({
              x: ast.x,
              y: ast.y,
              vx: (Math.random() - 0.5) * 160 * dt,
              vy: (Math.random() - 0.5) * 160 * dt,
              life: 0.6,
              color: "#f43f5e",
            });
          }

          if (shieldsRef.current <= 0) {
            saveHighScore(scoreRef.current);
            playGameOverSound();
            setGameState("gameover");
            return;
          }
          continue; // Asteroid destroyed upon shield hit
        }

        if (ast.y < h + 40) aliveAsteroids.push(ast);
      }
      asteroidsRef.current = aliveAsteroids;

      // ── 4. Update Stardust Gems & Pickups ──
      const aliveGems: StardustGem[] = [];
      for (const gem of gemsRef.current) {
        gem.y += gem.vy * dt;

        const dist = Math.hypot(p.x - gem.x, p.y - gem.y);
        if (dist < gem.radius + 14) {
          playRetroCoinSound();
          comboRef.current += 1;
          setCombo(comboRef.current);

          const gained = 100 * Math.min(5, comboRef.current);
          scoreRef.current += gained;
          setScore(scoreRef.current);

          // Sparkle burst particles
          for (let i = 0; i < 8; i++) {
            particlesRef.current.push({
              x: gem.x,
              y: gem.y,
              vx: (Math.random() - 0.5) * 120 * dt,
              vy: (Math.random() - 0.5) * 120 * dt,
              life: 0.5,
              color: "#fbbf24",
            });
          }
          continue; // Gem collected
        }

        if (gem.y < h + 20) aliveGems.push(gem);
      }
      gemsRef.current = aliveGems;

      // ── 5. Render Scene to Canvas ──
      ctx.clearRect(0, 0, w, h);

      // Deep space grid
      ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
      ctx.lineWidth = 1;
      const gridOffset = (now * 0.05) % 30;
      for (let y = gridOffset; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Stardust Gems
      for (const gem of gemsRef.current) {
        ctx.save();
        ctx.translate(gem.x, gem.y);
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, gem.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner glint
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-2, -2, gem.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Asteroids
      for (const ast of asteroidsRef.current) {
        ctx.save();
        ctx.translate(ast.x, ast.y);
        ctx.rotate(ast.rot);
        ctx.fillStyle = "#334155";
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(244, 63, 94, 0.4)";
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Draw Jetpack & Impact Particles
      const activeParticles: Particle[] = [];
      for (const pt of particlesRef.current) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= dt * 2.2;
        if (pt.life > 0) {
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = Math.max(0, pt.life);
          ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
          activeParticles.push(pt);
        }
      }
      particlesRef.current = activeParticles;
      ctx.globalAlpha = 1.0;

      // Draw ARIA Cadet Player
      ctx.save();
      ctx.translate(p.x, p.y);

      // Banking lean
      const bankAngle = Math.max(-0.4, Math.min(0.4, p.vx * 0.05));
      ctx.rotate(bankAngle);

      // Jetpack flame
      ctx.fillStyle = "#f97316";
      ctx.fillRect(-6, 12, 12, 6);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-3, 14, 6, 5);

      // Suit body
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(-10, -12, 20, 24);

      // Visor glowing cyan
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.fillRect(-6, -8, 12, 8);
      ctx.shadowBlur = 0;

      // Energy Shield Aura
      if (shieldsRef.current > 0) {
        ctx.strokeStyle = shieldsRef.current === 1 ? "#f43f5e" : "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isMinigameOpen, gameState, saveHighScore]);

  if (!isMinigameOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-void-black/85 backdrop-blur-xl animate-fade-in pointer-events-auto select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-400/40 bg-void-card/95 p-5 shadow-[0_0_50px_rgba(56,189,248,0.35)] flex flex-col gap-4">
        
        {/* Header HUD */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs font-black uppercase tracking-widest text-cyan-300">
              ARIA CADET: ORBITAL DEFENSE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleAudioMuted()}
              className="minigame-cursor-native cursor-pointer font-mono text-xs text-slate-400 hover:text-white transition-colors p-1"
              title="Toggle Audio"
            >
              {isAudioMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => setMinigameOpen(false)}
              className="minigame-cursor-native cursor-pointer font-mono text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-2 py-1"
              aria-label="Exit Game"
            >
              [ CLOSE ✕ ]
            </button>
          </div>
        </div>

        {/* Real-Time Telemetry Bar */}
        <div className="flex items-center justify-between font-mono text-xs px-2 py-1.5 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">SCORE:</span>
            <span className="text-starlight-gold font-bold">{score}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">TIME:</span>
            <span className={`font-bold ${timeLeft < 10 ? "text-rose-400 animate-pulse" : "text-cyan-300"}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">SHIELDS:</span>
            <span className="text-emerald-400 font-bold">
              {"✦".repeat(Math.max(0, shields))}
            </span>
          </div>
          {combo > 1 && (
            <span className="text-xs font-bold text-starlight-gold animate-bounce">
              {combo}x COMBO!
            </span>
          )}
        </div>

        {/* ── 2D Arcade Canvas ───────────────────────────────────── */}
        <div className="relative w-full h-[360px] rounded-xl border border-cyan-500/30 bg-black/60 overflow-hidden touch-none cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className="w-full h-full block"
          />

          {/* Ready Overlay */}
          {gameState === "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center gap-4 animate-fade-in">
              <span className="font-mono text-xl font-black text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]">
                ORBITAL DEBRIS FIELD DETECTED
              </span>
              <p className="font-sans text-xs text-slate-300 max-w-xs leading-relaxed">
                Pilot ARIA Cadet. Dodge space debris and collect golden stardust crystals before the 30-second orbital window closes!
              </p>
              <div className="font-mono text-[11px] text-slate-400">
                [ CONTROLS: Mouse / Touch / Arrow Keys / WASD ]
              </div>
              <button
                onClick={startGame}
                className="minigame-cursor-native cursor-pointer mt-2 px-6 py-2.5 rounded-xl border border-cyan-400 bg-cyan-500/20 text-cyan-200 font-mono text-xs font-black uppercase tracking-widest hover:bg-cyan-500/35 hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] active:scale-95 transition-all"
              >
                [ INITIATE LAUNCH ➔ ]
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center gap-3 animate-fade-in">
              <span className="font-mono text-2xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
                CRITICAL SHIELD DEPLETION
              </span>
              <span className="font-mono text-sm text-slate-300">
                Final Telemetry Score: <strong className="text-starlight-gold">{score}</strong>
              </span>
              {highScore > 0 && (
                <span className="font-mono text-xs text-slate-400">
                  Cadet Record: {Math.max(score, highScore)}
                </span>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={startGame}
                  className="minigame-cursor-native cursor-pointer px-5 py-2 rounded-xl border border-rose-500/60 bg-rose-500/20 text-rose-200 font-mono text-xs font-bold uppercase tracking-widest hover:bg-rose-500/35 transition-all"
                >
                  [ REBOOT CADET ]
                </button>
                <button
                  onClick={() => setMinigameOpen(false)}
                  className="minigame-cursor-native cursor-pointer px-5 py-2 rounded-xl border border-white/20 bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  [ RETURN TO GALAXY ]
                </button>
              </div>
            </div>
          )}

          {/* Victory Overlay */}
          {gameState === "victory" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center gap-3 animate-fade-in">
              <span className="font-mono text-2xl font-black text-starlight-gold drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
                ★ MISSION ACCOMPLISHED ★
              </span>
              <span className="font-mono text-sm text-slate-300">
                Stardust Harvested: <strong className="text-starlight-gold">{score} PTS</strong>
              </span>
              {score >= highScore && score > 0 && (
                <span className="font-mono text-xs text-emerald-400 animate-pulse font-bold">
                  ✦ NEW ALL-TIME RECORD ESTABLISHED! ✦
                </span>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={startGame}
                  className="minigame-cursor-native cursor-pointer px-5 py-2 rounded-xl border border-starlight-gold/60 bg-starlight-gold/20 text-starlight-gold font-mono text-xs font-bold uppercase tracking-widest hover:bg-starlight-gold/35 transition-all"
                >
                  [ PLAY AGAIN ➔ ]
                </button>
                <button
                  onClick={() => setMinigameOpen(false)}
                  className="minigame-cursor-native cursor-pointer px-5 py-2 rounded-xl border border-white/20 bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  [ RETURN TO GALAXY ]
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls hint */}
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 border-t border-white/10 pt-2 px-1">
          <span>HIGH SCORE: {Math.max(score, highScore)}</span>
          <span>PRESS [ESC] TO EXIT ANYTIME</span>
        </div>
      </div>
    </div>
  );
}

