"use client";

/**
 * components/ui/AboutMeModal.tsx
 *
 * A 2D cyberpunk "dossier" overlay featuring a scanning animation over
 * a placeholder avatar, hardcoded profile data, and neon cyan borders.
 * Toggled via the Identify button in MissionControl.
 */

import { useEffect, useRef } from "react";
import { playSelectSound, playTransitionSound } from "@/lib/audio";

interface AboutMeModalProps {
  onClose: () => void;
}

export function AboutMeModal({ onClose }: AboutMeModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* Close on Escape key */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* Close on backdrop click */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) onClose();
  };

  const handleClose = () => {
    playSelectSound();
    onClose();
  };

  return (
    <div
      ref={containerRef}
      onClick={handleBackdropClick}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
    >
      {/* ─── Dossier card ─── */}
      <div className="relative w-[480px] max-w-[95vw] rounded-2xl border border-cyan-focus/60 bg-[#0b0f17]/95 shadow-[0_0_40px_rgba(56,189,248,0.35),inset_0_0_60px_rgba(56,189,248,0.05)] backdrop-blur-xl">

        {/* Corner accent brackets */}
        <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-focus rounded-tl-2xl" />
        <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-focus rounded-tr-2xl" />
        <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-focus rounded-bl-2xl" />
        <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-focus rounded-br-2xl" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-cyan-focus/20 px-6 py-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-highlight">
              [ SYS // IDENTITY_SCAN ]
            </span>
            <h2 className="mt-0.5 font-mono text-base font-bold tracking-widest text-cyan-focus drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
              OPERATOR DOSSIER
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-highlight animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-highlight uppercase tracking-widest">
              ACTIVE
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex gap-5 px-6 py-5">

          {/* Avatar with scanning-line animation */}
          <div className="relative shrink-0 w-28 h-36 rounded-xl border border-cyan-focus/50 overflow-hidden bg-slate-900 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            {/* Stylised placeholder avatar */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-40">
              {/* Silhouette shapes */}
              <div className="w-10 h-10 rounded-full border-2 border-cyan-focus/60 bg-cyan-focus/10" />
              <div className="w-16 h-10 rounded-t-full border-2 border-t-2 border-cyan-focus/60 bg-cyan-focus/10" />
            </div>

            {/* Monogram overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-3xl font-bold text-cyan-focus/70 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] select-none">
                TA
              </span>
            </div>

            {/* Scanning line — pure CSS animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-focus to-transparent opacity-80" />
            </div>

            {/* Scan corner brackets */}
            <span className="absolute top-1 left-1 w-3 h-3 border-t border-l border-cyan-focus" />
            <span className="absolute top-1 right-1 w-3 h-3 border-t border-r border-cyan-focus" />
            <span className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-cyan-focus" />
            <span className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-cyan-focus" />
          </div>

          {/* Profile data */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Name */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">OPERATOR ID</span>
              <p className="mt-0.5 font-mono text-lg font-bold tracking-wide text-cyan-focus drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]">
                TAANUSH ABRAHAM
              </p>
            </div>

            {/* Title */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">CLEARANCE / ROLE</span>
              <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-sky-300">
                AI/LLM Intern @ Sstudize
              </p>
              <p className="font-mono text-[11px] leading-relaxed text-sky-300">
                B.Tech CS — VIT Vellore
              </p>
            </div>
          </div>
        </div>

        {/* ── Core Focus Tags ── */}
        <div className="px-6 pb-5">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">CORE FOCUS</span>

          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Python",
              "Deep Learning",
              "NLP",
              "Scalable ML Systems",
            ].map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-cyan-focus/40 bg-cyan-focus/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-focus shadow-[0_0_8px_rgba(56,189,248,0.15)]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className="mx-6 mb-5 rounded-lg border border-emerald-highlight/20 bg-emerald-950/30 px-4 py-2.5 font-mono text-[10px] text-emerald-highlight tracking-widest">
          <span className="mr-2 animate-pulse">◈</span>
          BUILDING INTELLIGENT, SCALABLE MACHINE LEARNING SYSTEMS
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-cyan-focus/20 px-6 py-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600">
            IDENTITY_SCAN v1.0.4 // AUTHENTICATED
          </span>

          <button
            onClick={handleClose}
            onMouseEnter={() => playSelectSound()}
            className="rounded-lg border border-cyan-focus/50 bg-cyan-focus/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-cyan-focus transition-all duration-200 hover:bg-cyan-focus/20 hover:shadow-[0_0_14px_rgba(56,189,248,0.45)] active:scale-95"
          >
            [ CLOSE ]
          </button>
        </div>
      </div>

      {/* Scanning-line keyframe injected as a global style tag */}
      <style jsx global>{`
        @keyframes scan {
          0%   { top: -4px; }
          100% { top: 100%; }
        }
        .scan-line {
          animation: scan 2.2s linear infinite;
        }
      `}</style>
    </div>
  );
}
