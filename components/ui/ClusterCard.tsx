"use client";

/**
 * components/ui/ClusterCard.tsx
 *
 * Expandable category cluster card in the scrollable project domain map.
 * Click the header to toggle an animated drawer revealing all ProjectRow cards.
 */

import { useState, useRef, useEffect } from "react";
import { playHoverSound, playSelectSound, playTransitionSound } from "@/lib/audio";
import { ProjectRow } from "./ProjectRow";
import { ALL_PROJECTS, type Category } from "@/lib/projects";

/* ── Per-accent color palettes ─────────────────────────────────────── */
const ACCENT = {
  cyan: {
    hex:      "#38bdf8",
    border:   "border-cyan-focus/40",
    glow:     "shadow-[0_0_30px_rgba(56,189,248,0.18)]",
    hoverGlow:"hover:shadow-[0_0_40px_rgba(56,189,248,0.35)]",
    text:     "text-cyan-focus",
    badge:    "bg-cyan-focus/15 text-cyan-focus border-cyan-focus/30",
    icon:     "text-cyan-focus",
    bar:      "bg-cyan-focus",
    divider:  "border-cyan-focus/15",
    ring:     "ring-cyan-focus/30",
  },
  emerald: {
    hex:      "#10b981",
    border:   "border-emerald-highlight/40",
    glow:     "shadow-[0_0_30px_rgba(16,185,129,0.18)]",
    hoverGlow:"hover:shadow-[0_0_40px_rgba(16,185,129,0.35)]",
    text:     "text-emerald-highlight",
    badge:    "bg-emerald-highlight/15 text-emerald-highlight border-emerald-highlight/30",
    icon:     "text-emerald-highlight",
    bar:      "bg-emerald-highlight",
    divider:  "border-emerald-highlight/15",
    ring:     "ring-emerald-highlight/30",
  },
  amber: {
    hex:      "#f59e0b",
    border:   "border-amber-caution/40",
    glow:     "shadow-[0_0_30px_rgba(245,158,11,0.18)]",
    hoverGlow:"hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]",
    text:     "text-amber-caution",
    badge:    "bg-amber-caution/15 text-amber-caution border-amber-caution/30",
    icon:     "text-amber-caution",
    bar:      "bg-amber-caution",
    divider:  "border-amber-caution/15",
    ring:     "ring-amber-caution/30",
  },
  purple: {
    hex:      "#a855f7",
    border:   "border-purple-500/40",
    glow:     "shadow-[0_0_30px_rgba(168,85,247,0.18)]",
    hoverGlow:"hover:shadow-[0_0_40px_rgba(168,85,247,0.35)]",
    text:     "text-purple-400",
    badge:    "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon:     "text-purple-400",
    bar:      "bg-purple-500",
    divider:  "border-purple-500/15",
    ring:     "ring-purple-500/30",
  },
  rose: {
    hex:      "#f43f5e",
    border:   "border-rose-500/40",
    glow:     "shadow-[0_0_30px_rgba(244,63,94,0.18)]",
    hoverGlow:"hover:shadow-[0_0_40px_rgba(244,63,94,0.35)]",
    text:     "text-rose-400",
    badge:    "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon:     "text-rose-400",
    bar:      "bg-rose-500",
    divider:  "border-rose-500/15",
    ring:     "ring-rose-500/30",
  },
};

/* ── SVG Hex icon ───────────────────────────────────────────────────── */
function HexIcon({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
      <polygon
        points="18,2 32,10 32,26 18,34 4,26 4,10"
        stroke={color}
        strokeWidth="1.5"
        fill={color + "22"}
      />
      <polygon
        points="18,8 27,13 27,23 18,28 9,23 9,13"
        stroke={color}
        strokeWidth="0.75"
        fill={color + "11"}
      />
    </svg>
  );
}

/* ── Chevron toggle icon ────────────────────────────────────────────── */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface ClusterCardProps {
  category: Category;
  /** Start expanded (e.g. for the first card) */
  defaultOpen?: boolean;
}

export function ClusterCard({ category, defaultOpen = false }: ClusterCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | "auto">(defaultOpen ? "auto" : 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const a = ACCENT[category.accent];

  /* Animated max-height for smooth expand/collapse */
  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      // After animation settles, set to auto so content can grow
      const timer = setTimeout(() => setHeight("auto"), 320);
      return () => clearTimeout(timer);
    } else {
      // Snap to current pixel height before collapsing so transition works
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [open]);

  const toggle = () => {
    playTransitionSound();
    playSelectSound();
    setOpen((v) => !v);
  };

  const categoryProjects = ALL_PROJECTS.filter((p) => p.categoryIds.includes(category.id));
  const hasProjects = categoryProjects.length > 0;

  return (
    <article
      className={`rounded-2xl border ${a.border} bg-slate-dark/80 backdrop-blur-md transition-all duration-300 ${a.glow} ${a.hoverGlow} overflow-hidden`}
    >
      {/* ── Card header / toggle ─────────────────────────────────── */}
      <button
        onClick={toggle}
        onMouseEnter={() => playHoverSound()}
        className={`w-full flex items-start gap-4 p-5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 ${a.ring}`}
        aria-expanded={open}
      >
        <HexIcon color={a.hex} />

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {/* Label row */}
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-mono text-base font-bold tracking-wide ${a.text} drop-shadow-[0_0_6px_${a.hex}66]`}>
              {category.label}
            </h3>
            <div className="flex items-center gap-2">
              {/* Project count badge */}
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${a.badge}`}>
                {hasProjects ? `${categoryProjects.length} PROJECT${categoryProjects.length !== 1 ? "S" : ""}` : "INCOMING"}
              </span>
              {/* Chevron */}
              <span className={`${a.text} opacity-60`}>
                <Chevron open={open} />
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="font-sans text-xs text-slate-400 leading-relaxed">
            {category.description}
          </p>

          {/* Accent underline bar */}
          <div className={`mt-2 h-px w-16 ${a.bar} opacity-40 transition-all duration-300 ${open ? "w-full opacity-60" : ""}`} />
        </div>
      </button>

      {/* ── Animated drawer ──────────────────────────────────────── */}
      <div
        ref={contentRef}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          overflow: "hidden",
          transition: "height 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className={`border-t ${a.divider} px-5 py-4 flex flex-col gap-3`}>
          {hasProjects ? (
            categoryProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                accentColor={a.hex}
              />
            ))
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className={`font-mono text-xs ${a.text} opacity-40 tracking-widest uppercase`}>
                // INCOMING TRANSMISSIONS
              </span>
              <p className="font-sans text-xs text-slate-600">
                Projects loading into this domain…
              </p>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1 w-1 rounded-full ${a.bar} opacity-30 animate-pulse`}
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
