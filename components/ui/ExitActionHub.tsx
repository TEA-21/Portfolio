"use client";

/**
 * components/ui/ExitActionHub.tsx
 *
 * Cyberpunk Action Hub overlay component that mounts when the Zustand store
 * state reaches 'exitActionHub' at the end of an automated Speed Run tour.
 *
 * CALLS TO ACTION
 * ───────────────
 * Presents 3 high-contrast glowing CTA buttons:
 *  1. 'Download Resume' - Triggers resume download
 *  2. 'Contact Me' - Opens direct communication channel
 *  3. 'Switch to Free-Roam' - Dispatches `setIdle()` to return to 3D matrix
 */

import { usePortfolioStore } from "@/lib/store";

export function ExitActionHub() {
  const mode = usePortfolioStore((s) => s.mode);
  const activeRole = usePortfolioStore((s) => s.activeRole);
  const setIdle = usePortfolioStore((s) => s.setIdle);
  const resetCamera = usePortfolioStore((s) => s.resetCamera);

  if (mode !== "exitActionHub") {
    return null;
  }

  const handleFreeRoam = () => {
    setIdle();
    resetCamera();
  };

  const handleDownloadResume = () => {
    // Open resume or download placeholder
    window.open("/resume.pdf", "_blank");
  };

  const handleContactMe = () => {
    window.location.href = "mailto:taanushabrahm@gmail.com?subject=Portfolio%20Inquiry";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md pointer-events-auto font-mono transition-all animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-focus/40 bg-slate-dark/95 p-6 sm:p-8 shadow-[0_0_50px_rgba(56,189,248,0.2)] overflow-hidden">
        {/* Background Glow Orbs */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-56 h-56 bg-cyan-focus/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 bg-emerald-highlight/15 rounded-full blur-3xl pointer-events-none" />

        {/* Scan line header */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-focus to-transparent mb-4 opacity-80" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-cyan-focus/20 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-highlight opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-highlight"></span>
              </span>
              <span className="text-xs font-bold text-emerald-highlight tracking-widest uppercase">
                SPEED RUN COMPLETE // ACTION HUB
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
              EVALUATION TOUR FINISHED
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              You have completed the automated 3D node tour for{" "}
              <strong className="text-cyan-focus font-mono">{activeRole ?? "Selected Track"}</strong>.
              Select a next step below to connect or continue exploring.
            </p>
          </div>

          <button
            onClick={handleFreeRoam}
            className="text-xs text-slate-400 hover:text-white transition-colors px-2.5 py-1 rounded border border-slate-700 hover:border-slate-500 bg-slate-900/60"
          >
            [X]
          </button>
        </div>

        {/* Glowing Call-To-Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* CTA 1: Download Resume */}
          <button
            onClick={handleDownloadResume}
            className="group relative p-4 rounded-xl border border-cyan-focus/40 bg-slate-900/80 hover:bg-slate-900/90 text-left transition-all duration-200 hover:border-cyan-focus hover:shadow-[0_0_25px_rgba(56,189,248,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between"
          >
            <div>
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-mono text-sm font-bold text-cyan-focus group-hover:text-white transition-colors">
                Download Resume
              </h3>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Get full PDF resume & system experience details.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-mono text-cyan-focus font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              DOWNLOAD &darr;
            </span>
          </button>

          {/* CTA 2: Contact Me */}
          <button
            onClick={handleContactMe}
            className="group relative p-4 rounded-xl border border-emerald-highlight/40 bg-slate-900/80 hover:bg-slate-900/90 text-left transition-all duration-200 hover:border-emerald-highlight hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between"
          >
            <div>
              <div className="text-2xl mb-2">✉️</div>
              <h3 className="font-mono text-sm font-bold text-emerald-highlight group-hover:text-white transition-colors">
                Contact Me
              </h3>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Initiate direct discussion or schedule interview.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-mono text-emerald-highlight font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              SEND MAIL &rarr;
            </span>
          </button>

          {/* CTA 3: Switch to Free-Roam */}
          <button
            onClick={handleFreeRoam}
            className="group relative p-4 rounded-xl border border-amber-caution/40 bg-slate-900/80 hover:bg-slate-900/90 text-left transition-all duration-200 hover:border-amber-caution hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 active:translate-y-0 flex flex-col justify-between"
          >
            <div>
              <div className="text-2xl mb-2">🌐</div>
              <h3 className="font-mono text-sm font-bold text-amber-caution group-hover:text-white transition-colors">
                Switch to Free-Roam
              </h3>
              <p className="text-[11px] text-slate-300 font-sans mt-1">
                Explore the 3D isometric matrix independently.
              </p>
            </div>
            <span className="mt-3 text-[11px] font-mono text-amber-caution font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              ENTER MATRIX &rarr;
            </span>
          </button>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>STATUS: ALL_NODES_VISITED</span>
          <span className="text-emerald-highlight">MODE // EXIT_ACTION_HUB</span>
        </div>
      </div>
    </div>
  );
}
