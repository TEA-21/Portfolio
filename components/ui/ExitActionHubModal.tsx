"use client";

/**
 * components/ui/ExitActionHubModal.tsx
 *
 * Completion overlay modal for the Speed Run evaluation tour sequence.
 *
 * MOUNTING CONDITIONS
 * ───────────────────
 * Mounts when the Zustand store's `mode` state transitions to 'exitActionHub'.
 */

import { usePortfolioStore } from "@/lib/store";

export function ExitActionHubModal() {
  const mode = usePortfolioStore((s) => s.mode);
  const activeRole = usePortfolioStore((s) => s.activeRole);
  const setIdle = usePortfolioStore((s) => s.setIdle);
  const setSpeedRun = usePortfolioStore((s) => s.setSpeedRun);

  if (mode !== "exitActionHub") {
    return null;
  }

  const handleReturnToMatrix = () => {
    setIdle();
  };

  const handleRestartTour = () => {
    setSpeedRun();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto font-mono transition-all animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl rounded-2xl border border-emerald-highlight/40 bg-slate-dark/95 p-6 sm:p-8 shadow-2xl shadow-emerald-highlight/20 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-highlight/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-emerald-highlight/20 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-highlight opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-highlight"></span>
              </span>
              <span className="text-xs font-bold text-emerald-highlight tracking-widest uppercase">
                SPEED RUN COMPLETE // ACTION HUB
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              EVALUATION SEQUENCE FINISHED
            </h2>
            <p className="mt-1 text-xs text-slate-300 font-sans">
              You have completed the targeted 3D node tour for{" "}
              <strong className="text-emerald-highlight">{activeRole ?? "Selected Role"}</strong>.
            </p>
          </div>

          <button
            onClick={handleReturnToMatrix}
            className="text-xs text-slate-400 hover:text-white transition-colors px-2.5 py-1 rounded border border-slate-700 hover:border-slate-500 bg-slate-900/60"
          >
            [X] CLOSE
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleRestartTour}
            className="p-4 rounded-xl border border-cyan-focus/40 bg-slate-900/80 hover:bg-slate-900 hover:border-cyan-focus hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] transition-all text-left group"
          >
            <div className="text-xs font-bold text-cyan-focus uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>🔄 RESTART TOUR</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">
              Select another role evaluation track to inspect.
            </p>
          </button>

          <button
            onClick={handleReturnToMatrix}
            className="p-4 rounded-xl border border-emerald-highlight/40 bg-slate-900/80 hover:bg-slate-900 hover:border-emerald-highlight hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all text-left group"
          >
            <div className="text-xs font-bold text-emerald-highlight uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>🌐 EXPLORE MATRIX</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans">
              Return to free-roam isometric 3D navigation mode.
            </p>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>STATUS: SEQUENCE_SUCCESS</span>
          <span className="text-emerald-highlight">INTERACTION_MODE // EXIT_ACTION_HUB</span>
        </div>
      </div>
    </div>
  );
}
