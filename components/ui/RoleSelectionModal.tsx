"use client";

/**
 * components/ui/RoleSelectionModal.tsx
 *
 * High-contrast 2D overlay modal for Speed Run evaluation mode.
 *
 * MOUNTING CONDITIONS
 * ───────────────────
 * Mounts when the Zustand store's `mode` state is set to 'speedRun'.
 *
 * EVALUATION ROLES
 * ────────────────
 * Presents 3 focused evaluation options:
 *  1. Full-Stack / Systems Engineering (MPMC / ZeroTrust)
 *  2. AI Tooling (ParleyLab)
 *  3. Rapid Prototyping (CivicGuard)
 *
 * DISPATCH BEHAVIOUR
 * ──────────────────
 * Clicking any role dispatches `startSpeedRunTour(role)` to the Zustand store,
 * which focuses the target 3D project node, adjusts zoom, and updates the
 * interaction state to 'inspection', unmounting the modal automatically.
 */

import { usePortfolioStore, type EvaluationRole } from "@/lib/store";
import { playHoverSound, playSelectSound, playTransitionSound } from "@/lib/audio";

interface RoleOption {
  id: EvaluationRole;
  title: string;
  badge: string;
  icon: string;
  description: string;
  focusNodes: string;
  accentColor: "cyan" | "emerald" | "amber";
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: "Full-Stack / Systems Engineering",
    title: "Full-Stack / Systems Engineering",
    badge: "HARDWARE & DISTRIBUTED SYSTEMS",
    icon: "⚡",
    description:
      "Deep dive into ESP32 microcontroller firmware, MQTT message queues, YOLOv8 edge vision, and zero-trust mobile backends.",
    focusNodes: "MPMC System // ZeroTrust Finance",
    accentColor: "emerald",
  },
  {
    id: "AI Tooling",
    title: "AI Tooling",
    badge: "LLM ENGINEERING & AGENTS",
    icon: "🧠",
    description:
      "Explore multi-agent negotiation frameworks, Python model fallback cascades (OpenRouter → Ollama), and real-time debate scoring.",
    focusNodes: "ParleyLab AI Simulator",
    accentColor: "cyan",
  },
  {
    id: "Rapid Prototyping",
    title: "Rapid Prototyping",
    badge: "SECURITY & PASSKEY ARCHITECTURE",
    icon: "🚀",
    description:
      "Inspect WebAuthn passwordless biometric flows, Solidity smart contract audit logs, and DigiLocker API integration.",
    focusNodes: "CivicGuard Security Platform",
    accentColor: "amber",
  },
];

export function RoleSelectionModal() {
  const mode = usePortfolioStore((s) => s.mode);
  const startSpeedRunTour = usePortfolioStore((s) => s.startSpeedRunTour);
  const setIdle = usePortfolioStore((s) => s.setIdle);

  // Only render when Speed Run mode is active
  if (mode !== "speedRun") {
    return null;
  }

  const handleSelectRole = (role: EvaluationRole) => {
    playSelectSound();
    playTransitionSound();
    startSpeedRunTour(role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto font-mono transition-all animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-focus/40 bg-slate-dark/95 p-6 sm:p-8 shadow-2xl shadow-cyan-focus/20 border-cyan-500/30 overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-cyan-focus/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-40 h-40 bg-emerald-highlight/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-cyan-focus/20 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-highlight opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-highlight"></span>
              </span>
              <span className="text-xs font-bold text-emerald-highlight tracking-widest uppercase">
                SPEED RUN // AUTOMATED TOUR INITIATOR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-cyan-focus tracking-tight drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]">
              SELECT EVALUATION FOCUS
            </h2>
            <p className="mt-1 text-xs text-slate-300 font-sans max-w-md">
              Choose your technical evaluation track to launch a targeted 3D camera tour focusing on relevant architectural components.
            </p>
          </div>

          <button
            onMouseEnter={() => playHoverSound()}
            onClick={() => setIdle()}
            className="text-xs text-slate-400 hover:text-cyan-focus transition-colors px-2.5 py-1 rounded border border-slate-700 hover:border-cyan-focus/60 bg-slate-900/60"
          >
            [X] CANCEL
          </button>
        </div>

        {/* Role Options Matrix */}
        <div className="grid grid-cols-1 gap-4">
          {ROLE_OPTIONS.map((role) => {
            const isCyan = role.accentColor === "cyan";
            const isEmerald = role.accentColor === "emerald";
            const isAmber = role.accentColor === "amber";

            return (
              <button
                key={role.id}
                onMouseEnter={() => playHoverSound()}
                onClick={() => handleSelectRole(role.id)}
                className={`group relative text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 bg-slate-900/80 hover:bg-slate-900 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between ${
                  isCyan
                    ? "border-cyan-focus/30 hover:border-cyan-focus hover:shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                    : isEmerald
                    ? "border-emerald-highlight/30 hover:border-emerald-highlight hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                    : "border-amber-caution/30 hover:border-amber-caution hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{role.icon}</span>
                    <h3 className="font-mono text-sm sm:text-base font-bold text-white group-hover:text-cyan-focus transition-colors">
                      {role.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      isCyan
                        ? "text-cyan-focus bg-cyan-950/60 border-cyan-500/40"
                        : isEmerald
                        ? "text-emerald-highlight bg-emerald-950/60 border-emerald-500/40"
                        : "text-amber-caution bg-amber-950/60 border-amber-500/40"
                    }`}
                  >
                    {role.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed mb-3">
                  {role.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800 pt-2.5">
                  <span className="text-slate-400">
                    TARGET: <strong className="text-slate-200">{role.focusNodes}</strong>
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 transition-transform group-hover:translate-x-1 ${
                      isCyan
                        ? "text-cyan-focus"
                        : isEmerald
                        ? "text-emerald-highlight"
                        : "text-amber-caution"
                    }`}
                  >
                    START TOUR &rarr;
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>STATUS: WAITING FOR USER INPUT</span>
          <span className="text-emerald-highlight">INTERACTION_MODE // SPEED_RUN</span>
        </div>
      </div>
    </div>
  );
}
