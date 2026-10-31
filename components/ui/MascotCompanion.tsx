"use client";

/**
 * components/ui/MascotCompanion.tsx
 *
 * Floating 2D levitating ARIA Orbital Station AI companion avatar & celestial dialogue modal.
 * Features smooth continuous levitation (y: 0 -> -10px -> 0), starlight hover glow,
 * and a dialogue menu with [ INITIATE CELESTIAL TOUR ] & [ ORBITAL MINIGAME ].
 */

import { useState } from "react";
import { usePortfolioStore } from "@/lib/store";
import { playHoverSound, playSelectSound, playTransitionSound, ensureAudioResumed } from "@/lib/audio";

export function MascotCompanion() {
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);

  const startSolarTour = usePortfolioStore((s) => s.startSolarTour);
  const setMinigameOpen = usePortfolioStore((s) => s.setMinigameOpen);

  const handleOpenDialogue = () => {
    ensureAudioResumed();
    playSelectSound();
    setIsDialogueOpen(true);
  };

  const handleInitiateSpeedTour = () => {
    ensureAudioResumed();
    playTransitionSound();
    playSelectSound();
    setIsDialogueOpen(false);

    // Trigger 360° Solar Tour in Zustand store
    startSolarTour();

    // Scroll smoothly to planetary solar system section
    const el = document.getElementById("interactive-project-web");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePlayMinigame = () => {
    ensureAudioResumed();
    playSelectSound();
    setIsDialogueOpen(false);
    setMinigameOpen(true);
  };

  return (
    <>
      {/* ── Levitating Companion Avatar Widget ───────────────────── */}
      <div className="relative inline-flex items-center gap-3 my-4">
        <button
          onClick={handleOpenDialogue}
          onMouseEnter={() => playHoverSound()}
          className="group relative flex items-center justify-center p-3 rounded-2xl border border-nebula-violet/40 bg-void-card/90 shadow-[0_0_25px_rgba(139,92,246,0.25)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(139,92,246,0.5)] hover:border-nebula-violet levitate-float cursor-pointer"
          aria-label="Talk to ARIA Orbital Station AI Companion"
        >
          {/* Outer glowing pulsing ring */}
          <div className="absolute inset-0 rounded-2xl border border-nebula-violet/30 animate-ping opacity-25 pointer-events-none" />

          {/* Avatar Orb Graphics */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-nebula-violet/30 via-void-black to-starlight-gold/20 border border-nebula-violet/50">
            <span className="font-mono text-xs font-black tracking-widest text-nebula-lavender drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">
              ARIA
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-starlight-gold animate-pulse" />
          </div>

          {/* NPC Label Badge */}
          <div className="flex flex-col text-left ml-3 pr-1">
            <span className="font-mono text-[9px] font-bold text-starlight-gold tracking-widest uppercase">
              [ ORBITAL PROBE ]
            </span>
            <span className="font-mono text-xs font-bold text-white group-hover:text-nebula-lavender transition-colors">
              ARIA STATION AI // V2.0
            </span>
          </div>

          {/* Interaction Indicator */}
          <span className="font-mono text-xs text-starlight-gold font-bold ml-2 animate-bounce">
            ✦
          </span>
        </button>
      </div>

      {/* ── NPC Dialogue Modal ────────────────────────────────────── */}
      {isDialogueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-cosmic-modal p-6 shadow-2xl flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-starlight-gold animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-starlight-gold">
                  [ CELESTIAL NAVIGATOR // ARIA ]
                </span>
              </div>
              <button
                onClick={() => {
                  playSelectSound();
                  setIsDialogueOpen(false);
                }}
                className="font-mono text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                [ CLOSE ✕ ]
              </button>
            </div>

            {/* Mascot Avatar & Dialogue Text */}
            <div className="flex gap-4 items-start">
              <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-xl border border-nebula-violet/50 bg-void-black shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <span className="font-mono text-base font-extrabold text-nebula-lavender drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]">
                  ARIA
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-starlight-gold uppercase tracking-widest">
                  ORBITAL STATION COMPANION
                </span>
                <p className="font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
                  "Greetings, Explorer! I am ARIA, your celestial station guide. Choose a navigational protocol below to explore Taanush's research galaxy:"
                </p>
              </div>
            </div>

            {/* Stylized Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleInitiateSpeedTour}
                onMouseEnter={() => playHoverSound()}
                className="w-full flex items-center justify-between rounded-xl border border-nebula-violet/50 bg-nebula-violet/20 px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-nebula-lavender transition-all duration-200 hover:bg-nebula-violet/35 hover:shadow-[0_0_20px_rgba(139,92,246,0.45)] active:scale-95 cursor-pointer"
              >
                <span>[ INITIATE CELESTIAL TOUR ]</span>
                <span className="text-starlight-gold">➔</span>
              </button>

              <button
                onClick={handlePlayMinigame}
                onMouseEnter={() => playHoverSound()}
                className="w-full flex items-center justify-between rounded-xl border border-starlight-gold/50 bg-starlight-gold/15 px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-starlight-gold transition-all duration-200 hover:bg-starlight-gold/25 hover:shadow-[0_0_20px_rgba(251,191,36,0.45)] active:scale-95 cursor-pointer"
              >
                <span>[ ORBITAL MINIGAME ]</span>
                <span className="text-starlight-gold">🎮</span>
              </button>
            </div>

            {/* Footer status line */}
            <div className="border-t border-white/10 pt-3 text-center">
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
                STATION CORE // TELEMETRY FLIGHT PATH STABLE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* levitate-float keyframe animation */}
      <style jsx global>{`
        @keyframes floatLevitate {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .levitate-float {
          animation: floatLevitate 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
